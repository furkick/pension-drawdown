import { escHtml } from '../format.js';

export function renderPensions(s) {
  return `
  <section class="bg-white rounded-xl shadow p-6 mb-4">
    <h2 class="text-lg font-semibold text-slate-800 mb-4">Pensions</h2>
    ${s.pensions.length === 0
      ? '<p class="text-sm text-slate-400 mb-4">No pensions added yet.</p>'
      : `<div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th class="pb-2 text-left">Name</th>
            <th class="pb-2 text-right">Balance (£)</th>
            <th class="pb-2 text-right">Annual Drawdown (£)</th>
            <th class="pb-2 text-right">Tax-Free (%)</th>
            <th class="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          ${s.pensions.map(p => `
          <tr class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-2">
              <input type="text" value="${escHtml(p.name)}" placeholder="Pension name"
                data-action="pension" data-id="${p.id}" data-field="name"
                class="block w-full rounded border-slate-300 text-sm focus:border-emerald-500 focus:ring-emerald-500" />
            </td>
            <td class="py-2 pr-2">
              <input type="number" step="0.01" value="${Number(p.balance)}"
                data-action="pension" data-id="${p.id}" data-field="balance"
                class="block w-full rounded border-slate-300 text-sm text-right tabular-nums focus:border-emerald-500 focus:ring-emerald-500" />
            </td>
            <td class="py-2 pr-2">
              <input type="number" step="1" value="${Number(p.annualDrawdown) || 0}"
                data-action="pension" data-id="${p.id}" data-field="annualDrawdown"
                class="block w-full rounded border-slate-300 text-sm text-right tabular-nums focus:border-emerald-500 focus:ring-emerald-500" />
            </td>
            <td class="py-2 pr-2">
              <input type="number" step="1" min="0" max="100" value="${Number(p.taxFreePercentage) || 25}"
                data-action="pension" data-id="${p.id}" data-field="taxFreePercentage"
                class="block w-full rounded border-slate-300 text-sm text-right tabular-nums focus:border-emerald-500 focus:ring-emerald-500" />
            </td>
            <td class="py-2 pl-2">
              <button data-action="delete-pension" data-id="${p.id}"
                class="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded text-xs font-medium">×</button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>`}
    <button data-action="add-pension"
      class="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
      + Add Pension
    </button>
  </section>`;
}
