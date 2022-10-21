// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import * as os from 'os';
import { gte } from 'semver';
import { PythonEnvKind, PythonEnvSource } from '../../info';
import { BasicEnvInfo, IPythonEnvsIterator, Locator } from '../../locator';
import { commonPosixBinPaths, getPythonBinFromPosixPaths } from '../../../common/posixUtils';
import { isPyenvShimDir } from '../../../common/environmentManagers/pyenv';
import { getOSType, OSType } from '../../../../common/utils/platform';
import { isMacDefaultPythonPath } from './macDefaultLocator';
import { logError } from '../../../../common/logging';

export class PosixKnownPathsLocator extends Locator<BasicEnvInfo> {
    private kind: PythonEnvKind = PythonEnvKind.OtherGlobal;

    public iterEnvs(): IPythonEnvsIterator<BasicEnvInfo> {
        // Flag to remove system installs of Python 2 from the list of discovered interpreters
        // If on macOS Monterey or later.
        // See https://github.com/microsoft/vscode-python/issues/17870.
        let isMacPython2Deprecated = false;
        if (getOSType() === OSType.OSX && gte(os.release(), '21.0.0')) {
            isMacPython2Deprecated = true;
        }

        const iterator = async function* (kind: PythonEnvKind) {
            // Filter out pyenv shims. They are not actual python binaries, they are used to launch
            // the binaries specified in .python-version file in the cwd. We should not be reporting
            // those binaries as environments.
            const knownDirs = (await commonPosixBinPaths()).filter((dirname) => !isPyenvShimDir(dirname));
            let pythonBinaries = await getPythonBinFromPosixPaths(knownDirs);

            // Filter out MacOS system installs of Python 2 if necessary.
            if (isMacPython2Deprecated) {
                pythonBinaries = pythonBinaries.filter((binary) => !isMacDefaultPythonPath(binary));
            }

            for (const bin of pythonBinaries) {
                try {
                    yield { executablePath: bin, kind, source: [PythonEnvSource.PathEnvVar] };
                } catch (ex) {
                    logError(`Failed to process environment: ${bin}`, ex);
                }
            }
        };
        return iterator(this.kind);
    }
}
