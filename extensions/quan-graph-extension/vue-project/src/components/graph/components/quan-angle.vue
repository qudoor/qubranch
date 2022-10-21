<!--
 * @Date: 2022-04-28 11:35:55
 * @Description: 拥有角度的门
-->
<template>
	<g>
		<g class="control">
			<g v-if="value?.ctrl?.length > 0" class="control-line">
				<line
					x1="16"
					y1="21"
					x2="16"
					:y2="`${40 * props.value.span - 20}`"
					style="stroke-width: 3; stroke:  #002d9c"
				></line>
			</g>
			<g
				v-for="reCtrlItem in value.readyCtrl || []"
				:key="reCtrlItem"
				:transform="`translate(16,${15 + 40 * (reCtrlItem - positionY)})`"
				class="control-dots"
				@mousedown.stop="fixCtrl(reCtrlItem)"
			>
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
				<circle r="6" cx="0" cy="0" style="fill: #002d9c; opacity: 0.6" class="dots"></circle>
			</g>
			<g
				v-for="ctrlItem in value.ctrl"
				:key="ctrlItem"
				:transform="`translate(16,${15 + 40 * (ctrlItem - positionY)})`"
				class="control-dots"
				@mousedown.stop="ctrlDown"
			>
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
				<circle r="6" cx="0" cy="0" style="fill: #002d9c" class="dots"></circle>
			</g>
		</g>
		<g :transform="`translate(0,${!value.quanPosition ? 0 : 40 * (value.quanPosition - positionY)})`">
			<rect width="32" height="32" :style="{ fill: value?.ctrl?.length > 0 ? `#002d9c` : `#fa4d56` }"></rect>
			<text
				dominant-baseline="alphabetical"
				x="16"
				:y="value.angle ? 16 : 22"
				style="font-size: 18px; font-style: normal; font-weight: normal"
				:style="{ fill: value?.ctrl?.length > 0 ? `#fff` : `#000` }"
			>
				<tspan text-anchor="middle">{{ value.name }}</tspan>
			</text>
			<text
				v-if="value?.angle"
				x="16"
				y="25"
				style="font-size: 7px; font-style: normal; font-weight: normal"
				:style="{ fill: value?.ctrl?.length > 0 ? `#fff` : `#000` }"
			>
				<tspan text-anchor="middle">({{ value.angle }})</tspan>
			</text>
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
function fixCtrl(idx: number) {
	let quanValue = { ...props.value }
	let activeQuanValue = { ...props.value }
	activeQuanValue.readyCtrl = []
	activeQuanValue.canHasCtrl = false
	activeQuanValue.ctrl = [idx]
	let quanMin = Math.min(...[idx, quanValue.quanPosition])
	let quanMax = Math.max(...[idx, quanValue.quanPosition])
	activeQuanValue.span = quanMax - quanMin + 1

	emit('ctrlChange', activeQuanValue, props.positionX, quanMin, props.positionY, quanValue.span)
}

function init() {
	let quanValue = { ...props.value }

	if (quanValue.quanPosition === undefined) {
		quanValue.quanPosition = props.positionY
	} else if (quanValue?.ctrl?.length > 0) {
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
