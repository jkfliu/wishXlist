// Builds a QuickChart.io URL that resolves to a PNG image — no API key required.
// Used for embedding charts directly in HTML emails.
function chartUrl(config, width = 600, height = 280) {
  const params = new URLSearchParams({
    c: JSON.stringify(config),
    w: width,
    h: height,
    bkg: 'white',
  });
  return `https://quickchart.io/chart?${params.toString()}`;
}

// Shared chart colour palette
const COLORS = {
  blue:   'rgba(54, 162, 235, 1)',
  blueFill: 'rgba(54, 162, 235, 0.2)',
  green:  'rgba(75, 192, 100, 1)',
  greenFill: 'rgba(75, 192, 100, 0.2)',
  orange: 'rgba(255, 159, 64, 1)',
  orangeFill: 'rgba(255, 159, 64, 0.2)',
  red:    'rgba(255, 99, 132, 1)',
  redFill: 'rgba(255, 99, 132, 0.2)',
  purple: 'rgba(153, 102, 255, 1)',
  purpleFill: 'rgba(153, 102, 255, 0.2)',
  grey:   'rgba(150, 150, 150, 1)',
  greyFill: 'rgba(150, 150, 150, 0.15)',
};

const BASE_LINE_DATASET = {
  fill: false,
  borderWidth: 2,
  pointRadius: 3,
  tension: 0.3,
};

// Chart 1: Users & Groups over time
function usersGroupsChart(history) {
  return chartUrl({
    type: 'line',
    data: {
      labels: history.weeks,
      datasets: [
        { ...BASE_LINE_DATASET, label: 'New Users',  data: history.newUsers,  borderColor: COLORS.blue,   backgroundColor: COLORS.blueFill },
        { ...BASE_LINE_DATASET, label: 'New Groups', data: history.newGroups, borderColor: COLORS.green,  backgroundColor: COLORS.greenFill },
      ],
    },
    options: { title: { display: true, text: 'Users & Groups' }, scales: { yAxes: [{ ticks: { beginAtZero: true } }] } },
  });
}

// Chart 2: Wishes & Gifted over time
function wishesGiftedChart(history) {
  return chartUrl({
    type: 'line',
    data: {
      labels: history.weeks,
      datasets: [
        { ...BASE_LINE_DATASET, label: 'New Wishes', data: history.newWishes, borderColor: COLORS.blue,   backgroundColor: COLORS.blueFill },
        { ...BASE_LINE_DATASET, label: 'Gifted',     data: history.gifted,    borderColor: COLORS.orange, backgroundColor: COLORS.orangeFill },
      ],
    },
    options: { title: { display: true, text: 'Wishes & Gifted' }, scales: { yAxes: [{ ticks: { beginAtZero: true } }] } },
  });
}

// Chart 3: Logins (total + unique users)
function loginsChart(history) {
  return chartUrl({
    type: 'line',
    data: {
      labels: history.weeks,
      datasets: [
        { ...BASE_LINE_DATASET, label: 'Total Logins',  data: history.logins,       borderColor: COLORS.blue,  backgroundColor: COLORS.blueFill },
        { ...BASE_LINE_DATASET, label: 'Unique Users',  data: history.uniqueLogins, borderColor: COLORS.green, backgroundColor: COLORS.greenFill },
      ],
    },
    options: { title: { display: true, text: 'Logins' }, scales: { yAxes: [{ ticks: { beginAtZero: true } }] } },
  });
}

// Chart 4: Page views — stacked bar (top 5 pages) + total line on secondary Y axis
function pageViewsChart(history) {
  const pageColors = [COLORS.blue, COLORS.green, COLORS.orange, COLORS.purple, COLORS.red];
  const pageDatasets = Object.entries(history.pageBreakdown).map(([path, counts], i) => ({
    type: 'bar',
    label: path,
    data: counts,
    backgroundColor: pageColors[i % pageColors.length].replace(', 1)', ', 0.7)'),
    stack: 'pages',
    yAxisID: 'left',
  }));
  pageDatasets.push({
    ...BASE_LINE_DATASET,
    type: 'line',
    label: 'Total Pageviews',
    data: history.pageviews,
    borderColor: COLORS.grey,
    backgroundColor: COLORS.greyFill,
    yAxisID: 'right',
  });
  return chartUrl({
    type: 'bar',
    data: { labels: history.weeks, datasets: pageDatasets },
    options: {
      title: { display: true, text: 'Page Views' },
      scales: {
        yAxes: [
          { id: 'left',  position: 'left',  stacked: true, ticks: { beginAtZero: true } },
          { id: 'right', position: 'right', ticks: { beginAtZero: true }, gridLines: { drawOnChartArea: false } },
        ],
      },
    },
  });
}

// Chart 5: HTTP errors + avg response time (secondary Y axis)
function metricsChart(history) {
  return chartUrl({
    type: 'line',
    data: {
      labels: history.weeks,
      datasets: [
        { ...BASE_LINE_DATASET, label: 'HTTP Errors',      data: history.httpErrors,    borderColor: COLORS.red,  backgroundColor: COLORS.redFill,  yAxisID: 'left' },
        { ...BASE_LINE_DATASET, label: 'Avg Response (ms)', data: history.avgResponseMs, borderColor: COLORS.blue, backgroundColor: COLORS.blueFill, yAxisID: 'right' },
      ],
    },
    options: {
      title: { display: true, text: 'Metrics' },
      scales: {
        yAxes: [
          { id: 'left',  position: 'left',  ticks: { beginAtZero: true } },
          { id: 'right', position: 'right', ticks: { beginAtZero: true }, gridLines: { drawOnChartArea: false } },
        ],
      },
    },
  });
}

module.exports = { usersGroupsChart, wishesGiftedChart, loginsChart, pageViewsChart, metricsChart };
