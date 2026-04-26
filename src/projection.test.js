import { describe, it, expect } from 'vitest';
import { calcProjection } from './projection.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Default 2026/27 UK tax settings — no accounts, no pensions */
function baseState(overrides = {}) {
  return {
    accounts: [],
    pensions: [],
    settings: {
      currentAge:                  60,
      monthlyOutgoings:            1500,
      annualStatePension:          11502,   // ~£959/month (2026 full new SP)
      statePensionStartAge:        67,
      pensionStartAge:             67,
      personalAllowance:           12570,
      savingsAllowance:            6000,    // Starting Rate + PSA combined
      incomeTaxRate:               0.20,
      drawdownStrategy:            'cash-first',
      fixedMonthlyPensionDrawdown: 0,
      ...overrides.settings,
    },
    accounts: overrides.accounts || [],
    pensions: overrides.pensions || [],
  };
}

function cashAccount(balance, interestRate, isISA = false) {
  return { id: '1', name: 'Test', balance, interestRate, isISA };
}

function pensionPot(balance, growthRate = 5, taxFreePercentage = 25) {
  return { id: 'p1', name: 'Pension', balance, growthRate, taxFreePercentage };
}

// ---------------------------------------------------------------------------
// 1. Projection basics
// ---------------------------------------------------------------------------

describe('Projection basics', () => {
  it('always produces rows from currentAge to 100', () => {
    const s = baseState({ accounts: [cashAccount(500000, 3)] });
    const rows = calcProjection(s);
    expect(rows[0].age).toBe(60);
    expect(rows[rows.length - 1].age).toBe(100);
    expect(rows.length).toBe(41);
  });

  it('produces 41 rows even when balances hit zero', () => {
    const s = baseState({ accounts: [cashAccount(1000, 1)] }); // tiny balance
    const rows = calcProjection(s);
    expect(rows.length).toBe(41);
  });

  it('closing balance of year N equals opening balance of year N+1', () => {
    const s = baseState({ accounts: [cashAccount(100000, 2)] });
    const rows = calcProjection(s);
    for (let i = 0; i < rows.length - 1; i++) {
      expect(rows[i + 1].openingCash).toBeCloseTo(rows[i].closingCash, 2);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Account management — ISA vs taxable
// ---------------------------------------------------------------------------

describe('Account management', () => {
  it('ISA interest does not contribute to taxableInterest', () => {
    const s = baseState({ accounts: [cashAccount(100000, 5, true)] }); // ISA
    const rows = calcProjection(s);
    expect(rows[0].taxableInterest).toBe(0);
  });

  it('non-ISA interest is fully taxable', () => {
    const s = baseState({ accounts: [cashAccount(100000, 5, false)] });
    const rows = calcProjection(s);
    expect(rows[0].taxableInterest).toBeCloseTo(5000, 2);
  });

  it('multiple accounts sum correctly', () => {
    const s = baseState({
      accounts: [
        { id: '1', name: 'A', balance: 50000, interestRate: 4, isISA: false },
        { id: '2', name: 'B', balance: 30000, interestRate: 2, isISA: true  },
        { id: '3', name: 'C', balance: 20000, interestRate: 3, isISA: false },
      ],
    });
    const rows = calcProjection(s);
    expect(rows[0].openingCash).toBe(100000);
    // taxable interest = 50000*0.04 + 20000*0.03 = 2000+600 = 2600
    expect(rows[0].taxableInterest).toBeCloseTo(2600, 2);
  });
});

// ---------------------------------------------------------------------------
// 3. UK Tax Engine
// ---------------------------------------------------------------------------

describe('UK Tax Engine — pre-67 (no state pension)', () => {
  it('no tax when taxable interest is below £18,570 threshold', () => {
    // PA=12570 + SA=6000 = £18,570 free
    const s = baseState({ accounts: [cashAccount(300000, 5)] }); // interest=15000 < 18570
    const rows = calcProjection(s);
    expect(rows[0].taxDeducted).toBe(0);
  });

  it('taxes interest above the £18,570 threshold at 20%', () => {
    // balance=500000 @5% = £25,000 interest; excess = 25000-18570 = 6430; tax = 1286
    const s = baseState({ accounts: [cashAccount(500000, 5)] });
    const rows = calcProjection(s);
    expect(rows[0].taxDeducted).toBeCloseTo(6430 * 0.20, 1);
  });

  it('ISA interest does not consume the £18,570 allowance', () => {
    const s = baseState({
      accounts: [
        { id: '1', name: 'ISA',     balance: 400000, interestRate: 5, isISA: true  },
        { id: '2', name: 'Taxable', balance: 100000, interestRate: 5, isISA: false },
      ],
    });
    // taxable interest = 100000*0.05 = 5000, well under 18570 → no tax
    const rows = calcProjection(s);
    expect(rows[0].taxDeducted).toBe(0);
  });
});

describe('UK Tax Engine — post-67 (state pension arrives)', () => {
  it('state pension consumes the Personal Allowance, reducing tax-free interest limit', () => {
    // SP=11502 leaves only 12570-11502=1068 of PA + 6000 SA = £7,068 tax-free for interest
    // With 200000@5% = 10000 taxable interest → excess = 10000-7068 = 2932 → tax = 586.40
    const s = baseState({
      settings: { currentAge: 67, statePensionStartAge: 67 },
      accounts: [cashAccount(200000, 5)],
    });
    const rows = calcProjection(s);
    const expectedLimit = (12570 - 11502) + 6000; // 7068
    const expectedTax   = Math.max(0, 10000 - expectedLimit) * 0.20;
    expect(rows[0].taxDeducted).toBeCloseTo(expectedTax, 1);
  });

  it('state pension income above PA is itself taxed', () => {
    // SP=15000 > PA=12570 → taxable SP = 2430 → SP tax = 486
    const s = baseState({
      settings: { currentAge: 67, statePensionStartAge: 67, annualStatePension: 15000 },
      accounts: [cashAccount(100, 0)], // minimal cash, no interest tax
    });
    const rows = calcProjection(s);
    expect(rows[0].taxDeducted).toBeCloseTo(486, 1);
  });

  it('no state pension before statePensionStartAge', () => {
    const s = baseState({
      settings: { currentAge: 65, statePensionStartAge: 67 },
      accounts: [cashAccount(10000, 1)],
    });
    const rows = calcProjection(s);
    expect(rows[0].statePension).toBe(0);  // age 65
    expect(rows[2].statePension).toBe(11502); // age 67
  });
});

// ---------------------------------------------------------------------------
// 4. State pension offsets spending
// ---------------------------------------------------------------------------

describe('State pension offsets spending', () => {
  it('cash withdrawal is reduced by state pension income', () => {
    const annualSpend = 1500 * 12; // 18000
    const sp          = 11502;
    const s = baseState({
      settings: { currentAge: 67, statePensionStartAge: 67 },
      accounts: [cashAccount(300000, 0)], // 0% interest for clarity
    });
    const rows = calcProjection(s);
    // net needed from cash = annualSpend - SP = 18000 - 11502 = 6498 (before tax)
    expect(rows[0].cashWithdrawal).toBeCloseTo(annualSpend - sp, 0);
  });

  it('cash withdrawal equals full annualSpend before state pension age', () => {
    const annualSpend = 1500 * 12;
    const s = baseState({
      settings: { currentAge: 60, statePensionStartAge: 67 },
      accounts: [cashAccount(300000, 0)],
    });
    const rows = calcProjection(s);
    expect(rows[0].cashWithdrawal).toBeCloseTo(annualSpend, 0);
  });
});

// ---------------------------------------------------------------------------
// 5. Drawdown strategies
// ---------------------------------------------------------------------------

describe('Drawdown strategies', () => {
  function stateWithBoth(strategy, fixedMonthly = 0) {
    return baseState({
      settings: {
        currentAge: 67,
        statePensionStartAge: 67,
        pensionStartAge: 67,
        drawdownStrategy: strategy,
        fixedMonthlyPensionDrawdown: fixedMonthly,
      },
      accounts: [{ id: '1', name: 'Cash',    balance: 50000,  interestRate: 0, isISA: false }],
      pensions: [{ id: 'p1', name: 'Pension', balance: 200000, growthRate: 0,  taxFreePercentage: 25 }],
    });
  }

  it('Strategy A (cash-first): draws from cash before touching pension', () => {
    const s    = stateWithBoth('cash-first');
    const rows = calcProjection(s);
    // First row should draw from cash, pension untouched
    expect(rows[0].cashWithdrawal).toBeGreaterThan(0);
    expect(rows[0].pensionDrawdown).toBe(0);
  });

  it('Strategy A (cash-first): falls back to pension when cash is exhausted', () => {
    const s    = stateWithBoth('cash-first');
    const rows = calcProjection(s);
    const firstPensionRow = rows.find(r => r.pensionDrawdown > 0);
    expect(firstPensionRow).toBeDefined();
    // When pension is drawn, cash should be near zero
    expect(firstPensionRow.openingCash).toBeLessThan(1500 * 12);
  });

  it('Strategy B (pension-first): draws from pension before touching cash', () => {
    const s    = stateWithBoth('pension-first');
    const rows = calcProjection(s);
    expect(rows[0].pensionDrawdown).toBeGreaterThan(0);
    expect(rows[0].cashWithdrawal).toBe(0);
  });

  it('Strategy B (pension-first): falls back to cash when pension is exhausted', () => {
    const s    = stateWithBoth('pension-first');
    const rows = calcProjection(s);
    const firstCashRow = rows.find(r => r.cashWithdrawal > 0);
    expect(firstCashRow).toBeDefined();
    expect(firstCashRow.openingPension).toBeLessThan(1500 * 12);
  });

  it('Strategy C (split): draws fixed monthly amount from pension', () => {
    const fixedMonthly = 500;
    const s    = stateWithBoth('split', fixedMonthly);
    const rows = calcProjection(s);
    expect(rows[0].pensionDrawdown).toBeCloseTo(fixedMonthly * 12, 1);
  });

  it('Strategy C (split): cash covers remainder after pension and state pension', () => {
    const fixedMonthly  = 500;
    const annualSpend   = 1500 * 12;  // 18000
    const sp            = 11502;
    const s    = stateWithBoth('split', fixedMonthly);
    const rows = calcProjection(s);
    // netNeeded = 18000 - 11502 = 6498; pensionDrawdown = 6000; cashNeeded = 498
    const expectedCash = Math.max(0, annualSpend - sp - fixedMonthly * 12);
    expect(rows[0].cashWithdrawal).toBeCloseTo(expectedCash, 0);
  });
});

// ---------------------------------------------------------------------------
// 6. Pension growth & tax-free percentage
// ---------------------------------------------------------------------------

describe('Pension pot', () => {
  it('pension balance grows at the configured growth rate', () => {
    const s = baseState({
      settings: { currentAge: 60, pensionStartAge: 80 }, // no drawdown yet
      accounts: [cashAccount(500000, 0)],
      pensions: [pensionPot(100000, 5)],
    });
    const rows = calcProjection(s);
    expect(rows[0].totalPensionGrowth).toBeCloseTo(5000, 2);
    expect(rows[0].openingPension).toBe(100000);
    expect(rows[1].openingPension).toBeCloseTo(105000, 1);
  });

  it('pension is not drawn before pensionStartAge', () => {
    const s = baseState({
      settings: { currentAge: 60, pensionStartAge: 67 },
      accounts: [cashAccount(300000, 0)],
      pensions: [pensionPot(100000, 0)],
    });
    const rows = calcProjection(s);
    const beforePensionAge = rows.filter(r => r.age < 67);
    beforePensionAge.forEach(r => expect(r.pensionDrawdown).toBe(0));
  });

  it('25% tax-free means 75% of drawdown is taxable income', () => {
    // monthly 1000 → annual 12000; 75% taxable = 9000, below PA 12570 → no tax
    const s = baseState({
      settings: {
        currentAge: 67,
        statePensionStartAge: 99, // suppress SP for clarity
        pensionStartAge: 67,
        drawdownStrategy: 'pension-first',
        monthlyOutgoings: 1000,
      },
      accounts: [],
      pensions: [pensionPot(500000, 0, 25)],
    });
    const rows = calcProjection(s);
    // drawn = 12000; taxable portion = 9000, still below PA of 12570 → no tax
    expect(rows[0].pensionDrawdownTax).toBe(0);
    expect(rows[0].pensionDrawdown).toBeCloseTo(12000, 1);
  });

  it('0% tax-free means entire drawdown is taxable', () => {
    // monthly 2000 → annual 24000; 0% tax-free → 24000 fully taxable
    // paAfterSP = 12570 (no SP); taxable = 24000-12570 = 11430; tax = 2286
    const s = baseState({
      settings: {
        currentAge: 67,
        statePensionStartAge: 99,
        pensionStartAge: 67,
        drawdownStrategy: 'pension-first',
        monthlyOutgoings: 2000,
      },
      accounts: [],
      pensions: [pensionPot(500000, 0, 0)], // 0% tax-free
    });
    const rows = calcProjection(s);
    const drawn = rows[0].pensionDrawdown;
    // With the bug fixed (|| 25 → ?? 25), entire drawn amount is taxable
    const expectedTax = Math.max(0, drawn - 12570) * 0.20;
    expect(rows[0].pensionDrawdownTax).toBeCloseTo(expectedTax, 1);
  });
});

// ---------------------------------------------------------------------------
// 7. Data persistence helpers (state.js)
// ---------------------------------------------------------------------------

describe('State loading', () => {
  it('loadState falls back to defaults when localStorage is empty', async () => {
    // localStorage is unavailable in Node — the module catches the error
    const { loadState } = await import('./state.js');
    const s = loadState();
    expect(s).toHaveProperty('accounts');
    expect(s).toHaveProperty('pensions');
    expect(s).toHaveProperty('settings');
    expect(s.settings).toHaveProperty('monthlyOutgoings');
  });
});
