export function calcProjection(s) {
  const rows        = [];
  const annualSpend = s.settings.monthlyOutgoings * 12;
  const strategy    = s.settings.drawdownStrategy || 'cash-first';

  let cashAccounts = s.accounts.map(a => ({ ...a, balance: Number(a.balance) }));
  let penAccounts  = s.pensions.map(p => ({ ...p, balance: Number(p.balance) }));

  for (let age = s.settings.currentAge; age <= 100; age++) {
    const openingCash    = cashAccounts.reduce((sum, a) => sum + a.balance, 0);
    const openingPension = penAccounts.reduce((sum, p) => sum + p.balance, 0);

    // --- Interest on cash accounts (ISA interest is tax-free) ---
    let totalCashInterest = 0;
    let taxableInterest   = 0;
    cashAccounts = cashAccounts.map(a => {
      const interest = a.balance * (a.interestRate / 100);
      totalCashInterest += interest;
      if (!a.isISA) taxableInterest += interest;
      return { ...a, balance: a.balance + interest };
    });

    // --- Growth on pension accounts ---
    let totalPensionGrowth = 0;
    penAccounts = penAccounts.map(p => {
      const growth = p.balance * ((Number(p.growthRate) || 0) / 100);
      totalPensionGrowth += growth;
      return { ...p, balance: p.balance + growth };
    });

    const totalInterest = totalCashInterest + totalPensionGrowth;

    // --- State pension income ---
    const statePension = age >= s.settings.statePensionStartAge
      ? s.settings.annualStatePension : 0;

    // Net amount that must come from savings pots after state pension income
    const netNeeded = Math.max(0, annualSpend - statePension);

    // --- Determine drawdown split based on strategy ---
    const pensionActive     = age >= (s.settings.pensionStartAge ?? s.settings.statePensionStartAge);
    const totalPensionAvail = pensionActive ? penAccounts.reduce((sum, p) => sum + p.balance, 0) : 0;
    const totalCashAvail    = cashAccounts.reduce((sum, a) => sum + a.balance, 0);

    let pensionDrawdownTarget = 0;
    let cashWithdrawalTarget  = 0;

    if (strategy === 'pension-first') {
      pensionDrawdownTarget = Math.min(netNeeded, totalPensionAvail);
      cashWithdrawalTarget  = Math.min(netNeeded - pensionDrawdownTarget, totalCashAvail);
    } else if (strategy === 'split') {
      // Fixed annual pension drawdown; cash covers the remainder
      const fixedAnnual     = (s.settings.fixedMonthlyPensionDrawdown || 0) * 12;
      pensionDrawdownTarget = Math.min(fixedAnnual, totalPensionAvail);
      const cashNeeded      = Math.max(0, netNeeded - pensionDrawdownTarget);
      cashWithdrawalTarget  = Math.min(cashNeeded, totalCashAvail);
    } else {
      // cash-first (default)
      cashWithdrawalTarget  = Math.min(netNeeded, totalCashAvail);
      pensionDrawdownTarget = Math.min(netNeeded - cashWithdrawalTarget, totalPensionAvail);
    }

    // --- Apply pension drawdown proportionally across pensions ---
    let pensionDrawdown = 0;
    let pensionTaxable  = 0;
    if (pensionDrawdownTarget > 0 && totalPensionAvail > 0) {
      penAccounts = penAccounts.map(p => {
        if (p.balance <= 0) return p;
        const share      = (p.balance / totalPensionAvail) * pensionDrawdownTarget;
        const drawn      = Math.min(p.balance, share);
        const taxFreeAmt = drawn * ((Number(p.taxFreePercentage) || 25) / 100);
        pensionDrawdown += drawn;
        pensionTaxable  += drawn - taxFreeAmt;
        return { ...p, balance: p.balance - drawn };
      });
    }

    // --- Tax: UK 2026/27 rules (separated by income type) ---
    //
    // 1. Savings interest tax
    //    The PA is first consumed by non-savings income (state pension). Whatever
    //    remains of the PA shelters interest before the Starting Rate + PSA kick in.
    //    Pre-67:  threshold = PA(12570) + SA(6000) = £18,570
    //    Post-67: threshold = (PA - SP)(~£22)  + SA(6000) = £6,022
    const taxFreeInterestLimit = Math.max(0, s.settings.personalAllowance - statePension)
      + s.settings.savingsAllowance;
    const taxableInterestExcess = Math.max(0, taxableInterest - taxFreeInterestLimit);
    const interestTax = taxableInterestExcess * s.settings.incomeTaxRate;

    // 2. Non-savings income tax (state pension + taxable pension drawdown above PA)
    //    Split so we can report pension-drawdown tax separately.
    //    State pension consumes PA first; pension drawdown uses any remainder.
    const paAfterStatePension     = Math.max(0, s.settings.personalAllowance - statePension);
    const taxableStatePension     = Math.max(0, statePension - s.settings.personalAllowance);
    const taxablePensionDrawdown  = Math.max(0, pensionTaxable - paAfterStatePension);
    const statePensionTax         = taxableStatePension    * s.settings.incomeTaxRate;
    const pensionDrawdownTax      = taxablePensionDrawdown * s.settings.incomeTaxRate;
    const nonSavingsTax           = statePensionTax + pensionDrawdownTax;

    const taxDeducted = interestTax + nonSavingsTax;

    // Kept for informational use in row data
    const grossTaxable = taxableInterest + statePension + pensionTaxable;

    // --- Deduct cash withdrawal + tax from cash accounts (non-ISA first, then ISA) ---
    let remaining = cashWithdrawalTarget + taxDeducted;
    cashAccounts = cashAccounts.map(a => {
      if (remaining <= 0 || a.isISA) return a;
      const take = Math.min(a.balance, remaining);
      remaining -= take;
      return { ...a, balance: a.balance - take };
    });
    cashAccounts = cashAccounts.map(a => {
      if (remaining <= 0 || !a.isISA) return a;
      const take = Math.min(a.balance, remaining);
      remaining -= take;
      return { ...a, balance: a.balance - take };
    });

    const closingCash    = cashAccounts.reduce((sum, a) => sum + a.balance, 0);
    const closingPension = penAccounts.reduce((sum, p) => sum + p.balance, 0);

    rows.push({
      age,
      openingCash,
      openingPension,
      openingBalance: openingCash + openingPension,
      totalInterest,
      totalCashInterest,
      totalPensionGrowth,
      taxableInterest,
      statePension,
      pensionDrawdown,
      pensionDrawdownTax,
      grossTaxable,
      taxDeducted,
      annualSpend,
      cashWithdrawal: cashWithdrawalTarget,
      closingCash,
      closingPension,
      closingBalance: closingCash + closingPension,
    });
  }

  return rows;
}
