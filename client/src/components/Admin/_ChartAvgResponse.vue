<script>
import { Line } from 'vue-chartjs'

export default {
  name: 'ChartAvgResponse',
  extends: Line,
  props: { history: { type: Object, required: true } },
  computed: {
    chartData() {
      return {
        labels: this.history.weeks,
        datasets: [
          { label: 'Avg Response (ms)', data: this.history.avgResponseMs, borderColor: 'rgba(54,162,235,1)', backgroundColor: 'rgba(54,162,235,0.15)', fill: false, borderWidth: 2, pointRadius: 3, tension: 0.3 },
        ],
      }
    },
    options() {
      return { responsive: true, maintainAspectRatio: true, title: { display: true, text: 'Avg Response Time (ms)' }, scales: { yAxes: [{ ticks: { beginAtZero: true } }] } }
    },
  },
  mounted() { this.renderChart(this.chartData, this.options) },
  watch: { history() { this.renderChart(this.chartData, this.options) } },
}
</script>
