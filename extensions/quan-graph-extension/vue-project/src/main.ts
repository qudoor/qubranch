import { createApp } from 'vue'
import App from './App.vue'
import 'ant-design-vue/dist/antd.less'
import './style/utils.less'
createApp(App).mount('#app')

//因为acquireVsCodeApi每个会话只能定义一次，故在此定义
let vscode
;(function () {
	vscode = acquireVsCodeApi()
})()
export { vscode }
