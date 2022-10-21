// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { IServiceManager } from '../ioc/types';
import { ActiveResourceService } from './application/activeResource';
import { ApplicationEnvironment } from './application/applicationEnvironment';
import { DocumentManager } from './application/documentManager';
import { Extensions } from './application/extensions';
import { IActiveResourceService, IApplicationEnvironment, IApplicationShell, ICommandManager, IDocumentManager, IWorkspaceService } from './application/types';
import { ProductInstaller } from './installer/productInstaller';
import { IS_WINDOWS } from './platform/constants';
import { ITerminalManager } from './application/types';
import { PathUtils } from './platform/pathUtils';
import { ProcessLogger } from './process/logger';
import { TerminalManager } from './application/terminalManager';
import { IProcessLogger } from './process/types';
import {
    IConfigurationService,
    ICurrentProcess,
    IExperimentService,
    IExtensions, IInstaller, IInterpreterPathProxyService, IInterpreterPathService, IPathUtils, IPersistentStateFactory, IsWindows, IToolExecutionPath, ToolExecutionPath,
} from './types';
import { TerminalHelper } from './terminal/helper';
import { ITerminalHelper, ITerminalActivationCommandProvider, TerminalActivationProviders, IShellDetector, ITerminalServiceFactory, ITerminalActivator, ITerminalActivationHandler } from './terminal/types';
import { Bash } from './terminal/environmentActivationProviders/bash';
import { CommandPromptAndPowerShell } from './terminal/environmentActivationProviders/commandPrompt';
import { PyEnvActivationCommandProvider } from './terminal/environmentActivationProviders/pyenvActivationProvider';
import { CondaActivationCommandProvider } from './terminal/environmentActivationProviders/condaActivationProvider';
import { PipEnvActivationCommandProvider } from './terminal/environmentActivationProviders/pipEnvActivationProvider';
import { CurrentProcess } from './process/currentProcess';
import { PipEnvExecutionPath } from './configuration/executionSettings/pipEnvExecution';
import { SettingsShellDetector } from './terminal/shellDetectors/settingsShellDetector';
import { TerminalNameShellDetector } from './terminal/shellDetectors/terminalNameShellDetector';
import { UserEnvironmentShellDetector } from './terminal/shellDetectors/userEnvironmentShellDetector';
import { VSCEnvironmentShellDetector } from './terminal/shellDetectors/vscEnvironmentShellDetector';
import { IExtensionSingleActivationService, IExtensionSyncActivationService } from '../activation/types';
import { PersistentStateFactory } from './persistentState';
import { TerminalServiceFactory } from './terminal/factory';
import { TerminalActivator } from './terminal/activator';
import { PowershellTerminalActivationFailedHandler } from './terminal/activator/powershellFailedHandler';
import { InterpreterPathService } from './interpreterPathService';
import { InterpreterPathProxyService } from './interpreterPathProxyService';
import { ExperimentService } from './experiments/service';
import { WorkspaceService } from './application/workspace';
import { ConfigurationService } from './configuration/service';
import { CommandManager } from './application/commandManager';
import { ApplicationShell } from './application/applicationShell';
import { ProjectQInstanllPackageCommand } from '../projectq/projectqInstallPackageCommand';
import { ProjectQInitEnvirnmentCommand } from '../projectq/projectqInitEnvCommand';
import { ProjectQInstanllOtherExtension } from '../projectq/projectqInstallOtherExtension';

// eslint-disable-next-line
export function registerTypes(serviceManager: IServiceManager) {
    serviceManager.addSingletonInstance<boolean>(IsWindows, IS_WINDOWS);

    serviceManager.addSingleton<IActiveResourceService>(IActiveResourceService, ActiveResourceService);
    serviceManager.addSingleton<IInterpreterPathProxyService>(
        IInterpreterPathProxyService,
        InterpreterPathProxyService,
    );

    serviceManager.addSingleton<IInterpreterPathService>(IInterpreterPathService, InterpreterPathService);
    serviceManager.addSingleton<IExtensions>(IExtensions, Extensions);

    serviceManager.addSingleton<IPersistentStateFactory>(IPersistentStateFactory, PersistentStateFactory);
    serviceManager.addBinding(IPersistentStateFactory, IExtensionSingleActivationService);
    serviceManager.addSingleton<ITerminalServiceFactory>(ITerminalServiceFactory, TerminalServiceFactory);
    serviceManager.addSingleton<IPathUtils>(IPathUtils, PathUtils);

    serviceManager.addSingleton<IApplicationShell>(IApplicationShell, ApplicationShell);

    serviceManager.addSingleton<IApplicationEnvironment>(IApplicationEnvironment, ApplicationEnvironment);

    serviceManager.addSingleton<ITerminalActivator>(ITerminalActivator, TerminalActivator);
    serviceManager.addSingleton<ITerminalActivationHandler>(
        ITerminalActivationHandler,
        PowershellTerminalActivationFailedHandler,
    );

    serviceManager.addSingleton<IExperimentService>(IExperimentService, ExperimentService);

    serviceManager.addSingleton<ICurrentProcess>(ICurrentProcess, CurrentProcess);
    serviceManager.addSingleton<IToolExecutionPath>(IToolExecutionPath, PipEnvExecutionPath, ToolExecutionPath.pipenv);

    serviceManager.addSingleton<ITerminalManager>(ITerminalManager, TerminalManager);
    serviceManager.addSingleton<IProcessLogger>(IProcessLogger, ProcessLogger);

    serviceManager.addSingleton<ICommandManager>(ICommandManager, CommandManager);

    serviceManager.addSingleton<IConfigurationService>(IConfigurationService, ConfigurationService);
    serviceManager.addSingleton<IWorkspaceService>(IWorkspaceService, WorkspaceService);

    serviceManager.addSingleton<ITerminalHelper>(ITerminalHelper, TerminalHelper);
    serviceManager.addSingleton<ITerminalActivationCommandProvider>(
        ITerminalActivationCommandProvider,
        Bash,
        TerminalActivationProviders.bashCShellFish,
    );
    serviceManager.addSingleton<ITerminalActivationCommandProvider>(
        ITerminalActivationCommandProvider,
        CommandPromptAndPowerShell,
        TerminalActivationProviders.commandPromptAndPowerShell,
    );
    serviceManager.addSingleton<ITerminalActivationCommandProvider>(
        ITerminalActivationCommandProvider,
        PyEnvActivationCommandProvider,
        TerminalActivationProviders.pyenv,
    );
    serviceManager.addSingleton<ITerminalActivationCommandProvider>(
        ITerminalActivationCommandProvider,
        CondaActivationCommandProvider,
        TerminalActivationProviders.conda,
    );
    serviceManager.addSingleton<ITerminalActivationCommandProvider>(
        ITerminalActivationCommandProvider,
        PipEnvActivationCommandProvider,
        TerminalActivationProviders.pipenv,
    );


    serviceManager.addSingleton<IShellDetector>(IShellDetector, TerminalNameShellDetector);
    serviceManager.addSingleton<IShellDetector>(IShellDetector, SettingsShellDetector);
    serviceManager.addSingleton<IShellDetector>(IShellDetector, UserEnvironmentShellDetector);
    serviceManager.addSingleton<IShellDetector>(IShellDetector, VSCEnvironmentShellDetector);

    serviceManager.addSingleton<IInstaller>(IInstaller, ProductInstaller);
    serviceManager.addSingleton<IDocumentManager>(IDocumentManager, DocumentManager);


    serviceManager.addSingleton<IExtensionSingleActivationService>(IExtensionSingleActivationService, ProjectQInstanllPackageCommand);
    serviceManager.addSingleton<IExtensionSingleActivationService>(IExtensionSingleActivationService, ProjectQInitEnvirnmentCommand);
    serviceManager.addSingleton<IExtensionSyncActivationService>(IExtensionSyncActivationService, ProjectQInstanllOtherExtension);
}
