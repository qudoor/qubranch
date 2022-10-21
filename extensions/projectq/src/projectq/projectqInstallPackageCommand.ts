import { inject, injectable, named } from "inversify";
import { IExtensionSingleActivationService } from "../activation/types";
import { ICommandManager, IApplicationShell } from "../common/application/types";
import { traceError } from "../common/logger";
import { IExtensions, IOutputChannel } from "../common/types";
import { PythonExtension } from "../datascience/constants";
import { STANDARD_OUTPUT_CHANNEL } from "../common/constants";
import { IModuleInstaller } from "../common/installer/types";
import { IServiceContainer } from "../ioc/types";
import { ModuleInstallerType } from "../pythonEnvironments/info";
import { Uri } from "vscode";
import { IInterpreterService } from "../interpreter/contracts";

@injectable()
export class ProjectQInstanllPackageCommand implements IExtensionSingleActivationService {
    constructor(
        @inject(ICommandManager) private readonly commandManager: ICommandManager,
        @inject(IApplicationShell) private readonly appShell: IApplicationShell,
        @inject(IServiceContainer) private readonly serviceContainer: IServiceContainer,
        @inject(IInterpreterService) private readonly interpreterService: IInterpreterService,
        @inject(IExtensions) private readonly extensions: IExtensions,
        @inject(IOutputChannel) @named(STANDARD_OUTPUT_CHANNEL) private readonly output: IOutputChannel,
    ) { }
    public async activate(): Promise<void> {
        this.commandManager.registerCommand('projectq-vscode.installPythonExt', this.onInstallPythonPackage, this);
    }

    private async onInstallPythonPackage() {
        const moduleName = await this.appShell.showInputBox({
            placeHolder: "Input package name"
        });

        if (!moduleName) {
            return;
        }

        // this.output.show(true);

        const pythonExtension = this.extensions.getExtension(PythonExtension);

        if (!pythonExtension) {
            traceError(`Python 插件不存在`);
            return;
        }

        if (!pythonExtension.isActive) {
            await pythonExtension.activate();
        }

        const pythonApi: any = pythonExtension.exports.settings;

        let pythonPath = null;

        if (!(pythonApi.getExecutionDetails() &&
            pythonApi.getExecutionDetails().execCommand &&
            pythonApi.getExecutionDetails().execCommand.length >= 0)) {
            traceError(`没有找到激活的Python环境,请确认Python是否启用,如已经启用可以尝试重启vscode`);
            return;
        }

        pythonPath = pythonApi.getExecutionDetails().execCommand[0];

        const installers = this.serviceContainer.getAll<IModuleInstaller>(IModuleInstaller);
        const pipInstaller = installers.find((installer) => installer.type === ModuleInstallerType.Pip);
        if (pipInstaller) {

            await pipInstaller.installModule(moduleName, Uri.parse(pythonPath));
        }


    }

}
