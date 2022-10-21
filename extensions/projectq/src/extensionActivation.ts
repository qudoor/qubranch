/* eslint-disable  */
import { env, ExtensionMode, extensions, OutputChannel, UIKind, window, workspace } from 'vscode';
import { isTestExecution, STANDARD_OUTPUT_CHANNEL } from "./common/constants";
import { IConfigurationService, IOutputChannel, IsCodeSpace, IsDevMode } from "./common/types";

// components
import * as pythonEnvironments from './pythonEnvironments';

import * as localize from './common/utils/localize';
import { addOutputChannelLogging } from './common/logging';
import { PythonExtension } from './datascience/constants';
import { registerTypes as installerRegisterTypes } from './common/installer/serviceRegistry';
import { registerTypes as appRegisterTypes } from './application/serviceRegistry';
import { registerTypes as platformRegisterTypes } from './common/platform/serviceRegistry';
import { registerTypes as activationRegisterTypes } from './activation/serviceRegistry';
import { registerTypes as variableRegisterTypes } from './common/variables/serviceRegistry';
// import { registerLoggerTypes } from './common/logging/serviceRegistry';
import { registerTypes as processRegisterTypes } from './common/process/serviceRegistry';
import { registerTypes as commonRegisterTerminalTypes } from './terminals/serviceRegistry';
import { registerInterpreterTypes as interpretersRegisterTypes } from './interpreter/serviceRegistry';

import { IFileSystem } from './common/platform/types';
import { setExtensionInstallTelemetryProperties } from './telemetry/extensionInstallTelemetry';
import { IExtensionActivationManager } from './activation/types';
import { IApplicationEnvironment, ICommandManager, IWorkspaceService } from './common/application/types';
import { noop } from 'lodash';
import { ActivationResult, ExtensionState } from './components';
import { Components } from './extensionInit';
import { WorkspaceService } from './common/application/workspace';
import { IInterpreterService } from './interpreter/contracts';


export async function activateComponents(
    // `ext` is passed to any extra activation funcs.
    ext: ExtensionState, components: Components) {
    // We will be pulling code over from activateLegacy().
    const legacyActivationResult = await activateLegacy(ext);

    const workspaceService = new WorkspaceService();
    if (!workspaceService.isTrusted) {
        return [legacyActivationResult];
    }
    const promises: Promise<ActivationResult>[] = [
        // More component activations will go here
        pythonEnvironments.activate(components.pythonEnvs, ext),
    ];
    return Promise.all([legacyActivationResult, ...promises]);
}

async function activateLegacy(ext: ExtensionState): Promise<ActivationResult> {
    const { context, legacyIOC } = ext;
    const { serviceManager, serviceContainer } = legacyIOC;

    // We need to setup this property before any telemetry is sent
    const fs = serviceManager.get<IFileSystem>(IFileSystem);
    await setExtensionInstallTelemetryProperties(fs);

    // register "services"
    const isDevMode =
        !isTestExecution() &&
        (context.extensionMode === ExtensionMode.Development ||
            workspace.getConfiguration('projectq').get<boolean>('development', false));
    serviceManager.addSingletonInstance<boolean>(IsDevMode, isDevMode);

    serviceManager.addSingletonInstance<boolean>(IsCodeSpace, env.uiKind == UIKind.Web);

    // Log versions of extensions.
    // standardOutputChannel.appendLine(`ProjectQ Extension Version: ${context.extension.packageJSON['version']}.`);
    // const pythonExtension = extensions.getExtension(PythonExtension);
    // if (pythonExtension) {
    //     standardOutputChannel.appendLine(`Python Extension Verison: ${pythonExtension.packageJSON['version']}.`);
    // } else {
    //     standardOutputChannel.appendLine('Python Extension not installed.');
    // }

    // Initialize logging to file if necessary as early as possible
    // registerLoggerTypes(serviceManager);

    // Core registrations (non-feature specific).
    // registerApiTypes(serviceManager);
    // commonRegisterTypes(serviceManager);
    // platformRegisterTypes(serviceManager);
    // processRegisterTypes(serviceManager);


    interpretersRegisterTypes(serviceManager);
    installerRegisterTypes(serviceManager);
    commonRegisterTerminalTypes(serviceManager);


    const applicationEnv = serviceManager.get<IApplicationEnvironment>(IApplicationEnvironment);
    // Feature specific registrations.
    // variableRegisterTypes(serviceManager);


    // Register datascience types after experiments have loaded.
    // To ensure we can register types based on experiments.
    // dataScienceRegisterTypes(serviceManager);

    // Language feature registrations.
    appRegisterTypes(serviceManager);
    activationRegisterTypes(serviceManager);

    const workspaceService = serviceContainer.get<IWorkspaceService>(IWorkspaceService);
    // if (workspaceService.isTrusted) {
    //     const interpreterManager = serviceContainer.get<IInterpreterService>(IInterpreterService);
    //     interpreterManager.initialize();
    // }


    // "initialize" "services"
    const cmdManager = serviceContainer.get<ICommandManager>(ICommandManager);
    cmdManager.executeCommand('setContext', 'projectq.vscode.channel', applicationEnv.channel).then(noop, noop);

    // "activate" everything else

    const manager = serviceContainer.get<IExtensionActivationManager>(IExtensionActivationManager);
    context.subscriptions.push(manager);
    manager.activateSync();
    const activationPromise = manager.activate();

    // Activate data science features after base features.
    // const dataScience = serviceManager.get<IDataScience>(IDataScience);
    // const dsActivationPromise = dataScience.activate();

    return { fullyReady: activationPromise };
}