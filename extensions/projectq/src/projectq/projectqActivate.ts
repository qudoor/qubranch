import { inject, injectable } from "inversify";
import { IServiceContainer } from "../ioc/types";
import { IExtensionSingleActivationService } from "../activation/types";


@injectable()
export class ProjectQTestActivate implements IExtensionSingleActivationService {
    constructor(
        @inject(IServiceContainer) private serviceContainer: IServiceContainer,) { }
    public async activate(): Promise<void> {
        // const installers = this.serviceContainer.getAll<IModuleInstaller>(IModuleInstaller);
        // const pipInstaller = installers.find((installer) => installer.type === ModuleInstallerType.Pip);
        // if (pipInstaller) {
        //     await pipInstaller.installModule('projectq');
        // }
    }

}
