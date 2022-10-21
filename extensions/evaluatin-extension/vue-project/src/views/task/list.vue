<!--
 * @Date: 2022-03-25 10:19:52
 * @Description: 任务结果页
-->
<template>
  <div style="padding: 40px 20px">
    <div class="ju-sp align-center">
      <dv-decoration-11 class="_action_btn" @click="$router.push('/')">重新测评</dv-decoration-11>
      <a-select
        v-if="modelType !== 'single'"
        v-model:value="activeIp"
        style="width: 150px"
        placeholder="请选择测评设备"
        :disabled="tableLoading"
        @change="activeChange"
      >
        <a-select-option v-for="item in ipList" :key="item">{{ item }}</a-select-option>
      </a-select>
    </div>

    <a-table
      :columns="columns"
      :data-source="tableData"
      style="margin-top: 10px"
      bordered
      :loading="tableLoading"
    >
      <template #bodyCell="{ column, record }">
        <div v-if="column.dataIndex === 'actions'" class="align-center">
          <a-button
            type="link"
            :disabled="record.status !== '任务已完成'"
            @click="GoTo('/result/list', record)"
          >
            详情
          </a-button>

          <template v-if="modelType !== 'colonySlurm'">
            <a-button
              type="link"
              :disabled="record.status !== '任务已完成'"
              @click="GoTo('/result/report', record)"
            >
              报告
            </a-button>

            <a-button
              type="link"
              :disabled="record.status !== '任务已完成'"
              @click="GoTo('/result/hardware_table', record)"
            >
              硬件信息
            </a-button>
          </template>
        </div>
      </template>
    </a-table>
  </div>
</template>
<script lang="ts" setup>
import { ref, onUnmounted } from 'vue'
import { Info } from '@/hooks/tools-class'
import { useRouter, useRoute } from 'vue-router'
import { vscode } from '@/main'
const columns = [
  {
    title: '任务名称',
    dataIndex: 'job'
  },
  {
    title: '测评状态',
    dataIndex: 'status'
  },
  {
    title: '任务开始时间',
    dataIndex: 'time'
  },
  {
    title: '提交时间',
    dataIndex: 'time'
  },
  {
    title: '操作',
    dataIndex: 'actions',
    width: 200
  }
]
let tableData = ref([])
let tableLoading = ref(true)
const router = useRouter()
const route = useRoute()
const modelType = route.query.modelType
let timeOut
let activeIp = ref('') //当前选中的远程设备
let ipList = ref([]) //当前模式下的远程设备
async function isBox() {
  try {
    const InfoClass = new Info()
    const data = await InfoClass.getJobListBox()
    tableData.value = data
    timeOut = setTimeout(() => {
      isBox()
    }, 3000)
  } catch (err) {
    clearTimeout(timeOut)
  } finally {
    tableLoading.value = false
  }
}
async function isHpc() {
  try {
    const InfoClass = new Info()
    const data = await InfoClass.getJobListHpc()
    tableData.value = data

    timeOut = setTimeout(() => {
      isHpc()
    }, 3000)
  } catch (err) {
    clearTimeout(timeOut)
  } finally {
    tableLoading.value = false
  }
}
const osType = sessionStorage.getItem('osType')
//windows版本
function isLocalPC() {
  tableLoading.value = true
  // if (osType === 'Darwin') {
  vscode.postMessage({
    type: osType === 'Darwin' ? 'getJobListSingleMac' : 'getJobListSingleWin'
  })
  // }
  window.addEventListener('message', messageChange)
}
function messageChange({ data }) {
  const { type, value } = data
  if (type === 'getJobListSingleMac' || type === 'getJobListSingleWin') {
    tableData.value = value
    tableLoading.value = false
  }
}

if (modelType === 'single') {
  isLocalPC()
} else if (modelType === 'colonyBox') {
  ipList.value = JSON.parse(sessionStorage.getItem('boxApiList'))
  activeIp.value = sessionStorage.getItem('boxapi')
  activeIp
  isBox()
} else if (modelType === 'colonySlurm') {
  ipList.value = JSON.parse(sessionStorage.getItem('slurmApiList'))
  activeIp.value = sessionStorage.getItem('slurmapi')
  isHpc()
}

function GoTo(path, record) {
  router.push({
    path,
    query: {
      tag: record.tag,
      job: record.job,
      modelType
    }
  })
}

//选择的设备变更
function activeChange(ip) {
  sessionStorage.setItem(modelType === 'colonyBox' ? 'boxapi' : 'slurmapi', ip)
  tableData.value = []
  tableLoading.value = true
  clearTimeout(timeOut)
  if (modelType === 'colonyBox') {
    isBox()
  } else {
    isHpc()
  }
}
onUnmounted(() => {
  clearTimeout(timeOut)
})
</script>
<style lang="less" scoped></style>
