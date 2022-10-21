<!--
 * @Date: 2022-05-07 09:01:25
 * @Description: cpu详情
-->
<template>
  <a-tabs v-model:activeKey="activeKey">
    <a-tab-pane v-for="(hardwareItem, modular) in detailData" :key="modular" :tab="modular">
      <div class="list">
        <a-descriptions bordered :column="2">
          <a-descriptions-item v-for="(item, key) in hardwareItem" :key="key" :label="key">
            {{ item }}
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-tab-pane>
  </a-tabs>
</template>
<script lang="ts" setup>
interface propsINF {
  detailData: any
}

defineProps<propsINF>()
</script>
<style lang="less" scoped>
.list {
  max-height: 40vh;
  overflow-y: auto;
}
</style>
