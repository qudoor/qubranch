// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
'use strict';

import { Uri } from "vscode";
import { InterpreterUri } from "../installer/types";
import { isParentPath } from "../platform/fs-paths";
import { Resource } from "../types";
import { isPromise } from "./async";
import { TraceInfo } from "./decorators";
import { StopWatch } from "./stopWatch";
// eslint-disable-next-line no-empty,@typescript-eslint/no-empty-function
export function noop() { }
/**
 * Checking whether something is a Resource (Uri/undefined).
 * Using `instanceof Uri` doesn't always work as the object is not an instance of Uri (at least not in tests).
 * That's why VSC too has a helper method `URI.isUri` (though not public).
 *
 * @export
 * @param {InterpreterUri} [resource]
 * @returns {resource is Resource}
 */
export function isResource(resource?: InterpreterUri): resource is Resource {
    if (!resource) {
        return true;
    }
    const uri = resource as Uri;
    return typeof uri.path === 'string' && typeof uri.scheme === 'string';
}
// Call run(), call log() with the trace info, and return the result.
export function tracing<T>(log: (t: TraceInfo) => void, run: () => T, logBeforeCall?: boolean): T {
    const timer = new StopWatch();
    try {
        if (logBeforeCall) {
            log(undefined);
        }
        // eslint-disable-next-line no-invalid-this, @typescript-eslint/no-use-before-define,
        const result = run();

        // If method being wrapped returns a promise then wait for it.
        if (isPromise(result)) {
            // eslint-disable-next-line
            (result as Promise<void>)
                .then((data) => {
                    log({ elapsed: timer.elapsedTime, returnValue: data });
                    return data;
                })
                .catch((ex) => {
                    log({ elapsed: timer.elapsedTime, err: ex });
                    // eslint-disable-next-line
                    // TODO(GH-11645) Re-throw the error like we do
                    // in the non-Promise case.
                });
        } else {
            log({ elapsed: timer.elapsedTime, returnValue: result });
        }
        return result;
    } catch (ex) {
        log({ elapsed: timer.elapsedTime, err: ex });
        throw ex;
    }
}

/**
 * Create a filter func that determine if the given URI and candidate match.
 *
 * The scheme must match, as well as path.
 *
 * @param checkParent - if `true`, match if the candidate is rooted under `uri`
 * or if the candidate matches `uri` exactly.
 * @param checkChild - if `true`, match if `uri` is rooted under the candidate
 * or if the candidate matches `uri` exactly.
 */
export function getURIFilter(
    uri: Uri,
    opts: {
        checkParent?: boolean;
        checkChild?: boolean;
    } = { checkParent: true },
): (u: Uri) => boolean {
    let uriPath = uri.path;
    while (uriPath.endsWith('/')) {
        uriPath = uriPath.slice(0, -1);
    }
    const uriRoot = `${uriPath}/`;
    function filter(candidate: Uri): boolean {
        if (candidate.scheme !== uri.scheme) {
            return false;
        }
        let candidatePath = candidate.path;
        while (candidatePath.endsWith('/')) {
            candidatePath = candidatePath.slice(0, -1);
        }
        if (opts.checkParent && isParentPath(candidatePath, uriRoot)) {
            return true;
        }
        if (opts.checkChild) {
            const candidateRoot = `${candidatePath}/`;
            if (isParentPath(uriPath, candidateRoot)) {
                return true;
            }
        }
        return false;
    }
    return filter;
}