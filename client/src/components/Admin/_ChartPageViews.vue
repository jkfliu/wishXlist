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
      return { labels: this.history.weeks, datasets: pageDatasets }
    },
    options() {
      return {
        responsive: true,
        maintainAspectRatio: true,
        title: { display: true, text: 'Page Views' },
        scales: {
          yAxes: [
            { id: 'left', position: 'left', stacked: true, ticks: { beginAtZero: true } },
          ],
        },
      }
    },
  },
  mounted() { this.renderChart(this.chartData, this.options) },
  watch: { history() { this.renderChart(this.chartData, this.options) } },
}
</script>
