<!--
 * @Date: 2022-03-25 11:38:41
 * @Description: 硬件数据列表
-->
<template>
  <div style="padding: 40px 20px">
    <a-space>
      <dv-decoration-11 class="_action_btn" @click="$router.back()">返回</dv-decoration-11>
      <dv-decoration-11 class="_action_btn" @click="$router.push('/')">重新测评</dv-decoration-11>
    </a-space>

    <a-table
      :columns="columns"
      :data-source="getFormData"
      style="margin-top: 10px"
      bordered
      :scroll="{ x: 3500 }"
      :loading="tableLoading"
    >
      <template #bodyCell="{ column, record }">
        <a v-if="column.key === 'actions'" @click="showHardwareDetail(record)">硬件详情</a>
      </template>
    </a-table>
    <a-modal v-model:visible="detailVis" title="硬件详情" width="800px">
      <hardware-detail :detail-data="detailData"></hardware-detail>
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import HardwareDetail from './components/hardware-detail.vue'
import { Info } from '@/hooks/tools-class'
import { useRoute } from 'vue-router'
import { hardwareTableColumn } from './base-data/utils'
import { vscode } from '@/main'
const route = useRoute()
const osType = sessionStorage.getItem('osType')
const modelType: string = route.query.modelType as string
const columns = hardwareTableColumn[osType === 'Darwin' && modelType === 'single' ? 'singleMac' : modelType]
let getFormData = ref([])
let detailVis = ref(false)
let tableLoading = ref(true)
let detailData = ref({})
//展示硬件详情
function showHardwareDetail(record) {
  detailVis.value = true
  detailData.value = record
}

//本地模式获取硬件信息
function isLocalPC() {
  window.addEventListener('message', e => {
    const { type, value } = e.data

    if (type === 'getHardwareInfo' || type === 'getHardwareInfoSingleMac') {
      tableLoading.value = false
      getFormData.value = value
    }
  })
  vscode.postMessage({
    type: osType === 'Darwin' ? 'getHardwareInfoSingleMac' : 'getHardwareInfo'
  })
}

//box模式下硬件数据
async function isBox() {
  tableLoading.value = true
  const infoClass = new Info()
  const data = await infoClass.getHardwareInfoBox()
  getFormData.value = data
  tableLoading.value = false
}
if (route.query.modelType === 'single') {
  isLocalPC()
} else if (route.query.modelType === 'colonyBox') {
  isBox()
}
</script>

<style lang="less" scoped></style>
