import * as vscode from 'vscode';


/*
See:
  + https://nodejs.org/api/errors.html
  + https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
  + node_modules/@types/node/globals.d.ts
 */

// Return true if the given error is EEXIST.
export function isFileExistsError(err: Error): boolean | undefined {
    const matched = vscErrors.isFileExists(err);
    if (matched !== undefined) {
        return matched;
    }
    return isSystemError(err, 'EEXIST');
}


interface IError {
    name: string;
    message: string;

    toString(): string;
}

interface INodeJSError extends IError {
    code: string;
    stack?: string;
    stackTraceLimit: number;

    captureStackTrace(): void;
}

interface ISystemError extends INodeJSError {
    errno: number;
    syscall: string;
    info?: string;
    path?: string;
    address?: string;
    dest?: string;
    port?: string;
}

// Return a new error for errno ENOTEMPTY.
export function createDirNotEmptyError(dirname: string): ISystemError {
    const err = new Error(`directory "${dirname}" not empty`) as ISystemError;
    err.name = 'SystemError';
    err.code = 'ENOTEMPTY';
    err.path = dirname;
    err.syscall = 'rmdir';
    return err;
}


//================================
// "system" errors

namespace vscErrors {
    const FILE_NOT_FOUND = vscode.FileSystemError.FileNotFound().name;
    const FILE_EXISTS = vscode.FileSystemError.FileExists().name;
    const IS_DIR = vscode.FileSystemError.FileIsADirectory().name;
    const NOT_DIR = vscode.FileSystemError.FileNotADirectory().name;
    const NO_PERM = vscode.FileSystemError.NoPermissions().name;
    const known = [
        // (order does not matter)
        FILE_NOT_FOUND,
        FILE_EXISTS,
        IS_DIR,
        NOT_DIR,
        NO_PERM
    ];
    function errorMatches(err: Error, expectedName: string): boolean | undefined {
        if (!known.includes(err.name)) {
            return undefined;
        }
        return err.name === expectedName;
    }

    export function isFileNotFound(err: Error): boolean | undefined {
        return errorMatches(err, FILE_NOT_FOUND);
    }
    export function isFileExists(err: Error): boolean | undefined {
        return errorMatches(err, FILE_EXISTS);
    }
    export function isFileIsDir(err: Error): boolean | undefined {
        return errorMatches(err, IS_DIR);
    }
    export function isNotDir(err: Error): boolean | undefined {
        return errorMatches(err, NOT_DIR);
    }
    export function isNoPermissions(err: Error): boolean | undefined {
        return errorMatches(err, NO_PERM);
    }
}


// Return true if the given error is ENOENT.
export function isFileNotFoundError(err: Error): boolean | undefined {
    const matched = vscErrors.isFileNotFound(err);
    if (matched !== undefined) {
        return matched;
    }
    return isSystemError(err, 'ENOENT');
}

function isSystemError(err: Error, expectedCode: string): boolean | undefined {
    const code = (err as ISystemError).code;
    if (!code) {
        return undefined;
    }
    return code === expectedCode;
}

// Return true if the given error is EACCES.
export function isNoPermissionsError(err: Error): boolean | undefined {
    const matched = vscErrors.isNoPermissions(err);
    if (matched !== undefined) {
        return matched;
    }
    return isSystemError(err, 'EACCES');
}
