import { isTestExecution } from "../constants";
import { logError, logVerbose } from "../logging";
import { isPromise } from "./async";
import { getCacheKeyFromFunctionArgs, getGlobalCacheStore } from "./cacheUtils";
import { StopWatch } from "./stopWatch";
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const _debounce = require('lodash/debounce') as typeof import('lodash/debounce');
/**
 * Combine multiple sequential calls to the decorated function into one.
 * @export
 * @param {number} [wait] Wait time (milliseconds).
 * @returns void
 *
 * The point is to ensure that successive calls to the function result
 * only in a single actual call.  Following the most recent call to
 * the debounced function, debouncing resets after the "wait" interval
 * has elapsed.
 */
export function debounceSync(wait?: number) {
    if (isTestExecution()) {
        // If running tests, lets debounce until the next cycle in the event loop.
        // Same as `setTimeout(()=> {}, 0);` with a value of `0`.
        wait = undefined;
    }
    return makeDebounceDecorator(wait);
}


export function makeDebounceDecorator(wait?: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,
    return function (_target: any, _propertyName: string, descriptor: TypedPropertyDescriptor<VoidFunction>) {
        // We could also make use of _debounce() options.  For instance,
        // the following causes the original method to be called
        // immediately:
        //
        //   {leading: true, trailing: false}
        //
        // The default is:
        //
        //   {leading: false, trailing: true}
        //
        // See https://lodash.com/docs/#debounce.
        const options = {};
        const originalMethod = descriptor.value!;
        const debounced = _debounce(
            function (this: any) {
                return originalMethod.apply(this, arguments as any);
            },
            wait,
            options
        );
        (descriptor as any).value = debounced;
    };
}

// Information about a traced function/method call.
export type TraceInfo =
    | {
        elapsed: number; // milliseconds
        // Either returnValue or err will be set.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        returnValue?: any;
        err?: Error;
    }
    | undefined;
// Information about a function/method call.
export type CallInfo = {
    kind: string; // "Class", etc.
    name: string;
    methodName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: any[];
    target: Object;
};
// Return a decorator that traces the decorated function.
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

export function trace(log: (c: CallInfo, t: TraceInfo) => void, logBeforeCall?: boolean) {
    // eslint-disable-next-line , @typescript-eslint/no-explicit-any
    return function (target: Object, methodName: string, descriptor: TypedPropertyDescriptor<any>) {
        const originalMethod = descriptor.value;
        // eslint-disable-next-line , @typescript-eslint/no-explicit-any
        descriptor.value = function (...args: any[]) {
            const call = {
                kind: 'Class',
                name: target && target.constructor ? target.constructor.name : '',
                args,
                methodName,
                target
            };
            // eslint-disable-next-line @typescript-eslint/no-this-alias, no-invalid-this
            const scope = this;
            return tracing(
                // "log()"
                (t) => log(call, t),
                // "run()"
                () => originalMethod.apply(scope, args),
                logBeforeCall
            );
        };

        return descriptor;
    };
}
type PromiseFunctionWithAnyArgs = (...any: any) => Promise<any>;

const cacheStoreForMethods = getGlobalCacheStore();

/**
 * Extension start up time is considered the duration until extension is likely to keep running commands in background.
 * It is observed on CI it can take upto 3 minutes, so this is an intelligent guess.
 */
const extensionStartUpTime = 200_000;
/**
 * Tracks the time since the module was loaded. For caching purposes, we consider this time to approximately signify
 * how long extension has been active.
 */
const moduleLoadWatch = new StopWatch();
/**
 * Caches function value until a specific duration.
 * @param expiryDurationMs Duration to cache the result for. If set as '-1', the cache will never expire for the session.
 * @param cachePromise If true, cache the promise instead of the promise result.
 * @param expiryDurationAfterStartUpMs If specified, this is the duration to cache the result for after extension startup (until extension is likely to
 * keep running commands in background)
 */
export function cache(expiryDurationMs: number, cachePromise = false, expiryDurationAfterStartUpMs?: number) {
    return function (
        target: Object,
        propertyName: string,
        descriptor: TypedPropertyDescriptor<PromiseFunctionWithAnyArgs>,
    ) {
        const originalMethod = descriptor.value!;
        const className = 'constructor' in target && target.constructor.name ? target.constructor.name : '';
        const keyPrefix = `Cache_Method_Output_${className}.${propertyName}`;
        descriptor.value = async function (...args: any) {
            if (isTestExecution()) {
                return originalMethod.apply(this, args) as Promise<any>;
            }
            let key: string;
            try {
                key = getCacheKeyFromFunctionArgs(keyPrefix, args);
            } catch (ex) {
                logError('Error while creating key for keyPrefix:', keyPrefix, ex);
                return originalMethod.apply(this, args) as Promise<any>;
            }
            const cachedItem = cacheStoreForMethods.get(key);
            if (cachedItem && (cachedItem.expiry > Date.now() || expiryDurationMs === -1)) {
                logVerbose(`Cached data exists ${key}`);
                return Promise.resolve(cachedItem.data);
            }
            const expiryMs =
                expiryDurationAfterStartUpMs && moduleLoadWatch.elapsedTime > extensionStartUpTime
                    ? expiryDurationAfterStartUpMs
                    : expiryDurationMs;
            const promise = originalMethod.apply(this, args) as Promise<any>;
            if (cachePromise) {
                cacheStoreForMethods.set(key, { data: promise, expiry: Date.now() + expiryMs });
            } else {
                promise
                    .then((result) => cacheStoreForMethods.set(key, { data: result, expiry: Date.now() + expiryMs }))
                    .ignoreErrors();
            }
            return promise;
        };
    };
}
