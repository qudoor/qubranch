'use strict';

/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */

// This line should always be right on top.
/* eslint-disable @typescript-eslint/no-explicit-any */
if ((Reflect as any).metadata === undefined) {
	require('reflect-metadata');
}

// Initialize the logger first.
require('./common/logger');

// Initialize source maps (this must never be moved up nor further down).
import { initialize } from './sourceMapSupport';
initialize(require('vscode'));

//===============================================
// We start tracking the extension's startup time at this point.  The
// locations at which we record various Intervals are marked below in
// the same way as this.

const durations: Record<string, number> = {};
import { StopWatch } from './common/utils/stopWatch';
// Do not move this line of code (used to measure extension load times).
const stopWatch = new StopWatch();

//===============================================
// loading starts here

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { ProgressLocation, ProgressOptions, window } from 'vscode';
import { buildApi, IExtensionApi } from './api';
import { IAsyncDisposableRegistry, IDisposableRegistry, IExperimentService, IExtensionContext } from './common/types';
import { createDeferred } from './common/utils/async';
import { Common } from './common/utils/localize';
import { noop } from './common/utils/misc';
import { activateComponents } from './extensionActivation';
import { initializeComponents, initializeGlobals, initializeStandard } from './extensionInit';
import { IServiceContainer } from './ioc/types';
import { traceError } from './common/logger';
import { IApplicationShell, IWorkspaceService } from './common/application/types';
import { sendErrorTelemetry, sendStartupTelemetry } from './startupTelemetry';
import { WorkspaceService } from './common/application/workspace';
import { runAfterActivation } from './common/utils/runAfterActivation';
import { IInterpreterService } from './interpreter/contracts';
import { setLoggingLevel } from './common/logging';
import { LogLevel } from './common/logging/levels';

setLoggingLevel(LogLevel.Trace);

durations.codeLoadingTime = stopWatch.elapsedTime;

//===============================================
// loading ends here

// These persist between activations:
let activatedServiceContainer: IServiceContainer | undefined;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: IExtensionContext): Promise<IExtensionApi> {
	let api: IExtensionApi;
	let ready: Promise<void>;
	let serviceContainer: IServiceContainer;
	try {
		const workspaceService = new WorkspaceService();
		context.subscriptions.push(
			workspaceService.onDidGrantWorkspaceTrust(async () => {
				await deactivate();
				await activate(context);
			}),
		);

		[api, ready, serviceContainer] = await activateUnsafe(context, stopWatch, durations);
	} catch (ex) {
		// We want to completely handle the error
		// before notifying VS Code.
		await handleError(ex, durations);
		traceError('Failed to active the ProjectQ Extension', ex);
		throw ex;
	}
	// Send the "success" telemetry only if activation did not fail.
	// Otherwise Telemetry is send via the error handler.

	sendStartupTelemetry(ready, durations, stopWatch, serviceContainer)
		// Run in the background.
		.ignoreErrors();
	return api;
}

// this method is called when your extension is deactivated
export function deactivate(): Thenable<void> {
	// Make sure to shutdown anybody who needs it.
	if (activatedServiceContainer) {
		const registry = activatedServiceContainer.get<IAsyncDisposableRegistry>(IAsyncDisposableRegistry);
		const disposables = activatedServiceContainer.get<IDisposableRegistry>(IDisposableRegistry);
		const promises = Promise.all(disposables.map((d) => d.dispose()));
		return promises.then(() => {
			if (registry) {
				return registry.dispose();
			}
		});
	}

	return Promise.resolve();
}


/////////////////////////////
// activation helpers

// eslint-disable-next-line
async function activateUnsafe(
	context: IExtensionContext,
	startupStopWatch: StopWatch,
	startupDurations: Record<string, number>
): Promise<[IExtensionApi, Promise<void>, IServiceContainer]> {
	const activationDeferred = createDeferred<void>();
	displayProgress(activationDeferred.promise);
	startupDurations.startActivateTime = startupStopWatch.elapsedTime;

	//===============================================
	// activation starts here

	const ext = initializeGlobals(context);
	activatedServiceContainer = ext.legacyIOC.serviceContainer;

	// Note standard utils especially experiment and platform code are fundamental to the extension
	// and should be available before we activate anything else.Hence register them first.
	initializeStandard(ext);
	// We need to activate experiments before initializing components as objects are created or not created based on experiments.
	const experimentService = activatedServiceContainer.get<IExperimentService>(IExperimentService);
	// This guarantees that all experiment information has loaded & all telemetry will contain experiment info.
	await experimentService.activate();
	const components = await initializeComponents(ext);

	// Then we finish activating.
	const componentsActivated = await activateComponents(ext, components);
	const nonBlocking = componentsActivated.map((r) => r.fullyReady);
	const activationPromise = (async () => {
		await Promise.all(nonBlocking);
	})();

	//===============================================
	// activation ends here

	startupDurations.totalActivateTime = startupStopWatch.elapsedTime - startupDurations.startActivateTime;
	activationDeferred.resolve();

	setTimeout(async () => {
		if (activatedServiceContainer) {
			const workspaceService = activatedServiceContainer.get<IWorkspaceService>(IWorkspaceService);
			if (workspaceService.isTrusted) {
				const interpreterManager = activatedServiceContainer.get<IInterpreterService>(IInterpreterService);
				const workspaces = workspaceService.workspaceFolders ?? [];
				await interpreterManager
					.refresh(workspaces.length > 0 ? workspaces[0].uri : undefined)
					.catch((ex) => traceError('ProjectQ Extension: interpreterManager.refresh', ex));
			}
		}

		runAfterActivation();
	});


	const api = buildApi(activationPromise, ext.legacyIOC.serviceManager, ext.legacyIOC.serviceContainer);
	return [api, activationPromise, ext.legacyIOC.serviceContainer];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function displayProgress(promise: Promise<any>) {
	const progressOptions: ProgressOptions = { location: ProgressLocation.Window, title: Common.loadingExtension() };
	window.withProgress(progressOptions, () => promise).then(noop, noop);
}


/////////////////////////////
// error handling

async function handleError(ex: Error, startupDurations: Record<string, number>) {
	notifyUser(
		"Extension activation failed, run the 'Developer: Toggle Developer Tools' command for more information."
	);
	// Possible logger hasn't initialized either.
	console.error('extension activation failed', ex);
	traceError('extension activation failed', ex);
	await sendErrorTelemetry(ex, startupDurations, activatedServiceContainer);
}

interface IAppShell {
	showErrorMessage(string: string): Promise<void>;
}

function notifyUser(msg: string) {
	try {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let appShell: IAppShell = (window as any) as IAppShell;
		if (activatedServiceContainer) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			appShell = (activatedServiceContainer.get<IApplicationShell>(IApplicationShell) as any) as IAppShell;
		}
		appShell.showErrorMessage(msg).ignoreErrors();
	} catch (ex) {
		traceError('failed to notify user', ex);
	}
}