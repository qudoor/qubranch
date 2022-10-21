<!--
 * @Date: 2022-04-19 15:31:00
 * @Description: 量子状态柱状统计图
-->
<template>
	<div ref="basisChartRef"></div>
</template>
<script lang="ts" setup>
import { useEcharts } from '@/hooks/echarts'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import { nextTick, onMounted, ref } from 'vue'
const basisChartRef = ref()
let options: EChartsOption = {
	tooltip: {
		trigger: 'axis',
		axisPointer: {
			type: 'shadow'
		}
	},
	grid: {
		right: 50,
		left: 10,
		top: 50,
		bottom: 20,
		containLabel: true
	},
	backgroundColor: '',
	xAxis: [
		{
			type: 'category',
			data: [],
			name: '量子态'
		}
	],
	yAxis: [
		{
			type: 'value',
			name: '概率(%)',
			max: 100
		}
	],
	series: [
		{
			data: [],
			type: 'bar',
			itemStyle: {
				color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
					{ offset: 0, color: '#83bff6' },
					{ offset: 0.5, color: '#188df0' },
					{ offset: 1, color: '#188df0' }
				])
			}
		}
	]
}
let myEcharts

onMounted(() => {
	nextTick(() => {
		const { myChart } = useEcharts(basisChartRef.value, 'dark')
		myEcharts = myChart
	})
})

interface resultDataINF {
	probs: {
		[key: string]: {
			probability: number
			angle: string
		}
	}
}
function setOption(resultData: resultDataINF) {
	options.xAxis[0].data = Object.keys(resultData.probs)
	options.series[0].data = Object.values(resultData.probs).map(item => {
		return item.probability * 100
	})

	myEcharts.setOption(options, true)
}
function resizeEcharts() {
	myEcharts.resize()
}

defineExpose({
	setOption,
	resizeEcharts,
	myEcharts: () => {
		return myEcharts
	}
})
</script>
