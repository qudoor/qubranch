import { ConcatWebView } from "./concatWebView";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

let _context: vscode.ExtensionContext;
const concatWebView = new ConcatWebView();
export function activate(context: vscode.ExtensionContext) {
	_context = context;
	let panel: any = undefined;
	context.subscriptions.push(
		vscode.commands.registerCommand("evaluating.start", () => {
			if (!panel || panel._store._isDisposed) {
				panel = vscode.window.createWebviewPanel(
					"testWebview", // viewType
					"测评", // 视图标题
					vscode.ViewColumn.One, // 显示在编辑器的哪个部位
					{
						enableScripts: true, // 启用JS，默认禁用
						retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
					}
				);
			}

			new EvaluatingPanel(panel);
		})
	);
}

class EvaluatingPanel {
	private readonly _panel: vscode.WebviewPanel;
	public createOrShow() {
		const panel: vscode.WebviewPanel = this._panel;
		panel.webview.onDidReceiveMessage(
			(message: any) => {
				if (
					[
						"getHardwareInfo",
						"kill",
						"runColonyBox",
						"setBoxapi",
						"getBoxapi",
						"runSingleMac",
						"getHardwareInfoSingleMac",
						"getRevalChartsSingleMac",
						"getOsType",
						"getJobListSingleMac",
						"getJobResultSingleMac",
						"runColonySlurm",
						"setSlurmapi",
						"getSlurmapi",
						"runSingleWin",
						"getJobListSingleWin",
						"getJobResultSingleWin",
						"getRevalCharts",
					].includes(message.type)
				) {
					concatWebView.getWebView(
						panel.webview,
						message.type,
						_context,
						message?.pid,
						message.value
					);
				}

				if (message.type === "getMachineId") {
					concatWebView.postWebView(panel.webview, {
						type: "getMachineId",
						value: { machineId: vscode.env.machineId },
					});
				}
			},
			undefined,
			_context.subscriptions
		);
	}

	constructor(panel: vscode.WebviewPanel) {
		this._panel = panel;
		this.createOrShow();
		this._update();
	}

	private _update() {
		this._panel.title = "测评";
		//加载本地html页面
		const srcPath = path.join(_context.extensionPath, "web-dist");
		const srcPathUri = vscode.Uri.file(srcPath);
		const baseUri = this._panel.webview.asWebviewUri(srcPathUri);
		const indexPath = path.join(srcPath, "index.html");
		let indexHtml = fs.readFileSync(indexPath, "utf8");
		indexHtml = indexHtml.replace(
			`<base href="/"/>`,
			`<base href="${String(baseUri)}/">`
		);
		this._panel.webview.html = indexHtml;
	}
}
