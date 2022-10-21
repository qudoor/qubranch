import {
    CancellationToken,
    ConfigurationTarget,
    Disposable,
    Event,
    Extension,
    ExtensionContext,
    OutputChannel,
    Uri
} from 'vscode';
import { InterpreterUri, ModuleInstallFlags } from './installer/types';
import { LogLevel } from './logging/levels';
import { EnvironmentVariables } from './variables/types';

export type ExecutionInfo = {
    execPath?: string;
    moduleName?: string;
    args: string[];
    product?: Product;
};

export type InterpreterConfigurationScope = { uri: Resource; configTarget: ConfigurationTarget };
export type InspectInterpreterSettingType = {
    globalValue?: string;
    workspaceValue?: string;
    workspaceFolderValue?: string;
};
/**
 * Interface used to access current Interpreter Path
 */
export const IInterpreterPathService = Symbol('IInterpreterPathService');
export interface IInterpreterPathService {
    onDidChange: Event<InterpreterConfigurationScope>;
    get(resource: Resource): string;
    inspect(resource: Resource): InspectInterpreterSettingType;
    update(resource: Resource, configTarget: ConfigurationTarget, value: string | undefined): Promise<void>;
    copyOldInterpreterStorageValuesToNew(resource: Uri | undefined): Promise<void>;
}



export const IPersistentStateFactory = Symbol('IPersistentStateFactory');

export interface IPersistentStateFactory {
    createGlobalPersistentState<T>(key: string, defaultValue?: T, expiryDurationMs?: number): IPersistentState<T>;
    createWorkspacePersistentState<T>(key: string, defaultValue?: T, expiryDurationMs?: number): IPersistentState<T>;
}


export enum ToolExecutionPath {
    pipenv = 'pipenv',
    // Gradually populate this list with tools as they come up.
}

/**
 * Carries various tool execution path settings. For eg. pipenvPath, condaPath, pytestPath etc. These can be
 * potentially used in discovery, autoselection, activation, installers, execution etc. And so should be a
 * common interface to all the components.
 */
export const IToolExecutionPath = Symbol('IToolExecutionPath');
export interface IToolExecutionPath {
    readonly executable: string;
}

export interface ITerminalSettings {
    readonly executeInFileDir: boolean;
    readonly launchArgs: string[];
    readonly activateEnvironment: boolean;
    readonly activateEnvInCurrentTerminal: boolean;
}


export interface IProjectQSettings {
    readonly defaultInterpreterPath: string;
    readonly disablePythonDaemon: boolean;
    readonly pythonPath: string;
    readonly pipenvPath: string;
    readonly globalModuleInstallation: boolean;

    readonly terminal: ITerminalSettings;
}

export interface IWatchableProjectQSettings extends IProjectQSettings {
    readonly onDidChange: Event<void>;
}


export interface IDisposable {
    dispose(): void | undefined;
}
export interface IAsyncDisposable {
    dispose(): Promise<void>;
}
export const IExtensionContext = Symbol('ExtensionContext');
export interface IExtensionContext extends ExtensionContext { }

export interface IOutputChannel extends OutputChannel { }

export const IDisposableRegistry = Symbol('IDisposableRegistry');
export type IDisposableRegistry = Disposable[];

export const IMemento = Symbol('IGlobalMemento');
export const GLOBAL_MEMENTO = Symbol('IGlobalMemento');
export const WORKSPACE_MEMENTO = Symbol('IWorkspaceMemento');
export const IsDevMode = Symbol('IsDevMode');
export const IOutputChannel = Symbol('IOutputChannel');
export const IsCodeSpace = Symbol('IsCodeSpace');
export type Resource = Uri | undefined;

export enum Product {
    pytest = 1,
    pylint = 3,
    flake8 = 4,
    pycodestyle = 5,
    pylama = 6,
    prospector = 7,
    pydocstyle = 8,
    yapf = 9,
    autopep8 = 10,
    mypy = 11,
    unittest = 12,
    isort = 15,
    black = 16,
    bandit = 17,
    jupyter = 18,
    ipykernel = 19,
    notebook = 20,
    kernelspec = 21,
    nbconvert = 22,
    pandas = 23,
    tensorboard = 24,
    torchProfilerInstallName = 25,
    torchProfilerImportName = 26,
    pip = 27,
    ensurepip = 28,
}

export enum ModuleNamePurpose {
    install = 1,
    run = 2
}

export enum InstallerResponse {
    Installed,
    Disabled,
    Ignore
}
export const IExtensions = Symbol('IExtensions');
export interface IExtensions {
    /**
     * All extensions currently known to the system.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly all: readonly Extension<any>[];

    /**
     * An event which fires when `extensions.all` changes. This can happen when extensions are
     * installed, uninstalled, enabled or disabled.
     */
    readonly onDidChange: Event<void>;

    /**
     * Get an extension by its full identifier in the form of: `publisher.name`.
     *
     * @param extensionId An extension identifier.
     * @return An extension or `undefined`.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getExtension(extensionId: string): Extension<any> | undefined;

    /**
     * Get an extension its full identifier in the form of: `publisher.name`.
     *
     * @param extensionId An extension identifier.
     * @return An extension or `undefined`.
     */
    getExtension<T>(extensionId: string): Extension<T> | undefined;
    determineExtensionFromCallStack(): Promise<{ extensionId: string; displayName: string }>;
}

export const IAsyncDisposableRegistry = Symbol('IAsyncDisposableRegistry');
export interface IAsyncDisposableRegistry extends IAsyncDisposable {
    push(disposable: IDisposable | IAsyncDisposable): void;
}

export const IInstaller = Symbol('IInstaller');

export interface IInstaller {
    promptToInstall(
        product: Product,
        resource?: InterpreterUri,
        cancel?: CancellationToken,
        flags?: ModuleInstallFlags,
    ): Promise<InstallerResponse>;
    install(
        product: Product,
        resource?: InterpreterUri,
        cancel?: CancellationToken,
        flags?: ModuleInstallFlags,
    ): Promise<InstallerResponse>;
    isInstalled(product: Product, resource?: InterpreterUri): Promise<boolean>;
    isProductVersionCompatible(
        product: Product,
        semVerRequirement: string,
        resource?: InterpreterUri,
    ): Promise<ProductInstallStatus>;
    translateProductToModuleName(product: Product): string;
}

export const IConfigurationService = Symbol('IConfigurationService');
export interface IConfigurationService {
    getSettings(resource?: Uri): IWatchableProjectQSettings;
    isTestExecution(): boolean;
    updateSetting(setting: string, value?: {}, resource?: Uri, configTarget?: ConfigurationTarget): Promise<void>;
    updateSectionSetting(
        section: string,
        setting: string,
        value?: {},
        resource?: Uri,
        configTarget?: ConfigurationTarget
    ): Promise<void>;
}

export type LoggingLevelSettingType = 'off' | 'error' | 'warn' | 'info' | 'debug' | 'verbose';
export interface ILoggingSettings {
    readonly level: LogLevel | 'off';
}
export interface IExperiments {
    /**
     * Return `true` if experiments are enabled, else `false`.
     */
    readonly enabled: boolean;
    /**
     * Experiments user requested to opt into manually
     */
    readonly optInto: string[];
    /**
     * Experiments user requested to opt out from manually
     */
    readonly optOutFrom: string[];
}

// eslint-disable-next-line
// TODO: Drop IPathUtils in favor of IFileSystemPathUtils.
// See https://github.com/microsoft/vscode-python/issues/8542.
export const IPathUtils = Symbol('IPathUtils');
export interface IPathUtils {
    readonly delimiter: string;
    readonly home: string;
    /**
     * The platform-specific file separator. '\\' or '/'.
     * @type {string}
     * @memberof IPathUtils
     */
    readonly separator: string;
    basename(pathValue: string, ext?: string): string;
    getDisplayName(pathValue: string, cwd?: string): string;
}

export const IsWindows = Symbol('IS_WINDOWS');

export interface IPersistentState<T> {
    readonly value: T;
    updateValue(value: T): Promise<void>;
}


export const ICurrentProcess = Symbol('ICurrentProcess');
export interface ICurrentProcess {
    readonly env: EnvironmentVariables;
    readonly argv: string[];
    readonly stdout: NodeJS.WriteStream;
    readonly stdin: NodeJS.ReadStream;
    readonly execPath: string;
    // eslint-disable-next-line @typescript-eslint/ban-types
    on(event: string | symbol, listener: Function): this;
}

/**
 * Interface used to access current Interpreter Path
 */
export const IInterpreterPathProxyService = Symbol('IInterpreterPathProxyService');
export interface IInterpreterPathProxyService {
    get(resource: Resource): string;
}

export enum ProductInstallStatus {
    Installed,
    NotInstalled,
    NeedsUpgrade,
}

/**
 * Experiment service leveraging VS Code's experiment framework.
 */
export const IExperimentService = Symbol('IExperimentService');
export interface IExperimentService {
    activate(): Promise<void>;
    inExperiment(experimentName: string): Promise<boolean>;
    inExperimentSync(experimentName: string): boolean;
    getExperimentValue<T extends boolean | number | string>(experimentName: string): Promise<T | undefined>;
}