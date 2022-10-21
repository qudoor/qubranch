<!--
 * @Date: 2022-04-08 14:57:57
 * @Description: CNOT
-->
<template>
	<g v-bind="$attrs">


		<g class="control">
			<g class="control-line">
				<line
					x1="16"
					y1="21"
					x2="16"
					:y2="`${40 * props.value.span - 20}`"
					style="stroke-width: 3; stroke:  #002d9c"
				></line>
			</g>
			<g
				class="control-dots"
				:transform="`translate(16,${15 + 40 * (value.ctrl[0] - positionY)})`"
				@mousedown.stop="ctrlDown"
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

			let y = Math.floor(newValue / 39) - 1
			let maxy = props.quanGround.length - 1
			let myActiveQuan = { ctrl: [], ...props.value }
			let ctrl = quanValue.ctrl[0]

			y = y <= 0 ? 0 : y >= maxy ? maxy : y

			if (y === quanValue.quanPosition) {
				y = ctrl
			}
			ctrl = y
			myActiveQuan.ctrl = [y]
			let quanMin = Math.min(...[ctrl, quanValue.quanPosition])
			let quanMax = Math.max(...[ctrl, quanValue.quanPosition])
			myActiveQuan.span = quanMax - quanMin + 1

			emit('update:value', myActiveQuan)

			emit('ctrlChange', myActiveQuan, props.positionX, quanMin, props.positionY, quanValue.span)
		}
	}
)

function ctrlDown() {
	let quanValue = { ...props.value }
	quanValue.myMouseDown = true
	emit('update:value', quanValue)

	emit('update:mouseUp', false)
}

function init() {
	let quanValue = { ...props.value }

	if (quanValue.quanPosition === undefined) {
		quanValue.ctrl = [props.positionY]
		quanValue.quanPosition = quanValue.ctrl[0] + 1
	} else {
		const limit = props.positionY - Math.min(...[...quanValue.ctrl, quanValue.quanPosition])
		quanValue.quanPosition = quanValue.quanPosition + limit
		quanValue.ctrl = [quanValue.ctrl[0] + limit]
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
}
</style>
