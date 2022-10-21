import { Container } from "inversify";
import { GLOBAL_MEMENTO, IDisposableRegistry, IExtensionContext, IMemento, IOutputChannel, WORKSPACE_MEMENTO } from "./common/types";
import { IServiceManager, IServiceContainer } from "./ioc/types";
import { ServiceContainer } from './ioc/container';
import { ServiceManager } from './ioc/serviceManager';
import { Disposable, Memento, OutputChannel, window } from "vscode";
import { ExtensionState } from "./components";
import { IDiscoveryAPI } from "./pythonEnvironments/base/locator";
import * as pythonEnvironments from './pythonEnvironments';
import { registerTypes as platformRegisterTypes } from './common/platform/serviceRegistry';
import { registerTypes as processRegisterTypes } from './common/process/serviceRegistry';
import { registerTypes as commonRegisterTypes } from './common/serviceRegistry';
import { registerTypes as variableRegisterTypes } from './common/variables/serviceRegistry';
import { OutputChannelNames } from "./common/utils/localize";
import { WorkspaceService } from "./common/application/workspace";
import { STANDARD_OUTPUT_CHANNEL } from "./common/constants";
import { addOutputChannelLogging } from "./common/logging";


export function initializeGlobals(context: IExtensionContext): ExtensionState {
    const cont = new Container({ skipBaseClassChecks: true });
    const serviceManager = new ServiceManager(cont);
    const serviceContainer = new ServiceContainer(cont);
    const disposables: IDisposableRegistry = context.subscriptions;

    serviceManager.addSingletonInstance<IServiceContainer>(IServiceContainer, serviceContainer);
    serviceManager.addSingletonInstance<IServiceManager>(IServiceManager, serviceManager);

    serviceManager.addSingletonInstance<Disposable[]>(IDisposableRegistry, disposables);
    serviceManager.addSingletonInstance<Memento>(IMemento, context.globalState, GLOBAL_MEMENTO);
    serviceManager.addSingletonInstance<Memento>(IMemento, context.workspaceState, WORKSPACE_MEMENTO);
    serviceManager.addSingletonInstance<IExtensionContext>(IExtensionContext, context);

    const standardOutputChannel = window.createOutputChannel(OutputChannelNames.projectq());
    addOutputChannelLogging(standardOutputChannel);

    const workspaceService = new WorkspaceService();

    // const unitTestOutChannel =
    //     workspaceService.isVirtualWorkspace || !workspaceService.isTrusted
    //         ? // Do not create any test related output UI when using virtual workspaces.
    //         instance(mock<IOutputChannel>())
    //         : window.createOutputChannel(OutputChannelNames.pythonTest());
    serviceManager.addSingletonInstance<OutputChannel>(IOutputChannel, standardOutputChannel, STANDARD_OUTPUT_CHANNEL);
    // serviceManager.addSingletonInstance<OutputChannel>(IOutputChannel, unitTestOutChannel, TEST_OUTPUT_CHANNEL);

    return {
        context,
        disposables: context.subscriptions,
        legacyIOC: {
            serviceManager, serviceContainer
        }
    };
}


/**
 * Registers standard utils like experiment and platform code which are fundamental to the extension.
 */
export function initializeStandard(ext: ExtensionState): void {
    const { serviceManager } = ext.legacyIOC;
    // Core registrations (non-feature specific).
    commonRegisterTypes(serviceManager);
    variableRegisterTypes(serviceManager);
    platformRegisterTypes(serviceManager);
    processRegisterTypes(serviceManager);

    // We will be pulling other code over from activateLegacy().
}

/**
 * The set of public APIs from initialized components.
 */
export type Components = {
    pythonEnvs: IDiscoveryAPI;
};

/**
 * Initialize all components in the extension.
 */
export async function initializeComponents(ext: ExtensionState): Promise<Components> {
    const pythonEnvs = await pythonEnvironments.initialize(ext);

    // Other component initializers go here.
    // We will be factoring them out of activateLegacy().

    return {
        pythonEnvs,
    };
}