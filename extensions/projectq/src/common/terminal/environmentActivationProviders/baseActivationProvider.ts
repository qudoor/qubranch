import { inject, injectable } from "inversify";
import * as path from "path";
import { IFileSystem } from "../../../common/platform/types";
import { IConfigurationService } from "../../../common/types";
import { IServiceContainer } from "../../../ioc/types";
import { Uri } from "vscode";
import { ITerminalActivationCommandProvider, TerminalShellType } from "../types";

type ExecutableFinderFunc = (python: string) => Promise<string | undefined>;

/**
 * Build an "executable finder" function that identifies venv environments.
 *
 * @param basename - the venv name or names to look for
 * @param pathDirname - typically `path.dirname`
 * @param pathJoin - typically `path.join`
 * @param fileExists - typically `fs.exists`
 */

function getVenvExecutableFinder(
    basename: string | string[],
    // <path>
    pathDirname: (filename: string) => string,
    pathJoin: (...parts: string[]) => string,
    // </path>
    fileExists: (n: string) => Promise<boolean>,
): ExecutableFinderFunc {
    const basenames = typeof basename === 'string' ? [basename] : basename;
    return async (python: string) => {
        // Generated scripts are found in the same directory as the interpreter.
        const binDir = pathDirname(python);
        for (const name of basenames) {
            const filename = pathJoin(binDir, name);
            if (await fileExists(filename)) {
                return filename;
            }
        }
        // No matches so return undefined.
        return undefined;
    };
}

@injectable()
abstract class BaseActivationCommandProvider implements ITerminalActivationCommandProvider {
    constructor(@inject(IServiceContainer) protected readonly serviceContainer: IServiceContainer) { }

    public abstract isShellSupported(targetShell: TerminalShellType): boolean;
    public getActivationCommands(
        resource: Uri | undefined,
        targetShell: TerminalShellType,
    ): Promise<string[] | undefined> {
        const pythonPath = this.serviceContainer.get<IConfigurationService>(IConfigurationService).getSettings(resource)
            .pythonPath;
        return this.getActivationCommandsForInterpreter(pythonPath, targetShell);
    }
    public abstract getActivationCommandsForInterpreter(
        pythonPath: string,
        targetShell: TerminalShellType,
    ): Promise<string[] | undefined>;
}

export type ActivationScripts = Record<TerminalShellType, string[]>;

export abstract class VenvBaseActivationCommandProvider extends BaseActivationCommandProvider {
    public isShellSupported(targetShell: TerminalShellType): boolean {
        return this.scripts[targetShell] !== undefined;
    }

    protected abstract get scripts(): ActivationScripts;

    protected async findScriptFile(pythonPath: string, targetShell: TerminalShellType): Promise<string | undefined> {
        const fs = this.serviceContainer.get<IFileSystem>(IFileSystem);
        const candidates = this.scripts[targetShell];
        if (!candidates) {
            return undefined;
        }
        const findScript = getVenvExecutableFinder(
            candidates,
            path.dirname,
            path.join,
            // Bind "this"!
            (n: string) => fs.fileExists(n),
        );
        return findScript(pythonPath);
    }
}
