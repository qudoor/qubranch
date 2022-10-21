<!--
 * @Date: 2022-04-18 10:45:56
 * @Description: 坐标轴（量子比特）
-->

<template>
	<g>
		<!-- 坐标轴 -->
		<g v-for="item in yAxios" :key="item">
			<g :transform="`translate(50, ${standard[1] * item})`">
				<line
					x1="0"
					:x2="innerWidth"
					y1="0"
					y2="0"
					fill="none"
					style="stroke: #e0e0e0; stroke-width: 1; stroke-linecap: round"
				></line>
			</g>
		</g>

		<g :transform="`translate(50, ${(yAxios + 1) * standard[1] + 20})`">
			<line
				data-v-f1b7b9f8=""
				x1="0"
				:x2="innerWidth"
				y1="-4"
				y2="-4"
				fill="none"
				style="stroke: var(--cds-ui-03, #e0e0e0); stroke-width: 1; stroke-linecap: round"
			></line>
			<line
				data-v-f1b7b9f8=""
				x1="0"
				:x2="innerWidth"
				y1="0"
				y2="0"
				fill="none"
				style="stroke: var(--cds-ui-03, #e0e0e0); stroke-width: 1; stroke-linecap: round"
			></line>
		</g>
	</g>
</template>
<script lang="ts" setup>
interface propsINF {
	yAxios: number
	standard: [number, number]

	innerWidth: number
}
defineProps<propsINF>()
</script>
