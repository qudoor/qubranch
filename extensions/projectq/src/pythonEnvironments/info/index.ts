import { Architecture } from "../../common/utils/platform";
import { PythonVersion } from "./pythonVersion";
/**
 * The supported Python environment types.
 */
export enum EnvironmentType {
    Unknown = 'Unknown',
    Conda = 'Conda',
    VirtualEnv = 'VirtualEnv',
    Pipenv = 'PipEnv',
    Pyenv = 'Pyenv',
    Venv = 'Venv',
    WindowsStore = 'WindowsStore',
    Poetry = 'Poetry',
    VirtualEnvWrapper = 'VirtualEnvWrapper',
    Global = 'Global',
    System = 'System',
}
/**
 * Details about a Python runtime.
 *
 * @prop path - the location of the executable file
 * @prop version - the runtime version
 * @prop sysVersion - the raw value of `sys.version`
 * @prop sysPrefix - the environment's install root (`sys.prefix`)
 */
export type InterpreterInformation = {
    path: string;
    version?: PythonVersion;
    sysVersion?: string;
    sysPrefix: string;
    architecture?: Architecture;
};

/**
 * Details about a Python environment.
 * @prop envType - the kind of Python environment
 */
export type PythonEnvironment = InterpreterInformation & {
    companyDisplayName?: string;
    displayName?: string;
    envType?: EnvironmentType;
    envName?: string;
    envPath?: string;
};

/**
 * The IModuleInstaller implementations.
 */
export enum ModuleInstallerType {
    Unknown = 'Unknown',
    Conda = 'Conda',
    Pip = 'Pip',
    Poetry = 'Poetry',
    Pipenv = 'Pipenv',
}