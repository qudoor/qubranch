import { Uri, TextDocument, Position, CancellationToken, ViewColumn } from "vscode";
import { Commands } from "../constants";
import { Channel } from "./types";

export type CommandsWithoutArgs = keyof ICommandNameWithoutArgumentTypeMapping;
/**
 * Mapping between commands and list or arguments.
 * These commands do NOT have any arguments.
 * @interface ICommandNameWithoutArgumentTypeMapping
 */
interface ICommandNameWithoutArgumentTypeMapping {
    ['workbench.action.showCommands']: [];
    ['workbench.action.debug.continue']: [];
    ['workbench.action.debug.stepOver']: [];
    ['workbench.action.debug.stop']: [];
    ['workbench.action.reloadWindow']: [];
    ['workbench.action.closeActiveEditor']: [];
    ['editor.action.formatDocument']: [];
    ['editor.action.rename']: [];
}
/**
 * Mapping between commands and list of arguments.
 * Used to provide strong typing for command & args.
 * @export
 * @interface ICommandNameArgumentTypeMapping
 * @extends {ICommandNameWithoutArgumentTypeMapping}
 */
export interface ICommandNameArgumentTypeMapping extends ICommandNameWithoutArgumentTypeMapping {

    ['projectq-vscode.installPythonExt']: [string];
    ['projectq-vscode.initProjectEnv']: [];

    [Commands.Enable_SourceMap_Support]: [];


    ['vscode.openWith']: [Uri, string];
    ['workbench.action.quickOpen']: [string];
    ['workbench.extensions.installExtension']: [Uri | 'ms-toolsai.jupyter'];
    ['workbench.action.files.openFolder']: [];
    ['workbench.action.openWorkspace']: [];
    ['extension.open']: [string];
    ['setContext']: [string, boolean] | ['projectq.vscode.channel', Channel];
    ['revealLine']: [{ lineNumber: number; at: 'top' | 'center' | 'bottom' }];
    ['python._loadLanguageServerExtension']: {}[];
    ['python.SelectAndInsertDebugConfiguration']: [TextDocument, Position, CancellationToken];
    ['vscode.open']: [Uri];
    ['vscode.open']: [Uri];
    ['workbench.action.files.saveAs']: [Uri];
    ['workbench.action.files.save']: [Uri];
    ['undo']: [];
    ['interactive.open']: [
        { preserveFocus?: boolean; viewColumn?: ViewColumn },
        Uri | undefined,
        string | undefined,
        string | undefined
    ];
    ['interactive.execute']: [string];
    ['outline.focus']: [];
    ['vscode.executeCompletionItemProvider']: [Uri, Position];

    [Commands.ClearStorage]: [];
    [Commands.Set_Linter]: [];
}
