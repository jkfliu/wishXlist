const { Resend } = require('resend');
const { usersGroupsChart, wishesGiftedChart, loginsChart, pageViewsChart, metricsChart } = require('./chartUrl');

const resend = new Resend(process.env.RESEND_API_KEY);

function fmt(n) { return n != null ? n : 'n/a'; }
function arrow(cur, prev) {
  if (cur == null || prev == null) return '';
  return cur > prev ? ' ▲' : cur < prev ? ' ▼' : ' –';
}

function tableRow(label, s) {
  return `<tr>
    <td style="padding:6px 12px;border-bottom:1px solid #eee">${label}</td>
    <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">${fmt(s.total)}</td>
    <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">${fmt(s.thisWeek)}${arrow(s.thisWeek, s.lastWeek)}</td>
    <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right">${fmt(s.lastWeek)}</td>
  </tr>`;
}

async function sendWeeklyReport(data) {
  const from = new Date(data.period.from).toDateString();
  const to   = new Date(data.period.to).toDateString();

  const html = `
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:660px;margin:0 auto;color:#333">
  <h2 style="border-bottom:2px solid #eee;padding-bottom:8px">wishXlist Weekly Report</h2>
  <p style="color:#888">${from} – ${to}</p>

  <h3>Stats</h3>
  <table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="background:#f5f5f5">
        <th style="padding:6px 12px;text-align:left"></th>
        <th style="padding:6px 12px;text-align:right">Total</th>
        <th style="padding:6px 12px;text-align:right">This week</th>
        <th style="padding:6px 12px;text-align:right">Last week</th>
      </tr>
    </thead>
    <tbody>
      ${tableRow('Users',  data.stats.users)}
      ${tableRow('Groups', data.stats.groups)}
      ${tableRow('Wishes', data.stats.wishes)}
      ${tableRow('Gifted', data.stats.gifted)}
    </tbody>
  </table>
  <img src="${usersGroupsChart(data.history)}" width="600" style="margin-top:12px" />
  <img src="${wishesGiftedChart(data.history)}" width="600" style="margin-top:8px" />

  <h3 style="margin-top:24px">Logins</h3>
  <ul>
    <li>Total logins: <strong>${fmt(data.logins.total)}</strong></li>
    <li>Unique users logged in: <strong>${fmt(data.logins.uniqueUsers)}</strong></li>
    <li>Page views: <strong>${fmt(data.logins.pageviews)}</strong></li>
    <li>Top pages: ${data.logins.top5Pages.map(p => `<code>${p.path}</code> (${p.count})`).join(', ')}</li>
  </ul>
  <img src="${loginsChart(data.history)}" width="600" style="margin-top:8px" />
  <img src="${pageViewsChart(data.history)}" width="600" style="margin-top:8px" />

  <h3 style="margin-top:24px">Metrics</h3>
  <ul>
    <li>HTTP errors: <strong>${fmt(data.metrics.httpErrors)}</strong></li>
    <li>Avg response time: <strong>${data.metrics.avgResponseTime != null ? data.metrics.avgResponseTime + ' ms' : 'n/a'}</strong></li>
  </ul>
  <img src="${metricsChart(data.history)}" width="600" style="margin-top:8px" />

  <p style="color:#aaa;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:8px">
    Generated ${new Date(data.generatedAt).toUTCString()}
  </p>
</body>
</html>`;

  await resend.emails.send({
    from:    process.env.RESEND_FROM_EMAIL || 'wishXlist <onboarding@resend.dev>',
    to:      process.env.ADMIN_EMAIL,
    subject: `wishXlist Weekly Report — ${to}`,
    html,
  });
}

module.exports = sendWeeklyReport;
