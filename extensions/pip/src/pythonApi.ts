import * as vscode from "vscode";
import{ Event, Uri } from "vscode";
import { i18n } from './i18n/localize';

export interface PythonExtensionApi {
    /**
     * Promise indicating whether all parts of the extension have completed loading or not.
     * @type {Promise<void>}
     * @memberof IExtensionApi
     */
    ready: Promise<void>;
    jupyter: {
        registerHooks(): void;
    };
    debug: {
        /**
         * Generate an array of strings for commands to pass to the Python executable to launch the debugger for remote debugging.
         * Users can append another array of strings of what they want to execute along with relevant arguments to Python.
         * E.g `['/Users/..../pythonVSCode/pythonFiles/lib/python/debugpy', '--listen', 'localhost:57039', '--wait-for-client']`
         * @param {string} host
         * @param {number} port
         * @param {boolean} [waitUntilDebuggerAttaches=true]
         * @returns {Promise<string[]>}
         */
        getRemoteLauncherCommand(host: string, port: number, waitUntilDebuggerAttaches: boolean): Promise<string[]>;

        /**
         * Gets the path to the debugger package used by the extension.
         * @returns {Promise<string>}
         */
        getDebuggerPackagePath(): Promise<string | undefined>;
    };
    /**
     * Return internal settings within the extension which are stored in VSCode storage
     */
    settings: {
        /**
         * An event that is emitted when execution details (for a resource) change. For instance, when interpreter configuration changes.
         */
        readonly onDidChangeExecutionDetails: Event<Uri | undefined>;
        /**
         * Returns all the details the consumer needs to execute code within the selected environment,
         * corresponding to the specified resource taking into account any workspace-specific settings
         * for the workspace to which this resource belongs.
         * @param {Resource} [resource] A resource for which the setting is asked for.
         * * When no resource is provided, the setting scoped to the first workspace folder is returned.
         * * If no folder is present, it returns the global setting.
         * @returns {({ execCommand: string[] | undefined })}
         */
        getExecutionDetails(
            resource?: any,
        ): {
            /**
             * E.g of execution commands returned could be,
             * * `['<path to the interpreter set in settings>']`
             * * `['<path to the interpreter selected by the extension when setting is not set>']`
             * * `['conda', 'run', 'python']` which is used to run from within Conda environments.
             * or something similar for some other Python environments.
             *
             * @type {(string[] | undefined)} When return value is `undefined`, it means no interpreter is set.
             * Otherwise, join the items returned using space to construct the full execution command.
             */
            execCommand: string[] | undefined;
        };
    };

    datascience: {
        /**
         * Launches Data Viewer component.
         * @param {IDataViewerDataProvider} dataProvider Instance that will be used by the Data Viewer component to fetch data.
         * @param {string} title Data Viewer title
         */
        showDataViewer(dataProvider: any, title: string): Promise<void>;
        /**
         * Registers a remote server provider component that's used to pick remote jupyter server URIs
         * @param serverProvider object called back when picking jupyter server URI
         */
        registerRemoteServerProvider(serverProvider: any): void;
    };
}

export async function pythonExtensionReady() {
	const pythonExt = vscode.extensions.getExtension<PythonExtensionApi>('ms-python.python');

	if (!pythonExt) {
		vscode.window.showErrorMessage(i18n.localize('pip-manager.tip.installPython', 'Please install python extension'));
		return Promise.reject();
	}

	if (!pythonExt.isActive) {
		await pythonExt.exports.ready;
	}

	function getPythonPath(){
		if(!pythonExt){
			return '';
		}
		const executionDetails = pythonExt.exports.settings.getExecutionDetails();
		return executionDetails?.execCommand?.[0] || '';
	}

	const pythonPath = getPythonPath();

	const onPythonPathChange = (callback: (pythonPath: string) => any) => {
		return pythonExt.exports.settings.onDidChangeExecutionDetails(() => {
			const pythonPath = getPythonPath();
			return callback(pythonPath);
		});
	};

	return [pythonPath, onPythonPathChange, pythonExt] as [typeof pythonPath, typeof onPythonPathChange, typeof pythonExt];
}