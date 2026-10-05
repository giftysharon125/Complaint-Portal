/* =====================================================
   dashboard.js — Chart.js helpers shared by dashboards
   ===================================================== */

const CHART_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#8b5cf6', '#0ea5e9', '#64748b', '#d946ef'];

function chartReady() {
  return typeof window.Chart !== 'undefined';
}

function emptyChartMessage(canvasId, text = 'Chart library not loaded (offline?)') {
  const canvas = document.getElementById(canvasId);
  if (canvas) {
    canvas.outerHTML = `<div class="chart-empty">${text}</div>`;
  }
}

function makeChart(canvasId, config) {
  if (!chartReady()) {
    emptyChartMessage(canvasId);
    return null;
  }
  const el = document.getElementById(canvasId);
  if (!el) return null;
  return new Chart(el.getContext('2d'), config);
}

/* Doughnut chart of complaint statuses */
function statusDoughnut(canvasId, byStatus) {
  const map = {};
  (byStatus || []).forEach((s) => (map[s.status] = s.count));
  const labels = STATUSES.filter((s) => map[s]);
  const data = labels.map((s) => map[s]);
  const colorMap = {
    Submitted: '#94a3b8',
    'Under Review': '#f59e0b',
    Assigned: '#2563eb',
    'In Progress': '#6366f1',
    Resolved: '#16a34a',
    Closed: '#64748b',
    Rejected: '#dc2626',
  };
  return makeChart(canvasId, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: labels.map((l) => colorMap[l] || '#94a3b8'), borderWidth: 2, borderColor: '#fff' }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
    },
  });
}

/* Horizontal bar chart of complaints per category */
function categoryBarChart(canvasId, byCategory) {
  const labels = (byCategory || []).map((c) => c.name);
  const data = (byCategory || []).map((c) => c.count);
  return makeChart(canvasId, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ data, backgroundColor: '#2563eb', borderRadius: 4, maxBarThickness: 26 }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { precision: 0 }, grid: { color: '#f1f5f9' } },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } },
      },
    },
  });
}

/* Line chart of complaints over the last 14 days */
function timeLineChart(canvasId, overTime) {
  const labels = (overTime || []).map((d) =>
    new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  );
  const data = (overTime || []).map((d) => d.count);
  return makeChart(canvasId, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Complaints',
          data,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.08)',
          fill: true,
          tension: 0.3,
          pointRadius: 2.5,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: '#f1f5f9' } },
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      },
    },
  });
}
