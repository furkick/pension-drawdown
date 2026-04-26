export function calcProjection(s) {
  const rows = [];
  const annualSpend = s.settings.monthlyOutgoings * 12;

  let accounts = s.accounts.map(a => ({ ...a, balance: Number(a.balance) }));
  let pensions  = s.pensions.map(p => ({ ...p, balance: Number(p.balance) }));

  for (let age = s.settings.currentAge; age <= 100; age++) {
    const openingBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
    if (openingBalance <= 0) break;

    // Interest — ISA interest is tax-free
    let totalInterest   = 0;
    let taxableInterest = 0;
    accounts = accounts.map(a => {
      const interest = a.balance * (a.interestRate / 100);
      totalInterest   += interest;
      if (!a.isISA) taxableInterest += interest;
      return { ...a, balance: a.balance + interest };
    });

    // State pension
    const statePension = age >= s.settings.statePensionStartAge
      ? s.settings.annualStatePension : 0;

    // Pension drawdown
    let pensionDrawdown = 0;
    let pensionTaxable  = 0;
    pensions = pensions.map(p => {
      if (p.balance <= 0) return p;
      const drawn      = Math.min(Number(p.annualDrawdown) || 0, p.balance);
      const taxFreeAmt = drawn * ((Number(p.taxFreePercentage) || 25) / 100);
      pensionDrawdown += drawn;
      pensionTaxable  += drawn - taxFreeAmt;
      return { ...p, balance: p.balance - drawn };
    });

    // Gross taxable income
    const grossTaxable = taxableInterest + statePension + pensionTaxable;

    // Tax: apply personal allowance + savings allowance, then flat rate
    const taxableAfterAllowances = Math.max(
      0,
      grossTaxable - s.settings.personalAllowance - s.settings.savingsAllowance,
    );
    const taxDeducted = taxableAfterAllowances * s.settings.incomeTaxRate;

    // Deduct spend + tax from accounts (non-ISA first, then ISA)
    const totalDeduction = annualSpend + taxDeducted;
    let remaining = totalDeduction;
    accounts = accounts.map(a => {
      if (remaining <= 0) return a;
      const take = Math.min(a.balance, remaining);
      remaining -= take;
      return { ...a, balance: a.balance - take };
    });

    const closingBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
    const annualCost     = age === s.settings.currentAge
      ? null
      : openingBalance - closingBalance;

    rows.push({
      age,
      openingBalance,
      totalInterest,
      taxableInterest,
      statePension,
      pensionDrawdown,
      grossTaxable,
      taxDeducted,
      annualSpend,
      closingBalance,
      annualCost,
    });
  }

  return rows;
}
