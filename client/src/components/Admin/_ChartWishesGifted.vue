<script>
import { Line } from 'vue-chartjs'

export default {
  name: 'ChartWishesGifted',
  extends: Line,
  props: { history: { type: Object, required: true } },
  computed: {
    chartData() {
      return {
        labels: this.history.weeks,
        datasets: [
          { label: 'New Wishes', data: this.history.newWishes, borderColor: 'rgba(54,162,235,1)',  backgroundColor: 'rgba(54,162,235,0.15)', fill: false, borderWidth: 2, pointRadius: 3, tension: 0.3 },
          { label: 'Gifted',     data: this.history.gifted,    borderColor: 'rgba(255,159,64,1)',   backgroundColor: 'rgba(255,159,64,0.15)',  fill: false, borderWidth: 2, pointRadius: 3, tension: 0.3 },
        ],
      }
    },
    options() {
      return { responsive: true, maintainAspectRatio: true, title: { display: true, text: 'Wishes & Gifted' }, scales: { yAxes: [{ ticks: { beginAtZero: true } }] } }
    },
  },
  mounted() { this.renderChart(this.chartData, this.options) },
  watch: { history() { this.renderChart(this.chartData, this.options) } },
}
</script>
