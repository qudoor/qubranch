// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import '../../../../common/extensions';
import { PythonEnvKind } from '../../info';
import { BasicEnvInfo, IPythonEnvsIterator, Locator } from '../../locator';
import { getInterpreterPathFromDir } from '../../../common/commonUtils';
import { Conda } from '../../../common/environmentManagers/conda';
import { logVerbose, logError } from '../../../../common/logging';

export class CondaEnvironmentLocator extends Locator<BasicEnvInfo> {
    // eslint-disable-next-line class-methods-use-this
    public async *iterEnvs(): IPythonEnvsIterator<BasicEnvInfo> {
        const conda = await Conda.getConda();
        if (conda === undefined) {
            logVerbose(`Couldn't locate the conda binary.`);
            return;
        }
        logVerbose(`Searching for conda environments using ${conda.command}`);

        const envs = await conda.getEnvList();
        for (const { prefix } of envs) {
            const executablePath = await getInterpreterPathFromDir(prefix);
            if (executablePath !== undefined) {
                logVerbose(`Found conda environment: ${executablePath}`);
                try {
                    yield { kind: PythonEnvKind.Conda, executablePath };
                } catch (ex) {
                    logError(`Failed to process environment: ${executablePath}`, ex);
                }
            }
        }
    }
}
