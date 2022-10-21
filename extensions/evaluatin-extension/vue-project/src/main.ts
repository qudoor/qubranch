import { createApp } from 'vue'
import App from './App.vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.less'
import '@/style/utils.less'
import 'animate.css'
import dataV from '@jiaminghi/data-view'
import router from './router'
// import Vuex	from 'vuex'
export const vueApp = createApp(App)
export const vscode = acquireVsCodeApi()
window.addEventListener('message', e => {
	if (e.data.type === 'getMachineId') {
		localStorage.setItem('machineId', e.data.value.machineId)
	}
	if (e.data.type === 'getBoxapi') {
		sessionStorage.setItem('boxapi', e.data.value)
	}
	if (e.data.type === 'getOsType') {
		sessionStorage.setItem('osType', e.data.value)
	}
	if (e.data.type === 'getSlurmapi') {
		sessionStorage.setItem('slurmapi', e.data.value)
	}
	if (e.data.type === 'getSlurmApiList') {
		sessionStorage.setItem('slurmApiList', e.data.value)
	}
	if (e.data.type === 'getBoxApiList') {
		sessionStorage.setItem('boxApiList', e.data.value)
	}
})
;['getMachineId', 'getBoxapi', 'getOsType', 'getSlurmapi'].forEach(type => {
	vscode.postMessage({
		type
	})
})

vueApp.use(Antd)
vueApp.use(dataV)
vueApp.use(router)
vueApp.mount('#app')
