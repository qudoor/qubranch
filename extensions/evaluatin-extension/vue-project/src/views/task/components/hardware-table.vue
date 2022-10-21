<!--
 * @Date: 2022-03-25 11:38:41
 * @Description: 硬件数据列表
-->
<template>
  <div style="padding: 40px 20px">
    <a-table :columns="columns" :data-source="tableData" style="margin-top: 10px" bordered></a-table>
  </div>
</template>
<script lang="ts" setup>
import { ref } from 'vue'

const columns = [
  {
    title: 'IP'
  },
  {
    title: 'OS',
    dataIndex: 'name',
    children: [
      {
        title: '名称'
      },
      {
        title: '位'
      }
    ]
  },
  {
    title: 'CPU',
    dataIndex: 'name',
    children: [
      {
        title: '规格型号'
      },
      {
        title: '主频'
      },
      {
        title: '核心数'
      },
      {
        title: '线程数'
      },
      {
        title: 'L1Cache'
      },
      {
        title: 'L2Cache'
      },
      {
        title: '指令集'
      }
    ]
  },
  {
    title: 'GPU',
    dataIndex: 'name',
    children: [
      {
        title: '型号'
      },
      {
        title: '算力'
      },
      {
        title: '主频'
      },
      {
        title: 'SM数'
      },
      {
        title: '共享内存'
      },
      {
        title: 'L2Cache'
      }
    ]
  },
  {
    title: '内存',
    dataIndex: 'name',
    children: [
      {
        title: '类型'
      },
      {
        title: '通道数'
      },
      {
        title: '大小'
      },
      {
        title: '频率'
      }
    ]
  },
  {
    title: '网络I/O',
    dataIndex: 'name'
  },
  {
    title: '磁盘I/O',
    dataIndex: 'name'
  }
]
let tableData = ref([])
</script>
<style lang="less" scoped></style>
