/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */

import { ConfigurationChangeEvent, ConfigurationTarget, Disposable, Event, EventEmitter, Uri, WorkspaceConfiguration } from "vscode";
import '../common/extensions';
import { IWorkspaceService } from "./application/types";
import { WorkspaceService } from "./application/workspace";
import { LogLevel } from "./logging/levels";
import { IExperiments, ILoggingSettings, ITerminalSettings, IWatchableProjectQSettings, LoggingLevelSettingType, Resource } from "./types";
import { debounceSync } from "./utils/decorators";
import { SystemVariables } from "./variables/systemVariables";

// eslint-disable-next-line
export class ProjectQSettings implements IWatchableProjectQSettings {
    // Privates should start with _ so that they are not read from the settings.json
    private _changeEmitter = new EventEmitter<void>();
    private readonly _workspace: IWorkspaceService;
    private _workspaceRoot: Resource;
    private _disposables: Disposable[] = [];

    public get onDidChange(): Event<void> {
        return this._changeEmitter.event;
    }

    public experiments!: IExperiments;
    public disableProjectQAutoStart: boolean = false;
    public logging: ILoggingSettings = { level: LogLevel.Error };
    // Hidden settings not surfaced in package.json
    public disablePythonDaemon: boolean = false;
    public pythonPath: string = '/usr/bin/python';
    public pipenvPath: string = '';
    public globalModuleInstallation: boolean = true;
    defaultInterpreterPath: string = '';

    public terminal: ITerminalSettings = {
        executeInFileDir: true,
        launchArgs: [],
        activateEnvInCurrentTerminal: true,
        activateEnvironment: true
    };

    private static projectqSettings: Map<string, ProjectQSettings> = new Map<string, ProjectQSettings>();

    constructor(workspaceFolder: Resource, workspace?: IWorkspaceService) {
        this._workspace = workspace || new WorkspaceService();
        this._workspaceRoot = workspaceFolder;
        this.initialize();
        // Disable auto start in untrusted workspaces.
        if (workspace && workspace.isTrusted === false) {
            this.disableProjectQAutoStart = true;
        }
    }

    // eslint-disable-next-line
    public static getInstance(resource: Uri | undefined, workspace?: IWorkspaceService): ProjectQSettings {
        workspace = workspace || new WorkspaceService();
        const workspaceFolderUri = ProjectQSettings.getSettingsUriAndTarget(resource, workspace).uri;
        const workspaceFolderKey = workspaceFolderUri ? workspaceFolderUri.fsPath : '';

        if (!ProjectQSettings.projectqSettings.has(workspaceFolderKey)) {
            const settings = new ProjectQSettings(workspaceFolderUri, workspace);
            ProjectQSettings.projectqSettings.set(workspaceFolderKey, settings);
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return ProjectQSettings.projectqSettings.get(workspaceFolderKey)!;
    }

    // eslint-disable-next-line @typescript-eslint/member-delimiter-style
    public static getSettingsUriAndTarget(
        resource: Uri | undefined,
        workspace?: IWorkspaceService
    ): { uri: Uri | undefined; target: ConfigurationTarget } {
        workspace = workspace || new WorkspaceService();
        const workspaceFolder = resource ? workspace.getWorkspaceFolder(resource) : undefined;
        let workspaceFolderUri: Uri | undefined = workspaceFolder ? workspaceFolder.uri : undefined;

        if (!workspaceFolderUri && Array.isArray(workspace.workspaceFolders) && workspace.workspaceFolders.length > 0) {
            workspaceFolderUri = workspace.workspaceFolders[0].uri;
        }

        const target = workspaceFolderUri ? ConfigurationTarget.WorkspaceFolder : ConfigurationTarget.Global;
        return { uri: workspaceFolderUri, target };
    }

    @debounceSync(1)
    protected debounceChangeNotification() {
        this._changeEmitter.fire();
    }

    protected fireChangeNotification() {
        this._changeEmitter.fire();
    }

    private getSerializableKeys() {
        // Get the keys that are allowed.
        return Object.getOwnPropertyNames(this).filter((f) => !f.startsWith('_'));
    }
    protected onWorkspaceFoldersChanged() {
        //If an activated workspace folder was removed, delete its key
        const workspaceKeys = this._workspace.workspaceFolders!.map((workspaceFolder) => workspaceFolder.uri.fsPath);
        const activatedWkspcKeys = Array.from(ProjectQSettings.projectqSettings.keys());
        const activatedWkspcFoldersRemoved = activatedWkspcKeys.filter((item) => workspaceKeys.indexOf(item) < 0);
        if (activatedWkspcFoldersRemoved.length > 0) {
            for (const folder of activatedWkspcFoldersRemoved) {
                ProjectQSettings.projectqSettings.delete(folder);
            }
        }
    }
    protected initialize(): void {
        const onDidChange = () => {
            const currentConfig = this._workspace.getConfiguration('projectq', this._workspaceRoot);
            this.update(currentConfig);

            // If workspace config changes, then we could have a cascading effect of on change events.
            // Let's defer the change notification.
            this.debounceChangeNotification();
        };
        this._disposables.push(this._workspace.onDidChangeWorkspaceFolders(this.onWorkspaceFoldersChanged, this));
        this._disposables.push(
            this._workspace.onDidChangeConfiguration((event: ConfigurationChangeEvent) => {
                if (event.affectsConfiguration('projectq')) {
                    onDidChange();
                }
            })
        );

        const initialConfig = this._workspace.getConfiguration('projectq', this._workspaceRoot);
        if (initialConfig) {
            this.update(initialConfig);
        }
    }

    // eslint-disable-next-line complexity,
    protected update(projectqConfig: WorkspaceConfiguration) {
        const workspaceRoot = this._workspaceRoot?.fsPath;
        const systemVariables: SystemVariables = new SystemVariables(undefined, workspaceRoot, this._workspace);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loggingSettings = systemVariables.resolveAny(projectqConfig.get<any>('logging'))!;
        if (loggingSettings) {
            loggingSettings.level = convertSettingTypeToLogLevel(loggingSettings.level);
            if (this.logging) {
                Object.assign<ILoggingSettings, ILoggingSettings>(this.logging, loggingSettings);
            } else {
                this.logging = loggingSettings;
            }
        }

        const experiments = systemVariables.resolveAny(projectqConfig.get<IExperiments>('experiments'))!;
        if (this.experiments) {
            Object.assign<IExperiments, IExperiments>(this.experiments, experiments);
        } else {
            this.experiments = experiments;
        }
        this.experiments = this.experiments
            ? this.experiments
            : {
                enabled: true,
                optInto: [],
                optOutFrom: []
            };

        // The rest are all the same.
        const keys = this.getSerializableKeys().filter((f) => f !== 'experiments' && f !== 'logging');
        keys.forEach((k) => {
            // Replace variables with their actual value.
            const val = systemVariables.resolveAny(projectqConfig.get(k));
            if (k !== 'variableTooltipFields' || val) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (<any>this)[k] = val;
            }
        });
    }
}

function convertSettingTypeToLogLevel(setting: LoggingLevelSettingType | undefined): LogLevel | 'off' {
    switch (setting) {
        case 'info': {
            return LogLevel.Info;
        }
        case 'warn': {
            return LogLevel.Warn;
        }
        case 'off': {
            return 'off';
        }
        case 'debug': {
            return LogLevel.Debug;
        }
        case 'verbose': {
            return LogLevel.Trace;
        }
        default: {
            return LogLevel.Error;
        }
    }
}