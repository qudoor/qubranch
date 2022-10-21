import * as path from 'path';
import { logError } from '../../../../common/logging';
import { getInterpreterPathFromDir } from '../../../../pythonEnvironments/common/commonUtils';
import { getPyenvDir } from '../../../../pythonEnvironments/common/environmentManagers/pyenv';
import { getSubDirs } from '../../../../pythonEnvironments/common/externalDependencies';
import { PythonEnvKind } from "../../info";
import { BasicEnvInfo, IPythonEnvsIterator } from "../../locator";
import { FSWatchingLocator } from "./fsWatchingLocator";

export class PyenvLocator extends FSWatchingLocator<BasicEnvInfo> {
    constructor() {
        super(getPyenvVersionsDir, async () => PythonEnvKind.Pyenv);
    }

    // eslint-disable-next-line class-methods-use-this
    public doIterEnvs(): IPythonEnvsIterator<BasicEnvInfo> {
        return getPyenvEnvironments();
    }
}

function getPyenvVersionsDir(): string {
    return path.join(getPyenvDir(), 'versions');
}


/**
 * Gets all the pyenv environments.
 *
 * Remarks: This function looks at the <pyenv dir>/versions directory and gets
 * all the environments (global or virtual) in that directory.
 */
async function* getPyenvEnvironments(): AsyncIterableIterator<BasicEnvInfo> {
    const pyenvVersionDir = getPyenvVersionsDir();

    const subDirs = getSubDirs(pyenvVersionDir, { resolveSymlinks: true });
    for await (const subDirPath of subDirs) {
        const interpreterPath = await getInterpreterPathFromDir(subDirPath);

        if (interpreterPath) {
            try {
                yield {
                    kind: PythonEnvKind.Pyenv,
                    executablePath: interpreterPath,
                };
            } catch (ex) {
                logError(`Failed to process environment: ${interpreterPath}`, ex);
            }
        }
    }
}
