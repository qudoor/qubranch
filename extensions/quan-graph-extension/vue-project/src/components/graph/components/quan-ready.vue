<!--
 * @Date: 2022-04-08 16:40:51
 * @Description: 准备选择的icon
-->
<template>
	<g>
		<rect
			width="32"
			:height="height"
			transform="translate(0,0)"
			style="fill: transparent; stroke-width: 1; stroke: #aaa"
			stroke-dasharray="2 2"
		></rect>
		<rect width="24" :height="height - 8" style="fill: #cdcdcd" transform="translate(4,4)"></rect>
	</g>
</template>
<script setup lang="ts">
interface propsINF {
	height: number
}
defineProps<propsINF>()
</script>
