/*
 * @Date: 2022-05-30 16:41:50
 * @Description:工具类
 */
import vscode from "vscode";
import * as pro from "child_process";
export class Tool {
	context: vscode.ExtensionContext;
	constructor(context) {
		this.context = context;
		this.pipInstall = this.pipInstall.bind(this);
		this.getPython = this.getPython.bind(this);
	}
	//获取python地址
	async getPython() {
		const pythonExt = vscode.extensions.getExtension("ms-python.python");

		if (!pythonExt.isActive) {
			await pythonExt.exports.ready;
		}

		function getPythonPath() {
			if (!pythonExt) {
				return "python";
			}
			const executionDetails = pythonExt.exports.settings.getExecutionDetails();
			return executionDetails?.execCommand?.[0] || "";
		}

		const pythonPath = getPythonPath();

		const onPythonPathChange = (callback: (pythonPath: string) => any) => {
			return pythonExt.exports.settings.onDidChangeExecutionDetails(() => {
				const pythonPath = getPythonPath();
				return callback(pythonPath);
			});
		};

		return { pythonPath, onPythonPathChange, pythonExt };
	}
	//安装qutrunk依赖包
	async pipInstall() {
		const { pythonPath } = await this.getPython();
		const addPackage = () => {
			return new Promise((resolve, reject) => {
				const spawn = pro.spawn(pythonPath, [
					`-m`,
					`pip`,
					`install`,
					`--upgrade`,
					`qutrunk`,
				]);

				spawn.on("close", (code) => {
					if (!code) {
						resolve(code);
						vscode.window.showInformationMessage("安装完成");
					} else {
						reject();
						vscode.window.showErrorMessage("安装失败，请稍后重试");
					}
				});
			});
		};

		vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: `正在安装依赖`,
				cancellable: true,
			},
			async () => {
				await addPackage();
			}
		);
	}
}
