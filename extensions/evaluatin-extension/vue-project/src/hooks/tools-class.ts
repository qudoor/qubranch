/*
 * @Date: 2022-05-10 14:26:35
 * @Description:针对不同模式下的工具类
 */
import {
	apiGetInfo,
	apiGetTask,
	apiPostStartJob,
	apiGetResult,
	apiSlurmPostStartJob,
	apiGetSlurmResult,
	apiSlurmGetTask
} from '@/apis/result'

import router from '@/router/index'

//运行模式的工具类
export class Run {
	constructor() {}

	// 远程box（arm）运行
	runColonyBox(formData, callback: Function) {
		async function runApi(e) {
			const { type } = e.data
			if (type === 'runColonyBox') {
				sessionStorage.setItem('boxapi', formData.ip)
				const { tag }: any = await apiPostStartJob(formData)
				window.removeEventListener('message', runApi)

				router.push({
					name: 'RevalCharts',

					query: {
						modelType: 'colonyBox',
						tag,
						job: formData.job
					}
				})
				callback()
			}
		}

		window.addEventListener('message', runApi)
	}

	//mac
	runSingleMac(formData) {
		function getTag({ data }) {
			if (data.type === 'runSingleMac') {
				router.push({
					name: 'RevalCharts',
					query: {
						modelType: 'single',
						tag: data.value,
						job: formData.name
					}
				})
				window.removeEventListener('message', getTag)
			}
		}
		window.addEventListener('message', getTag)
	}

	//win
	runSingleWin(formData) {
		function getTag({ data }) {
			if (data.type === 'runSingleWin') {
				router.push({
					name: 'RevalCharts',
					query: {
						modelType: 'single',
						tag: data.value,
						job: formData.name
					}
				})
				window.removeEventListener('message', getTag)
			}
		}
		window.addEventListener('message', getTag)
	}

	//远程HPC（slurm）的运行
	runColonyHpc(formData, callback: Function) {
		async function runApi(e) {
			const { type } = e.data
			if (type === 'runColonySlurm') {
				sessionStorage.setItem('slurmapi', formData.ip)
				const { tag }: any = await apiSlurmPostStartJob(formData)
				window.removeEventListener('message', runApi)

				router.push({
					path: '/task/list',

					query: {
						modelType: 'colonySlurm',
						tag,
						job: formData.job
					}
				})
				callback()
			}
		}

		window.addEventListener('message', runApi)
	}
}

//获取信息的工具类
export class Info {
	constructor() {}

	//box获取硬件数据
	async getHardwareInfoBox() {
		const data: any = await apiGetInfo(1)
		// let dataKeys = Object.keys(data)
		const { suanli, xinghao, zhupin } = data.gpu_info
		const parseData = {
			CPU: data.cpu_info,
			GPU: { 算力: suanli, 型号: xinghao, 主频: zhupin },
			OS: { 名称: data.os_info },
			内存: data.ram_info,
			IP: { ip: sessionStorage.getItem('boxapi') }
		}

		return [parseData]
	}

	//hpc（slurm）获取硬件数据
	getHardwareInfoHpc() {}

	//box获取JOB列表信息
	async getJobListBox() {
		const data: any = await apiGetTask()
		return data
	}
	//hpc(slurm)获取JOB列表
	async getJobListHpc() {
		const data: any = await apiSlurmGetTask()
		return data
	}

	//hpc获取JOB信息
	async getJobInfoHpc({ tag, job }) {
		const data: any = await apiGetSlurmResult({ tag, job })
		const parseData = []
		const algorithmKeys = Object.keys(data.all_algo_data) //算法
		algorithmKeys.forEach(algorithmItem => {
			const bitNums = Object.keys(data.all_algo_data[algorithmItem])
			bitNums.forEach(bitItem => {
				const rounds = Object.keys(data.all_algo_data[algorithmItem][bitItem].all_round_details)
				rounds.forEach(roundItem => {
					const item = data.all_algo_data[algorithmItem][bitItem].all_round_details[roundItem]
					const {
						algorithm,
						now_qubit,
						now_round,
						// data: runData,
						data: { time }
					} = item
					// const cpu_speed = `${runData.cpu[0][2].toFixed(2)}%`
					// const men_speed = `${((runData.ram.Total.used / runData.ram.Total.total) * 100).toFixed(2)}%`

					parseData.push({
						taskname: data.job_name,
						algorithm,
						now_qubit,
						now_round,
						time: `${time}s`,
						// cpu_speed,
						// men_speed,
						// cpu_thread: data.cpu_thread,
						tasknameLen: algorithmKeys.length * bitNums.length * rounds.length,
						algorithmLen: bitNums.length * rounds.length,
						now_qubitLen: rounds.length
					})
				})
			})
		})

		return parseData
	}

	//box获取单个job的信息
	async getJobInfoBox({ tag, job }) {
		const data: any = await apiGetResult({ tag, job })
		const parseData = []
		const algorithmKeys = Object.keys(data.all_algo_data) //算法
		algorithmKeys.forEach(algorithmItem => {
			const bitNums = Object.keys(data.all_algo_data[algorithmItem])
			bitNums.forEach(bitItem => {
				const rounds = Object.keys(data.all_algo_data[algorithmItem][bitItem].all_round_details)
				rounds.forEach(roundItem => {
					const item = data.all_algo_data[algorithmItem][bitItem].all_round_details[roundItem]
					const {
						algorithm,
						now_qubit,
						now_round,
						data: runData,
						data: { time }
					} = item
					const cpu_speed = `${runData.cpu[0][2].toFixed(2)}%`
					const men_speed = `${((runData.ram.Total.used / runData.ram.Total.total) * 100).toFixed(2)}%`

					parseData.push({
						taskname: data.job_name,
						algorithm,
						now_qubit,
						now_round,
						time: `${time}s`,
						cpu_speed,
						men_speed,
						cpu_thread: data.cpu_thread,
						tasknameLen: algorithmKeys.length * bitNums.length * rounds.length,
						algorithmLen: bitNums.length * rounds.length,
						now_qubitLen: rounds.length
					})
				})
			})
		})

		return parseData
	}
	getJobInfoSingleMac(data) {
		const parseData = []
		const algorithmKeys = Object.keys(data.all_algo_data) //算法
		algorithmKeys.forEach(algorithmItem => {
			const bitNums = Object.keys(data.all_algo_data[algorithmItem])
			bitNums.forEach(bitItem => {
				const rounds = Object.keys(data.all_algo_data[algorithmItem][bitItem].all_round_details)
				rounds.forEach(roundItem => {
					const item = data.all_algo_data[algorithmItem][bitItem].all_round_details[roundItem]
					const {
						algorithm,
						now_qubit,
						now_round,
						data: runData,
						data: { time }
					} = item
					const cpu_speed = `${runData.cpu[0][2].toFixed(2)}%`
					const men_speed = `${((runData.ram.Total.used / runData.ram.Total.total) * 100).toFixed(2)}%`

					parseData.push({
						taskname: data.job_name,
						algorithm,
						now_qubit,
						now_round,
						time: `${time}s`,
						cpu_speed,
						men_speed,
						cpu_thread: data.cpu_thread,
						tasknameLen: algorithmKeys.length * bitNums.length * rounds.length,
						algorithmLen: bitNums.length * rounds.length,
						now_qubitLen: rounds.length
					})
				})
			})
		})
		return parseData
	}

	//box获取单个job的报告
	async getReportBox({ tag, job }) {
		const data: any = await apiGetResult({ tag, job })
		const lineSeries: { name: string; type: 'line'; data: number[] | string[] }[] = []
		const linelegendData = Object.keys(data.all_algo_data)
		let linexAxisData = []
		const barAllSeries = {}
		linelegendData.forEach(algorithmItem => {
			const bitNums = Object.keys(data.all_algo_data[algorithmItem])
			barAllSeries[algorithmItem] = {}
			bitNums.forEach(bitItem => {
				const nowItem = data.all_algo_data[algorithmItem][bitItem]
				barAllSeries[algorithmItem][bitItem] = {
					并行: { best: 0, avg: 0, worst: 0 },
					CPU使用率: {
						best: nowItem['cpu_best'][1],
						avg: nowItem['average_cpu'],
						worst: nowItem['cpu_last'][1]
					},
					内存使用率: {
						best: nowItem['ram_best'][1],
						avg: nowItem['average_ram'],
						worst: nowItem['ram_last'][1]
					}
				}
			})
		})
		linelegendData.forEach(algorithmItem => {
			const bitNums = Object.keys(data.all_algo_data[algorithmItem])
			const bitData = []
			if (linexAxisData.length === 0) {
				linexAxisData = bitNums
			}
			bitNums.forEach(bitItem => {
				bitData.push(data.all_algo_data[algorithmItem][bitItem].average_time)
			})
			lineSeries.push({ name: algorithmItem, type: 'line', data: bitData })
		})
		return { lineSeries, linelegendData, linexAxisData, barAllSeries }
	}

	async getReportSlurm({ tag, job }) {
		const data: any = await apiGetSlurmResult({ tag, job })
		const lineSeries: { name: string; type: 'line'; data: number[] | string[] }[] = []
		const linelegendData = Object.keys(data.all_algo_data)
		let linexAxisData = []
		const barAllSeries = {}
		linelegendData.forEach(algorithmItem => {
			const bitNums = Object.keys(data.all_algo_data[algorithmItem])
			barAllSeries[algorithmItem] = {}
			bitNums.forEach(bitItem => {
				const nowItem = data.all_algo_data[algorithmItem][bitItem]
				barAllSeries[algorithmItem][bitItem] = {
					并行: { best: 0, avg: 0, worst: 0 },
					CPU使用率: {
						best: nowItem['cpu_best'][1],
						avg: nowItem['average_cpu'],
						worst: nowItem['cpu_last'][1]
					},
					内存使用率: {
						best: nowItem['ram_best'][1],
						avg: nowItem['average_ram'],
						worst: nowItem['ram_last'][1]
					}
				}
			})
		})
		linelegendData.forEach(algorithmItem => {
			const bitNums = Object.keys(data.all_algo_data[algorithmItem])
			const bitData = []
			if (linexAxisData.length === 0) {
				linexAxisData = bitNums
			}
			bitNums.forEach(bitItem => {
				bitData.push(data.all_algo_data[algorithmItem][bitItem].average_time)
			})
			lineSeries.push({ name: algorithmItem, type: 'line', data: bitData })
		})
		return { lineSeries, linelegendData, linexAxisData, barAllSeries }
	}

	//mac获取单个job的报告
	getReportMac(data) {
		const lineSeries: { name: string; type: 'line'; data: number[] | string[] }[] = []
		const linelegendData = Object.keys(data.all_algo_data)
		let linexAxisData = []
		const barAllSeries = {}
		linelegendData.forEach(algorithmItem => {
			const bitNums = Object.keys(data.all_algo_data[algorithmItem])
			barAllSeries[algorithmItem] = {}
			bitNums.forEach(bitItem => {
				const nowItem = data.all_algo_data[algorithmItem][bitItem]
				barAllSeries[algorithmItem][bitItem] = {
					并行: { best: 0, avg: 0, worst: 0 },
					CPU使用率: {
						best: nowItem['cpu_best'][1],
						avg: nowItem['average_cpu'],
						worst: nowItem['cpu_last'][1]
					},
					内存使用率: {
						best: nowItem['ram_best'][1],
						avg: nowItem['average_ram'],
						worst: nowItem['ram_last'][1]
					}
				}
			})
		})

		linelegendData.forEach(algorithmItem => {
			const bitNums = Object.keys(data.all_algo_data[algorithmItem])
			const bitData = []
			if (linexAxisData.length === 0) {
				linexAxisData = bitNums
			}
			bitNums.forEach(bitItem => {
				bitData.push(data.all_algo_data[algorithmItem][bitItem].average_time)
			})
			lineSeries.push({ name: algorithmItem, type: 'line', data: bitData })
		})
		return { lineSeries, linelegendData, linexAxisData, barAllSeries }
	}
}

//webSocket工具类
export class ConcatSocket {
	public socket: WebSocket

	constructor() {
		const url = `ws://${sessionStorage.getItem('boxapi')}:21567`
		this.socket = new WebSocket(url)
	}
}
