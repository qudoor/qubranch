<!--
 * @Date: 2022-03-29 16:28:53
 * @Description: 实时监控页面
-->
<template>
  <div>
    <div style="position: relative">
      <div class="main-tab" @click="$router.push('/')">
        <dv-decoration-11 style="width: 200px; height: 60px">重新测评</dv-decoration-11>
      </div>
      <dv-decoration-5 style="width: 800px; height: 80px" class="name" />
    </div>
    <div class="ju-sp align-center">
      <div>
        <div ref="cpuRef" class="cpu"></div>
      </div>

      <div style="flex: 1;padding: 20px;50px;max-height:420px; overflow-y: auto;">
        <a-row :gutter="[40, 40]">
          <a-col v-for="item in cardList" :key="item.name" :xl="12" :xxl="8" :xxxl="6">
            <dv-border-box-12 style="width: 100%; height: 150px" background-color="rgba(255,255,255,0.15)">
              <div class="card">
                <img :src="item.img" class="card-icon" />
                <div>
                  <div class="card-label">{{ item.name }}</div>
                  <dv-digital-flop
                    :config="{ number: [item.value], content: `{nt}${item.unit}`, textAlign: 'left' }"
                    style="width: 200px; height: 50px"
                  />
                </div>
              </div>
            </dv-border-box-12>
          </a-col>
        </a-row>
      </div>
    </div>
    <div ref="memoryRef" class="memory"></div>
    <door :visible="doorVis"></door>
  </div>
</template>
<script lang="ts" setup>
import Door from '@/components/dataV/door.vue'
import { useEcharts } from '@/hooks/echarts'
import type { EChartsOption } from 'echarts'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { ConcatSocket } from '@/hooks/tools-class'
import { useRoute, useRouter } from 'vue-router'
import { vscode } from '@/main'
const route = useRoute()
const router = useRouter()
let doorVis = ref(true)
const cpuRef = ref()
const memoryRef = ref()
let cpuChart, memoryChart
let cpuOptions: EChartsOption = {
  backgroundColor: '',
  tooltip: {
    formatter: '{a} <br/>{b} : {c}%'
  },
  series: [
    {
      name: 'Pressure',
      type: 'gauge',
      axisLine: {
        lineStyle: {
          width: 6,
          color: [
            [0.9, '#00ffff'],

            [1, '#FF6E76']
          ]
        }
      },
      axisTick: {
        length: 12,
        lineStyle: {
          color: 'auto',
          width: 2
        }
      },
      splitLine: {
        length: 20,
        lineStyle: {
          color: 'auto',
          width: 5
        }
      },
      pointer: {
        itemStyle: {
          color: 'auto'
        }
      },
      detail: {
        valueAnimation: true,
        formatter: '{value}%'
      },
      data: [
        {
          value: Math.floor(Math.random() * 10 + 90),
          name: 'cpu总使用率'
        }
      ]
    }
  ]
}
let memoryOptions: EChartsOption = {
  grid: {
    right: 50,
    left: 10,
    top: 50,
    bottom: 20,
    containLabel: true
  },
  backgroundColor: '',
  visualMap: [
    {
      show: false,
      type: 'continuous',
      seriesIndex: 0,
      min: 0,
      max: 100
    }
  ],
  xAxis: [
    {
      boundaryGap: false,
      splitLine: {
        show: false
      },
      data: [],
      name: '时间'
    }
  ],
  yAxis: [
    {
      name: '内存占用率(%)',
      type: 'value',
      max: 100
    }
  ],
  series: [
    {
      type: 'line',

      data: []
    }
  ]
}
interface cardListINF {
  name: string
  value: string | number
  img: any
  unit: string
}
let cardList = ref<cardListINF[]>([])

let cpuImg: any = require('./img/cpu.svg')
let memoryImg: any = require('./img/memory.svg')
let diskImg: any = require('./img/hard-disk.svg')
function messageChange(e) {
  const { type, value, pid } = e.data
  swpanPid = pid

  if (type === 'getRevalCharts' || type === 'getRevalChartsSingleMac') {
    if (!value) {
      return
    } else if (
      ['done\r\n', 'done'].includes(value) ||
      value.substring(value.length - 4, value.length) === 'done' ||
      value.substring(value.length - 5, value.length) === 'done\r\n'
    ) {
      router.push({ path: '/result/list', query: { ...route.query } })

      return
    }
    let objectData = JSON.parse(value)

    // 总cpu start
    cpuOptions.series[0].data[0].value = parseFloat(
      objectData.cpu.find(item => item[1] === 'all')[2]
    ).toFixed(2)

    cpuChart.setOption(cpuOptions)
    // 总cpu end

    const cpuCardList: cardListINF[] = objectData.cpu
      .filter(item => item[1] !== 'all')
      .map((item): cardListINF => {
        return { name: `CPU-${item[1]}使用率`, value: parseFloat(item[2]), unit: '%', img: cpuImg }
      })
    const memoryUse =
      Math.round((parseFloat(objectData.ram.used) * 10000) / parseFloat(objectData.ram.total)) / 100
    const memoryCardList: cardListINF = {
      name: '内存占用率',
      value: memoryUse,
      img: memoryImg,
      unit: '%'
    }
    const diskCardList: cardListINF[] = []
    let diskKeys = Object.keys(objectData.disk)
    diskKeys.forEach(item => {
      let diskItem = objectData.disk[item]
      if (diskItem['wkB/s'] !== '') {
        diskCardList.push({
          name: `磁盘${item}写入`,
          value: parseFloat(diskItem['wkB/s']),
          unit: 'kb/s',
          img: diskImg
        })
        diskCardList.push({
          name: `磁盘${item}读取`,
          value: parseFloat(diskItem['rkB/s']),
          unit: 'kb/s',
          img: diskImg
        })
      }
    })

    cardList.value = [...cpuCardList, memoryCardList, ...diskCardList]
    memoryOptions.series[0].data.push(memoryUse)
    if (memoryOptions.series[0].data.length > 50) {
      memoryOptions.series[0].data.shift()
      memoryOptions.xAxis[0].data.shift()
    }
    memoryOptions.xAxis[0].data.push(objectData.ram.time)
    memoryChart.setOption(memoryOptions)
    if (doorVis.value) {
      nextTick(() => {
        doorVis.value = false
      })
    }
  }
}
let swpanPid = '' //进程id
const modelType = route.query.modelType
//单机模式的实时监控
function isLocalPC() {
  window.addEventListener('message', messageChange)
  const osType = sessionStorage.getItem('osType')
  const { tag, job } = route.query
  if (osType === 'Darwin') {
    vscode.postMessage({
      type: 'getRevalChartsSingleMac',
      value: {
        tag,
        job
      }
    })
  } else {
    vscode.postMessage({
      type: 'getRevalCharts',
      value: {
        tag,
        job
      }
    })
  }
}
let socket
//远程box(arm)实时监控
function isBox() {
  let { socket: mysocket } = new ConcatSocket()
  socket = mysocket

  socket.onopen = () => {
    const { job, tag } = route.query
    const params = JSON.stringify({
      userId: localStorage.getItem('machineId'),
      // userId: '03b2a589172d1c4969c20027a3ec0533e34ea56d4961280fe0903c68bb83d9c8',
      job,
      tag
    })
    socket.send(params)
  }
  socket.onmessage = ({ data }) => {
    try {
      messageChange({ data: { type: 'getRevalCharts', value: data, pid: undefined } })
    } catch (err) {
      console.log('错误')
    }
  }
  socket.onclose = err => {
    console.log('关闭', err)
  }
  socket.onerror = err => {
    console.log('报错', err)
  }
}
console.log('route.query.modelType==>', route.query.modelType)
if (modelType === 'single') {
  isLocalPC()
} else if (modelType === 'colonyBox') {
  isBox()
}
onMounted(() => {
  nextTick(() => {
    cpuChart = useEcharts(cpuRef.value, 'dark').myChart
    memoryChart = useEcharts(memoryRef.value, 'dark').myChart
    window.onresize = () => {
      cpuChart.resize()
      memoryChart.resize()
    }
  })
})
onUnmounted(() => {
  window.removeEventListener('message', messageChange)
  if (modelType === 'single') {
    vscode.postMessage({
      type: 'kill',
      pid: swpanPid
    })
  } else if (modelType === 'colonyBox') {
    socket.close()
  }
})
</script>
<style lang="less" scoped>
.title {
  font-size: 32px;
  font-weight: bold;
  text-shadow: 0 0 10px cyan;
  text-align: center;
}
.cpu {
  width: 500px;
  height: 500px;
  margin: auto;
}
.memory {
  width: 100%;
  height: 500px;
  margin-top: 20px;
  position: relative;
}
.name {
  position: relative;
  margin: 20px auto;
  &::before {
    position: absolute;
    left: 0;
    right: 0;
    text-align: center;
    top: -10px;

    font-size: 32px;
    font-weight: bold;
    text-shadow: 0 0 10px cyan;
    content: '实时监测';
  }
}
.card {
  display: flex;
  align-items: center;
  height: 150px;

  &-icon {
    width: 100px;
    margin: 0 20px;
  }
  &-label {
    font-size: 22px;
    font-weight: bold;
  }
  &-value {
    font-size: 26px;
    font-weight: bold;
  }
}
.main-tab {
  position: absolute;
  top: 30px;
  left: 30px;
  cursor: pointer;
}
</style>
