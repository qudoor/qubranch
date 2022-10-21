<!--
 * @Date: 2022-03-09 11:27:23
 * @Description: 测试启动页面
-->
<template>
	<dv-border-box-12 style="width: 400px; height: auto">
		<div style="padding: 20px">
			<form-app
				ref="formAppRef"
				v-model:formData="formData"
				:schemas="schemas"
				:form-rules="formRules"
				layout="vertical"
			></form-app>
		</div>
	</dv-border-box-12>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import { FormApp, schemasItemINF } from '@/components/form-app'
let formData = ref({
	department_id: '',
	user_id: '',
	ss: ''
})
const formRules = {
	department_id: [
		{
			required: true,
			//trigger: 'blur',
			message: '格式：纯数字/半角逗号分隔的一组数字(1,3,5...)，注意数字不能为0开头',
			pattern: /^[1-9][\d]*(,[1-9][\d]*)*$/g
		}
	], //比特数
	user_id: [{ required: true, message: '请输入大于0的数字', pattern: /^[1-9][\d]*$/g }], //轮数
	ss: [{ required: true, message: '请选择' }],
	name: [{ required: true, message: '请输入' }]
}
let formAppRef = ref()

const schemas = ref<schemasItemINF[]>([
	{
		field: 'name',
		label: '任务名字',
		component: 'Input'
	},
	{
		field: 'user_id',
		label: '测试轮数',
		component: 'Input'
	},
	{
		field: 'department_id',
		label: '比特数',
		component: 'Input'
	},
	{
		field: 'ss',
		label: '算法',
		component: 'Select',
		componentProps: {
			options: [
				{
					label: 'grover',
					value: 'grover'
					//  disabled: true // 是否禁用
				}
				// {
				//   label: 'b',
				//   value: 'b',
				// },
				// {
				//   label: 'c',
				//   value: 'c'
				// },
			]
		}
	}
])

function getFormData() {
	//emit("changeEvent", formAppRef.value.comFormData);
	return formAppRef.value.comFormData
}

//开始
async function run() {
	const { validateFields } = formAppRef.value.useForm()
	await validateFields()
	return formData.value
}

defineExpose({
	getFormData,
	run
})
</script>
<style lang="less" scoped>
.form {
	padding: 20px;
}
</style>
