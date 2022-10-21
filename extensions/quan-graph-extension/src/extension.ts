import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { MemFS } from "./fileSystemProvider";

import { QuboxSetting } from "./quboxSetting";
import { ResultCharts } from "./resultCharts";
import { Tool } from "./tools";
import { QdoorLanguages } from "./languages";
let _context: vscode.ExtensionContext;
let activeTextEditor: vscode.TextEditor;

let _panel: any;
let resultCharts: ResultCharts;
export async function activate(context: vscode.ExtensionContext) {
	_context = context;
	new QdoorLanguages();
	const memFs = new MemFS();
	let fileIndex = 0;
	const tool = new Tool(context);

	const { onPythonPathChange } = await tool.getPython();

	context.subscriptions.push(
		onPythonPathChange((pythonPath) => {
			console.log("python==>", pythonPath);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand("quan.pipInstall", tool.pipInstall)
	);

	const quboxSetting = new QuboxSetting(context);
	quboxSetting.registerCommand();
	context.subscriptions.push(
		vscode.workspace.registerFileSystemProvider("memfs", memFs, {
			isCaseSensitive: true,
		})
	);

	if (
		vscode.workspace.getWorkspaceFolder(vscode.Uri.parse("memfs:/QUAN-GRAPH"))
	) {
		vscode.commands.executeCommand("setContext", "myExtension.hasMemfs", true);
	} else {
		vscode.commands.executeCommand("setContext", "myExtension.hasMemfs", false);
	}

	context.subscriptions.push(
		vscode.commands.registerCommand("quan.init", async () => {
			vscode.workspace.updateWorkspaceFolders(
				0,
				vscode.workspace.workspaceFolders
					? vscode.workspace.workspaceFolders.length
					: 0,
				{
					uri: vscode.Uri.parse("memfs:/"),
					name: "QUAN-GRAPH",
				}
			);
			vscode.commands.executeCommand(
				"setContext",
				"myExtension.hasMemfs",
				true
			);
		})
	);
	context.subscriptions.push(
		vscode.commands.registerCommand("quan.start", async () => {
			if (
				vscode.workspace.getWorkspaceFolder(
					vscode.Uri.parse(`memfs:/QUAN-GRAPH/file_${fileIndex}.qdoor`)
				)
			) {
				fileIndex++;
			}
			if (!_panel || _panel._store._isDisposed) {
				_panel = vscode.window.createWebviewPanel(
					"testWebview", // viewType
					"图形化", // 视图标题
					vscode.ViewColumn.One, // 显示在编辑器的哪个部位
					{
						enableScripts: true, // 启用JS，默认禁用
						// retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
					}
				);

				new GraphPanel();
			}

			memFs.writeFile(
				vscode.Uri.parse(`memfs:/file_${fileIndex}.qdoor`),
				Buffer.from(""),
				{ create: true, overwrite: true }
			);
			const uri = vscode.Uri.parse(`memfs:/file_${fileIndex}.qdoor`);

			vscode.workspace.openTextDocument(uri); // calls back into the provider
		})
	);

	vscode.workspace.onDidOpenTextDocument(async (item) => {
		if (item.fileName.indexOf(".qdoor") > -1) {
			activeTextEditor = await vscode.window.showTextDocument(
				item,
				vscode.ViewColumn.Two
			);
		}

		return;
	});
	vscode.window.onDidChangeActiveTextEditor((e) => {
		if (e) {
			activeTextEditor = e;
			const fileJson = e.document.getText();
			const codeArray = fileJson.split("\n").filter((item) => !!item);
			_panel.webview.postMessage({
				command: "edit",
				value: codeArray,
				rawCode: fileJson,
			});
			// resultCharts.runQuanTrunk(fileJson, _qubit);
		}
	});
}

class GraphPanel {
	constructor() {
		this.createOrShow = this.createOrShow.bind(this);
		this.watchTextEditSave = this.watchTextEditSave.bind(this);
		this.createOrShow();
		this._update();
		this.watchTextEditSave();
		resultCharts = new ResultCharts(_context, _panel.webview);
	}
	public createOrShow() {
		_panel.webview.onDidReceiveMessage(
			({ command, value }: any) => {
				switch (command) {
					case "edit":
						activeTextEditor.edit((editBuilder) => {
							const lineCount = activeTextEditor.document.lineCount;
							const reversed = value.codeArray.join("\n"); //在编辑器上的内容
							// _qubit = value.qubit;
							editBuilder.replace(
								new vscode.Range(
									new vscode.Position(0, 0),
									new vscode.Position(lineCount, 0)
								),
								reversed
							);
							setTimeout(() => {
								resultCharts.runQuanTrunk(reversed, value.qubit);
							}, 0);

							setTimeout(() => {
								activeTextEditor.document.save();
							}, 200);
						});
						break;
					case "error":
						vscode.window.showErrorMessage(value);
						break;
					case "runQuanTrunk": {
						resultCharts.runQuanTrunk(value.rawCode, value.qubit);
						break;
					}
				}
			},
			undefined,
			_context.subscriptions
		);
	}

	private _update() {
		_panel.title = "量子编程可视化";

		//加载本地html页面
		const srcPath = path.join(_context.extensionPath, "web-dist");
		const srcPathUri = vscode.Uri.file(srcPath);
		const baseUri = _panel.webview.asWebviewUri(srcPathUri);
		const indexPath = path.join(srcPath, "index.html");
		let indexHtml = fs.readFileSync(indexPath, "utf8");
		indexHtml = indexHtml.replace(
			`<base href="/"/>`,
			`<base href="${String(baseUri)}/">`
		);
		_panel.webview.html = indexHtml;
	}
	oldCode: string;
	private watchTextEditSave() {
		vscode.workspace.onDidSaveTextDocument((e) => {
			const fileJson = e.getText();
			if (this.oldCode == fileJson) {
				return;
			}
			this.oldCode = fileJson;

			const codeArray = fileJson
				.split(e.eol === 1 ? "\n" : "\r\n")
				.filter((item) => !!item);
			_panel.webview.postMessage({
				command: "edit",
				value: codeArray,
				rawCode: fileJson,
			});
			// resultCharts.runQuanTrunk(fileJson, _qubit);
		});
	}
}
