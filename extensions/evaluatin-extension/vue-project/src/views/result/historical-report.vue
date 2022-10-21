<!--
 * @Date: 2022-03-10 14:28:30
 * @Description: 结果报告图表
-->
<template>
	<div style="padding: 40px 20px">
		<a-space>
			<dv-decoration-11 class="_action_btn" @click="$router.back()">返回</dv-decoration-11>
		</a-space>
		<div class="ju-sp">
			<dv-border-box-10 style="width: 100%; margin-right: 20px">
				<div style="padding: 20px">
					<div ref="lineRef" class="graph"></div>
				</div>
			</dv-border-box-10>
			<dv-border-box-10 style="width: 100%">
				<div style="padding: 20px">
					<div ref="radarRef" class="graph"></div>
				</div>
			</dv-border-box-10>
		</div>
		<dv-decoration-10 style="width: 100%; height: 5px; margin: 10px auto" />
		<div ref="barRef" class="graph" style="margin: 0px 20px"></div>
	</div>
</template>
<script lang="ts" setup>
// import { useEcharts } from '@/hooks/echarts'
import { useEcharts } from '../../hooks/echarts'
import { nextTick, onMounted, ref } from 'vue'

let radarOption = {
	//雷达
	backgroundColor: '',
	title: {
		text: '量子计算模拟能力',
		subtext: 'Quantum Simulation Capability Index (QSCI)'
	},
	legend: {
		data: ['Allocated Budget', 'Actual Spending']
	},
	radar: {
		indicator: [
			{ name: '并行', max: 24 },
			{ name: '网络In', max: 30720 },
			{ name: '网络Out', max: 102400 },
			{ name: '内存使用率', max: 100 },
			{ name: 'cpu使用率', max: 100 }
			//并行-网络In-网络Out-内存使用率-cpu使用率
		]
	},
	color: 'rgb(255,228,52)'
}

let barOption = {
	//柱状
	backgroundColor: '',
	title: {
		text: '量子计算模拟能力',
		subtext: 'Quantum Simulation Capability Index (QSCI)'
	},
	grid: {
		top: 150,
		left: 50,
		right: 50
	},
	xAxis: {
		type: 'category',
		data: ['cpu核数', '运行性能', '资源使用']
	},
	yAxis: {
		type: 'value',
		max: 2500,
		axisLine: {
			show: true
		}
	},
	legend: {
		top: 80,
		data: ['best', 'avg', 'yours']
	},
	series: [
		{
			name: 'best',
			data: [1, 0, 2000],
			type: 'bar',
			label: {
				show: true,
				color: '#fff',
				formatter: '{a}',
				position: 'top'
			}
		},
		{
			name: 'avg',
			data: [800, 0, 1500],
			type: 'bar',
			label: {
				show: true,
				color: '#fff',
				formatter: '{a}',
				position: 'top'
			}
		},
		{
			name: 'yours',
			data: [900, 0, 1700],
			type: 'bar',
			label: {
				show: true,
				color: '#fff',
				formatter: '{a}',
				position: 'top'
			}
		}
	]
}

let lineOption = {
	//折线
	backgroundColor: '',
	title: {
		text: '量子计算模拟能力',
		subtext: 'Quantum Simulation Capability Index (QSCI)'
	},

	legend: {
		data: ['CPU', 'MEMORY'],
		top: 80
	},
	grid: {
		left: '3%',
		right: '4%',
		bottom: '3%',
		top: '150',
		containLabel: true
	},
	toolbox: {
		feature: {
			saveAsImage: {}
		}
	},
	xAxis: {
		type: 'category',
		boundaryGap: false,
		data: ['5', '10', '15', '20', '25', '30']
	},
	yAxis: {
		type: 'value',
		axisLine: {
			show: true
		},
		name: '运行时间(ms)'
	},
	series: [
		{
			name: 'random',
			type: 'line',

			data: [24, 510, 4023, 32698, 243796, 445000]
		},
		{
			name: 'Shor',
			type: 'line',

			data: [600, 8000, 18023, 50000, 100000, 200000]
		}
	]
}
const lineRef = ref<HTMLElement>()
const barRef = ref<HTMLElement>()
const radarRef = ref<HTMLElement>()

// let getradarData = ref([])
onMounted(() => {
	nextTick(() => {
		let { myChart: lineChart } = useEcharts(lineRef.value, 'dark')
		lineChart.setOption(lineOption)
		let { myChart: barChart } = useEcharts(barRef.value, 'dark')
		barChart.setOption(barOption)
		let { myChart: radarChart } = useEcharts(radarRef.value, 'dark')
		radarChart.setOption(radarOption)
		window.onresize = () => {
			lineChart.resize()
			barChart.resize()
			radarChart.resize()
		}
	})
	const getInformation = window.sessionStorage.getItem('historical-report')

	lineOption = JSON.parse(getInformation).line.line

	barOption = JSON.parse(getInformation).bar.bar

	radarOption = Object.assign(radarOption, JSON.parse(getInformation).radar.radar)
})

defineExpose({})
</script>
<style lang="less" scoped>
.graph {
	height: 500px;
}
</style>
