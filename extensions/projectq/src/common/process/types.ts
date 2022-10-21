import { ChildProcess, ExecOptions, SpawnOptions as ChildProcessSpawnOptions } from 'child_process';
import { Observable } from 'rxjs/Observable';

import { InterpreterInformation, PythonEnvironment } from "../../pythonEnvironments/info";
import { Uri, CancellationToken } from "vscode";
import { IDisposable } from "../types";
import { Newable } from "../../ioc/types";
import { PythonExecInfo } from "../../pythonEnvironments/exec";
import { BaseError } from '../errors/types';

export function isDaemonPoolCreationOption(
    options: PooledDaemonExecutionFactoryCreationOptions | DedicatedDaemonExecutionFactoryCreationOptions
): options is PooledDaemonExecutionFactoryCreationOptions {
    if ('dedicated' in options && options.dedicated === true) {
        return false;
    } else {
        return true;
    }
}

export const IProcessLogger = Symbol('IProcessLogger');
export interface IProcessLogger {
    logProcess(file: string, ars: string[], options?: SpawnOptions): void;
}

export const IBufferDecoder = Symbol('IBufferDecoder');
export interface IBufferDecoder {
    decode(buffers: Buffer[], encoding: string): string;
}
export class StdErrError extends BaseError {
    constructor(message: string) {
        super('unknown', message);
    }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export type SpawnOptions = ChildProcessSpawnOptions & {
    encoding?: string;
    token?: CancellationToken;
    mergeStdOutErr?: boolean;
    throwOnStdErr?: boolean;
};

export type Output<T extends string | Buffer> = {
    source: 'stdout' | 'stderr';
    out: T;
};

export type ObservableExecutionResult<T extends string | Buffer> = {
    proc: ChildProcess | undefined;
    out: Observable<Output<T>>;
    dispose(): void;
};
export type ExecutionFactoryCreationOptions = {
    resource?: Uri;
    pythonPath?: string;
};
export const IPythonExecutionFactory = Symbol('IPythonExecutionFactory');
export interface IPythonExecutionFactory {
    create(options: ExecutionFactoryCreationOptions): Promise<IPythonExecutionService>;

    createActivatedEnvironment(options: ExecutionFactoryCreateWithEnvironmentOptions): Promise<IPythonExecutionService>;
}
export type ExecutionResult<T extends string | Buffer> = {
    stdout: T;
    stderr?: T;
};
export const IPythonExecutionService = Symbol('IPythonExecutionService');

export interface IPythonExecutionService {
    getInterpreterInformation(): Promise<InterpreterInformation | undefined>;
    getExecutablePath(): Promise<string>;
    isModuleInstalled(moduleName: string): Promise<boolean>;
    getModuleVersion(moduleName: string): Promise<string | undefined>;
    getExecutionInfo(pythonArgs?: string[]): PythonExecInfo;

    execObservable(args: string[], options: SpawnOptions): ObservableExecutionResult<string>;
    execModuleObservable(moduleName: string, args: string[], options: SpawnOptions): ObservableExecutionResult<string>;

    exec(args: string[], options: SpawnOptions): Promise<ExecutionResult<string>>;
    execModule(moduleName: string, args: string[], options: SpawnOptions): Promise<ExecutionResult<string>>;
}
/**
 * Identical to the PythonExecutionService, but with a `dispose` method.
 * This is a daemon process that lives on until it is disposed, hence the `IDisposable`.
 *
 * @export
 * @interface IPythonDaemonExecutionService
 * @extends {IPythonExecutionService}
 * @extends {IDisposable}
 */
export interface IPythonDaemonExecutionService extends IPythonExecutionService, IDisposable { }

export type DaemonExecutionFactoryCreationOptions =
    | PooledDaemonExecutionFactoryCreationOptions
    | DedicatedDaemonExecutionFactoryCreationOptions;

// This daemon will belong to a daemon pool (i.e it goes back into a pool for re-use).
export type PooledDaemonExecutionFactoryCreationOptions = ExecutionFactoryCreationOptions & {
    /**
     * Python file that implements the daemon.
     *
     * @type {string}
     */
    daemonModule?: string;
    /**
     * Typescript Daemon class (client) that maps to the Python daemon.
     * Defaults to `PythonDaemonExecutionService`.
     * Any other class provided must extend `PythonDaemonExecutionService`.
     *
     * @type {Newable<IPythonDaemonExecutionService>}
     */
    daemonClass?: Newable<IPythonDaemonExecutionService>;
    /**
     * Number of daemons to be created for standard synchronous operations such as
     * checking if a module is installed, running a module, running a python file, etc.
     * Defaults to `2`.
     *
     */
    daemonCount?: number;
    /**
     * Number of daemons to be created for operations such as execObservable, execModuleObservale.
     * These operations are considered to be long running compared to checking if a module is installed.
     * Hence a separate daemon will be created for this.
     * Defaults to `1`.
     *
     */
    observableDaemonCount?: number;
};

// This daemon will not belong to a daemon pool (i.e its a dedicated daemon and cannot be re-used).
export type DedicatedDaemonExecutionFactoryCreationOptions = ExecutionFactoryCreationOptions & {
    /**
     * Python file that implements the daemon.
     */
    daemonModule?: string;
    /**
     * Typescript Daemon class (client) that maps to the Python daemon.
     * Defaults to `PythonDaemonExecutionService`.
     * Any other class provided must extend `PythonDaemonExecutionService`.
     */
    daemonClass?: Newable<IPythonDaemonExecutionService | IDisposable>;
    /**
     * This flag indicates it is a dedicated daemon.
     */
    dedicated: true;
};
export type ExecutionFactoryCreateWithEnvironmentOptions = {
    resource?: Uri;
    interpreter?: PythonEnvironment;
    allowEnvironmentFetchExceptions?: boolean;
    /**
     * Ignore running `conda run` when running code.
     * It is known to fail in certain scenarios. Where necessary we might want to bypass this.
     *
     * @type {boolean}
     */
    bypassCondaExecution?: boolean;
};

export const IProcessServiceFactory = Symbol('IProcessServiceFactory');

export interface IProcessServiceFactory {
    create(resource?: Uri): Promise<IProcessService>;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export type ShellOptions = ExecOptions & { throwOnStdErr?: boolean };

export interface IProcessService extends IDisposable {
    execObservable(file: string, args: string[], options?: SpawnOptions): ObservableExecutionResult<string>;
    exec(file: string, args: string[], options?: SpawnOptions): Promise<ExecutionResult<string>>;
    shellExec(command: string, options?: ShellOptions): Promise<ExecutionResult<string>>;
    on(event: 'exec', listener: (file: string, args: string[], options?: SpawnOptions) => void): this;
}

export interface IPythonExecutionFactory {
    create(options: ExecutionFactoryCreationOptions): Promise<IPythonExecutionService>;

    createActivatedEnvironment(options: ExecutionFactoryCreateWithEnvironmentOptions): Promise<IPythonExecutionService>;
}

export interface IPersistentState<T> {
    readonly value: T;
    updateValue(value: T): Promise<void>;
}