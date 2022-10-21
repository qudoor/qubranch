import { inject, injectable, named } from "inversify";
import { ICommandManager, IApplicationShell, IWorkspaceService } from "../common/application/types";
import { STANDARD_OUTPUT_CHANNEL } from "../common/constants";
import { IExtensions, IOutputChannel } from "../common/types";
import { IExtensionSingleActivationService } from "../activation/types";
import { Uri, workspace } from 'vscode';
import * as fs from "fs-extra";
import * as path from 'path';
import { _SCRIPTS_DIR } from "../common/process/internal/scripts";

@injectable()
export class ProjectQInitEnvirnmentCommand implements IExtensionSingleActivationService {
    constructor(
        @inject(ICommandManager) private readonly commandManager: ICommandManager,
        @inject(IApplicationShell) private readonly appShell: IApplicationShell,
        // @inject(IServiceContainer) private readonly serviceContainer: IServiceContainer,
        @inject(IExtensions) private readonly extensions: IExtensions,
        @inject(IOutputChannel) @named(STANDARD_OUTPUT_CHANNEL) private readonly output: IOutputChannel,
        @inject(IWorkspaceService) private readonly workspaceService: IWorkspaceService,
    ) { }

    public async activate(): Promise<void> {
        this.commandManager.registerCommand('projectq-vscode.initProjectEnv', this.onInitProjectEnv, this);
    }

    public async onInitProjectEnv() {
        if (workspace.workspaceFolders != undefined) {
            const rootPath = workspace.workspaceFolders[0].uri.path;

            try {
                await workspace.fs.delete(Uri.parse(`${rootPath}/.vscode`));
            } catch (error) {

            }

            fs.copySync(path.join(_SCRIPTS_DIR, 'envFiles'), path.join(rootPath, '.vscode'));
        }
    }
}