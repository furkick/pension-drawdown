import { Chart, registerables } from 'chart.js';
import { GBP, GBP2 } from './format.js';

Chart.register(...registerables);

let chartsVisible = false;
let balanceChart  = null;
let taxChart      = null;

export function renderChartsSection() {
  return `
  <section class="bg-white rounded-xl shadow p-6 mb-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-slate-800">Charts</h2>
      <button data-action="toggle-charts"
        class="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
        ${chartsVisible ? 'Hide Charts' : 'Show Charts'}
      </button>
    </div>
    <div id="chart-grid" class="${chartsVisible ? '' : 'hidden'} grid grid-cols-1 md:grid-cols-2 gap-6">
      <div><canvas id="balance-chart"></canvas></div>
      <div><canvas id="tax-chart"></canvas></div>
    </div>
  </section>`;
}

export function mountCharts(rows) {
  if (!chartsVisible) return;

  const ages     = rows.map(r => r.age);
  const balances = rows.map(r => Math.round(r.openingBalance));
  const taxes    = rows.map(r => Math.round(r.taxDeducted));

  const balanceEl = document.getElementById('balance-chart');
  const taxEl     = document.getElementById('tax-chart');
  if (!balanceEl || !taxEl) return;

  if (balanceChart) { balanceChart.destroy(); balanceChart = null; }
  if (taxChart)     { taxChart.destroy();     taxChart = null; }

  balanceChart = new Chart(balanceEl, {
    type: 'line',
    data: {
      labels: ages,
      datasets: [{
        label: 'Opening Balance',
        data: balances,
        borderColor: '#059669',
        backgroundColor: 'rgba(5,150,105,0.08)',
        fill: true,
        tension: 0.3,
        pointRadius: 2,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => GBP.format(ctx.parsed.y) } },
      },
      scales: {
        x: { title: { display: true, text: 'Age' } },
        y: { ticks: { callback: v => GBP.format(v) } },
      },
    },
  });

  taxChart = new Chart(taxEl, {
    type: 'bar',
    data: {
      labels: ages,
      datasets: [{
        label: 'Tax Deducted',
        data: taxes,
        backgroundColor: '#f59e0b',
        borderRadius: 3,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => GBP2.format(ctx.parsed.y) } },
      },
      scales: {
        x: { title: { display: true, text: 'Age' } },
        y: { ticks: { callback: v => GBP.format(v) } },
      },
    },
  });
}

export function toggleCharts(rows) {
  chartsVisible = !chartsVisible;

  if (!chartsVisible) {
    if (balanceChart) { balanceChart.destroy(); balanceChart = null; }
    if (taxChart)     { taxChart.destroy();     taxChart = null; }
  }

  const grid = document.getElementById('chart-grid');
  const btn  = document.querySelector('[data-action="toggle-charts"]');
  if (grid) grid.classList.toggle('hidden', !chartsVisible);
  if (btn)  btn.textContent = chartsVisible ? 'Hide Charts' : 'Show Charts';
  if (chartsVisible) mountCharts(rows);
}
