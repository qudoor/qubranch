/*
 * @Description:结果模块接口
 */

import useRequest from '@/hooks/request'
const myrequest = () => {
	return { request: useRequest(`http://${sessionStorage.getItem('boxapi')}:21568`) }
}
const slurmrequest = () => {
	return { request: useRequest(`http://${sessionStorage.getItem('slurmapi')}:21568`) }
}

/**
 * @description: 获取硬件详情
 */
export const apiGetInfo = (id: string | number) => myrequest().request.get(`/get_info/${id}`)

/**
 * @description: 开始测评
 */
export const apiPostStartJob = (params: any) => myrequest().request.post('/start_job', {}, { params })

/**
 * @description: 获取测评结果
 */
export const apiGetResult = (params: any) => myrequest().request.get('/get_result', { params })

/**
 * @description: 获取任务列表
 */
export const apiGetTask = () => myrequest().request.get('/get_task')

/**
 * @description: slurm执行任务
 */
export const apiSlurmPostStartJob = (params: any) => slurmrequest().request.post('/start_job', {}, { params })

/**
 * @description: slurm获取测评结果
 */
export const apiGetSlurmResult = (params: any) => slurmrequest().request.get('/get_result', { params })

/**
 * @description: slurm获取任务列表
 */
export const apiSlurmGetTask = () => slurmrequest().request.get('/get_task')
