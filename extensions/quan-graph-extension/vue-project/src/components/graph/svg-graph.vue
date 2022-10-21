<!--
 * @Date: 2022-03-07 18:03:14
 * @Description: svg图表
-->
<template>
	<div>
		<div v-if="activeVis" :style="activeQuanStyle" class="active-quan">
			<svg width="40" height="50" v-html="svgIcon[activeQuan.name].icon"></svg>
		</div>
		<div class="search">
			<div
				v-for="(item, key) in svgIcon"
				:key="key"
				class="search-svg"
				:data-name="key"
				@mousedown="mousedown($event, key)"
			>
				<svg width="40" height="50" v-html="item.icon"></svg>
			</div>
		</div>
		<div class="viewbox" @scroll="($refs.yaxiosDelRef as any).scrollX">
			<svg
				id="graph"
				:height="`${standard[1] * (yAxiosNum + 2)}`"
				:width="innerWidth"
				:viewBox="`0 0 ${innerWidth} ${standard[1] * (yAxiosNum + 2)}`"
				style="background-color: #ffffff; user-select: none"
				@mousemove="graphInMove"
			>
				<g>
					<y-axios v-model:yAxios="yAxiosNum" :standard="standard" :inner-width="innerWidth"></y-axios>

					<!-- 门 -->
					<g>
						<template v-for="(quanList, quanListItemIdx) in quanGround">
							<template v-for="(quanItem, quanItemIndex) in quanList" :key="quanItemIndex">
								<g
									v-if="quanItem"
									:transform="`translate(${74 + quanItemIndex * standard[0]},${
										25 + quanListItemIdx * standard[1]
									})`"
									class="quan-item"
								>
									<rect
										width="38"
										:height="quanItem.span * (standard[1] - 2)"
										transform="translate(-3,-3)"
										style="fill: transparent; stroke-width: 1; stroke: #aaa"
										class="quan-pd"
										stroke-dasharray="2 2"
									></rect>

									<quan-cnot
										v-if="quanItem.name === 'CNOT'"
										:key="quanItem.id"
										v-model:value="quanGround[quanListItemIdx][quanItemIndex]"
										v-model:mouseUp="mouseUp"
										class="search-svg"
										:graph-move-y="graphMoveY"
										:position-y="quanListItemIdx"
										:position-x="quanItemIndex"
										:quan-ground="quanGround"
										@mousedown="mousedown($event, quanItem.name, [quanListItemIdx, quanItemIndex])"
										@ctrlChange="ctrlChange"
									></quan-cnot>
									<quan-angle
										v-else-if="['X', 'Y', 'Z', 'P', 'R', 'Rx', 'Ry', 'Rz'].includes(quanItem.name)"
										v-model:value="quanGround[quanListItemIdx][quanItemIndex]"
										v-model:mouseUp="mouseUp"
										class="search-svg"
										:graph-move-y="graphMoveY"
										:position-y="quanListItemIdx"
										:position-x="quanItemIndex"
										:quan-ground="quanGround"
										@mousedown="mousedown($event, quanItem.name, [quanListItemIdx, quanItemIndex])"
										@ctrlChange="ctrlChange"
									></quan-angle>
									<quan-toffoli
										v-else-if="quanItem.name === 'Toffoli'"
										v-model:value="quanGround[quanListItemIdx][quanItemIndex]"
										v-model:mouseUp="mouseUp"
										class="search-svg"
										:graph-move-y="graphMoveY"
										:position-y="quanListItemIdx"
										:position-x="quanItemIndex"
										:quan-ground="quanGround"
										@mousedown="mousedown($event, quanItem.name, [quanListItemIdx, quanItemIndex])"
										@ctrlChange="ctrlChange"
									></quan-toffoli>

									<g v-else-if="quanItem.name === 'readyIcon'">
										<quan-ready :height="32 + (activeQuan.span - 1) * standard[1]"></quan-ready>
									</g>

									<g
										v-else-if="quanItem.name"
										class="search-svg"
										@mousedown="mousedown($event, quanItem.name, [quanListItemIdx, quanItemIndex])"
										v-html="svgIcon[quanItem.name].icon"
									></g>
								</g>
							</template>
						</template>
					</g>
					<yaxios-del
						ref="yaxiosDelRef"
						v-model:yAxios="yAxiosNum"
						:standard="standard"
						:quan-ground="quanGround"
						@rearrangement="yAxiosChange"
					></yaxios-del>
				</g>
			</svg>
		</div>
		<basis-states-bar ref="basisStateBarRef" style="width: 100%; height: 500px"></basis-states-bar>
	</div>
</template>
<script lang="ts" setup>
import svgIcon from '../../svg/all-icon'
import { ref, StyleValue, computed } from 'vue'
import Tool from '@/hooks/tools'
import QuanCnot from './components/quan-cnot.vue'
import QuanReady from './components/quan-ready.vue'
import YAxios from './components/y-axios.vue'
import QuanToffoli from './components/quan-toffoli.vue'
import BasisStatesBar from './components/basis-states-bar.vue'
import YaxiosDel from './components/yaxios-del.vue'
import QuanAngle from './components/quan-angle.vue'
import { nextTick } from 'vue'
import { message } from 'ant-design-vue'
const { propsWithEdit, parseEditData } = new Tool()

const basisStateBarRef = ref()
let yAxiosNum = ref(3) //y轴有多少条
let standard = ref<[number, number]>([50, 40]) //每个组件的标准起始距离x、y

let quanGround = ref<any>([[], [], []]) //所有选中的门
let activeQuan = ref<any>({}) //当前选中的门
let graphMoveX = ref(0)
let graphMoveY = ref(0)

//svg图表内鼠标的移动
function graphInMove(e) {
	graphMoveX.value = e.offsetX
	graphMoveY.value = e.offsetY
}

/**

 * @description: 选中的节点离开图表时
 * @param {*}
 * @return {*}
 */
function dragleave() {
	quanGround.value.some((items, index) => {
		let i = items.findIndex(item => item?.ready)
		if (i > -1) {
			quanGround.value[index][i] = undefined

			return
		}
	})
	quanGround.value = rearrangement(quanGround.value)

	readyYIndex = -1
}

let readyYIndex = -1 //上一次选中的Y位置
let loading = false
/**
 
 * @description: 选中节点并鼠标移动时
 * @param {*} e dom
 * @param {*} reXIndex 在重新托图表中存在的门的起始x位置
 * @param {*} reYIndex 在重新托图表中存在的门的起始Y位置
 * @return {*}
 */
function dragover(e: any, reXIndex?: number, reYIndex?: number) {
	if (loading) {
		return
	}
	loading = true
	let myQuan = JSON.parse(JSON.stringify(quanGround.value))
	let nowXIndex: number
	let nowYIndex: number
	if (e) {
		const { offsetY, offsetX } = e
		nowXIndex = Math.floor((offsetX - 65) / standard.value[0])
		nowYIndex = Math.floor((offsetY - 21) / standard.value[1])
		nowYIndex = nowYIndex >= yAxiosNum.value ? yAxiosNum.value - 1 : nowYIndex < 0 ? 0 : nowYIndex

		if (nowYIndex > yAxiosNum.value - activeQuan.value.span) {
			nowYIndex = readyYIndex
		}
	} else {
		nowXIndex = reXIndex
		nowYIndex = reYIndex
	}
	if (nowXIndex !== undefined) {
		myQuan.forEach((quanList, index) => {
			let readyIndex = quanList.findIndex(readyItem => readyItem?.ready)
			if (readyIndex > -1) {
				myQuan[index][readyIndex] = undefined
			}
			myQuan[index].splice(
				nowXIndex,
				0,
				index >= nowYIndex && index < nowYIndex + activeQuan.value.span
					? {
							...activeQuan.value,
							name: index === nowYIndex ? 'readyIcon' : undefined,
							ready: true
					  }
					: undefined
			)
		})
	}

	quanGround.value = rearrangement(myQuan)
	readyYIndex = nowYIndex

	loading = false
}

/**
 * @description: 拖动结束，门放在图表上时
 * @param {*}
 * @return {*}
 */
function dragend() {
	if (readyYIndex !== -1) {
		let xIndex = quanGround.value[readyYIndex].findIndex(item => item?.name === 'readyIcon') //准备元素所在位置，给门添加控制位时是不存在
		quanGround.value[readyYIndex][xIndex] = { ...activeQuan.value }

		if (activeQuan.value?.span && xIndex > -1) {
			for (let i = 1; i < activeQuan.value?.span; i++) {
				if (quanGround.value[readyYIndex + i][xIndex]) {
					quanGround.value[readyYIndex + i].splice(xIndex, 1, { name: undefined })
				}

				quanGround.value[readyYIndex + i][xIndex] = { ...activeQuan.value, name: undefined }
			}
		}
	}

	readyYIndex = -1
	activeQuan.value = {}

	propsWithEdit(quanGround.value, yAxiosNum.value)
}

window.addEventListener('message', e => {
	const { command, value } = e.data

	switch (command) {
		case 'basisStateBar':
			basisStateBarRef.value.setOption(value)
			break
		case 'edit':
			try {
				const { myQuanGround, qubit } = parseEditData(e.data.value, yAxiosNum.value, e.data?.rawCode)
				yAxiosNum.value = qubit
				quanGround.value = rearrangement(myQuanGround)
			} finally {
			}
			break
		case 'controlLoading': {
			nextTick(() => {
				if (value == `1`) {
					basisStateBarRef.value.myEcharts().showLoading('default', {
						color: '#fff',
						textColor: '#fff',
						maskColor: 'rgba(0, 0, 0, 0.8)'
					})
				} else {
					basisStateBarRef.value.myEcharts().hideLoading()
				}
			})

			break
		}
	}
})

let activeVis = ref(false)
let activeQuanStyle = ref<StyleValue>()

function mousedown(e: any, key: any, indexs?: [number, number]) {
	activeVis.value = true
	let a = indexs ? { ...quanGround.value[indexs[0]][indexs[1]] } : { ...svgIcon[key] }

	activeQuan.value = a
	if (indexs) {
		for (let i = 0; i < activeQuan.value.span; i++) {
			quanGround.value[indexs[0] + i][indexs[1]] = undefined
		}
		dragover(null, indexs[1], indexs[0])
	} else {
		activeQuan.value.id = new Date().getTime()
		activeQuan.value.span = activeQuan.value?.span || 1

		activeQuan.value.name = key
		activeQuan.value.readyHeight = a.readyHeight || 32
	}

	activeQuanStyle.value = {
		transform: `translate(${e.clientX - standard.value[0] / 2 + 8}px,  ${
			e.clientY - standard.value[1] / 2 - 4
		}px) `
	}
}

//对图形重新排序
function rearrangement(myQuan) {
	const xLength = myQuan[0].length
	const yLength = myQuan.length
	for (let xIndex = 1; xIndex < xLength; xIndex++) {
		for (let yIndex = 0; yIndex < yLength; yIndex++) {
			const itemItem = myQuan[yIndex][xIndex]
			const quanList = myQuan[yIndex]
			if (itemItem?.span === 1) {
				for (let i = xIndex - 1; i >= 0; i--) {
					if (quanList[i]) {
						break
					} else {
						quanList[i] = quanList[i + 1]
						quanList[i + 1] = undefined
					}
				}
			} else if (itemItem && yIndex + itemItem.span <= yAxiosNum.value && itemItem.name) {
				quanListFor: for (let i = xIndex - 1; i >= 0; i--) {
					for (let ii = yIndex; ii < yIndex + itemItem.span; ii++) {
						if (myQuan[ii][i]) {
							break quanListFor
						}
					}

					for (let iii = yIndex; iii < yIndex + itemItem.span; iii++) {
						myQuan[iii][i] = myQuan[iii][i + 1]
						myQuan[iii][i + 1] = undefined
					}
				}
			}
		}
	}

	for (let i = 0; i < myQuan[0].length; ) {
		let notDelBol = myQuan.some(item => {
			if (item[i]) {
				return true
			}
		})
		if (!notDelBol) {
			myQuan.forEach(item => {
				item.splice(i, 1)
			})
		} else {
			i++
		}
	}

	return myQuan
}

//ctrlChange
function ctrlChange(
	myActiveQuan: any,
	nowXIndex: number,
	nowYIndex: number,
	oldYIndex: number,
	oldSpan: number
) {
	let myQuan = JSON.parse(JSON.stringify(quanGround.value))
	for (let i = 0; i < oldSpan; i++) {
		myQuan[oldYIndex + i][nowXIndex] = undefined
	}

	// debugger
	myQuan.forEach((quanList, index) => {
		myQuan[index].splice(
			nowXIndex,
			0,
			(index >= nowYIndex && index < nowYIndex + myActiveQuan.span) || myActiveQuan.canHasCtrl
				? {
						...myActiveQuan,
						name: index === nowYIndex ? myActiveQuan.name : undefined
				  }
				: undefined
		)
	})

	quanGround.value = rearrangement(myQuan)
	// dragend()
	// propsWithEdit(quanGround.value, yAxiosNum.value)
}

//y轴改变时
function yAxiosChange(callback) {
	let hasDontComplete = quanGround.value[0].find(item => item?.readyCtrl?.length > 0) //拥有未完成操作的量子门,当前只有加入控制位未完成的情况
	if (hasDontComplete) {
		message.error('当前有操作未完成，请先完成操作')
		return
	}
	callback(value => {
		quanGround.value = rearrangement(value)
		propsWithEdit(quanGround.value, yAxiosNum.value)
	})
}
let windowInerrWidth = ref(740)
let innerWidth = computed(() => {
	let iw = windowInerrWidth.value
	let quanw = quanGround.value[0].length * 50 + 80
	return iw > quanw ? iw : quanw
})
//获取并设置svg宽度
function getInnerWidth() {
	windowInerrWidth.value = window.innerWidth - 50
}
getInnerWidth()

//拖控制位到电路图上的门
function ctrlInQuan(e: any) {
	const { left, top, bottom, right } = (document.getElementById('graph') as Element).getBoundingClientRect()
	if (e.clientX > left && e.clientY > top && e.clientX < right && e.clientY < bottom) {
		let nowXIndex = Math.floor((e.clientX - left - 65) / standard.value[0])
		let nowYIndex = Math.floor((e.clientY - top - 21) / standard.value[1])
		let quanItem = quanGround.value[nowYIndex][nowXIndex]

		if (quanItem?.canHasCtrl) {
			let readyCtrl = []
			for (let i = 0; i < yAxiosNum.value; i++) {
				if (i !== quanItem.quanPosition && !quanItem.ctrl.includes(i)) {
					readyCtrl.push(i)
				}
				quanItem.readyCtrl = readyCtrl
			}

			quanItem.span = yAxiosNum.value
			activeQuan.value = quanItem
			readyYIndex = nowYIndex
			ctrlChange(quanItem, nowXIndex, 0, nowYIndex, 1)
		}
		console.log('ctrlInQuan', quanItem)
	}
}

window.onresize = () => {
	getInnerWidth()
	basisStateBarRef.value?.resizeEcharts()
}
document.onmousemove = (e: any) => {
	if (!activeVis.value) {
		return
	}
	activeQuanStyle.value = {
		transform: `translate(${e.clientX - standard.value[0] / 2 + 8}px,  ${
			e.clientY - standard.value[1] / 2 - 4
		}px) `
	}
	if (['_Ctrl'].includes(activeQuan.value.name)) {
		return
	}
	const { left, top, bottom, right } = (document.getElementById('graph') as Element).getBoundingClientRect()

	if (e.clientX > left && e.clientY > top && e.clientX < right && e.clientY < bottom) {
		dragover({ offsetX: e.clientX - left, offsetY: e.clientY - top })
	} else {
		dragleave()
	}
}
let mouseUp = ref(true)
document.onmouseup = e => {
	mouseUp.value = true
	activeVis.value = false
	if (activeQuan.value.name === '_Ctrl') {
		ctrlInQuan(e)
	} else {
		dragend()
	}
}
</script>
<style lang="less" scoped>
@import url('./style/utils.less');
</style>
