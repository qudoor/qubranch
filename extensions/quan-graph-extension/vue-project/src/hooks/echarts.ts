/*
 * @Date: 2021-12-28 14:23:52
 * @Description: echarts的公共封装
 */
import * as echarts from 'echarts'
/**
 * @description: 初始化及使用echarts
 * @param {HTMLElement} el dom
 * @param {string} theme 主题
 * @return {*}
 */
function useEcharts(el: HTMLElement, theme?: string) {
	const myChart: any = echarts.init(el, theme)
	const MyOptions: any = {
		xAxis: {
			type: 'category',
			data: []
		},
		yAxis: {
			type: 'value'
		},
		series: [
			{
				data: [],
				type: 'bar'
			}
		]
	}

	/**
	 * @description: 设置并渲染echarts
	 * @param {*} options
	 * @param {HTMLElement} myChartREF
	 * @return {*}
	 */
	async function setOption(options: any) {
		myChart.setOption({ MyOptions, ...options }, true)
	}

	function resizeMychart() {
		myChart.resize()
	}

	return {
		myChart,
		/**设置options */
		setOption,

		/**重绘echart图表 */
		resizeMychart
	}
}

export { useEcharts }
