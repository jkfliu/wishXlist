<script>
import { Line } from 'vue-chartjs'

export default {
  name: 'ChartMetrics',
  extends: Line,
  props: { history: { type: Object, required: true } },
  computed: {
    chartData() {
      return {
        labels: this.history.weeks,
        datasets: [
          { label: 'HTTP Errors',       data: this.history.httpErrors,    borderColor: 'rgba(255,99,132,1)',  backgroundColor: 'rgba(255,99,132,0.15)', fill: false, borderWidth: 2, pointRadius: 3, tension: 0.3, yAxisID: 'left' },
          { label: 'Avg Response (ms)', data: this.history.avgResponseMs, borderColor: 'rgba(54,162,235,1)',  backgroundColor: 'rgba(54,162,235,0.15)', fill: false, borderWidth: 2, pointRadius: 3, tension: 0.3, yAxisID: 'right' },
        ],
      }
    },
    options() {
      return {
        responsive: true,
        maintainAspectRatio: true,
        title: { display: true, text: 'Metrics' },
        scales: {
          yAxes: [
            { id: 'left',  position: 'left',  ticks: { beginAtZero: true } },
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
