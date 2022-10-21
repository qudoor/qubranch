/*
 * @Date: 2022-04-19 15:59:37
 * @Description:渲染结果图表
 */
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import * as pro from "child_process";
import { Tool } from "./tools";
export class ResultCharts {
	private context: vscode.ExtensionContext;
	private webView: vscode.Webview;
	private tool: Tool;
	constructor(context: vscode.ExtensionContext, webView: vscode.Webview) {
		this.readResultFile = this.readResultFile.bind(this);
		this.runQuanTrunk = this.runQuanTrunk.bind(this);

		this.context = context;
		this.webView = webView;
		this.tool = new Tool(context);
	}
	readResultFile() {
		return new Promise((resolve, reject) => {
			const resultFilePath = path.join(
				this.context.extensionPath,
				"media",
				"result.json"
			);
			const resultData = fs.readFileSync(resultFilePath);

			this.webView.postMessage({
				command: "basisStateBar",
				value: JSON.parse(JSON.parse(resultData.toString())),
			});

			resolve(true);
		});
	}
	nowExecState = "ready";
	waitTask: { fileJson; qubit } | undefined = undefined;
	oldCode: string;
	oldQubit: string | number;
	runQuanTrunk(fileJson: string, qubit: string | number) {
		try {
			if (this.oldCode == fileJson && this.oldQubit == qubit) {
				return;
			}

			return new Promise((resolve, reject) => {
				if (!fileJson) {
					this.webView.postMessage({
						command: "basisStateBar",
						value: { probs: {} },
					});
					return;
				}
				if (this.nowExecState === "pendinng") {
					this.waitTask = { fileJson, qubit };

					return;
				}
				this.oldCode = fileJson;
				this.oldQubit = qubit;
				this.webView.postMessage({
					command: "controlLoading",
					value: "1",
				});
				this.nowExecState = "pendinng";
				const codeArray = fileJson.split("\n").filter((item) => !!item);

				const srcPath = path.join(
					this.context.extensionPath,
					"media",
					"myFile.json"
				);
				const gates = new Set();
				codeArray.forEach((item) => {
					gates.add(item.split(" ", 1)[0]);
				});

				const fileData = {
					result_path: path.join(
						this.context.extensionPath,
						"media",
						"result.json"
					),
					version: 1.0,
					qubit,
					gates: Array.from(gates),
					cmd: codeArray,
				};
				fs.writeFileSync(srcPath, JSON.stringify(fileData));

				const runPath = path.join(this.context.extensionPath, "media");
				const run = async () => {
					const { pythonPath } = await this.tool.getPython();

					const spawn = pro.spawn(`${pythonPath}`, [`run.py`], {
						cwd: runPath,
					});

					spawn.stdout.on("data", async () => {
						this.nowExecState = "ready";
						if (this.waitTask) {
							const json = this.waitTask;
							this.waitTask = undefined;
							this.runQuanTrunk(json.fileJson, json.qubit);
						} else {
							await this.readResultFile();
							resolve(true);
						}
					});
					spawn.stderr.on("data", () => {
						reject(false);
					});
				};
				run();
			}).finally(() => {
				this.nowExecState = "ready";
				this.webView.postMessage({
					command: "controlLoading",
					value: "0",
				});
			});
		} catch (err) {
			vscode.window.showErrorMessage(err.context);
		}
	}
}
