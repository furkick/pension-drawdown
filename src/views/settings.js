export function renderSettings(s) {
  const strategy = s.settings.drawdownStrategy || 'cash-first';

  function numInput(key, step = '1') {
    const raw = s.settings[key];
    const val = key === 'incomeTaxRate' ? (raw * 100).toFixed(0) : raw;
    return `<input type="number" step="${step}" value="${val}"
      data-action="setting" data-key="${key}"
      class="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" />`;
  }

  function field(label, input) {
    return `<div><label class="block text-sm font-medium text-slate-700 mb-1">${label}</label>${input}</div>`;
  }

  function groupHeading(title) {
    return `<div class="col-span-full mt-2 mb-1 border-b border-slate-200 pb-1">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-400">${title}</h3>
    </div>`;
  }

  return `
  <section class="bg-white rounded-xl shadow p-6 mb-4">
    <h2 class="text-lg font-semibold text-slate-800 mb-4">Settings</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">

      ${groupHeading('Your Details')}
      ${field('Current Age', numInput('currentAge'))}
      ${field('Monthly Outgoings Target (£)', numInput('monthlyOutgoings'))}

      ${groupHeading('State Pension')}
      ${field('Annual State Pension (£)', numInput('annualStatePension'))}
      ${field('State Pension Start Age', numInput('statePensionStartAge'))}

      ${groupHeading('Pension Drawdown')}
      ${field('Pension Drawdown Start Age', numInput('pensionStartAge'))}
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">Drawdown Strategy</label>
        <select data-action="setting" data-key="drawdownStrategy"
          class="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm">
          <option value="cash-first"    ${strategy === 'cash-first'    ? 'selected' : ''}>A — Cash First</option>
          <option value="pension-first" ${strategy === 'pension-first' ? 'selected' : ''}>B — Pension First</option>
          <option value="split"         ${strategy === 'split'         ? 'selected' : ''}>C — Split (fixed pension + cash top-up)</option>
        </select>
      </div>
      <div class="${strategy === 'split' ? '' : 'opacity-40 pointer-events-none'}">
        <label class="block text-sm font-medium text-slate-700 mb-1">Fixed Monthly Pension Drawdown (£) <span class="font-normal text-slate-400">(C only)</span></label>
        <input type="number" step="1" min="0" value="${s.settings.fixedMonthlyPensionDrawdown || 0}"
          data-action="setting" data-key="fixedMonthlyPensionDrawdown"
          class="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm" />
      </div>

      ${groupHeading('Tax')}
      ${field('Personal Allowance (£)', numInput('personalAllowance'))}
      ${field('Savings Allowance — Starting Rate + PSA (£)', numInput('savingsAllowance'))}
      ${field('Income Tax Rate (%)', numInput('incomeTaxRate', '1'))}

    </div>
  </section>`;
}
