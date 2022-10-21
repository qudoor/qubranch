/*
 * @Date: 2022-03-22 17:11:11
 * @Description:
 */
import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createMemoryHistory } from 'vue-router'
import RunIndex from '@/views/run/index.vue'
import ResultReport from '@/views/result/report.vue'
import ResultList from '@/views/result/list.vue'

import HistoricalReport from '@/views/result/historical-report.vue'
import TaskList from '@/views/task/list.vue'
import ResultHardwareTable from '@/views/result/hardware-table.vue'
import RevalCharts from '@/views/reval-charts/index.vue'

const routes: Array<RouteRecordRaw> = [
	{
		path: '/',
		component: RunIndex
	},
	{
		path: '/result/report',
		component: ResultReport
	},
	{
		path: '/result/list',
		component: ResultList
	},
	{
		path: '/task/list',
		component: TaskList
	},
	{
		path: '/result/hardware_table',
		component: ResultHardwareTable
	},
	{
		path: '/reval_charts/index',
		name: 'RevalCharts',
		component: RevalCharts
	},
	{
		path: '/result/historical_report',
		component: HistoricalReport
	}
]

const router = createRouter({
	history: createMemoryHistory(),
	routes
})

export default router
