export const GBP = new Intl.NumberFormat('en-GB', {
  style: 'currency', currency: 'GBP', maximumFractionDigits: 0,
});

export const GBP2 = new Intl.NumberFormat('en-GB', {
  style: 'currency', currency: 'GBP', minimumFractionDigits: 2, maximumFractionDigits: 2,
});

export function fmtCurrency(n) {
  if (n == null || n === 0) return '—';
  return GBP.format(Math.round(n));
}

export function fmtCurrencyDec(n) {
  if (n == null || n === 0) return '—';
  return GBP2.format(n);
}

export function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
