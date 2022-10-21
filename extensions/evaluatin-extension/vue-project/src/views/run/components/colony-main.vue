<!--
 * @Date: 2022-03-10 09:10:57
 * @Description: 远程模式启动页面
-->
<template>
  <div>
    <dv-border-box-12 :key="mode" style="width: 400px; height: auto">
      <div style="padding: 20px">
        <div class="ju-end">
          <a-radio-group v-model:value="mode" button-style="solid">
            <a-radio-button value="box">box</a-radio-button>
            <a-radio-button value="hpc">hpc</a-radio-button>
          </a-radio-group>
        </div>
        <form-app
          ref="formAppRef"
          v-model:formData="formData"
          :schemas="schemas"
          :form-rules="formRules"
          layout="vertical"
        >
          <template #node>
            <a-space align="center">
              <a-form-item name="ip">
                <a-input v-model:value="formData.ip" placeholder="请输入ip"></a-input>
              </a-form-item>
              <a-form-item name="sshUsername">
                <a-input v-model:value="formData.sshUsername" placeholder="请输入ssh账号"></a-input>
              </a-form-item>
              <a-form-item name="sshPassword">
                <a-input v-model:value="formData.sshPassword" placeholder="请输入ssh密码"></a-input>
              </a-form-item>
              <!-- <plus-circle-outlined class="icon" /> -->
            </a-space>
          </template>
        </form-app>
      </div>
    </dv-border-box-12>
  </div>
</template>
<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { FormApp, schemasItemINF } from '@/components/form-app'
import { vscode } from '@/main'
import { Run } from '@/hooks/tools-class.ts'
import { message } from 'ant-design-vue'
const router = useRouter()
let formData = ref({
  job: '',
  al: '',
  qubit: undefined,
  ip: '',
  sshUsername: '',
  sshPassword: ''
})
const formRules = {
  job: [{ required: true, message: '请输入' }],
  l: [{ required: true, message: '请输入大于0的数字', pattern: /^[1-9][\d]*$/g }],
  qubit: [
    {
      required: true,
      message: '格式：纯数字/半角逗号分隔的一组数字(1,3,5...)，注意数字不能为0开头',
      pattern: /^[1-9][\d]*(,[1-9][\d]*)*$/g
    }
  ],
  ip: [{ required: true, message: '请输入' }],
  sshUsername: [{ required: true, message: '请输入' }],
  sshPassword: [{ required: true, message: '请输入' }],
  al: [{ required: true, message: '请选择' }]
  // node: [{ required: true, message: '请填写完整' }]
}
let formAppRef = ref()
const schemas = computed<schemasItemINF[]>(() => {
  return [
    {
      field: 'job',
      label: '任务名称',
      component: 'Input',
      componentProps: {
        autocomplete: 'off'
      }
    },
    {
      field: 'l',
      label: '测试轮数',
      component: 'InputNumber'
    },
    {
      field: 'qubit',
      label: '比特数',
      component: 'Input'
    },
    {
      field: 'al',
      label: '算法',
      component: 'Select',
      componentProps: {
        options: [
          {
            value: 'grover',
            label: 'grover'
          }
        ]
      }
    },
    {
      field: 'node',
      slot: 'node',
      component: 'Slot',
      label: '节点'
    }
  ]
})

let mode = ref('box')
async function run(callback: Function) {
  console.log('运行')
  try {
    await validateFields()
    callback(true)
    if (mode.value === 'box') {
      const RunClass = new Run()
      RunClass.runColonyBox(formData.value, callback)
      // vscode.postMessage({
      //   type: 'setBoxapi',
      //   value: formData.value.ip
      // })
      vscode.postMessage({
        type: 'runColonyBox',
        value: {
          ip: formData.value.ip,
          user: formData.value.sshUsername,
          pwd: formData.value.sshPassword
        }
      })
    } else {

      const RunClass = new Run()
      RunClass.runColonyHpc(formData.value, callback)

      vscode.postMessage({
        type: 'runColonySlurm',
        value: {
          ip: formData.value.ip,
          user: formData.value.sshUsername,
          pwd: formData.value.sshPassword
        }
      })
    }
  } catch {
    callback(false)
  }
}
async function validateFields() {
  const { validateFields } = formAppRef.value.useForm()
  await validateFields()
}
function GoTask() {
  if (
    (mode.value === 'box' && sessionStorage.getItem('boxapi') != 'null') ||
    (mode.value === 'hpc' && sessionStorage.getItem('slurmapi') != 'null')
  ) {
    router.push({
      path: '/task/list',
      query: { modelType: mode.value === 'box' ? 'colonyBox' : 'colonySlurm' }
    })
  } else {
    message.info('请先跑个测评吧~')
    return
  }
}
defineExpose({
  run,
  validateFields,
  GoTask
})
</script>
<style lang="less" scoped>
.icon {
  cursor: pointer;
  &:hover {
    color: #1890ff;
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
}
.form {
  padding: 20px;
}
</style>
