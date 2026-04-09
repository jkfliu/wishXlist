<script>
import { Line } from 'vue-chartjs'

export default {
  name: 'ChartUsersGroups',
  extends: Line,
  props: { history: { type: Object, required: true } },
  computed: {
    chartData() {
      return {
        labels: this.history.weeks,
        datasets: [
          { label: 'New Users',  data: this.history.newUsers,  borderColor: 'rgba(54,162,235,1)',  backgroundColor: 'rgba(54,162,235,0.15)', fill: false, borderWidth: 2, pointRadius: 3, tension: 0.3 },
          { label: 'New Groups', data: this.history.newGroups, borderColor: 'rgba(75,192,100,1)',  backgroundColor: 'rgba(75,192,100,0.15)', fill: false, borderWidth: 2, pointRadius: 3, tension: 0.3 },
        ],
      }
    },
    options() {
      return { responsive: true, maintainAspectRatio: true, title: { display: true, text: 'Users & Groups' }, scales: { yAxes: [{ ticks: { beginAtZero: true } }] } }
    },
  },
  mounted() { this.renderChart(this.chartData, this.options) },
  watch: { history() { this.renderChart(this.chartData, this.options) } },
}
</script>
