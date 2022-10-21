// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { logError } from '../../../../common/logging';
import { Event, EventEmitter } from 'vscode';
import '../../../../common/extensions';
import { createDeferred } from '../../../../common/utils/async';
import { StopWatch } from '../../../../common/utils/stopWatch';
import { sendTelemetryEvent } from '../../../../telemetry';
import { EventName } from '../../../../telemetry/constants';
import { PythonEnvInfo } from '../../info';
import { IDiscoveryAPI, IPythonEnvsIterator, IResolvingLocator, PythonLocatorQuery } from '../../locator';
import { getQueryFilter } from '../../locatorUtils';
import { PythonEnvCollectionChangedEvent, PythonEnvsWatcher } from '../../watcher';
import { IEnvsCollectionCache } from './envsCollectionCache';

/**
 * A service which maintains the collection of known environments.
 */
export class EnvsCollectionService extends PythonEnvsWatcher<PythonEnvCollectionChangedEvent> implements IDiscoveryAPI {
    /** Keeps track of ongoing refreshes for various queries. */
    private refreshPromises = new Map<PythonLocatorQuery | undefined, Promise<void>>();

    /** Keeps track of scheduled refreshes other than the ongoing one for various queries. */
    private scheduledRefreshes = new Map<PythonLocatorQuery | undefined, Promise<void>>();

    private readonly refreshStarted = new EventEmitter<void>();

    public get onRefreshStart(): Event<void> {
        return this.refreshStarted.event;
    }

    public get refreshPromise(): Promise<void> | undefined {
        return this.refreshPromises.size > 0
            ? Promise.all(Array.from(this.refreshPromises.values())).then()
            : undefined;
    }

    constructor(private readonly cache: IEnvsCollectionCache, private readonly locator: IResolvingLocator) {
        super();
        this.locator.onChanged((event) => {
            const query: any = undefined; // We can also form a query based on the event, but skip that for simplicity.
            let scheduledRefresh = this.scheduledRefreshes.get(query);
            // If there is no refresh scheduled for the query, start a new one.
            if (!scheduledRefresh) {
                scheduledRefresh = this.scheduleNewRefresh(query);
            }
            scheduledRefresh.then(() => {
                // Once refresh of cache is complete, notify changes.
                this.fire(event);
            });
        });
        this.cache.onChanged((e) => {
            this.fire(e);
        });
    }

    public async resolveEnv(executablePath: string): Promise<PythonEnvInfo | undefined> {
        // Note cache may have incomplete info when a refresh is happening.
        // This API is supposed to return complete info by definition, so
        // only use cache if it has complete info on an environment.
        const cachedEnv = this.cache.getCompleteInfo(executablePath);
        if (cachedEnv) {
            return cachedEnv;
        }
        const resolved = await this.locator.resolveEnv(executablePath);
        if (resolved) {
            this.cache.addEnv(resolved, true);
        }
        return resolved;
    }

    public getEnvs(query?: PythonLocatorQuery): PythonEnvInfo[] {
        const cachedEnvs = this.cache.getAllEnvs();
        if (cachedEnvs.length === 0 && this.refreshPromises.size === 0) {
            // We expect a refresh to already be triggered when activating discovery component.
            logError('No python is installed or a refresh has not already been triggered');
            this.triggerRefresh().ignoreErrors();
        }
        return query ? cachedEnvs.filter(getQueryFilter(query)) : cachedEnvs;
    }

    public triggerRefresh(query?: PythonLocatorQuery): Promise<void> {
        let refreshPromise = this.getRefreshPromiseForQuery(query);
        if (!refreshPromise) {
            refreshPromise = this.startRefresh(query);
        }
        return refreshPromise;
    }

    private startRefresh(query: PythonLocatorQuery | undefined): Promise<void> {
        const stopWatch = new StopWatch();
        const deferred = createDeferred<void>();
        // Ensure we set this before we trigger the promise to accurately track when a refresh has started.
        this.refreshPromises.set(query, deferred.promise);
        this.refreshStarted.fire();
        const iterator = this.locator.iterEnvs(query);
        const promise = this.addEnvsToCacheFromIterator(iterator);
        return promise
            .then(async () => {
                // Ensure we delete this before we resolve the promise to accurately track when a refresh finishes.
                this.refreshPromises.delete(query);
                deferred.resolve();
                sendTelemetryEvent(EventName.PYTHON_INTERPRETER_DISCOVERY, stopWatch.elapsedTime, {
                    interpreters: this.cache.getAllEnvs().length,
                });
            })
            .catch((ex) => deferred.reject(ex));
    }

    private async addEnvsToCacheFromIterator(iterator: IPythonEnvsIterator) {
        const seen: PythonEnvInfo[] = [];
        const state = {
            done: false,
            pending: 0,
        };
        const updatesDone = createDeferred<void>();

        if (iterator.onUpdated !== undefined) {
            const listener = iterator.onUpdated(async (event) => {
                if (event === null) {
                    state.done = true;
                    listener.dispose();
                } else {
                    state.pending += 1;
                    this.cache.updateEnv(seen[event.index], event.update);
                    if (event.update) {
                        seen[event.index] = event.update;
                    }
                    state.pending -= 1;
                }
                if (state.done && state.pending === 0) {
                    updatesDone.resolve();
                }
            });
        } else {
            updatesDone.resolve();
        }

        for await (const env of iterator) {
            seen.push(env);
            this.cache.addEnv(env);
        }
        await updatesDone.promise;
        await this.cache.validateCache();
        this.cache.flush().ignoreErrors();
    }

    /**
     * See if we already have a refresh promise for the query going on and return it.
     */
    private getRefreshPromiseForQuery(query?: PythonLocatorQuery) {
        // Even if no refresh is running for this exact query, there might be other
        // refreshes running for a superset of this query. For eg. the `undefined` query
        // is a superset for every other query, only consider that for simplicity.
        return this.refreshPromises.get(query) ?? this.refreshPromises.get(undefined);
    }

    /**
     * Ensure we trigger a fresh refresh for the query after the current refresh (if any) is done.
     */
    private async scheduleNewRefresh(query?: PythonLocatorQuery): Promise<void> {
        const refreshPromise = this.getRefreshPromiseForQuery(query);
        let nextRefreshPromise: Promise<void>;
        if (!refreshPromise) {
            nextRefreshPromise = this.startRefresh(query);
        } else {
            nextRefreshPromise = refreshPromise.then(() => {
                // No more scheduled refreshes for this query as we're about to start the scheduled one.
                this.scheduledRefreshes.delete(query);
                this.startRefresh(query);
            });
            this.scheduledRefreshes.set(query, nextRefreshPromise);
        }
        return nextRefreshPromise;
    }
}
