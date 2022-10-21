import { FileChangeType } from "../../common/platform/fileSystemWatcher";
import { Event, Uri } from "vscode";
import { PythonEnvInfo, PythonEnvKind, PythonEnvSource } from "./info";
import { PythonEnvCollectionChangedEvent, PythonEnvsChangedEvent, PythonEnvsWatcher } from "./watcher";
import { IAsyncIterableIterator } from "../../common/utils/async";

/**
 * The generic base for Python envs locators.
 *
 * By default `resolveEnv()` returns undefined.  Subclasses may override
 * the method to provide an implementation.
 *
 * Subclasses will call `this.emitter.fire()` to emit events.
 *
 * Also, in most cases the default event type (`PythonEnvsChangedEvent`)
 * should be used.  Only in low-level cases should you consider using
 * `BasicPythonEnvsChangedEvent`.
 */
abstract class LocatorBase<I = PythonEnvInfo, E extends BasicPythonEnvsChangedEvent = PythonEnvsChangedEvent>
    implements ILocator<I, E> {
    public readonly onChanged: Event<E>;

    protected readonly emitter: IEmitter<E>;

    constructor(watcher: IPythonEnvsWatcher<E> & IEmitter<E>) {
        this.emitter = watcher;
        this.onChanged = watcher.onChanged;
    }

    // eslint-disable-next-line class-methods-use-this
    public abstract iterEnvs(query?: QueryForEvent<E>): IPythonEnvsIterator<I>;
}

interface IEmitter<E extends PythonEnvsChangedEvent> {
    fire(e: E): void;
}


// The use cases for `BasicPythonEnvsChangedEvent` are currently
// hypothetical.  However, there's a real chance they may prove
// useful for the concrete low-level locators.  So for now we are
// keeping the separate "basic" type.

/**
 * The most basic info for a Python environments event.
 *
 * @prop kind - the env kind, if any, affected by the event
 */
export type BasicPythonEnvsChangedEvent = {
    kind?: PythonEnvKind;
    type?: FileChangeType;
};

export interface IDiscoveryAPI {
    /**
     * Fires when the known list of environments starts refreshing, i.e when discovery starts or restarts.
     */
    readonly onRefreshStart: Event<void>;
    /**
     * Fires with details if the known list changes.
     */
    readonly onChanged: Event<PythonEnvCollectionChangedEvent>;
    /**
     * Resolves once environment list has finished refreshing, i.e all environments are
     * discovered. Carries `undefined` if there is no refresh currently going on.
     */
    readonly refreshPromise: Promise<void> | undefined;
    /**
     * Triggers a new refresh for query if there isn't any already running.
     */
    triggerRefresh(query?: PythonLocatorQuery): Promise<void>;
    /**
     * Get current list of known environments.
     */
    getEnvs(query?: PythonLocatorQuery): PythonEnvInfo[];
    /**
     * Find as much info about the given Python environment as possible.
     * If executable passed is invalid, then `undefined` is returned.
     */
    resolveEnv(executablePath: string): Promise<PythonEnvInfo | undefined>;
}

/**
 * A "watcher" for events related to changes to Python environemts.
 *
 * The watcher will notify listeners (callbacks registered through
 * `onChanged`) of events at undetermined times.  The actual emitted
 * events, their source, and the timing is entirely up to the watcher
 * implementation.
 */
export interface IPythonEnvsWatcher<E extends BasicPythonEnvsChangedEvent = PythonEnvsChangedEvent> {
    /**
     * The hook for registering event listeners (callbacks).
     */
    readonly onChanged: Event<E>;
}

/**
 * A single Python environment locator.
 *
 * Each locator object is responsible for identifying the Python
 * environments in a single location, whether a directory, a directory
 * tree, or otherwise.  That location is identified when the locator
 * is instantiated.
 *
 * Based on the narrow focus of each locator, the assumption is that
 * calling iterEnvs() to pick up a changed env is effectively no more
 * expensive than tracking down that env specifically.  Consequently,
 * events emitted via `onChanged` do not need to provide information
 * for the specific environments that changed.
 */
export interface ILocator<I = PythonEnvInfo, E extends BasicPythonEnvsChangedEvent = PythonEnvsChangedEvent>
    extends IPythonEnvsWatcher<E> {
    /**
     * Iterate over the enviroments known tos this locator.
     *
     * Locators are not required to have provide all info about
     * an environment.  However, each yielded item will at least
     * include all the `PythonEnvBaseInfo` data.  To ensure all
     * possible information is filled in, call `ILocator.resolveEnv()`.
     *
     * Updates to yielded objects may be provided via the optional
     * `onUpdated` property of the iterator.  However, callers can
     * usually ignore the update event entirely and rely on the
     * locator to provide sufficiently complete information.
     *
     * @param query - if provided, the locator will limit results to match
     * @returns - the fast async iterator of Python envs, which may have incomplete info
     */
    iterEnvs(query?: QueryForEvent<E>): IPythonEnvsIterator<I>;
}

/**
 * The full set of possible info to send to a locator when requesting environments.
 *
 * This is directly correlated with the `PythonEnvsChangedEvent`
 * emitted by watchers.
 */
export type PythonLocatorQuery = BasicPythonLocatorQuery & {
    /**
     * If provided, results should be limited to within these locations.
     */
    searchLocations?: SearchLocations;
};

/**
 * The portion of a query related to env search locations.
 */
type SearchLocations = {
    /**
     * The locations under which to look for environments.
     */
    roots: Uri[];
    /**
     * If true, only query for workspace related envs, i.e do not look for environments that do not have a search location.
     */
    doNotIncludeNonRooted?: boolean;
};

/**
 * The most basic info to send to a locator when requesting environments.
 *
 * This is directly correlated with the `BasicPythonEnvsChangedEvent`
 * emitted by watchers.
 */
type BasicPythonLocatorQuery = {
    /**
     * If provided, results should be limited to these env
     * kinds; if not provided, the kind of each environment
     * is not considered when filtering
     */
    kinds?: PythonEnvKind[];
};

type QueryForEvent<E> = E extends PythonEnvsChangedEvent ? PythonLocatorQuery : BasicPythonLocatorQuery;

/**
 * A fast async iterator of Python envs, which may have incomplete info.
 *
 * Each object yielded by the iterator represents a unique Python
 * environment.
 *
 * The iterator is not required to have provide all info about
 * an environment.  However, each yielded item will at least
 * include all the `PythonEnvBaseInfo` data.
 *
 * During iteration the information for an already
 * yielded object may be updated.  Rather than updating the yielded
 * object or yielding it again with updated info, the update is
 * emitted by the iterator's `onUpdated` (event) property. Once there are no more updates, the event emits
 * `null`.
 *
 * If the iterator does not have `onUpdated` then it means the
 * provider does not support updates.
 *
 * Callers can usually ignore the update event entirely and rely on
 * the locator to provide sufficiently complete information.
 */
export interface IPythonEnvsIterator<I = PythonEnvInfo> extends IAsyncIterableIterator<I> {
    /**
     * Provides possible updates for already-iterated envs.
     *
     * Once there are no more updates, `null` is emitted.
     *
     * If this property is not provided then it means the iterator does
     * not support updates.
     */
    onUpdated?: Event<PythonEnvUpdatedEvent<I> | null>;
}

/**
 * A single update to a previously provided Python env object.
 */
export type PythonEnvUpdatedEvent<I = PythonEnvInfo> = {
    /**
     * The iteration index of The env info that was previously provided.
     */
    index: number;
    /**
     * The env info that was previously provided.
     */
    old?: I;
    /**
     * The env info that replaces the old info.
     * Update is sent as `undefined` if we find out that the environment is no longer valid.
     */
    update: I | undefined;
};

export type BasicEnvInfo = { kind: PythonEnvKind; executablePath: string; source?: PythonEnvSource[] };

export interface IResolvingLocator<I = PythonEnvInfo> extends IResolver, ILocator<I> { }

interface IResolver {
    /**
     * Find as much info about the given Python environment as possible.
     * If executable passed is invalid, then `undefined` is returned.
     *
     * @param env - the Python executable path to resolve more information about
     */
    resolveEnv(env: string): Promise<PythonEnvInfo | undefined>;
}

/**
 * The base for most Python envs locators.
 *
 * By default `resolveEnv()` returns undefined.  Subclasses may override
 * the method to provide an implementation.
 *
 * Subclasses will call `this.emitter.fire()` * to emit events.
 *
 * In most cases this is the class you will want to subclass.
 * Only in low-level cases should you consider subclassing `LocatorBase`
 * using `BasicPythonEnvsChangedEvent.
 */
export abstract class Locator<I = PythonEnvInfo> extends LocatorBase<I> {
    constructor() {
        super(new PythonEnvsWatcher());
    }
}

