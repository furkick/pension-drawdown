import { fmtCurrency, fmtCurrencyDec } from '../format.js';

function rowClass(row, s) {
  const annualSpend = s.settings.monthlyOutgoings * 12;
  if (row.closingBalance <= 0)                     return 'bg-rose-200 font-bold';
  if (row.closingBalance < annualSpend)             return 'bg-rose-50 text-rose-900';
  if (row.closingBalance < annualSpend * 2)         return 'bg-amber-50 text-amber-900';
  if (row.age === s.settings.statePensionStartAge)  return 'border-l-4 border-emerald-500 bg-emerald-50';
  if (row.age === s.settings.pensionStartAge)       return 'border-l-4 border-blue-400 bg-blue-50';
  return '';
}

  'Cash Opening', 'Pension Opening',
function td(content, extraClass) {
  return '<td class="px-3 py-1.5 text-right tabular-nums ' + (extraClass || '') + '">' + content + '</td>';
}

function buildRow(row, hasPension, bdr) {
  const cells = [
    '<td class="px-3 py-1.5 font-medium tabular-nums">' + row.age + '</td>',
    td(fmtCurrency(row.openingCash), bdr),
  ];
  if (hasPension) cells.push(td(fmtCurrency(row.openingPension), ''));
  cells.push(td(fmtCurrency(row.totalCashInterest), bdr));
  cells.push(td(fmtCurrency(row.statePension), ''));
  if (hasPension) cells.push(td(fmtCurrency(row.totalPensionGrowth), ''));
  if (hasPension) cells.push(td(fmtCurrency(row.pensionDrawdown), bdr));
  if (hasPension) cells.push(td(fmtCurrencyDec(row.pensionDrawdownTax), ''));
  cells.push(td(fmtCurrencyDec(row.taxDeducted), bdr));
  cells.push(td(fmtCurrency(row.cashWithdrawal), bdr));
  cells.push(td(fmtCurrency(row.closingCash), bdr));
  if (hasPension) cells.push(td(fmtCurrency(row.closingPension), ''));
  return cells.join('');
}

export function renderTable(rows, s) {
  if (!rows.length) {
    return '<section class="bg-white rounded-xl shadow p-6 mb-4"><p class="text-sm text-slate-400">No projection data &mdash; please add accounts.</p></section>';
  }

  const hasPension = s.pensions.length > 0;
  const bdr = 'border-l border-slate-200';

  const colGroups = [
    { label: '',                    cols: 1,                  border: false },
    { label: 'Opening Balances',    cols: hasPension ? 2 : 1, border: true  },
    { label: 'Income &amp; Growth', cols: hasPension ? 3 : 2, border: true  },
    ...(hasPension ? [{ label: 'Pension', cols: 2, border: true }] : []),
    { label: 'Tax',                 cols: 1,                  border: true  },
    { label: 'Withdrawals',         cols: 1,                  border: true  },
    { label: 'Closing Balances',    cols: hasPension ? 2 : 1, border: true  },
  ];

  const subHeaders = [
    { label: 'Age',           border: false },
    { label: 'Cash',          border: true  },
    ...(hasPension ? [{ label: 'Pension',     border: false }] : []),
    { label: 'Interest',      border: true  },
    { label: 'State Pension', border: false },
    ...(hasPension ? [{ label: 'Growth',      border: false }] : []),
    ...(hasPension ? [{ label: 'Drawn',       border: true  }] : []),
    ...(hasPension ? [{ label: 'Pension Tax', border: false }] : []),
    { label: 'Total Tax',     border: true  },
    { label: 'Cash',          border: true  },
    { label: 'Cash',          border: true  },
    ...(hasPension ? [{ label: 'Pension',     border: false }] : []),
  ];

  const groupRow = colGroups.map(function(g) {
    const border = g.border ? 'border-l border-slate-600' : '';
    return '<th colspan="' + g.cols + '" class="px-3 py-1 text-center text-xs font-semibold uppercase tracking-wide text-slate-300 ' + border + ' whitespace-nowrap">' + g.label + '</th>';
  }).join('');

  const subRow = subHeaders.map(function(h, i) {
    const border = h.border ? 'border-l border-slate-600' : '';
    const align  = i === 0 ? 'text-left' : 'text-right';
    return '<th class="px-3 py-2 text-xs uppercase tracking-wide ' + align + ' ' + border + ' whitespace-nowrap">' + h.label + '</th>';
  }).join('');

  const bodyRows = rows.map(function(row, i) {
    const rc    = rowClass(row, s);
    const zebra = !rc && i % 2 === 1 ? 'bg-slate-50' : '';
    const cls   = rc || zebra;
    return '<tr class="' + cls + ' border-b border-slate-100">' + buildRow(row, hasPension, bdr) + '</tr>';
  }).join('');

  const pensionLegend = hasPension
    ? '<span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm bg-blue-100 border-l-2 border-blue-400"></span> Pension drawdown starts</span>'
    : '';

  return '<section class="bg-white rounded-xl shadow mb-4">'
    + '<div class="p-6 pb-2 flex items-center gap-4 flex-wrap">'
    + '<h2 class="text-lg font-semibold text-slate-800 flex-1">Year-by-Year Projection (to Age 100)</h2>'
    + '<div class="flex gap-3 text-xs flex-wrap">'
    + '<span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm bg-emerald-100 border-l-2 border-emerald-500"></span> State Pension starts</span>'
    + pensionLegend
    + '<span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm bg-amber-100"></span> Low funds</span>'
    + '<span class="flex items-center gap-1"><span class="inline-block w-3 h-3 rounded-sm bg-rose-200"></span> Depleted</span>'
    + '</div></div>'
    + '<div class="overflow-auto max-h-[70vh]">'
    + '<table class="w-full text-xs">'
    + '<thead class="sticky top-0 bg-slate-800 text-white">'
    + '<tr class="border-b border-slate-600">' + groupRow + '</tr>'
    + '<tr>' + subRow + '</tr>'
    + '</thead>'
    + '<tbody>' + bodyRows + '</tbody>'
    + '</table></div></section>';
}
