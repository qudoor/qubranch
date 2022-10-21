import { logError } from "../../common/logging";
import { PythonEnvKind } from "../base/info";
import { getPrioritizedEnvKinds } from "../base/info/envKind";
import { isCondaEnvironment } from "./environmentManagers/conda";
import { isGloballyInstalledEnv } from "./environmentManagers/globalInstalledEnvs";
import { isPipenvEnvironment } from "./environmentManagers/pipenv";
import { isPoetryEnvironment } from "./environmentManagers/poetry";
import { isPyenvEnvironment } from "./environmentManagers/pyenv";
import { isVenvEnvironment, isVirtualenvwrapperEnvironment as isVirtualEnvWrapperEnvironment, isVirtualenvEnvironment as isVirtualEnvEnvironment, } from "./environmentManagers/simplevirtualenvs";
import { isWindowsStoreEnvironment } from "./environmentManagers/windowsStoreEnv";

/**
 * Returns environment type.
 * @param {string} interpreterPath : Absolute path to the python interpreter binary.
 * @returns {PythonEnvKind}
 */
export async function identifyEnvironment(interpreterPath: string): Promise<PythonEnvKind> {
    const identifiers = getIdentifiers();
    const prioritizedEnvTypes = getPrioritizedEnvKinds();
    for (const e of prioritizedEnvTypes) {
        try {
            const identifier = identifiers.get(e);
            if (identifier && (await identifier(interpreterPath))) {
                return e;
            }
        } catch (error) {
            logError(`identifyEnvironment error ${error}`);
        }
    }
    return PythonEnvKind.Unknown;
}

function getIdentifiers(): Map<PythonEnvKind, (path: string) => Promise<boolean>> {
    const notImplemented = () => Promise.resolve(false);
    const defaultTrue = () => Promise.resolve(true);
    const identifier: Map<PythonEnvKind, (path: string) => Promise<boolean>> = new Map();
    Object.values(PythonEnvKind).forEach((k) => {
        identifier.set(k, notImplemented);
    });

    identifier.set(PythonEnvKind.Conda, isCondaEnvironment);
    identifier.set(PythonEnvKind.WindowsStore, isWindowsStoreEnvironment);
    identifier.set(PythonEnvKind.Pipenv, isPipenvEnvironment);
    identifier.set(PythonEnvKind.Pyenv, isPyenvEnvironment);
    identifier.set(PythonEnvKind.Poetry, isPoetryEnvironment);
    identifier.set(PythonEnvKind.Venv, isVenvEnvironment);
    identifier.set(PythonEnvKind.VirtualEnvWrapper, isVirtualEnvWrapperEnvironment);
    identifier.set(PythonEnvKind.VirtualEnv, isVirtualEnvEnvironment);
    identifier.set(PythonEnvKind.Unknown, defaultTrue);
    identifier.set(PythonEnvKind.OtherGlobal, isGloballyInstalledEnv);
    return identifier;
}
