import path from "path";
import * as minimatch from 'minimatch';
import { getOSType, OSType } from "../../common/utils/platform";
import { FileChangeType, watchLocationForPattern } from '../../common/platform/fileSystemWatcher';
import { IDisposable } from "../../common/utils/resourceLifecycle";
import { logVerbose } from "../../common/logging";


export enum PythonEnvStructure {
    Standard = 'standard',
    Flat = 'flat',
}

const [executable, binName] = getOSType() === OSType.Windows ? ['python.exe', 'Scripts'] : ['python', 'bin'];

/**
 * Generate the globs to use when watching a directory for Python executables.
 */
export function resolvePythonExeGlobs(
    basenameGlob = executable,
    // Be default we always expect a "standard" structure.
    structure = PythonEnvStructure.Standard,
): string[] {
    if (path.posix.normalize(basenameGlob).includes('/')) {
        throw Error(`invalid basename glob "${basenameGlob}"`);
    }
    const globs: string[] = [];
    if (structure === PythonEnvStructure.Standard) {
        globs.push(
            // Check the directory.
            basenameGlob,
            // Check in all subdirectories.
            `*/${basenameGlob}`,
            // Check in the "bin" directory of all subdirectories.
            `*/${binName}/${basenameGlob}`,
        );
    } else if (structure === PythonEnvStructure.Flat) {
        // Check only the directory.
        globs.push(basenameGlob);
    }
    return globs;
}

/**
 * Start watching the given directory for changes to files matching the glob.
 *
 * @param baseDir - the root to which the glob is applied while watching
 * @param callback - called when the event happens
 * @param executableGlob - matches the executable under the directory
 */
export function watchLocationForPythonBinaries(
    baseDir: string,
    callback: (type: FileChangeType, absPath: string) => void,
    executableGlob: string = executable,
): IDisposable {
    const resolvedGlob = path.posix.normalize(executableGlob);
    const [baseGlob] = resolvedGlob.split('/').slice(-1);
    function callbackClosure(type: FileChangeType, e: string) {
        logVerbose('Received event', type, JSON.stringify(e), 'for baseglob', baseGlob);
        const isMatch = minimatch(path.basename(e), baseGlob, { nocase: getOSType() === OSType.Windows });
        if (!isMatch) {
            // When deleting the file for some reason path to all directories leading up to python are reported
            // Skip those events
            return;
        }
        callback(type, e);
    }
    return watchLocationForPattern(baseDir, resolvedGlob, callbackClosure);
}