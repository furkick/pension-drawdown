export const SETTINGS_META = [
  { key: 'monthlyOutgoings',     label: 'Monthly Outgoings Target',               prefix: '£', type: 'number', step: '1'    },
  { key: 'annualStatePension',   label: 'Annual State Pension',                   prefix: '£', type: 'number', step: '1'    },
  { key: 'statePensionStartAge', label: 'State Pension Start Age',                prefix: '',  type: 'number', step: '1'    },
  { key: 'personalAllowance',    label: 'Personal Allowance',                     prefix: '£', type: 'number', step: '1'    },
  { key: 'savingsAllowance',     label: 'Savings Allowance (Starting Rate + PSA)', prefix: '£', type: 'number', step: '1'   },
  { key: 'currentAge',           label: 'Current Age',                            prefix: '',  type: 'number', step: '1'    },
  { key: 'incomeTaxRate',        label: 'Income Tax Rate',                        prefix: '%', type: 'number', step: '0.01' },
];

export function renderSettings(s) {
  return `
  <section class="bg-white rounded-xl shadow p-6 mb-4">
    <h2 class="text-lg font-semibold text-slate-800 mb-4">Settings</h2>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      ${SETTINGS_META.map(({ key, label, prefix, type, step }) => {
        const rawVal     = s.settings[key];
        const displayVal = key === 'incomeTaxRate' ? (rawVal * 100).toFixed(0) : rawVal;
        return `
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">
            ${label}${prefix === '£' ? ' (£)' : prefix === '%' ? ' (%)' : ''}
          </label>
          <input
            type="${type}"
            step="${step}"
            value="${displayVal}"
            data-action="setting"
            data-key="${key}"
            class="block w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
          />
        </div>`;
      }).join('')}
    </div>
  </section>`;
}
