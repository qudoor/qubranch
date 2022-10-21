import { message } from 'ant-design-vue'
import axios from 'axios'

function useRequest(
	baseURL?: string,
	extend?: {
		messageClose: boolean | undefined //不展示错误message
	}
) {
	const request = axios.create({
		baseURL: baseURL || `http://${sessionStorage.getItem('boxapi')}:21568`,
		timeout: 50000 // 设置默认的请求超时时间
	})

	// 请求拦截器
	request.interceptors.request.use(
		(config: any) => {
			config.headers = {
				'Content-Type': config.headers['Content-Type'],
				userId: localStorage.getItem('machineId')
			}

			return config
		},
		error => {
			return Promise.reject(error)
		}
	)
	request.interceptors.response.use(
		(response: any) => {
			response = response.data
			return response
		},
		error => {
			if (!extend?.messageClose) {
				if (error.code === 'ERR_NETWORK') {
					message.error('连接不上远程box，请重新开始测评或稍后重试')
				}
			}

			return Promise.reject(error)
		}
	)
	return request
}

export default useRequest
