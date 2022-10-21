import { ActivationResult, ExtensionState } from "../components";
import * as vscode from "vscode";
import { Uri } from 'vscode';
import { createPythonEnvironments } from "./api";
import { getEnvironmentInfoService } from "./base/info/environmentInfoService";
import { BasicEnvInfo, IDiscoveryAPI, ILocator, IPythonEnvsIterator, PythonLocatorQuery } from "./base/locator";
import { registerNewDiscoveryForIOC } from "./legacyIOC";
import { ExtensionLocators, } from './base/locators/';
import { Disposables, IDisposable } from "../common/utils/resourceLifecycle";
import { PythonEnvsReducer } from "./base/locators/composite/envsReducer";
import { PythonEnvsResolver } from "./base/locators/composite/envsResolver";
import { EnvsCollectionService } from "./base/locators/composite/envsCollectionService";
import { initializeExternalDependencies as initializeLegacyExternalDependencies } from './common/externalDependencies';
import { getGlobalStorage } from "../common/persistentState";
import { getOSType, OSType } from "../common/utils/platform";
import { IEnvsCollectionCache, createCollectionCache as createCache, } from "./base/locators/composite/envsCollectionCache";
import { PyenvLocator } from "./base/locators/lowLevel/pyenvLocator";
import { CondaEnvironmentLocator } from "./base/locators/lowLevel/condaLocator";
import { GlobalVirtualEnvironmentLocator } from "./base/locators/lowLevel/globalVirtualEnvronmentLocator";
import { CustomVirtualEnvironmentLocator } from "./base/locators/lowLevel/customVirtualEnvLocator";
import { WindowsPathEnvVarLocator } from "./base/locators/lowLevel/windowsKnownPathsLocator";
import { WindowsRegistryLocator } from "./base/locators/lowLevel/windowsRegistryLocator";
import { WindowsStoreLocator } from "./base/locators/lowLevel/windowsStoreLocator";
import { PosixKnownPathsLocator } from "./base/locators/lowLevel/posixKnownPathsLocator";
import { LazyResourceBasedLocator } from "./base/locators/common/resourceBasedLocator";
import { getURIFilter } from "../common/utils/misc";
import { iterEmpty } from "../common/utils/async";
import { combineIterators, Locators } from "./base/locators";
import { WorkspaceVirtualEnvironmentLocator } from "./base/locators/lowLevel/workspaceVirtualEnvLocator";
import { PoetryLocator } from "./base/locators/lowLevel/poetryLocator";
import { PythonEnvInfo } from "./base/info";

/**
 * Set up the Python environments component (during extension activation).'
 */
export async function initialize(ext: ExtensionState): Promise<IDiscoveryAPI> {
    const api = await createPythonEnvironments(() => createLocator(ext));

    // Any other initialization goes here.

    initializeLegacyExternalDependencies(ext.legacyIOC.serviceContainer);
    registerNewDiscoveryForIOC(
        // These are what get wrapped in the legacy adapter.
        ext.legacyIOC.serviceManager,
        api,
    );

    return api;
}

/**
 * Make use of the component (e.g. register with VS Code).
 */
export async function activate(api: IDiscoveryAPI, _ext: ExtensionState): Promise<ActivationResult> {
    /**
     * Force an initial background refresh of the environments.
     *
     * Note API is ready to be queried only after a refresh has been triggered, and extension activation is blocked on API. So,
     * * If discovery was never triggered, we need to block extension activation on the refresh trigger.
     * * If discovery was already triggered, it maybe the case that this is a new workspace for which it hasn't been triggered yet.
     * So always trigger discovery as part of extension activation for now.
     *
     * TODO: https://github.com/microsoft/vscode-python/issues/17498
     * Once `onInterpretersChanged` event is exposed via API, we can probably expect extensions to rely on that and
     * discovery can be triggered after activation, especially in the second case.
     */
    api.triggerRefresh().ignoreErrors();

    return {
        fullyReady: Promise.resolve(),
    };
}

/**
 * Get the locator to use in the component.
 */
async function createLocator(
    ext: ExtensionState,
    // This is shared.
): Promise<IDiscoveryAPI> {
    // Create the low-level locators.
    let locators: ILocator<BasicEnvInfo> = new ExtensionLocators<BasicEnvInfo>(
        // Here we pull the locators together.
        createNonWorkspaceLocators(ext),
        createWorkspaceLocator(ext),
    );

    // Create the env info service used by ResolvingLocator and CachingLocator.
    const envInfoService = getEnvironmentInfoService(ext.disposables);

    // Build the stack of composite locators.
    locators = new PythonEnvsReducer(locators);
    const resolvingLocator = new PythonEnvsResolver(
        locators,
        // These are shared.
        envInfoService,
    );
    const caching = new EnvsCollectionService(
        await createCollectionCache(ext),
        // This is shared.
        resolvingLocator,
    );
    return caching;
}

function createNonWorkspaceLocators(ext: ExtensionState): ILocator<BasicEnvInfo>[] {
    const locators: (ILocator<BasicEnvInfo> & Partial<IDisposable>)[] = [];
    locators.push(
        // OS-independent locators go here.
        new PyenvLocator(),
        new CondaEnvironmentLocator(),
        new GlobalVirtualEnvironmentLocator(),
        new CustomVirtualEnvironmentLocator(),
    );

    if (getOSType() === OSType.Windows) {
        locators.push(
            // Windows specific locators go here.
            new WindowsRegistryLocator(),
            new WindowsStoreLocator(),
            new WindowsPathEnvVarLocator(),
        );
    } else {
        locators.push(
            // Linux/Mac locators go here.
            new PosixKnownPathsLocator(),
        );
    }

    const disposables = locators.filter((d) => d.dispose !== undefined) as IDisposable[];
    ext.disposables.push(...disposables);
    return locators;
}

function createWorkspaceLocator(ext: ExtensionState): WorkspaceLocators<BasicEnvInfo> {
    const locators = new WorkspaceLocators<BasicEnvInfo>(watchRoots, [
        (root: vscode.Uri) => [new WorkspaceVirtualEnvironmentLocator(root.fsPath), new PoetryLocator(root.fsPath)],
        // Add an ILocator factory func here for each kind of workspace-rooted locator.
    ]);
    ext.disposables.push(locators);
    return locators;
}

function watchRoots(args: WatchRootsArgs): IDisposable {
    const { initRoot, addRoot, removeRoot } = args;

    const folders = vscode.workspace.workspaceFolders;
    if (folders) {
        folders.map((f) => f.uri).forEach(initRoot);
    }

    return vscode.workspace.onDidChangeWorkspaceFolders((event) => {
        for (const root of event.removed) {
            removeRoot(root.uri);
        }
        for (const root of event.added) {
            addRoot(root.uri);
        }
    });
}

async function createCollectionCache(ext: ExtensionState): Promise<IEnvsCollectionCache> {
    const storage = getGlobalStorage<PythonEnvInfo[]>(ext.context, 'PYTHON_ENV_INFO_CACHE', []);
    const cache = await createCache({
        load: async () => storage.get(),
        store: async (e) => storage.set(e),
    });
    return cache;
}

export type WatchRootsArgs = {
    initRoot(root: Uri): void;
    addRoot(root: Uri): void;
    removeRoot(root: Uri): void;
};

type RootURI = string;
type WatchRootsFunc = (args: WatchRootsArgs) => IDisposable;
type WorkspaceLocatorFactoryResult<I> = ILocator<I> & Partial<IDisposable>;
type WorkspaceLocatorFactory<I = PythonEnvInfo> = (root: Uri) => WorkspaceLocatorFactoryResult<I>[];
/**
 * The collection of all workspace-specific locators used by the extension.
 *
 * The factories are used to produce the locators for each workspace folder.
 */
export class WorkspaceLocators<I = PythonEnvInfo> extends LazyResourceBasedLocator<I> {
    private readonly locators: Record<RootURI, [ILocator<I>, IDisposable]> = {};

    private readonly roots: Record<RootURI, Uri> = {};

    constructor(private readonly watchRoots: WatchRootsFunc, private readonly factories: WorkspaceLocatorFactory<I>[]) {
        super();
    }

    public async dispose(): Promise<void> {
        await super.dispose();

        // Clear all the roots.
        const roots = Object.keys(this.roots).map((key) => this.roots[key]);
        roots.forEach((root) => this.removeRoot(root));
    }

    protected doIterEnvs(query?: PythonLocatorQuery): IPythonEnvsIterator<I> {
        const iterators = Object.keys(this.locators).map((key) => {
            if (query?.searchLocations !== undefined) {
                const root = this.roots[key];
                // Match any related search location.
                const filter = getURIFilter(root, { checkParent: true, checkChild: true });
                // Ignore any requests for global envs.
                if (!query.searchLocations.roots.some(filter)) {
                    // This workspace folder did not match the query, so skip it!
                    return iterEmpty<I>();
                }
            }
            // The query matches or was not location-specific.
            const [locator] = this.locators[key];
            return locator.iterEnvs(query);
        });
        return combineIterators(iterators);
    }

    protected async initResources(): Promise<void> {
        const disposable = this.watchRoots({
            initRoot: (root: Uri) => this.addRoot(root),
            addRoot: (root: Uri) => {
                // Drop the old one, if necessary.
                this.removeRoot(root);
                this.addRoot(root);
                this.emitter.fire({ searchLocation: root });
            },
            removeRoot: (root: Uri) => {
                this.removeRoot(root);
                this.emitter.fire({ searchLocation: root });
            },
        });
        this.disposables.push(disposable);
    }

    private addRoot(root: Uri): void {
        // Create the root's locator, wrapping each factory-generated locator.
        const locators: ILocator<I>[] = [];
        const disposables = new Disposables();
        this.factories.forEach((create) => {
            create(root).forEach((loc) => {
                locators.push(loc);
                if (loc.dispose !== undefined) {
                    disposables.push(loc as IDisposable);
                }
            });
        });
        const locator = new Locators(locators);
        // Cache it.
        const key = root.toString();
        this.locators[key] = [locator, disposables];
        this.roots[key] = root;
        // Hook up the watchers.
        disposables.push(
            locator.onChanged((e) => {
                if (e.searchLocation === undefined) {
                    e.searchLocation = root;
                }
                this.emitter.fire(e);
            }),
        );
    }

    private removeRoot(root: Uri): void {
        const key = root.toString();
        const found = this.locators[key];
        if (found === undefined) {
            return;
        }
        const [, disposables] = found;
        delete this.locators[key];
        delete this.roots[key];
        disposables.dispose();
    }
}

