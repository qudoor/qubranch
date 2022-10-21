<!--
 * @Date: 2022-04-18 13:57:52
 * @Description: Toffoli
-->
<template>
	<g v-bind="$attrs">
		

		<g class="control">
			<g class="control-line">
				<line
					x1="16"
					y1="21"
					x2="16"
					:y2="`${40 * (props.value.span - 1) + 18}`"
					style="stroke-width: 3; stroke: #002d9c"
				></line>
			</g>
			<g
				class="control-dots"
				:transform="`translate(16,${
					value.ctrl[0] === undefined ? 15 : 40 * (value.ctrl[0] - positionY) + 15
				})`"
				@mousedown.stop="ctrlDown(0)"
			>
				<g>
					<circle
						r="10"
						cx="0"
						cy="0"
						fill="transparent"
						stroke-width="1"
						stroke="#aaa"
						stroke-dasharray="2 2"
						class="dots-pd"
					></circle>
					<circle r="6" cx="0" cy="0" style="fill: #002d9c; opacity: 1" class="dots"></circle>
				</g>
			</g>
			<g
				class="control-dots"
				:transform="`translate(16,${
					value.ctrl[1] === undefined ? 55 : 40 * (value.ctrl[1] - positionY) + 15
				})`"
				@mousedown.stop="ctrlDown(1)"
			>
				<g>
					<circle
						r="10"
						cx="0"
						cy="0"
						fill="transparent"
						stroke-width="1"
						stroke="#aaa"
						stroke-dasharray="2 2"
						class="dots-pd"
					></circle>
					<circle r="6" cx="0" cy="0" style="fill: #002d9c; opacity: 1" class="dots"></circle>
				</g>
			</g>
		</g>
		<g :transform="`translate(0,${!value.quanPosition ? 0 : 40 * (value.quanPosition - positionY)})`">
			<circle cx="16" cy="16" r="16" style="fill: #002d9c"></circle>
			<path
				transform="translate(16, 16) scale(0.8)"
				d="M1.1-1.2v-9.4h-2.2v9.4h-8.8v2.4h8.8v9.4h2.2V1.2h8.8v-2.4H1.1z"
				fill=" #ffffff"
			></path>
		</g>
	</g>
</template>
<script lang="ts" setup>
import { watch } from 'vue'
interface propsINF {
	graphMoveY: number
	mouseUp: boolean //鼠标是否移起
	value: any
	positionY: number
	positionX: number
	quanGround: any
}
const props = defineProps<propsINF>()

interface emitINF {
	(e: 'update:value', value: any): void
	(
		e: 'ctrlChange',
		myActiveQuan: any,
		nowXIndex: number,
		nowYIndex: number,
		oldYIndex: number,
		oldSpan: number
	): void
	(e: 'update:mouseUp', bol: boolean): void
}
const emit = defineEmits<emitINF>()

watch(
	() => props.mouseUp,
	newValue => {
		if (newValue) {
			let quanValue = { ...props.value }
			quanValue.myMouseDown = !newValue
			emit('update:value', quanValue)
		}
	}
)

watch(
	() => props.graphMoveY,
	newValue => {
		if (props.value.myMouseDown) {
			let quanValue = { ...props.value }
			let activeCtrl = props.value.ctrl[activeCtrlIdx] === Math.min(...props.value.ctrl) ? 'min' : 'max'
			let y = Math.floor(newValue / 39) - 1
			let maxy = props.quanGround.length - 1
			let myActiveQuan = { ...props.value }
			const ctrlMinIdx = Math.min(...quanValue.ctrl) === quanValue.ctrl[0] ? 0 : 1
			const ctrlMaxIdx = ctrlMinIdx === 0 ? 1 : 0
			const ctrl = myActiveQuan.ctrl
			y = y <= 0 ? 0 : y >= maxy ? maxy : y
			if (![...quanValue.ctrl, quanValue.quanPosition].includes(y)) {
				if (activeCtrl === 'min') {
					if (y === ctrl[ctrlMaxIdx] && ctrl[ctrlMaxIdx] < quanValue.quanPosition) {
						ctrl[ctrlMaxIdx] = ctrl[ctrlMaxIdx] + 1
						ctrl[ctrlMinIdx] = y
					}
					ctrl[ctrlMinIdx] = y
				} else {
					if (y === ctrl[ctrlMinIdx] && ctrl[ctrlMinIdx] > 0) {
						ctrl[ctrlMinIdx] = ctrl[ctrlMinIdx] - 1
						ctrl[ctrlMaxIdx] = y
					} else {
						ctrl[ctrlMaxIdx] = y
					}
				}

				myActiveQuan.ctrl = ctrl
				myActiveQuan.span =
					Math.max(...[...quanValue.ctrl, quanValue.quanPosition]) -
					Math.min(...[...quanValue.ctrl, quanValue.quanPosition]) +
					1

				emit('update:value', quanValue)
				emit(
					'ctrlChange',
					myActiveQuan,
					props.positionX,
					Math.min(...[...quanValue.ctrl, quanValue.quanPosition]),
					props.positionY,
					props.value.span
				)
			}
		}
	}
)

let activeCtrlIdx = 0
function ctrlDown(index) {
	activeCtrlIdx = index

	let quanValue = { ...props.value }
	quanValue.myMouseDown = true
	emit('update:value', quanValue)
	emit('update:mouseUp', false)
}

function init() {
	let quanValue = { ...props.value }

	if (props.value.quanPosition === undefined) {
		quanValue.ctrl = [props.positionY, props.positionY + 1]
		quanValue.quanPosition = quanValue.ctrl[1] + 1 //除了控制位外，门的位置
	} else {
		const limit = props.positionY - Math.min(...[...quanValue.ctrl, quanValue.quanPosition])
		quanValue.ctrl = [quanValue.ctrl[0] + limit, quanValue.ctrl[1] + limit]
		quanValue.quanPosition = quanValue.quanPosition + limit
	}
	emit('update:value', quanValue)
}
init()
</script>
<style lang="less" scoped>
.control-dots {
	.dots-pd {
		display: none;
	}
	&:hover {
		.dots-pd {
			display: block;
		}
	}
}
.dots {
	cursor: pointer;
	&:active {
		cursor: grabbing;
	}
}
</style>
