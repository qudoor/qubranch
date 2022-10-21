/*
 * @Date: 2022-03-23 17:01:43
 * @Description: 工具类
 */
import { vscode } from '@/main'
export default class Tool {
	private timeOut
	constructor() {
		this.propsWithEdit = this.propsWithEdit.bind(this)
		this.parseCanHasCtrlFromText = this.parseCanHasCtrlFromText.bind(this)
		this.parseEditData = this.parseEditData.bind(this)
	}
	//图形编辑器传文本编辑器
	propsWithEdit(data, qubit) {
		if (this.timeOut) {
			clearTimeout(this.timeOut)
		}

		this.timeOut = setTimeout(() => {
			const graph = JSON.parse(JSON.stringify(data))
			const instructionsList = []
			interface graphItemINF {
				[key: string]: any
			}
			let maxLength = 0
			graph.forEach((graphList: graphItemINF[]) => {
				maxLength = maxLength > graphList.length ? maxLength : graphList.length
			})
			for (let i = 0; i < maxLength; i++) {
				graph.forEach((graphList: graphItemINF[], glIdx: number) => {
					if (graphList?.[i]?.name === 'readyIcon') {
						return
					}
					if (graphList?.[i]?.name && graphList?.[i]?.name !== 'readyIcon') {
						if (graphList[i]?.span > 1) {
							const position = []
							if (graphList[i]?.ctrl) {
								graphList[i].ctrl.forEach(item => {
									position.push(`qr[${item}]`)
								})
								position.push(`qr[${graphList[i].quanPosition}]`)
							} else {
								for (let span = 0; span < graphList[i].span; span++) {
									position.push(`qr[${span + glIdx - 1}]`)
								}
							}
							const name =
								graphList[i].canHasCtrl === false && graphList[i]?.ctrl?.length > 0
									? this.parseCanHasCtrlFromGraph(graphList[i])
									: `${graphList[i].name}${
											graphList[i]?.angle || graphList[i]?.angle === 0 ? `(${graphList[i].angle})` : ''
									  }`

							instructionsList.push(
								`${name} | ${position.length > 1 ? `(${position.join(',')})` : position.join(',')}`
							)
						} else {
							instructionsList.push(
								`${graphList[i].name}${
									graphList[i]?.angle || graphList[i]?.angle === 0 ? `(${graphList[i].angle})` : ''
								} | qr[${glIdx}]`
							)
						}
					}
				})
			}
			vscode.postMessage({
				command: 'edit',
				value: {
					qubit,
					codeArray: instructionsList
				}
			})
			return instructionsList
		}, 250)
	}
	/**
	 * @description: 转换文本编辑器发送过来的数据
	 * @return {Array} value 返回的数据
	 */
	parseEditData(value: string[], qubit: number, rawCode?: string) {
		try {
			let parseData = [...new Array(qubit)]
			parseData = parseData.map(() => {
				return []
			})

			value.forEach((item: string, index) => {
				const codeArray = item.split(' | ')
				let quanOtherValue: any = {}
				if (/\C\((\S*)\)/.test(codeArray[0])) {
					const canHasCtrlData = this.parseCanHasCtrlFromText(item)
					quanOtherValue = canHasCtrlData.value
					item = canHasCtrlData.code
				}
				const qubitsQuan = codeArray[1].match(/\((\S*)\)/) //拥有多比特的门
				const id = `${new Date().getTime()}_${index}`
				if (qubitsQuan) {
					if (['CNOT', 'Toffoli'].includes(item.split(' ', 1)[0]) || quanOtherValue?.name) {
						const qubits = qubitsQuan[1].split(',').map(quItem => {
							const idx = parseInt(quItem.match(/qr\[(\d+)\]/)[1])
							if (idx >= qubit) {
								qubit = idx + 1
								// throw new Error('编码超出比特位数')
							}
							return idx
						})
						const indexs = []
						for (let i = 0; i <= qubits.length - 2; i++) {
							indexs.push(qubits[i])
						}

						const quanPosition = qubits[qubits.length - 1]
						const positionMin = Math.min(...qubits)
						const positionMax = Math.max(...qubits)
						qubits.sort()

						parseData.forEach((quanListItem, idx) => {
							if (positionMin <= idx && idx <= positionMax) {
								quanListItem.push({
									...quanOtherValue,
									name: idx === positionMin ? item.split(' ', 1)[0] : undefined,
									id,
									ctrl: indexs,
									quanPosition,
									span: positionMax - positionMin + 1
								})
							} else {
								quanListItem.push(undefined)
							}
						})
					}
				} else {
					const idx = parseInt(item.match(/qr\[(\d+)\]/)[1])
					if (idx >= qubit) {
						// throw new Error('编码超出比特位数')
						qubit = idx + 1
					}

					parseData.forEach((quanList, quanIdx) => {
						if (quanIdx === idx) {
							if (/\((\S*)\)/.test(codeArray[0])) {
								const angle = codeArray[0].match(/\((\S*)\)/)[1]
								const name = codeArray[0].match(/(\S*)\(/)[1]
								quanList.push({
									name,
									span: 1,
									id,
									angle,
									canHasCtrl: true,
									ctrl: [],
									readyCtrl: [],
									quanPosition: quanIdx
								})
							} else if (['X', 'Y', 'Z', 'P', 'R', 'Rx', 'Ry', 'Rz'].includes(codeArray[0])) {
								quanList.push({
									name: codeArray[0],
									span: 1,
									id,
									canHasCtrl: true,
									ctrl: [],
									readyCtrl: [],
									quanPosition: quanIdx
								})
							} else {
								quanList.push({ name: item.split(' ', 1)[0], span: 1, id })
							}
						} else {
							quanList.push(undefined)
						}
					})
				}
			})
			if (rawCode) {
				vscode.postMessage({
					command: 'runQuanTrunk',
					value: {
						qubit,
						rawCode
					}
				})
			}

			return { myQuanGround: parseData, qubit }
		} catch (error) {
			if (error instanceof Error) {
				vscode.postMessage({
					command: 'error',
					value: error.message
				})
			} else {
				vscode.postMessage({
					command: 'error',
					value: '编码有误'
				})
			}
			throw new Error(error)
		}
	}
	//处理来自图型编辑器拥有canHasCtrl属性的量子门
	parseCanHasCtrlFromGraph(data: { [key: string]: any }) {
		const code = `C(${data.name}${data?.angle ? `(${data.angle})` : ''})`
		return code
	}
	//处理来自文本编辑器需要拥有canHasCtrl属性的量子门
	parseCanHasCtrlFromText(code: string) {
		const codeArray = code.split(' | ')
		const codeSplit = codeArray[0].match(/\C\((\S*)\((\S*)\)\)/)

		if (!codeSplit) {
			const noAngleCodeSplit = codeArray[0].match(/\C\((\S*)\)/)
			return {
				value: { name: noAngleCodeSplit[1], canHasCtrl: false, readyCtrl: [] },
				code: `${noAngleCodeSplit[1]} | ${codeArray[1]}`
			}
		}
		const name = codeSplit[1]
		const angle = codeSplit[2]

		return { value: { name, canHasCtrl: false, readyCtrl: [], angle }, code: `${name} | ${codeArray[1]}` }
	}
}
