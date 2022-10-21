/*
 * @Date: 2022-06-07 11:01:21
 * @Description:qdoor语言相关模块
 */

import * as vscode from "vscode";
import * as qugates from "../media/qudoor/qugates.json";
export class QdoorLanguages {
	constructor() {
		const completion = vscode.languages.registerCompletionItemProvider(
			[
				{
					language: "qdoor",
					scheme: "memfs",
				},
			],
			new QdoorCompletionItemProvider(),
			"",
			" "
		);
	}
}
export class QdoorCompletionItemProvider {
	provideCompletionItems(
		document: vscode.TextDocument,
		position: vscode.Position,
		token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
		const values: vscode.CompletionItem[] = qugates.default.map(
			(item: vscode.CompletionItem) => {
				return {
					kind: vscode.CompletionItemKind.Keyword,
					preselect: true,
					...item,
				};
			}
		);

		return values;
	}
}
