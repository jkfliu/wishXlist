<template>
  <bar-chart :chart-data="chartData" :options="options" />
</template>

<script>
import { Bar } from 'vue-chartjs'

const PAGE_COLORS = [
  'rgba(54,162,235,0.7)',
  'rgba(75,192,100,0.7)',
  'rgba(255,159,64,0.7)',
  'rgba(153,102,255,0.7)',
  'rgba(255,99,132,0.7)',
]

export default {
  name: 'ChartPageViews',
  extends: Bar,
  props: { history: { type: Object, required: true } },
  computed: {
    chartData() {
      const pageDatasets = Object.entries(this.history.pageBreakdown || {}).map(([path, counts], i) => ({
        type: 'bar',
        label: path,
        data: counts,
        backgroundColor: PAGE_COLORS[i % PAGE_COLORS.length],
        stack: 'pages',
        yAxisID: 'left',
      }))
      pageDatasets.push({
        type: 'line',
        label: 'Total Pageviews',
        data: this.history.pageviews,
        borderColor: 'rgba(150,150,150,1)',
        backgroundColor: 'rgba(150,150,150,0.1)',
        fill: false,
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.3,
        yAxisID: 'right',
      })
      return { labels: this.history.weeks, datasets: pageDatasets }
    },
    options() {
      return {
        responsive: true,
        maintainAspectRatio: true,
        title: { display: true, text: 'Page Views' },
        scales: {
          yAxes: [
            { id: 'left',  position: 'left',  stacked: true, ticks: { beginAtZero: true } },
            { id: 'right', position: 'right', ticks: { beginAtZero: true }, gridLines: { drawOnChartArea: false } },
          ],
        },
      }
    },
  },
  mounted() { this.renderChart(this.chartData, this.options) },
  watch: { history() { this.renderChart(this.chartData, this.options) } },
}
</script>
