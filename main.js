import './style.css';

// ---------------------------------------------------------------------------
// TODO 1: Inflation toggle � uprate monthlyOutgoings and annualStatePension
//         annually by a configurable % (e.g. 2.5%).
// TODO 2: Per-account balance chart � stacked area showing each account
//         depleting separately over time.
// TODO 3: Export to CSV button for the projection table.
// TODO 4: Higher/lower rate tax band � currently flat 20%; extend to handle
//         40% above �50,270 automatically.
// TODO 5: Pension lifetime allowance warning if reinstated by future govt.
// ---------------------------------------------------------------------------

import { state, saveState } from './src/state.js';
import { calcProjection }   from './src/projection.js';
import { showToast }        from './src/toast.js';
import { renderSettings }   from './src/views/settings.js';
import { renderAccounts, updateAccountsSummary } from './src/views/accounts.js';
import { renderPensions }   from './src/views/pensions.js';
import { renderActions }    from './src/views/actions.js';
import { renderTable }      from './src/views/table.js';
import {
  renderChartsSection,
  mountCharts,
  toggleCharts,
} from './src/charts.js';

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

function render() {
  const rows = calcProjection(state);
  document.getElementById('app').innerHTML = `
    <header class="mb-6">
      <h1 class="text-2xl font-bold text-slate-900">Retirement Tax &amp; Drawdown Calculator</h1>
    </header>
    ${renderSettings(state)}
    ${renderAccounts(state)}
    ${renderPensions(state)}
    ${renderChartsSection()}
    ${renderTable(rows, state)}
    ${renderActions()}
  `;
  mountCharts(rows);
}

function renderTableInPlace(rows) {
  const sections = document.querySelectorAll('#app section');
  const last = sections[sections.length - 1];
  if (last) {
    const tmp = document.createElement('div');
    tmp.innerHTML = renderTable(rows, state);
    last.replaceWith(tmp.firstElementChild);
  }
}

// ---------------------------------------------------------------------------
// Account helpers
// ---------------------------------------------------------------------------

function addAccount() {
  state.accounts.push({ id: crypto.randomUUID(), name: '', balance: 0, interestRate: 0, isISA: false });
  saveState(state);
  render();
}

function deleteAccount(id) {
  state.accounts = state.accounts.filter(a => a.id !== id);
  saveState(state);
  render();
}

function updateAccount(id, field, value) {
  const acc = state.accounts.find(a => a.id === id);
  if (!acc) return;
  if (field === 'isISA')     acc[field] = Boolean(value);
  else if (field === 'name') acc[field] = value;
  else                       acc[field] = parseFloat(value) || 0;
  saveState(state);
  const rows = calcProjection(state);
  updateAccountsSummary(state.accounts);
  renderTableInPlace(rows);
  mountCharts(rows);
}

// ---------------------------------------------------------------------------
// Pension helpers
// ---------------------------------------------------------------------------

function addPension() {
  state.pensions.push({ id: crypto.randomUUID(), name: '', balance: 0, growthRate: 5, taxFreePercentage: 25 });
  saveState(state);
  render();
}

function deletePension(id) {
  state.pensions = state.pensions.filter(p => p.id !== id);
  saveState(state);
  render();
}

function updatePension(id, field, value) {
  const pen = state.pensions.find(p => p.id === id);
  if (!pen) return;
  if (field === 'name') pen[field] = value;
  else                  pen[field] = parseFloat(value) || 0;
  saveState(state);
  const rows = calcProjection(state);
  renderTableInPlace(rows);
  mountCharts(rows);
}

// ---------------------------------------------------------------------------
// Settings helpers
// ---------------------------------------------------------------------------

function updateSetting(key, rawValue) {
  if (key === 'incomeTaxRate') {
    state.settings[key] = parseFloat(rawValue) / 100 || 0;
  } else if (key === 'drawdownStrategy') {
    state.settings[key] = rawValue;
  } else {
    state.settings[key] = parseFloat(rawValue) || 0;
  }
  saveState(state);
  if (key === 'drawdownStrategy') {
    render();
    return;
  }
  const rows = calcProjection(state);
  renderTableInPlace(rows);
  mountCharts(rows);
}

// ---------------------------------------------------------------------------
// Event delegation
// ---------------------------------------------------------------------------

document.getElementById('app').addEventListener('input', e => {
  const el     = e.target;
  const action = el.dataset.action;
  if (!action) return;

  if (action === 'setting') {
    updateSetting(el.dataset.key, el.value);
  } else if (action === 'account') {
    updateAccount(el.dataset.id, el.dataset.field, el.type === 'checkbox' ? el.checked : el.value);
  } else if (action === 'pension') {
    updatePension(el.dataset.id, el.dataset.field, el.value);
  }
});

document.getElementById('app').addEventListener('click', e => {
  const el     = e.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;

  if      (action === 'add-account')    addAccount();
  else if (action === 'delete-account') deleteAccount(el.dataset.id);
  else if (action === 'add-pension')    addPension();
  else if (action === 'delete-pension') deletePension(el.dataset.id);
  else if (action === 'save')           { saveState(state); showToast('Saved ✓'); }
  else if (action === 'reset') {
    if (confirm('Reset all data to defaults? This cannot be undone.')) {
      localStorage.removeItem('retirementCalc');
      location.reload();
    }
  } else if (action === 'toggle-charts') {
    toggleCharts(calcProjection(state));
  }
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

render();
