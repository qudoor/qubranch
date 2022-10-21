// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPromise<T>(v: any): v is Promise<T> {
    return typeof v?.then === 'function' && typeof v?.catch === 'function';
}

//======================
// Deferred

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface Deferred<T> {
    readonly promise: Promise<T>;
    readonly resolved: boolean;
    readonly rejected: boolean;
    readonly completed: boolean;
    readonly value?: T;
    resolve(value?: T | PromiseLike<T>): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reject(reason?: any): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createDeferred<T>(scope: any = null): Deferred<T> {
    return new DeferredImpl<T>(scope);
}
class DeferredImpl<T> implements Deferred<T> {
    private _resolve!: (value: T | PromiseLike<T>) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _reject!: (reason?: any) => void;
    private _resolved: boolean = false;
    private _rejected: boolean = false;
    private _promise: Promise<T>;
    private _value: T | undefined;
    public get value() {
        return this._value;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(private scope: any = null) {
        // eslint-disable-next-line
        this._promise = new Promise<T>((res, rej) => {
            this._resolve = res;
            this._reject = rej;
        });
    }
    public resolve(value?: T | PromiseLike<T>) {
        this._value = value as T | undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._resolve.apply(this.scope ? this.scope : this, arguments as any);
        this._resolved = true;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public reject(_reason?: any) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this._reject.apply(this.scope ? this.scope : this, arguments as any);
        this._rejected = true;
    }
    get promise(): Promise<T> {
        return this._promise;
    }
    get resolved(): boolean {
        return this._resolved;
    }
    get rejected(): boolean {
        return this._rejected;
    }
    get completed(): boolean {
        return this._rejected || this._resolved;
    }
}

export function createDeferredFromPromise<T>(promise: Promise<T>): Deferred<T> {
    const deferred = createDeferred<T>();
    promise.then(deferred.resolve.bind(deferred)).catch(deferred.reject.bind(deferred));
    return deferred;
}

export async function sleep(timeout: number): Promise<number> {
    return new Promise<number>((resolve) => {
        setTimeout(() => resolve(timeout), timeout);
    });
}

// iterators

interface IAsyncIterator<T> extends AsyncIterator<T, void> { }

export interface IAsyncIterableIterator<T> extends IAsyncIterator<T>, AsyncIterable<T> { }

/**
 * Yield everything produced by the given iterators as soon as each is ready.
 *
 * When one of the iterators has something to yield then it gets yielded
 * right away, regardless of where the iterator is located in the array
 * of iterators.
 *
 * @param iterators - the async iterators from which to yield items
 * @param onError - called/awaited once for each iterator that fails
 */
export async function* chain<T>(
    iterators: AsyncIterator<T, T | void>[],
    onError?: (err: Error, index: number) => Promise<void>,
    // Ultimately we may also want to support cancellation.
): IAsyncIterableIterator<T> {
    const promises = iterators.map(getNext);
    let numRunning = iterators.length;
    while (numRunning > 0) {
        // Promise.race will not fail, because each promise calls getNext,
        // Which handles failures by wrapping each iterator in a try/catch block.
        const { index, result, err } = await Promise.race(promises) as any;

        if (err !== null) {
            promises[index] = NEVER as Promise<NextResult<T>>;
            numRunning -= 1;
            if (onError !== undefined) {
                await onError(err, index);
            }
            // XXX Log the error.
        } else if (result!.done) {
            promises[index] = NEVER as Promise<NextResult<T>>;
            numRunning -= 1;
            // If R is void then result.value will be undefined.
            if (result!.value !== undefined) {
                yield result!.value;
            }
        } else {
            promises[index] = getNext(iterators[index], index);
            // Only the "return" result can be undefined (void),
            // so we're okay here.
            yield result!.value as T;
        }
    }
}
const NEVER: Promise<unknown> = new Promise(() => {
    /** No body. */
});

type NextResult<T> = { index: number } & (
    | { result: IteratorResult<T, T | void>; err: null }
    | { result: null; err: Error }
);
async function getNext<T>(it: AsyncIterator<T, T | void>, indexMaybe?: number): Promise<NextResult<T>> {
    const index = indexMaybe === undefined ? -1 : indexMaybe;
    try {
        const result = await it.next();
        return { index, result, err: null };
    } catch (err) {
        return { index, err, result: null };
    }
}

/**
 * Convert an iterator into an iterable, if it isn't one already.
 */
export function iterable<T>(iterator: IAsyncIterator<T>): IAsyncIterableIterator<T> {
    const it = iterator as IAsyncIterableIterator<T>;
    if (it[Symbol.asyncIterator] === undefined) {
        it[Symbol.asyncIterator] = () => it;
    }
    return it;
}

/**
 * An iterator that yields nothing.
 */
export function iterEmpty<T>(): IAsyncIterableIterator<T> {
    return ((async function* () {
        /** No body. */
    })() as unknown) as IAsyncIterableIterator<T>;
}
