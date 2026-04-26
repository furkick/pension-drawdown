import { fmtCurrency, fmtCurrencyDec } from '../format.js';

function rowClass(row, s) {
  const annualSpend = s.settings.monthlyOutgoings * 12;
  if (row.closingBalance <= 0)                         return 'bg-rose-200 font-bold';
  if (row.closingBalance < annualSpend)                return 'bg-rose-50 text-rose-900';
  if (row.closingBalance < annualSpend * 2)            return 'bg-amber-50 text-amber-900';
  if (row.age === s.settings.statePensionStartAge)     return 'border-l-4 border-emerald-500 bg-emerald-50';
  return 'hover:bg-slate-50';
}

const HEADERS = [
  'Age',
  'Cash Opening', 'Pension Opening',
  'Interest / Growth',
  'State Pension',
  'Pension Drawn', 'Pension Tax',
  'Tax Paid',
  'Cash Withdrawn',
  'Cash Closing', 'Pension Closing',
];

export function renderTable(rows, s) {
  if (!rows.length) {
    return `
    <section class="bg-white rounded-xl shadow p-6 mb-4">
      <p class="text-sm text-slate-400">No projection data — please add accounts.</p>
    </section>`;
  }

  return `
  <section class="bg-white rounded-xl shadow mb-4">
    <div class="p-6 pb-2">
      <h2 class="text-lg font-semibold text-slate-800">Year-by-Year Projection (to Age 100)</h2>
    </div>
    <div class="overflow-auto max-h-[70vh]">
      <table class="w-full text-sm">
        <thead class="sticky top-0 bg-slate-800 text-white">
          <tr>
            ${HEADERS.map((h, i) => `
            <th class="px-3 py-3 text-xs uppercase tracking-wide ${i === 0 ? 'text-left' : 'text-right'} whitespace-nowrap">${h}</th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => {
            const rc = rowClass(row, s);
            return `
            <tr class="${rc}">
              <td class="px-3 py-2 tabular-nums">${row.age}</td>
              <td class="px-3 py-2 text-right tabular-nums">${fmtCurrency(row.openingCash)}</td>
              <td class="px-3 py-2 text-right tabular-nums">${fmtCurrency(row.openingPension)}</td>
              <td class="px-3 py-2 text-right tabular-nums">${fmtCurrency(row.totalInterest)}</td>
              <td class="px-3 py-2 text-right tabular-nums">${fmtCurrency(row.statePension)}</td>
              <td class="px-3 py-2 text-right tabular-nums">${fmtCurrency(row.pensionDrawdown)}</td>
              <td class="px-3 py-2 text-right tabular-nums">${fmtCurrencyDec(row.pensionDrawdownTax)}</td>
              <td class="px-3 py-2 text-right tabular-nums">${fmtCurrencyDec(row.taxDeducted)}</td>
              <td class="px-3 py-2 text-right tabular-nums">${fmtCurrency(row.cashWithdrawal)}</td>
              <td class="px-3 py-2 text-right tabular-nums">${fmtCurrency(row.closingCash)}</td>
              <td class="px-3 py-2 text-right tabular-nums">${fmtCurrency(row.closingPension)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </section>`;
}
