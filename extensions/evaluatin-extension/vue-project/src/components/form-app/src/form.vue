<!--
 * @Date: 2021-12-15 10:39:44
 * @Description: 共用表单
-->
<template>
  <a-form ref="formRef" :model="comFormData" :rules="formRules" v-bind="formProps">
    <a-row :gutter="[20, 0]">
      <a-col v-for="item in schemas" :key="item.field" :span="24" v-bind="item.colProps">
        <a-form-item :name="item.field" v-bind="item.formItemProps" :label="item.label">
          <slot v-if="item.slot" :name="item.slot" :record="formData"></slot>
          <component
            :is="componentMap.get(item.component)"
            v-else-if="['Checkbox', 'Switch'].includes(item.component)"
            v-model:checked="comFormData[item.field]"
            v-bind="item.componentProps"
          ></component>
          <component
            :is="componentMap.get(item.component)"
            v-else
            v-model:value="comFormData[item.field]"
            style="width: 100%"
            v-bind="item.componentProps"
            @change="changeEvent(item, $event)"
          ></component>
        </a-form-item>
      </a-col>
      <a-col :span="6">
        <slot name="operate-btn"></slot>
      </a-col>
    </a-row>
  </a-form>
</template>
<script lang="ts" setup>
import { ref, computed } from "vue";
import type { schemasItemINF } from "./type/index";
import { componentMap } from "./component-map";

interface formPropsINF {
  schemas: schemasItemINF[];
  formProps?: any;
  formData: any;
  formRules?: any;
}

let props = defineProps<formPropsINF>();
interface emitINF {
  (e: "update:formData", value: any): void;
  (e: "changeEvent", value: any): void;
}
let emit = defineEmits<emitINF>();

let comFormData = computed({
  get: () => {
    return props.formData;
  },
  set: value => {
    emit("update:formData", value);
  },
});
let formRef = ref();

function useForm() {
  const { validate, validateFields, scrollToField, resetFields, clearValidate } = formRef.value;
  return { validate, validateFields, scrollToField, resetFields, clearValidate };
}

/**
 * @author: cmm
 * @description: 组件发生改变时生效
 * @param {*} fieldName
 * @param {*} val
 * @return {*}
 */
function changeEvent(item: any, val: any): void {
  emit("changeEvent", { item, val });
}

defineExpose({
  useForm,
  comFormData
});
</script>

