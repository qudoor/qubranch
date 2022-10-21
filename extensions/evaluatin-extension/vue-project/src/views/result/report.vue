<!--
 * @Date: 2022-03-10 14:28:30
 * @Description: 结果报告图表
-->
<template>
  <div style="padding: 40px 20px">
    <a-space>
      <dv-decoration-11 class="_action_btn" @click="$router.push('/')">重新测评</dv-decoration-11>
      <dv-decoration-11
        class="_action_btn"
        @click="$router.push({ path: '/result/list', query: $route.query })"
      >
        详细列表
      </dv-decoration-11>
      <dv-decoration-11
        class="_action_btn"
        @click="$router.push({ path: '/result/hardware_table', query: $route.query })"
      >
        硬件信息
      </dv-decoration-11>
    </a-space>
    <div class="ju-sp">
      <dv-border-box-10 style="width: 100%; margin-right: 20px">
        <div style="padding: 20px">
          <div ref="lineRef" class="graph"></div>
        </div>
      </dv-border-box-10>
      <dv-border-box-10 style="width: 100%">
        <div style="padding: 20px; position: relative">
          <div class="select-item">
            <a-space>
              <!-- <a-select
                v-model:value="radarAlgorithm"
                placeholder="请选择算法"
                class="select"
                @change="radarOptionChange"
              >
                <a-select-option v-for="item in algorithmOptions" :key="item">{{ item }}</a-select-option>
              </a-select> -->
              <a-select
                v-model:value="radarBit"
                placeholder="请选择比特数"
                class="select"
                @change="radarOptionChange"
              >
                <a-select-option v-for="item in quBitOptions" :key="item">{{ item }}</a-select-option>
              </a-select>
            </a-space>
          </div>
          <div ref="radarRef" class="graph"></div>
        </div>
      </dv-border-box-10>
    </div>
    <dv-decoration-10 style="width: 100%; height: 5px; margin: 10px auto" />
    <div style="position: relative">
      <div class="select-item">
        <a-space>
          <a-select
            v-model:value="barAlgorithm"
            placeholder="请选择算法"
            class="select"
            @change="barOptionChange"
          >
            <a-select-option v-for="item in algorithmOptions" :key="item">{{ item }}</a-select-option>
          </a-select>
          <a-select
            v-model:value="barBit"
            placeholder="请选择比特数"
            class="select"
            @change="barOptionChange"
          >
            <a-select-option v-for="item in quBitOptions" :key="item">{{ item }}</a-select-option>
          </a-select>
        </a-space>
      </div>
      <div ref="barRef" class="graph" style="margin: 0px 20px"></div>
    </div>
    <door :visible="doorVis"></door>
  </div>
</template>
<script lang="ts" setup>
import { useEcharts } from '@/hooks/echarts'

import { nextTick, onMounted, ref } from 'vue'
import { Info } from '@/hooks/tools-class.ts'
import { useRoute } from 'vue-router'
import Door from '@/components/dataV/door.vue'
import { vscode } from '@/main'
const route = useRoute()
let algorithmOptions = ref([])
let quBitOptions = ref([])
let radarOption = {
  //雷达
  backgroundColor: '',
  tooltip: {
    trigger: 'axis'
  },
  title: {
    text: '量子计算模拟能力',
    subtext: 'Quantum Simulation Capability Index (QSCI)'
  },
  legend: {
    data: []
  },
  radar: {
    // shape: 'circle',
    indicator: [
      { name: '并行', max: 24 },
      { name: '网络In', max: 30720 },
      { name: '网络Out', max: 102400 },
      { name: '内存使用率', max: 100 },
      { name: 'cpu使用率', max: 100 }
    ]
  },
  color: 'rgb(255,228,52)',
  series: [
    // {
    //   type: 'radar',
    //   data: [
    //     {
    //       value: [],
    //       name: '数据'
    //     }
    //   ]
    // }
  ]
}

let barOption = {
  //柱状
  backgroundColor: '',
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  title: {
    text: '量子计算模拟能力',
    subtext: 'Quantum Simulation Capability Index (QSCI)'
  },
  grid: {
    top: 150,
    left: 50,
    right: 50
  },
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: {
    type: 'value',
    max: 100,
    axisLine: {
      show: true
    }
  },
  legend: {
    top: 80,
    data: ['best', 'avg', 'worst']
  },

  series: [
    {
      name: 'best',
      data: [],
      type: 'bar',
      label: {
        show: true,
        color: '#fff',
        formatter: '{a}',
        position: 'top'
      }
    },
    {
      name: 'avg',
      data: [],
      type: 'bar',
      label: {
        show: true,
        color: '#fff',
        formatter: '{a}',
        position: 'top'
      }
    },
    {
      name: 'worst',
      data: [],
      type: 'bar',
      label: {
        show: true,
        color: '#fff',
        formatter: '{a}',
        position: 'top'
      }
    }
  ]
}

let lineOption = {
  //折线
  backgroundColor: '',
  title: {
    text: '量子计算模拟能力',
    subtext: 'Quantum Simulation Capability Index (QSCI)'
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  legend: {
    data: ['CPU', 'MEMORY'],
    top: 80
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    top: '150',
    containLabel: true
  },
  toolbox: {
    feature: {
      saveAsImage: {}
    }
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['5', '10', '15', '20', '25', '30']
  },
  yAxis: {
    type: 'value',
    axisLine: {
      show: true
    },
    name: '运行时间(ms)'
  },
  series: [
    {
      name: 'random',
      type: 'line',

      data: [24, 510, 4023, 32698, 243796, 445000]
    },
    {
      name: 'Shor',
      type: 'line',

      data: [600, 8000, 18023, 50000, 100000, 200000]
    }
  ]
}
const lineRef = ref<HTMLElement>()
const barRef = ref<HTMLElement>()
const radarRef = ref<HTMLElement>()
// let getLineChartData = ref([])
// let getbarData = ref([])
// let getradarData = ref([])
let lineChart
let barChart
let radarChart
const modelType = route.query.modelType
let doorVis = ref(true)
onMounted(() => {
  nextTick(() => {

    if (modelType === 'single') {
      isLocalPC()
    } else if (modelType === 'colonyBox') {
      isBox()
    } else if (modelType === 'colonySlurm') {
      isHpc()
    }
    lineChart = useEcharts(lineRef.value, 'dark').myChart
    barChart = useEcharts(barRef.value, 'dark').myChart
    radarChart = useEcharts(radarRef.value, 'dark').myChart

    window.onresize = () => {
      lineChart.resize()
      barChart.resize()
      radarChart.resize()
    }
  })
})

let barAlgorithm = ref()
let barBit = ref()
let barAllSeriesData
const osType = sessionStorage.getItem('osType')

let radarBit = ref()
async function isBox() {
  const { getReportBox } = new Info()
  const { tag, job } = route.query
  const { lineSeries, linelegendData, linexAxisData, barAllSeries } = await getReportBox({ tag, job })

  lineOption.legend.data = linelegendData
  lineOption.series = lineSeries
  lineOption.xAxis.data = linexAxisData
  algorithmOptions.value = Object.keys(barAllSeries)
  barAlgorithm.value = algorithmOptions.value[0]
  quBitOptions.value = Object.keys(barAllSeries[barAlgorithm.value])
  radarBit.value = barBit.value = quBitOptions.value[0]

  barAllSeriesData = barAllSeries
  radarOptionChange()
  barOptionChange()
  lineChart.setOption(lineOption, true)
  doorVis.value = false
}
async function isHpc() {
  const { getReportSlurm } = new Info()
  const { tag, job } = route.query
  const { lineSeries, linelegendData, linexAxisData, barAllSeries } = await getReportSlurm({ tag, job })

  lineOption.legend.data = linelegendData
  lineOption.series = lineSeries
  lineOption.xAxis.data = linexAxisData
  algorithmOptions.value = Object.keys(barAllSeries)
  barAlgorithm.value = algorithmOptions.value[0]
  quBitOptions.value = Object.keys(barAllSeries[barAlgorithm.value])
  radarBit.value = barBit.value = quBitOptions.value[0]

  barAllSeriesData = barAllSeries
  radarOptionChange()
  barOptionChange()
  lineChart.setOption(lineOption, true)
  doorVis.value = false
}
function radarOptionChange() {
  radarOption.series = []
  algorithmOptions.value.forEach(algorithm => {
    radarOption.series.push({
      name: algorithm,
      type: 'radar',
      data: [
        {
          value: [
            0,
            0,
            0,
            barAllSeriesData[algorithm][radarBit.value]['内存使用率'].avg,
            barAllSeriesData[algorithm][radarBit.value]['CPU使用率'].avg
          ],
          name: '数据'
        }
      ]
    })
  })
  radarOption.legend.data = algorithmOptions.value

  radarChart.setOption(radarOption, true)
}
function barOptionChange() {
  let xAxisData = Object.keys(barAllSeriesData[barAlgorithm.value][barBit.value])
  let best = xAxisData.map(item => {
    return barAllSeriesData[barAlgorithm.value][barBit.value][item].best
  })
  let avg = xAxisData.map(item => {
    return barAllSeriesData[barAlgorithm.value][barBit.value][item].avg
  })
  let worst = xAxisData.map(item => {
    return barAllSeriesData[barAlgorithm.value][barBit.value][item].worst
  })
  barOption.series[0].data = best
  barOption.series[1].data = avg
  barOption.series[2].data = worst
  barOption.xAxis.data = xAxisData
  barChart.setOption(barOption, true)
}
function isLocalPC() {
  const { tag, job } = route.query
  function getReport({ data }) {
    const { type, value } = data
    if (type === 'getJobResultSingleMac' || type === 'getJobResultSingleWin') {
      const InfoClass = new Info()
      const { lineSeries, linelegendData, linexAxisData, barAllSeries } = InfoClass.getReportMac(value)

      lineOption.legend.data = linelegendData
      lineOption.series = lineSeries
      lineOption.xAxis.data = linexAxisData
      algorithmOptions.value = Object.keys(barAllSeries)
      barAlgorithm.value = algorithmOptions.value[0]
      quBitOptions.value = Object.keys(barAllSeries[barAlgorithm.value])
      radarBit.value = barBit.value = quBitOptions.value[0]

      barAllSeriesData = barAllSeries
      radarOptionChange()
      barOptionChange()
      lineChart.setOption(lineOption, true)
      window.removeEventListener('message', getReport)
      doorVis.value = false
    }
  }
  window.addEventListener('message', getReport)
  vscode.postMessage({
    type: osType === 'Darwin' ? 'getJobResultSingleMac' : 'getJobResultSingleWin',
    value: {
      tag,
      job
    }
  })
  return
}

defineExpose({})
</script>
<style lang="less" scoped>
.graph {
  height: 500px;
}
.select {
  width: 150px;
}
.select-item {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 99;
}
</style>
