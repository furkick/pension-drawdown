import { GBP, escHtml } from '../format.js';

function accountSummary(accounts) {
  const total         = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const totalInterest = accounts.reduce((s, a) => s + Number(a.balance) * (Number(a.interestRate) / 100), 0);
  const blended       = total > 0 ? (totalInterest / total * 100) : 0;
  const taxable       = accounts.filter(a => !a.isISA).reduce((s, a) => s + Number(a.balance), 0);
  const taxablePct    = total > 0 ? (taxable / total * 100).toFixed(1) : '0.0';
  return { total, blended, taxablePct };
}

export function renderAccounts(s) {
  const { total, blended, taxablePct } = accountSummary(s.accounts);
  return `
  <section class="bg-white rounded-xl shadow p-6 mb-4">
    <h2 class="text-lg font-semibold text-slate-800 mb-4">Savings Accounts</h2>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th class="pb-2 text-left">Name</th>
            <th class="pb-2 text-right">Balance (£)</th>
            <th class="pb-2 text-right">Rate (%)</th>
            <th class="pb-2 text-center">ISA?</th>
            <th class="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          ${s.accounts.map(a => `
          <tr class="border-b border-slate-100 hover:bg-slate-50">
            <td class="py-2 pr-2">
              <input type="text" value="${escHtml(a.name)}" placeholder="Account name"
                data-action="account" data-id="${a.id}" data-field="name"
                class="block w-full rounded border-slate-300 text-sm focus:border-emerald-500 focus:ring-emerald-500" />
            </td>
            <td class="py-2 pr-2">
              <input type="number" step="0.01" value="${Number(a.balance)}"
                data-action="account" data-id="${a.id}" data-field="balance"
                class="block w-full rounded border-slate-300 text-sm text-right tabular-nums focus:border-emerald-500 focus:ring-emerald-500" />
            </td>
            <td class="py-2 pr-2">
              <input type="number" step="0.01" value="${Number(a.interestRate)}"
                data-action="account" data-id="${a.id}" data-field="interestRate"
                class="block w-full rounded border-slate-300 text-sm text-right tabular-nums focus:border-emerald-500 focus:ring-emerald-500" />
            </td>
            <td class="py-2 text-center">
              <input type="checkbox" ${a.isISA ? 'checked' : ''}
                data-action="account" data-id="${a.id}" data-field="isISA"
                class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
            </td>
            <td class="py-2 pl-2">
              <button data-action="delete-account" data-id="${a.id}"
                class="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded text-xs font-medium">×</button>
            </td>
          </tr>`).join('')}
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-slate-300 bg-slate-50 font-semibold text-sm">
            <td class="py-2 text-slate-700">Total</td>
            <td class="py-2 text-right tabular-nums text-slate-800">${GBP.format(Math.round(total))}</td>
            <td class="py-2 text-right tabular-nums text-slate-600">${blended.toFixed(2)}%</td>
            <td class="py-2 text-center text-xs text-slate-500">${taxablePct}%<br><span class="font-normal">taxable</span></td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
    <button data-action="add-account"
      class="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
      + Add Account
    </button>
  </section>`;
}
