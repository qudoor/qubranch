import * as fsapi from 'fs-extra';
import * as vscode from 'vscode';
import { chain, iterable } from '../../common/utils/async';

// processes

import { IServiceContainer } from "../../ioc/types";
import { ShellOptions, ExecutionResult, IProcessServiceFactory, SpawnOptions } from "../../common/process/types";
import * as path from 'path';
import { getOSType, OSType } from "../../common/utils/platform";
import { IConfigurationService, IDisposable } from '../../common/types';

let internalServiceContainer: IServiceContainer;
export function initializeExternalDependencies(serviceContainer: IServiceContainer): void {
    internalServiceContainer = serviceContainer;
}

export async function shellExecute(command: string, options: ShellOptions = {}): Promise<ExecutionResult<string>> {
    const service = await internalServiceContainer.get<IProcessServiceFactory>(IProcessServiceFactory).create();
    return service.shellExec(command, options);
}

export function arePathsSame(path1: string, path2: string): boolean {
    return normCasePath(path1) === normCasePath(path2);
}
export function normCasePath(filePath: string): string {
    return getOSType() === OSType.Windows ? path.normalize(filePath).toUpperCase() : path.normalize(filePath);
}
// filesystem

export function pathExists(absPath: string): Promise<boolean> {
    return fsapi.pathExists(absPath);
}

export function pathExistsSync(absPath: string): boolean {
    return fsapi.pathExistsSync(absPath);
}

export function readFile(filePath: string): Promise<string> {
    return fsapi.readFile(filePath, 'utf-8');
}

export function readFileSync(filePath: string): string {
    return fsapi.readFileSync(filePath, 'utf-8');
}

// eslint-disable-next-line global-require
export const untildify: (value: string) => string = require('untildify');

/**
 * Returns true if given file path exists within the given parent directory, false otherwise.
 * @param filePath File path to check for
 * @param parentPath The potential parent path to check for
 */
export function isParentPath(filePath: string, parentPath: string): boolean {
    if (!parentPath.endsWith(path.sep)) {
        parentPath += path.sep;
    }
    if (!filePath.endsWith(path.sep)) {
        filePath += path.sep;
    }
    return normCasePath(filePath).startsWith(normCasePath(parentPath));
}

export function getWorkspaceFolders(): string[] {
    return vscode.workspace.workspaceFolders?.map((w) => w.uri.fsPath) ?? [];
}

/**
 * Returns the value for setting `python.<name>`.
 * @param name The name of the setting.
 */
export function getPythonSetting<T>(name: string): T | undefined {
    const settings = internalServiceContainer.get<IConfigurationService>(IConfigurationService).getSettings();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (settings as any)[name];
}

export async function exec(file: string, args: string[], options: SpawnOptions = {}): Promise<ExecutionResult<string>> {
    const service = await internalServiceContainer.get<IProcessServiceFactory>(IProcessServiceFactory).create();
    return service.exec(file, args, options);
}

/**
 * Returns full path to sub directories of a given directory.
 * @param {string} root : path to get sub-directories from.
 * @param options : If called with `resolveSymlinks: true`, then symlinks found in
 *                  the directory are resolved and if they resolve to directories
 *                  then resolved values are returned.
 */
export async function* getSubDirs(
    root: string,
    options?: { resolveSymlinks?: boolean },
): AsyncIterableIterator<string> {
    const dirContents = await fsapi.promises.readdir(root, { withFileTypes: true });
    const generators = dirContents.map((item) => {
        async function* generator() {
            const fullPath = path.join(root, item.name);
            if (item.isDirectory()) {
                yield fullPath;
            } else if (options?.resolveSymlinks && item.isSymbolicLink()) {
                // The current FS item is a symlink. It can potentially be a file
                // or a directory. Resolve it first and then check if it is a directory.
                const resolvedPath = await resolveSymbolicLink(fullPath);
                const resolvedPathStat = await fsapi.lstat(resolvedPath);
                if (resolvedPathStat.isDirectory()) {
                    yield resolvedPath;
                }
            }
        }

        return generator();
    });

    yield* iterable(chain(generators));
}


export async function resolveSymbolicLink(absPath: string): Promise<string> {
    const stats = await fsapi.lstat(absPath);
    if (stats.isSymbolicLink()) {
        const link = await fsapi.readlink(absPath);
        // Result from readlink is not guaranteed to be an absolute path. For eg. on Mac it resolves
        // /usr/local/bin/python3.9 -> ../../../Library/Frameworks/Python.framework/Versions/3.9/bin/python3.9
        //
        // The resultant path is reported relative to the symlink directory we resolve. Convert that to absolute path.
        const absLinkPath = path.isAbsolute(link) ? link : path.resolve(path.dirname(absPath), link);
        return resolveSymbolicLink(absLinkPath);
    }
    return absPath;
}

/**
 * Registers the listener to be called when a particular setting changes.
 * @param name The name of the setting.
 * @param callback The listener function to be called when the setting changes.
 */
export function onDidChangePythonSetting(name: string, callback: () => void): IDisposable {
    return vscode.workspace.onDidChangeConfiguration((event: vscode.ConfigurationChangeEvent) => {
        if (event.affectsConfiguration(`python.${name}`)) {
            callback();
        }
    });
}
