/**
 * Register all the new types inside this method.
 * This method is created for testing purposes. Registers all interpreter types except `IInterpreterAutoSelectionProxyService`, `IEnvironmentActivationService`.
 * See use case in `src\test\serviceRegistry.ts` for details
 * @param serviceManager
 */

import { IServiceManager } from "../ioc/types";
import { InterpreterAutoSelectionService } from "./autoSelection";
import { IInterpreterAutoSelectionService } from "./autoSelection/types";
import { IInterpreterService } from "./contracts";
import { InterpreterService } from "./interpreterService";

export function registerInterpreterTypes(serviceManager: IServiceManager): void {

    serviceManager.addSingleton<IInterpreterAutoSelectionService>(
        IInterpreterAutoSelectionService,
        InterpreterAutoSelectionService,
    );

    serviceManager.addSingleton<IInterpreterService>(IInterpreterService, InterpreterService);
}