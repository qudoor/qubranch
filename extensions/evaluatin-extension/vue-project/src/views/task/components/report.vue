<!--
 * @Date: 2022-03-10 14:28:30
 * @Description: 结果报告图表
-->
<template>
  <div style="padding: 40px 20px">
    <div class="ju-sp">
      <dv-border-box-10 style="width: 100%; margin-right: 20px">
        <div style="padding: 20px">
          <div ref="lineRef" class="graph"></div>
        </div>
      </dv-border-box-10>
      <dv-border-box-10 style="width: 100%">
        <div style="padding: 20px">
          <div ref="radarRef" class="graph"></div>
        </div>
      </dv-border-box-10>
    </div>
    <dv-decoration-10 style="width: 100%; height: 5px; margin: 10px auto" />
    <div ref="barRef" class="graph" style="margin: 0px 20px"></div>
  </div>
</template>
<script lang="ts" setup>
import { useEcharts } from '@/hooks/echarts'
import { nextTick, onMounted, ref } from 'vue'

let radarOption = {
  backgroundColor: '',
  title: {
    text: '量子计算模拟能力',
    subtext: 'Quantum Simulation Capability Index (QSCI)'
  },
  legend: {
    data: ['Allocated Budget', 'Actual Spending']
  },
  radar: {
    // shape: 'circle',
    indicator: [
      { name: '编译速度', max: 6500 },
      { name: '优化指数', max: 16000 },
      { name: '运行性能', max: 30000 },
      { name: '并行度', max: 38000 },
      { name: '资源使用', max: 52000 },
      { name: '实时/大数据处理能力', max: 25000 },
      { name: '吞吐率', max: 25000 },
      { name: '模拟架构数', max: 25000 }
    ]
  },
  series: [
    {
      name: 'Budget vs spending',
      type: 'radar',
      data: [
        {
          value: [4200, 3000, 20000, 35000, 20000, 18000, 18000, 18000],
          name: '数据'
        }
      ]
    }
  ],
  color: 'rgb(255,228,52)'
}

let barOption = {
  backgroundColor: '',
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
    data: [
      '编译速度',
      '优化指数',
      '运行性能',
      '并行度',
      '资源使用',
      '实时/大数据处理能力',
      '吞吐率',
      '模拟架构数'
    ]
  },
  yAxis: {
    type: 'value',
    max: 2500,
    axisLine: {
      show: true
    }
  },
  legend: {
    top: 80,
    data: ['best', 'avg', 'yours']
  },
  series: [
    {
      name: 'best',
      data: [1200, 2000, 1500, 800, 700, 1100, 1300, 1200],
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
      data: [800, 1500, 1200, 500, 500, 900, 800, 890],
      type: 'bar',
      label: {
        show: true,
        color: '#fff',
        formatter: '{a}',
        position: 'top'
      }
    },
    {
      name: 'yours',
      data: [900, 1700, 1400, 600, 400, 750, 1000, 1100],
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
  backgroundColor: '',
  title: {
    text: '量子计算模拟能力',
    subtext: 'Quantum Simulation Capability Index (QSCI)'
  },

  legend: {
    data: ['random', 'Shor', 'Grover', 'Deutsch-Jozsa'],
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
    },
    {
      name: 'Grover',
      type: 'line',

      data: [1000, 12000, 150003, 300000, 443796, 645000]
    },
    {
      name: 'Deutsch-Jozsa',
      type: 'line',

      data: [80, 2000, 9000, 32698, 143796, 345000]
    }
  ]
}
const lineRef = ref<HTMLElement>()
const barRef = ref<HTMLElement>()
const radarRef = ref<HTMLElement>()
onMounted(() => {
  nextTick(() => {
    let { myChart: lineChart } = useEcharts(lineRef.value, 'dark')
    lineChart.setOption(lineOption)
    let { myChart: barChart } = useEcharts(barRef.value, 'dark')
    barChart.setOption(barOption)
    let { myChart: radarChart } = useEcharts(radarRef.value, 'dark')
    radarChart.setOption(radarOption)
    window.onresize = () => {
      lineChart.resize()
      barChart.resize()
      radarChart.resize()
    }
  })
})
</script>
<style lang="less" scoped>
.graph {
  height: 500px;
}
</style>
