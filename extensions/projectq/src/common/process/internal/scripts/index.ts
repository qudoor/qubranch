import * as path from 'path';
import { EXTENSION_ROOT_DIR } from '../../../../constants';

// It is simpler to hard-code it instead of using vscode.ExtensionContext.extensionPath.
export const _SCRIPTS_DIR = path.join(EXTENSION_ROOT_DIR, 'pythonFiles');
const SCRIPTS_DIR = _SCRIPTS_DIR;
type ReleaseLevel = 'alpha' | 'beta' | 'candidate' | 'final';

type PythonVersionInfo = [number, number, number, ReleaseLevel, number];
export type InterpreterInfoJson = {
    versionInfo: PythonVersionInfo;
    sysPrefix: string;
    sysVersion: string;
    is64Bit: boolean;
};

export type PythonEnvInfo = {
    versionInfo: PythonVersionInfo;
    sysPrefix: string;
    sysVersion: string;
    is64Bit: boolean;
    exe: string;
};


export function interpreterInfo(): [string[], (out: string) => PythonEnvInfo] {
    const script = path.join(SCRIPTS_DIR, 'interpreterInfo.py');
    const args = [script];

    function parse(out: string): PythonEnvInfo {
        let json: PythonEnvInfo;
        try {
            json = JSON.parse(out);
        } catch (ex) {
            throw Error(`python ${args} returned bad JSON (${out}) (${ex})`);
        }
        return json;
    }

    return [args, parse];
}

//============================
// printEnvVariables.py

export function printEnvVariables(): [string[], (out: string) => NodeJS.ProcessEnv] {
    const script = path.join(SCRIPTS_DIR, 'printEnvVariables.py').fileToCommandArgument();
    const args = [script];

    function parse(out: string): NodeJS.ProcessEnv {
        return JSON.parse(out);
    }

    return [args, parse];
}

// eslint-disable-next-line camelcase
export function shell_exec(command: string, lockfile: string, shellArgs: string[]): string[] {
    const script = path.join(SCRIPTS_DIR, 'shell_exec.py');
    // We don't bother with a "parse" function since the output
    // could be anything.
    return [
        script,
        command.fileToCommandArgument(),
        // The shell args must come after the command
        // but before the lockfile.
        ...shellArgs,
        lockfile.fileToCommandArgument(),
    ];
}