<!--
 * @Date: 2022-03-10 11:41:12
 * @Description: 测评结果详情
-->
<template>
  <div style="padding: 40px 20px">
    <a-space>
      <dv-decoration-11 class="_action_btn" @click="$router.push('/')">重新测评</dv-decoration-11>
      <dv-decoration-11
        v-if="modelType !== 'colonySlurm'"
        class="_action_btn"
        @click="$router.push({ path: '/result/report', query: $route.query })"
      >
        详细报告
      </dv-decoration-11>
      <dv-decoration-11
        v-if="modelType !== 'colonySlurm'"
        class="_action_btn"
        @click="$router.push({ path: '/result/hardware_table', query: $route.query })"
      >
        硬件信息
      </dv-decoration-11>
    </a-space>
    <a-table
      :columns="resultListColumn[modelType === 'single' ? 'colonyBox' : modelType]"
      :data-source="tableData"
      style="margin-top: 10px"
      bordered
      :loading="tableLoading"
    ></a-table>
  </div>
</template>
<script lang="ts" setup>
import { ref, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Info } from '@/hooks/tools-class'
import { resultListColumn } from './base-data/utils'
import { vscode } from '@/main'
const route = useRoute()

let tableData = ref([])
let tableLoading = ref(false)
const modelType = route.query.modelType

const { getJobInfoSingleMac } = new Info()
function messageChange(event) {
  const { type, value } = event.data
  if (type === 'getJobResultSingleMac' || type === 'getJobResultSingleWin') {
    tableData.value = getJobInfoSingleMac(value)
    tableLoading.value = false
  }
}

//本地版本
function isLocalPC() {
  tableLoading.value = true
  window.addEventListener('message', messageChange)
  if (sessionStorage.getItem('osType') !== 'Darwin') {
    const { tag, job } = route.query
    vscode.postMessage({
      type: 'getJobResultSingleWin',
      value: {
        tag,
        job
      }
    })
  } else {
    const { tag, job } = route.query
    vscode.postMessage({
      type: 'getJobResultSingleMac',

      value: {
        tag,
        job
      }
    })
  }
}

//box（arm）版本
async function isBox() {
  const { tag, job } = route.query
  tableLoading.value = true
  const infoClass = new Info()
  const data = await infoClass.getJobInfoBox({ tag, job })
  tableData.value = data
  tableLoading.value = false
}

async function isHpc() {
  const { tag, job } = route.query
  tableLoading.value = true
  const infoClass = new Info()
  const data = await infoClass.getJobInfoHpc({ tag, job })
  tableData.value = data
  tableLoading.value = false
}

if (modelType === 'single') {
  isLocalPC()
} else if (modelType === 'colonyBox') {
  isBox()
} else if (modelType === 'colonySlurm') {
  isHpc()
}

onUnmounted(() => {
  window.removeEventListener('message', messageChange)
})
</script>
<style lang="less" scoped></style>
