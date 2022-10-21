<!--
 * @Date: 2022-03-10 11:41:12
 * @Description: 测评结果详情
-->
<template>
  <div style="padding: 40px 20px">
    <a-table :columns="columns" :data-source="tableData"></a-table>
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'

const columns = [
  {
    title: '算法名称',
    dataIndex: 'name'
  },
  {
    title: '量子比特数',
    dataIndex: 'name'
  },
  {
    title: '纯/混合态',
    dataIndex: 'name'
  },
  {
    title: '量子门数量',
    dataIndex: 'name'
  },
  {
    title: '量子深度',
    dataIndex: 'name'
  },
  {
    title: '测试轮次',
    dataIndex: 'name'
  },
  {
    title: '编译用时',
    dataIndex: 'name'
  },
  {
    title: '运行用时',
    dataIndex: 'name'
  },
  {
    title: '线程数',
    dataIndex: 'name'
  },
  {
    title: 'cpu使用率',
    dataIndex: 'name'
  },
  {
    title: '内存使用率',
    dataIndex: 'name'
  },
  {
    title: '网络I/O',
    dataIndex: 'name'
  },
  {
    title: '操作',
    dataIndex: 'name'
  }
]
let tableData = ref([])
</script>
<style lang="less" scoped></style>
