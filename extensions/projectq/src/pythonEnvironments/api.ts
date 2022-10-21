// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IDiscoveryAPI, PythonLocatorQuery } from './base/locator';

export type GetLocatorFunc = () => Promise<IDiscoveryAPI>;

/**
 * The public API for the Python environments component.
 *
 * Note that this is composed of sub-components.
 */
class PythonEnvironments implements IDiscoveryAPI {
    private locator!: IDiscoveryAPI;

    constructor(
        // These are factories for the sub-components the full component is composed of:
        private readonly getLocator: GetLocatorFunc,
    ) { }

    public async activate(): Promise<void> {
        this.locator = await this.getLocator();
    }

    public get onRefreshStart() {
        return this.locator.onRefreshStart;
    }

    public get refreshPromise() {
        return this.locator.refreshPromise;
    }

    public get onChanged() {
        return this.locator.onChanged;
    }

    public getEnvs(query?: PythonLocatorQuery) {
        return this.locator.getEnvs(query);
    }

    public async resolveEnv(env: string) {
        return this.locator.resolveEnv(env);
    }

    public async triggerRefresh(query?: PythonLocatorQuery) {
        return this.locator.triggerRefresh(query);
    }
}

export async function createPythonEnvironments(getLocator: GetLocatorFunc): Promise<IDiscoveryAPI> {
    const api = new PythonEnvironments(getLocator);
    await api.activate();
    return api;
}
