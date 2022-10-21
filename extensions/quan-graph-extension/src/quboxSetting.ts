/*
 * @Date: 2022-04-19 13:36:52
 * @Description:qubox的配置指令
 */
import * as vscode from "vscode";
import * as pro from "child_process";
import { Tool } from "./tools";
export class QuboxSetting {
	private context: vscode.ExtensionContext;
	private tool: Tool;
	constructor(context: vscode.ExtensionContext) {
		this.context = context;
		this.registerCommand = this.registerCommand.bind(this);
		this.setPythonPath = this.setPythonPath.bind(this);
		this.setBoxSetting = this.setBoxSetting.bind(this);
		this.tool = new Tool(context);
	}
	registerCommand() {
		console.log("注册");
		this.context.subscriptions.push(this.setPythonPath());
		this.context.subscriptions.push(this.setBoxSetting());
	}
	//设置python地址
	setPythonPath() {
		return vscode.commands.registerCommand("quan.pythonPath", () => {
			vscode.commands.executeCommand("python.setInterpreter").then(async () => {
				vscode.window.showInformationMessage("设置成功");
			});
		});
	}
	//设置boxIP
	setBoxSetting() {
		return vscode.commands.registerCommand("quan.boxsetting", async () => {
			const { pythonPath } = await this.tool.getPython();
			const spawn = pro.spawn(`${pythonPath}`, [
				`-m`,
				`qutrunk.tools.get_config`,
			]);
			console.log("spawn", spawn);
			spawn.stdout.on("data", async (data) => {
				const what: string | undefined = await vscode.window.showInputBox({
					placeHolder: "请输入Box地址(ip:port)",
					value: data.toString(),
				});
				console.log("what", what);
				if (what == undefined) {
					return;
				}
				if (/\d+\.\d+\.\d+\.\d+:\d/.test(what)) {
					pro.execSync(
						`${pythonPath} -m qutrunk.tools.set_config --ip ${what}`
					);
					vscode.window.showInformationMessage("设置成功");
				} else {
					vscode.window.showErrorMessage("请输入正确的ip:port");
				}
			});
			spawn.stderr.on("data", (data) => {
				console.log("错误", data.toString());
			});
		});
	}
}
