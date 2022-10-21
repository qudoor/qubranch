import { IServiceManager } from "../../ioc/types";
import { PipInstaller } from "./pipInstaller";
import { IModuleInstaller } from "./types";

export function registerTypes(serviceManager: IServiceManager) {
    serviceManager.addSingleton<IModuleInstaller>(IModuleInstaller, PipInstaller);
}