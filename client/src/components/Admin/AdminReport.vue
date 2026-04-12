<template>
  <div id="admin-report" class="small-container">
    <h3>Weekly Report</h3>

    <p v-if="loading"><i class="fas fa-spinner fa-spin"></i> Loading...</p>
    <p v-else-if="forbidden" class="error-text">Access denied. Admin only.</p>
    <p v-else-if="error" class="error-text">Failed to load report ({{ errorDetail }}). Please try again.</p>

    <template v-else-if="data">
      <p class="period">{{ periodLabel }}</p>

      <!-- Section 1: Stats -->
      <section class="card">
        <h5>Stats</h5>
        <table class="report-table">
          <thead>
            <tr><th></th><th class="col-num">Total</th><th class="col-num">Last week</th><th class="col-num">This week</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in statsRows" :key="row.label">
              <td>{{ row.label }}</td>
              <td class="col-num">{{ row.total }}</td>
              <td class="col-num">{{ row.lastWeek }}</td>
              <td class="col-num">{{ row.thisWeek }} <span :class="arrowClass(row.thisWeek, row.lastWeek)">{{ arrow(row.thisWeek, row.lastWeek) }}</span></td>
            </tr>
          </tbody>
        </table>
        <div class="chart-row">
          <div class="chart-wrap"><chart-users-groups :history="data.history" /></div>
          <div class="chart-wrap"><chart-wishes-gifted :history="data.history" /></div>
        </div>
      </section>

      <!-- Section 2: Logins -->
      <section class="card">
        <h5>Logins</h5>
        <ul class="stat-list">
          <li>Total logins: <strong>{{ data.logins.total }}</strong></li>
          <li>Unique users logged in: <strong>{{ data.logins.uniqueUsers }}</strong></li>
          <li>Page views: <strong>{{ data.logins.pageviews }}</strong></li>
        </ul>
        <h6 class="collapsible-heading" @click="showTopUsers = !showTopUsers">
          Top users this week <span class="chevron">{{ showTopUsers ? '▲' : '▼' }}</span>
        </h6>
        <div v-show="showTopUsers">
          <table class="report-table" v-if="data.logins.top5Users && data.logins.top5Users.length">
            <thead><tr><th>User</th><th>Page views</th></tr></thead>
            <tbody>
              <tr v-for="u in data.logins.top5Users" :key="u.username">
                <td>{{ u.username }}</td>
                <td>{{ u.count }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="muted">No user page views recorded yet.</p>
        </div>
        <h6 class="collapsible-heading" @click="showTopPages = !showTopPages">
          Top pages this week <span class="chevron">{{ showTopPages ? '▲' : '▼' }}</span>
        </h6>
        <div v-show="showTopPages">
          <table class="report-table" v-if="data.logins.top5Pages.length">
            <thead><tr><th>Page</th><th>Views</th></tr></thead>
            <tbody>
              <tr v-for="p in data.logins.top5Pages" :key="p.path">
                <td><code>{{ p.path }}</code></td>
                <td>{{ p.count }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="muted">No page views recorded yet.</p>
        </div>
        <div class="chart-row">
          <div class="chart-wrap"><chart-logins :history="data.history" /></div>
          <div class="chart-wrap"><chart-page-views :history="data.history" /></div>
        </div>
      </section>

      <!-- Section 3: Metrics -->
      <section class="card">
        <h5>Metrics</h5>
        <ul class="stat-list">
          <li>HTTP errors: <strong>{{ data.metrics.httpErrors }}</strong></li>
          <li>Avg response time: <strong>{{ data.metrics.avgResponseTime != null ? data.metrics.avgResponseTime + ' ms' : 'n/a' }}</strong></li>
        </ul>
        <h6 class="collapsible-heading" @click="showHttpErrors = !showHttpErrors">
          HTTP error details <span class="chevron">{{ showHttpErrors ? '▲' : '▼' }}</span>
        </h6>
        <div v-show="showHttpErrors">
          <table class="report-table" v-if="data.metrics.httpErrorList.length">
            <thead><tr><th>Status</th><th>Path</th><th>User</th><th>Response</th><th>Time</th></tr></thead>
            <tbody>
              <tr v-for="(e, i) in data.metrics.httpErrorList" :key="i">
                <td>{{ e.status }}</td>
                <td><code>{{ e.path }}</code></td>
                <td>{{ e.username || '—' }}</td>
                <td><span class="response-body">{{ e.responseBody || '—' }}</span></td>
                <td>{{ new Date(e.timestamp).toLocaleString() }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="muted">No HTTP errors this week.</p>
        </div>
        <div class="chart-row">
          <div class="chart-wrap"><chart-http-errors :history="data.history" /></div>
          <div class="chart-wrap"><chart-avg-response :history="data.history" /></div>
        </div>
      </section>

      <p class="muted">Generated {{ generatedAt }}</p>
    </template>
  </div>
</template>

<script>
import ChartUsersGroups  from './_ChartUsersGroups.vue'
import ChartWishesGifted from './_ChartWishesGifted.vue'
import ChartLogins       from './_ChartLogins.vue'
import ChartPageViews    from './_ChartPageViews.vue'
import ChartHttpErrors   from './_ChartHttpErrors.vue'
import ChartAvgResponse  from './_ChartAvgResponse.vue'

export default {
  name: 'AdminReport',
  components: { ChartUsersGroups, ChartWishesGifted, ChartLogins, ChartPageViews, ChartHttpErrors, ChartAvgResponse },

  data() {
    return { data: null, loading: true, forbidden: false, error: false, errorDetail: '', showTopUsers: false, showTopPages: false, showHttpErrors: false }
  },

  computed: {
    periodLabel() {
      if (!this.data) return ''
      const from = new Date(this.data.period.from).toDateString()
      const to   = new Date(this.data.period.to).toDateString()
      return `${from} – ${to}`
    },
    generatedAt() {
      return this.data ? new Date(this.data.generatedAt).toUTCString() : ''
    },
    statsRows() {
      if (!this.data) return []
      const s = this.data.stats
      return [
        { label: 'Users',  ...s.users },
        { label: 'Groups', ...s.groups },
        { label: 'Wishes', ...s.wishes },
        { label: 'Gifted', ...s.gifted },
      ]
    },
  },

  async mounted() {
    try {
      const res = await fetch('/Admin/Report', { credentials: 'include' })
      if (res.status === 403) { this.forbidden = true; return }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        this.errorDetail = `HTTP ${res.status}${body.error ? ': ' + body.error : ''}`
        this.error = true
        return
      }
      this.data = await res.json()
    } catch (err) {
      this.errorDetail = err.message || 'network error'
      this.error = true
    } finally {
      this.loading = false
    }
  },

  methods: {
    arrow(cur, prev) {
      if (cur == null || prev == null) return ''
      return cur > prev ? '▲' : cur < prev ? '▼' : '–'
    },
    arrowClass(cur, prev) {
      if (cur == null || prev == null) return ''
      return cur > prev ? 'arrow-up' : cur < prev ? 'arrow-down' : ''
    },
  },
}
</script>

<style scoped>
.small-container { margin-left: 0; }
h3 { margin-top: 0; }

.period { color: #888; margin-bottom: 1rem; }
.muted  { color: #aaa; font-size: 0.875rem; }

.error-text { color: #d33c40; }

.report-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}
.report-table th, .report-table td {
  text-align: left;
  padding: 0.35rem 0.75rem;
  border-bottom: 1px solid #eee;
}
.report-table th { font-weight: 600; background: #f9f9f9; }
.report-table .col-num { width: 20%; text-align: center; }

.stat-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1rem;
}
.stat-list li { padding: 0.2rem 0; }

.chart-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}
.chart-wrap {
  flex: 1;
  min-width: 280px;
}

.arrow-up   { color: #2a9d2a; }
.arrow-down { color: #d33c40; }

h6 { margin: 0.75rem 0 0.25rem; font-size: 0.9rem; color: #555; }
.response-body { font-size: 0.8rem; color: #555; word-break: break-word; }
.collapsible-heading { cursor: pointer; user-select: none; display: flex; justify-content: space-between; align-items: center; }
.collapsible-heading:hover { color: #333; }
.chevron { font-size: 0.75rem; color: #aaa; }
</style>
