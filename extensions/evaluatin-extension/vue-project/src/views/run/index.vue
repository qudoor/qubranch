<!--
 * @Date: 2022-03-11 14:44:01
 * @Description: 启动页面
-->
<template>
	<div class="ju-center align-center" style="min-height: 100vh">
		<dv-border-box1 style="width: 80vw; min-width: 1200px; max-width: 1700px; position: relative">
			<div style="padding: 8px">
				<div class="main">
					<div class="main-tab" @click="modeChange">
						<dv-decoration-11 style="width: 200px; height: 60px">
							切换至{{ modeType === 'single' ? '远程模式' : '本机模式' }}
						</dv-decoration-11>
						<!-- <dv-decoration-11 class="_action_btn" @click="$router.push('/result/historical_evaluation')" v-if="modeType === 'single'">查看历史评测</dv-decoration-11> -->
					</div>
					<div class="ju-sp align-center" style="width: 1000px">
						<transition
							mode="out-in"
							enter-active-class="animate__animated animate__fadeInLeft animate__faster"
							leave-active-class="animate__animated animate__fadeOutLeft animate__faster"
						>
							<single-main
								v-if="modeType === 'single'"
								ref="inputRef"
								@changeEvent="changeEvent"
							></single-main>
							<colony-main v-else ref="colonyRef"></colony-main>
						</transition>

						<div class="left align-center">
							<transition
								mode="out-in"
								enter-active-class="animate__animated animate__zoomIn animate__faster"
								leave-active-class="animate__animated animate__zoomOut animate__faster"
							>
								<div :key="modeType">
									<h1 class="left-title">{{ modeType === 'single' ? '本机模式' : '远程模式' }}</h1>

									<p class="left-remark">欢迎使用启科测评系统</p>
								</div>
							</transition>

							<dv-decoration-9
								style="width: 200px; height: 200px; cursor: pointer; margin-top: 50px"
								@click="run"
							>
								<div class="btn">开始</div>
							</dv-decoration-9>
						</div>
					</div>
				</div>
			</div>
			<div class="go-task" @click="routerPush(modeType)">
				<dv-decoration-11 style="width: 200px; height: 60px">任务管理</dv-decoration-11>
			</div>
		</dv-border-box1>
		<door :visible="doorVis"></door>
	</div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SingleMain from './components/single-main.vue'
import ColonyMain from './components/colony-main.vue'
import Door from '@/components/dataV/door.vue'
import { Run } from '@/hooks/tools-class.ts'
import { vscode } from '@/main'

const router = useRouter()
let modeType = ref('single')
let doorVis = ref(false)
function modeChange() {
	modeType.value = modeType.value === 'single' ? 'colony' : 'single'
}
let inputRef = ref()
let colonyRef = ref()

function routerPush(type) {
	if (type === 'single') {
		// const osType = sessionStorage.getItem('osType')
		// if (osType === 'Darwin') {
		router.push({ path: '/task/list', query: { modelType: type } })
		return
		// }
		// router.push('/result/historical_evaluation')
	} else {
		colonyRef.value.GoTask()
	}
}

async function run() {
	// eslint-disable-next-line no-undef
	// let vscode = acquireVsCodeApi()
	//发送消息到vscode
	// eslint-disable-next-line no-undef
	if (modeType.value === 'colony') {
		colonyRef.value.run(e => {
			doorVis.value = e
		})
		return
	}
	if (modeType.value === 'single') {
		const osType = sessionStorage.getItem('osType')
		const formData = await inputRef.value.run()
		doorVis.value = true
		const { user_id: round, department_id: step, ss: algo, name: job } = formData
		if (osType === 'Darwin') {
			const RunClass = new Run()
			RunClass.runSingleMac(formData)
			vscode.postMessage({
				type: 'runSingleMac',
				value: {
					round,
					step,
					algo,
					job
				}
			})
			return
		} else {
			const RunClass = new Run()
			RunClass.runSingleWin(formData)
			vscode.postMessage({
				type: 'runSingleWin',
				value: {
					round,
					step,
					algo,
					job
				}
			})
			return
		}
	}

	const osType = sessionStorage.getItem('osType')
	if (osType === 'Darwin') {
		const formData = await inputRef.value.run()
		doorVis.value = true
		const { user_id: round, department_id: step, ss: algo, name: job } = formData
		const RunClass = new Run()
		RunClass.runSingleMac(formData)
		vscode.postMessage({
			type: 'runSingleMac',
			value: {
				round,
				step,
				algo,
				job
			}
		})
		return
	}
}

defineExpose({})
</script>

<style lang="less" scope>
.main {
	min-height: 700px;
	height: 80vh;
	border-radius: 20px;
	box-sizing: border-box;
	background: rgba(255, 255, 255, 0.15);
	position: relative;

	display: flex;
	justify-content: center;

	&-tab {
		position: absolute;
		top: 30px;
		right: 30px;
		cursor: pointer;
	}
}
.left {
	width: 400px;
	flex-direction: column;
	color: rgba(255, 255, 255, 0.75);
	&-remark {
		font-size: 18px;
	}
	&-title {
		text-shadow: 0 0 10px cyan;
		font-size: 36px;
		letter-spacing: 5px;
		font-weight: bold;
		transform: translateZ(5px);
	}
}
.btn {
	font-size: 32px;
	font-weight: bold;
	user-select: none;
}
.go-task {
	position: absolute;
	right: 30px;
	bottom: 30px;
	cursor: pointer;
}
</style>
