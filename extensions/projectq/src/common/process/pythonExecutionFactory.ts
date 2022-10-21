// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { inject, injectable } from 'inversify';
import { gte } from 'semver';

import { Uri } from 'vscode';
import { IEnvironmentActivationService } from '../../interpreter/activation/types';
import { IComponentAdapter, ICondaService } from '../../interpreter/contracts';
import { IServiceContainer } from '../../ioc/types';
import { CondaEnvironmentInfo } from '../../pythonEnvironments/common/environmentManagers/conda';
import { sendTelemetryEvent } from '../../telemetry';
import { EventName } from '../../telemetry/constants';
import { IFileSystem } from '../platform/types';
import { IConfigurationService, IDisposableRegistry, IInterpreterPathProxyService } from '../types';
import { ProcessService } from './proc';
import { createCondaEnv, createPythonEnv, createWindowsStoreEnv } from './pythonEnvironment';
import { createPythonProcessService } from './pythonProcess';
import {
    ExecutionFactoryCreateWithEnvironmentOptions,
    ExecutionFactoryCreationOptions,
    IBufferDecoder,
    IProcessLogger,
    IProcessService,
    IProcessServiceFactory,
    IPythonExecutionFactory,
    IPythonExecutionService,
} from './types';
import { IInterpreterAutoSelectionService } from '../../interpreter/autoSelection/types';
import { sleep } from '../utils/async';
import { logError } from '../logging';

// Minimum version number of conda required to be able to use 'conda run'
export const CONDA_RUN_VERSION = '4.6.0';

@injectable()
export class PythonExecutionFactory implements IPythonExecutionFactory {
    private readonly disposables: IDisposableRegistry;

    private readonly logger: IProcessLogger;

    private readonly fileSystem: IFileSystem;

    constructor(
        @inject(IServiceContainer) private serviceContainer: IServiceContainer,
        @inject(IEnvironmentActivationService) private readonly activationHelper: IEnvironmentActivationService,
        @inject(IProcessServiceFactory) private readonly processServiceFactory: IProcessServiceFactory,
        @inject(IConfigurationService) private readonly configService: IConfigurationService,
        @inject(ICondaService) private readonly condaService: ICondaService,
        @inject(IBufferDecoder) private readonly decoder: IBufferDecoder,
        @inject(IComponentAdapter) private readonly pyenvs: IComponentAdapter,
        @inject(IInterpreterAutoSelectionService) private readonly autoSelection: IInterpreterAutoSelectionService,
        @inject(IInterpreterPathProxyService) private readonly interpreterPathExpHelper: IInterpreterPathProxyService,
    ) {
        // Acquire other objects here so that if we are called during dispose they are available.
        this.disposables = this.serviceContainer.get<IDisposableRegistry>(IDisposableRegistry);
        this.logger = this.serviceContainer.get<IProcessLogger>(IProcessLogger);
        this.fileSystem = this.serviceContainer.get<IFileSystem>(IFileSystem);
    }

    public async create(options: ExecutionFactoryCreationOptions): Promise<IPythonExecutionService> {
        let { pythonPath } = options;
        if (!pythonPath) {
            // If python path wasn't passed in, we need to auto select it and then read it
            // from the configuration.
            const interpreterPath = this.interpreterPathExpHelper.get(options.resource);
            if (!interpreterPath || interpreterPath === 'python') {
                // Block on autoselection if no interpreter selected.
                // Note autoselection blocks on discovery, so we do not want discovery component
                // to block on this code. Discovery component should 'options.pythonPath' before
                // calling into this, so this scenario should not happen. But in case consumer
                // makes such an error. So break the loop via timeout and log error.
                const success = await Promise.race([
                    this.autoSelection.autoSelectInterpreter(options.resource).then(() => true),
                    sleep(50000).then(() => false),
                ]);
                if (!success) {
                    logError(
                        'Autoselection timeout out, this is likely a issue with how consumer called execution factory API. Using default python to execute.',
                    );
                }
            }
            pythonPath = this.configService.getSettings(options.resource).pythonPath;
        }
        const processService: IProcessService = await this.processServiceFactory.create(options.resource);

        const windowsStoreInterpreterCheck = this.pyenvs.isWindowsStoreInterpreter.bind(this.pyenvs);

        return createPythonService(
            pythonPath,
            processService,
            this.fileSystem,
            undefined,
            await windowsStoreInterpreterCheck(pythonPath),
        );
    }

    public async createActivatedEnvironment(
        options: ExecutionFactoryCreateWithEnvironmentOptions,
    ): Promise<IPythonExecutionService> {
        const envVars = await this.activationHelper.getActivatedEnvironmentVariables(
            options.resource,
            options.interpreter,
            options.allowEnvironmentFetchExceptions,
        );
        const hasEnvVars = envVars && Object.keys(envVars).length > 0;
        sendTelemetryEvent(EventName.PYTHON_INTERPRETER_ACTIVATION_ENVIRONMENT_VARIABLES, undefined, { hasEnvVars });
        if (!hasEnvVars) {
            return this.create({
                resource: options.resource,
                pythonPath: options.interpreter ? options.interpreter.path : undefined,
            });
        }
        const pythonPath = options.interpreter
            ? options.interpreter.path
            : this.configService.getSettings(options.resource).pythonPath;
        const processService: IProcessService = new ProcessService(this.decoder, { ...envVars });
        processService.on('exec', this.logger.logProcess.bind(this.logger));
        this.disposables.push(processService);

        return createPythonService(pythonPath, processService, this.fileSystem);
    }

    // Not using this function for now because there are breaking issues with conda run (conda 4.8, PVSC 2020.1).
    // See https://github.com/microsoft/vscode-python/issues/9490
    public async createCondaExecutionService(
        pythonPath: string,
        processService?: IProcessService,
        resource?: Uri,
    ): Promise<IPythonExecutionService | undefined> {
        const processServicePromise = processService
            ? Promise.resolve(processService)
            : this.processServiceFactory.create(resource);
        const condaLocatorService = this.serviceContainer.get<IComponentAdapter>(IComponentAdapter);
        const [condaVersion, condaEnvironment, condaFile, procService] = await Promise.all([
            this.condaService.getCondaVersion(),
            condaLocatorService.getCondaEnvironment(pythonPath),
            this.condaService.getCondaFile(),
            processServicePromise,
        ]);

        if (condaVersion && gte(condaVersion, CONDA_RUN_VERSION) && condaEnvironment && condaFile && procService) {
            // Add logging to the newly created process service
            if (!processService) {
                procService.on('exec', this.logger.logProcess.bind(this.logger));
                this.disposables.push(procService);
            }
            return createPythonService(
                pythonPath,
                procService,
                this.fileSystem,
                // This is what causes a CondaEnvironment to be returned:
                [condaFile, condaEnvironment],
            );
        }

        return Promise.resolve(undefined);
    }
}

function createPythonService(
    pythonPath: string,
    procService: IProcessService,
    fs: IFileSystem,
    conda?: [string, CondaEnvironmentInfo],
    isWindowsStore?: boolean,
): IPythonExecutionService {
    let env = createPythonEnv(pythonPath, procService, fs);
    if (conda) {
        const [condaPath, condaInfo] = conda;
        env = createCondaEnv(condaPath, condaInfo, pythonPath, procService, fs);
    } else if (isWindowsStore) {
        env = createWindowsStoreEnv(pythonPath, procService);
    }
    const procs = createPythonProcessService(procService, env);
    return {
        getInterpreterInformation: () => env.getInterpreterInformation(),
        getExecutablePath: () => env.getExecutablePath(),
        isModuleInstalled: (m) => env.isModuleInstalled(m),
        getModuleVersion: (m) => env.getModuleVersion(m),
        getExecutionInfo: (a) => env.getExecutionInfo(a),
        execObservable: (a, o) => procs.execObservable(a, o),
        execModuleObservable: (m, a, o) => procs.execModuleObservable(m, a, o),
        exec: (a, o) => procs.exec(a, o),
        execModule: (m, a, o) => procs.execModule(m, a, o),
    };
}
