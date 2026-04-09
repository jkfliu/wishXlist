<script>
import { Line } from 'vue-chartjs'

export default {
  name: 'ChartHttpErrors',
  extends: Line,
  props: { history: { type: Object, required: true } },
  computed: {
    chartData() {
      return {
        labels: this.history.weeks,
        datasets: [
          { label: 'HTTP Errors', data: this.history.httpErrors, borderColor: 'rgba(255,99,132,1)', backgroundColor: 'rgba(255,99,132,0.15)', fill: false, borderWidth: 2, pointRadius: 3, tension: 0.3 },
        ],
      }
    },
    options() {
      return { responsive: true, maintainAspectRatio: true, title: { display: true, text: 'HTTP Errors' }, scales: { yAxes: [{ ticks: { beginAtZero: true } }] } }
    },
  },
  mounted() { this.renderChart(this.chartData, this.options) },
  watch: { history() { this.renderChart(this.chartData, this.options) } },
}
</script>
