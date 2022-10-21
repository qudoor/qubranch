/*
 * @Date: 2022-05-09 09:57:51
 * @Description:与webview之间的通信
 */
import * as vscode from "vscode";
import * as path from "path";
import * as pro from "child_process";
import * as os from "os";
import { LocalStorageService } from "./memento";
import * as iconvLite from "iconv-lite";
export class ConcatWebView {
	spawnMap; //子进程Map
	constructor() {
		this.getWebView = this.getWebView.bind(this);
		this.spawnMap = new Map();
	}
	//展示错误
	private showError(err: string) {
		vscode.window.showErrorMessage(err);
	}
	public postWebView(
		webview: vscode.Webview,
		data: { type: string; value: any; pid?: string }
	) {
		webview.postMessage(data);
	}
	public getWebView(
		webview: vscode.Webview,
		type: string,
		context: vscode.ExtensionContext,
		pid?: string,
		value?: any
	) {
		switch (type) {
			case "runSingleWin": {
				const getInfoPath = path.join(
					context.extensionPath,
					"media",
					"pythonProject",
					"win"
				);
				const { round, step, algo, job, ip } = value;
				const spawn = pro.spawn(
					"Algorithm_job_win.exe",
					["--round", round, "--step", step, "--algo", algo, "--job", job],
					{ cwd: getInfoPath }
				);

				spawn.stderr.on("data", (data) => {
					console.log("runSingleWin错误=>", data.toString(), value);
				});
				spawn.stdout.on("data", (data) => {
					const parseData = `${iconvLite.decode(data, "cp936")}`;
					this.getWebView(webview, "setBoxapi", context, undefined, ip);
					this.postWebView(webview, { type: "runSingleWin", value: parseData });
				});
				spawn.stderr.on("data", (err) => {
					this.showError(`${err}`);
				});
				break;
			}
			case "getJobListSingleWin": {
				const getInfoPath = path.join(
					context.extensionPath,
					"media",
					"pythonProject",
					"win"
				);
				const spawn = pro.spawn("get_task.exe", [], { cwd: getInfoPath });
				spawn.stdout.on("data", (data) => {
					this.postWebView(webview, {
						type: "getJobListSingleWin",
						value: JSON.parse(`${iconvLite.decode(data, "cp936")}`),
					});
				});
				spawn.stderr.on("data", (err) => {
					this.showError(`${err}`);
				});

				break;
			}
			case "getJobResultSingleWin": {
				const { tag, job } = value;
				const getInfoPath = path.join(
					context.extensionPath,
					"media",
					"pythonProject",
					"win"
				);
				const spawn = pro.spawn(
					"get_result.exe",
					["--tag", tag, "--job", job],
					{ cwd: getInfoPath }
				);
				spawn.stdout.on("data", (data) => {
					this.postWebView(webview, {
						type: "getJobResultSingleWin",
						value: JSON.parse(`${iconvLite.decode(data, "cp936")}`),
					});
				});
				spawn.stderr.on("data", (err) => {
					this.showError(`${err}`);
				});
				break;
			}
			case "getHardwareInfo": {
				const getInfoPath = path.join(
					context.extensionPath,
					"media",
					"pythonProject",
					"win"
				);
				const spawn = pro.spawn("get_info.exe", [], { cwd: getInfoPath });
				spawn.stdout.on("data", (data) => {
					this.postWebView(webview, {
						type: "getHardwareInfo",
						value: JSON.parse(`${iconvLite.decode(data, "cp936")}`),
					});
				});
				spawn.stderr.on("data", (err) => {
					this.showError(`${err}`);
				});

				break;
			}
			case "getRevalCharts": {
				const { tag, job } = value;
				const getInfoPath = path.join(
					context.extensionPath,
					"media",
					"pythonProject",
					"win"
				);
				const spawn = pro.spawn("real_time.exe", ["--tag", tag, "--job", job], {
					cwd: getInfoPath,
				});
				this.spawnMap.set(`${spawn.pid}`, spawn);
				spawn.stdout.on("data", (data) => {
					this.postWebView(webview, {
						type: "getRevalCharts",
						value: `${iconvLite.decode(data, "cp936")}`,
						pid: `${spawn.pid}`,
					});
				});
				spawn.stderr.on("data", (err) => {
					this.showError(`${err}`);
				});

				break;
			}
			case "kill": {
				const spawn = this.spawnMap.get(pid);
				const kill = spawn.kill();
				break;
			}
			case "runColonyBox": {
				const osType = os.type();
				const getInfoPath =
					osType === "Darwin"
						? path.join(
								context.extensionPath,
								"media",
								"pythonProject",
								"arm",
								"remote_connection"
						  )
						: "remote_connection.exe";
				const ip = value.ip;
				const user = value.user;
				const pwd = value.pwd;
				const spawn = pro.spawn(
					getInfoPath,
					[
						"--ip",
						`${ip}`,
						"--port",
						"22",
						"--user",
						`${user}`,
						"--pwd",
						`${pwd}`,
					],
					{
						cwd: path.join(
							context.extensionPath,
							"media",
							"pythonProject",
							"arm"
						),
					}
				);
				spawn.stderr.on("data", (err) => {
					this.showError(`${err}`);
				});
				spawn.stdout.on("data", (data) => {
					// if (data.toString() === "1") {
					this.postWebView(webview, { type: "runColonyBox", value: undefined });
					// }
				});
				break;
			}
			case "setBoxapi": {
				const localStorageService = new LocalStorageService(
					context.globalState
				);
				localStorageService.setValue("boxapi", value);
				const boxApiList: string[] =
					localStorageService.getValue("boxApiList") || [];
				if (!boxApiList.includes(value)) {
					localStorageService.setValue("boxApiList", boxApiList.concat(value));
					this.postWebView(webview, {
						type: "getBoxApiList",
						value: JSON.stringify(boxApiList.concat(value)),
					});
				}
				break;
			}
			case "getBoxapi": {
				const localStorageService = new LocalStorageService(
					context.globalState
				);
				const boxapi = localStorageService.getValue("boxapi");
				this.postWebView(webview, { type: "getBoxapi", value: boxapi });

				const boxApiList = localStorageService.getValue(
					"boxApiList",
					boxapi ? [boxapi] : []
				);
				this.postWebView(webview, {
					type: "getBoxApiList",
					value: JSON.stringify(boxApiList),
				});
				break;
			}
			case "runSingleMac": {
				// python3 Algorithm_job_arm.py --round 3 --step 5,6,8 --algo grover --job myjobname
				const getInfoPath = path.join(
					context.extensionPath,
					"media",
					"pythonProject",
					"mac",
					"Algorithm_job_mac"
				);
				const { round, step, algo, job } = value;
				const spawn = pro.spawn(
					getInfoPath,
					["--round", round, "--step", step, "--algo", algo, "--job", job],
					{
						cwd: path.join(
							context.extensionPath,
							"media",
							"pythonProject",
							"mac"
						),
					}
				);
				spawn.stderr.on("data", (err) => {
					this.showError(`${err}`);
				});
				spawn.stdout.on("data", (data) => {
					// if (data.toString() === "1") {
					this.postWebView(webview, {
						type: "runSingleMac",
						value: data.toString(),
					});
					// }
				});
				break;
			}
			case "getHardwareInfoSingleMac": {
				const getInfoPath = path.join(
					context.extensionPath,
					"media",
					"pythonProject",
					"mac",
					"get_info"
				);
				const spawn = pro.spawn(getInfoPath, [], {
					cwd: path.join(
						context.extensionPath,
						"media",
						"pythonProject",
						"mac"
					),
				});
				spawn.stderr.on("data", (err) => {
					this.showError(`${err}`);
				});
				spawn.stdout.on("data", (data) => {
					this.postWebView(webview, {
						type: "getHardwareInfoSingleMac",
						value: JSON.parse(data.toString()),
					});
				});
				break;
			}
			case "getRevalChartsSingleMac": {
				const { tag, job } = value;
				const getInfoPath = path.join(
					context.extensionPath,
					"media",
					"pythonProject",
					"mac",
					"real_time"
				);
				// python3 real_time.py --tag 1652600819 --job myjobname
				const spawn = pro.spawn(getInfoPath, ["--tag", tag, "--job", job], {
					cwd: path.join(
						context.extensionPath,
						"media",
						"pythonProject",
						"mac"
					),
				});
				this.spawnMap.set(`${spawn.pid}`, spawn);
				spawn.stdout.on("data", (data) => {
					this.postWebView(webview, {
						type: "getRevalChartsSingleMac",
						value: data.toString(),
						pid: `${spawn.pid}`,
					});
				});
				spawn.stderr.on("data", (err) => {
					this.showError(`${err}`);
				});

				break;
			}
			case "getOsType": {
				const type = os.type();
				this.postWebView(webview, { type: "getOsType", value: type });
				break;
			}
			case "getJobListSingleMac": {
				const getInfoPath = path.join(
					context.extensionPath,
					"media",
					"pythonProject",
					"mac",
					"get_task"
				);
				const spawn = pro.spawn(getInfoPath, [], {
					cwd: path.join(
						context.extensionPath,
						"media",
						"pythonProject",
						"mac"
					),
				});
				spawn.stdout.on("data", (data) => {
					this.postWebView(webview, {
						type: "getJobListSingleMac",
						value: JSON.parse(data.toString()),
					});
				});
				spawn.stderr.on("data", (err) => {
					this.showError(`${err}`);
				});

				break;
			}
			case "getJobResultSingleMac": {
				const { tag, job } = value;
				const getInfoPath = path.join(
					context.extensionPath,
					"media",
					"pythonProject",
					"mac",
					"get_result"
				);
				const spawn = pro.spawn(getInfoPath, ["--tag", tag, "--job", job]);
				spawn.stdout.on("data", (data) => {
					this.postWebView(webview, {
						type: "getJobResultSingleMac",
						value: JSON.parse(data.toString()),
					});
				});
				spawn.stderr.on("data", (err) => {
					this.showError(`${err}`);
				});
				break;
			}
			case "runColonySlurm": {
				const osType = os.type();
				const getInfoPath =
					osType === "Darwin"
						? path.join(
								context.extensionPath,
								"media",
								"pythonProject",
								"slurm",
								"remote_connection"
						  )
						: "remote_connection.exe";
				const ip = value.ip;
				const user = value.user;
				const pwd = value.pwd;
				const spawn = pro.spawn(
					getInfoPath,
					[
						"--ip",
						`${ip}`,
						"--port",
						"22",
						"--user",
						`${user}`,
						"--pwd",
						`${pwd}`,
					],
					{
						cwd: path.join(
							context.extensionPath,
							"media",
							"pythonProject",
							"slurm"
						),
					}
				);
				spawn.stderr.on("data", (err) => {
					this.showError(`${err}`);
				});
				spawn.stdout.on("data", (data) => {
					// if (data.toString() === "1") {
					this.getWebView(webview, "setBoxapi", context, undefined, ip);
					this.postWebView(webview, {
						type: "runColonySlurm",
						value: undefined,
					});
					// }
				});
				break;
			}
			case "setSlurmapi": {
				const localStorageService = new LocalStorageService(
					context.globalState
				);
				localStorageService.setValue("slurmapi", value);
				const slurmApiList: string[] =
					localStorageService.getValue("slurmApiList") || [];
				if (!slurmApiList.includes(value)) {
					localStorageService.setValue(
						"slurmApiList",
						slurmApiList.concat(value)
					);
					this.postWebView(webview, {
						type: "getSlurmApiList",
						value: JSON.stringify(slurmApiList.concat(value)),
					});
				}
				break;
			}
			case "getSlurmapi": {
				const localStorageService = new LocalStorageService(
					context.globalState
				);
				const slurmapi = localStorageService.getValue("slurmapi");
				this.postWebView(webview, { type: "getSlurmapi", value: slurmapi });
				const slurmApiList = localStorageService.getValue(
					"slurmApiList",
					slurmapi ? [slurmapi] : []
				);
				this.postWebView(webview, {
					type: "getSlurmApiList",
					value: JSON.stringify(slurmApiList),
				});
				break;
			}
		}
	}
}
