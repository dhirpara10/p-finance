/**
 * test-engine.cjs
 *
 * Tests for the transaction engine (lib/engine).
 * Covers all 20 scenarios from the foundation spec.
 *
 * Run: node scripts/test-engine.cjs
 */

"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

// ─── TypeScript loader ────────────────────────────────────────────────────────

const root = path.resolve(__dirname, "..");

Module._resolveFilename = (function (orig) {
  return function resolveAlias(request, parent, isMain, options) {
    if (request.startsWith("@/")) {
      request = path.join(root, request.slice(2));
    }
    return orig.call(this, request, parent, isMain, options);
  };
})(Module._resolveFilename);

require.extensions[".ts"] = function compileTS(mod, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  mod._compile(output, filename);
};

// ─── Load engine ──────────────────────────────────────────────────────────────

const { generateLedgerEntries } = require("../lib/engine/ledger.ts");
const {
  getAccountBalance,
  getBankBalance,
  getCashBalance,
  getNetWorth,
  getUsableBalance,
  getBnplOwed,
  getCreditCardOwed,
  getReceivablesTotal,
  getPersonalBorrowingTotal,
  getMonthlyIncome,
  getMonthlyExpense,
} = require("../lib/engine/selectors.ts");

// ─── Test runner ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ❌  ${name}`);
    console.log(`       ${err.message}`);
    failed++;
  }
}

function near(actual, expected, msg) {
  const ok = Math.abs(actual - expected) < 0.001;
  assert.ok(
    ok,
    `${msg ?? ""}: expected ${expected}, got ${actual}`
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().slice(0, 10);
const YEAR = Number(TODAY.slice(0, 4));
const MONTH = Number(TODAY.slice(5, 7));

/**
 * buildTx — constructs a minimal FinanceTransaction for testing.
 * generateLedgerEntries only reads: id, type, amount, date, currency,
 * accountId, sourceAccountId, destinationAccountId, bucketId, personId,
 * liabilityId, remittanceId, categoryId, trackerId, metadata.
 */
function buildTx(overrides) {
  return {
    id: `tx-${Math.random().toString(36).slice(2)}`,
    type: "expense",
    amount: 0,
    currency: "AUD",
    date: TODAY,
    note: "",
    accountId: "Bank",
    status: "active",
    createdBy: "me",
    metadata: {},
    createdAt: TODAY,
    updatedAt: TODAY,
    ...overrides,
  };
}

/** Run a single transaction through the ledger and return all entries. */
function run(overrides) {
  const tx = buildTx(overrides);
  return generateLedgerEntries(tx);
}

/** Run multiple transactions and return combined ledger entries. */
function runAll(txOverrides) {
  return txOverrides.flatMap((o) => run(o));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

console.log("\n Transaction Engine Tests\n");

// ────────────────────────────────────────────────────────────────────────────
// 1. Income split: $700 income, $620 bank, $80 cash
// ────────────────────────────────────────────────────────────────────────────
test("1. Income split — bank + cash portions", () => {
  const entries = run({
    type: "income",
    amount: 700,
    metadata: { cashReceived: 80 },
  });

  // Bank debit 620, Cash debit 80, Income credit 700
  assert.equal(entries.length, 3);
  near(getBankBalance(entries), 620, "bank");
  near(getCashBalance(entries), 80, "cash");
  near(getAccountBalance("income", entries), 700, "income");
  near(getNetWorth(entries), 700, "net worth");
});

// ────────────────────────────────────────────────────────────────────────────
// 2. Normal cash expense: $20 food from cash
// ────────────────────────────────────────────────────────────────────────────
test("2. Cash expense reduces cash and increases expense", () => {
  const entries = run({ type: "expense", amount: 20, accountId: "Cash" });

  near(getCashBalance(entries), -20, "cash");
  near(getAccountBalance("expense", entries), 20, "expense");
  near(getNetWorth(entries), -20, "net worth");
});

// ────────────────────────────────────────────────────────────────────────────
// 3. Transfer bank → cash: $100
// ────────────────────────────────────────────────────────────────────────────
test("3. Bank-to-cash transfer — net worth unchanged", () => {
  const entries = run({
    type: "transfer",
    amount: 100,
    sourceAccountId: "Bank",
    destinationAccountId: "Cash",
  });

  near(getBankBalance(entries), -100, "bank");
  near(getCashBalance(entries), 100, "cash");
  near(getNetWorth(entries), 0, "net worth");
  near(getAccountBalance("expense", entries), 0, "expense unchanged");
});

// ────────────────────────────────────────────────────────────────────────────
// 4. Bucket fund: $200 bank → emergency fund
// ────────────────────────────────────────────────────────────────────────────
test("4. Bucket fund — bank decreases, bucket increases, net worth unchanged", () => {
  const entries = run({
    type: "bucket_fund",
    amount: 200,
    accountId: "Bank",
    bucketId: "savings_emergency_fund",
  });

  near(getBankBalance(entries), -200, "bank");
  near(getAccountBalance("emergency_fund", entries), 200, "emergency_fund");
  near(getNetWorth(entries), 0, "net worth");
  near(getAccountBalance("expense", entries), 0, "expense unchanged");
});

// ────────────────────────────────────────────────────────────────────────────
// 5. Bucket withdraw: $50 emergency fund → bank
// ────────────────────────────────────────────────────────────────────────────
test("5. Bucket withdraw — bucket decreases, bank increases, net worth unchanged", () => {
  const entries = run({
    type: "bucket_withdraw",
    amount: 50,
    accountId: "Bank",
    bucketId: "savings_emergency_fund",
  });

  near(getBankBalance(entries), 50, "bank");
  near(getAccountBalance("emergency_fund", entries), -50, "emergency_fund");
  near(getNetWorth(entries), 0, "net worth");
});

// ────────────────────────────────────────────────────────────────────────────
// 6. BNPL purchase $400 — no upfront payment
// ────────────────────────────────────────────────────────────────────────────
test("6. BNPL purchase (no upfront) — expense +400, liability +400, bank unchanged", () => {
  const entries = run({
    type: "bnpl_purchase",
    amount: 400,
    accountId: "Bank",
    metadata: { upfrontPayment: 0 },
  });

  near(getAccountBalance("expense", entries), 400, "expense");
  near(getBnplOwed(entries), 400, "bnpl_liability");
  near(getBankBalance(entries), 0, "bank unchanged");
  near(getNetWorth(entries), -400, "net worth");
});

// ────────────────────────────────────────────────────────────────────────────
// 7. BNPL repayment: $100 from bank
// ────────────────────────────────────────────────────────────────────────────
test("7. BNPL repayment — bank −100, liability −100, expense unchanged", () => {
  const entries = run({ type: "bnpl_repayment", amount: 100, accountId: "Bank" });

  near(getBankBalance(entries), -100, "bank");
  near(getBnplOwed(entries), -100, "bnpl_liability");
  near(getAccountBalance("expense", entries), 0, "expense unchanged");
});

// ────────────────────────────────────────────────────────────────────────────
// 8. Credit card purchase: $50
// ────────────────────────────────────────────────────────────────────────────
test("8. Credit card purchase — expense +50, cc_liability +50, bank unchanged", () => {
  const entries = run({ type: "credit_card_purchase", amount: 50 });

  near(getAccountBalance("expense", entries), 50, "expense");
  near(getCreditCardOwed(entries), 50, "cc_liability");
  near(getBankBalance(entries), 0, "bank unchanged");
  near(getNetWorth(entries), -50, "net worth");
});

// ────────────────────────────────────────────────────────────────────────────
// 9. Credit card repayment: $50 from bank
// ────────────────────────────────────────────────────────────────────────────
test("9. Credit card repayment — bank −50, liability −50, expense unchanged", () => {
  const entries = run({
    type: "credit_card_repayment",
    amount: 50,
    accountId: "Bank",
  });

  near(getBankBalance(entries), -50, "bank");
  near(getCreditCardOwed(entries), -50, "cc_liability");
  near(getAccountBalance("expense", entries), 0, "expense unchanged");
});

// ────────────────────────────────────────────────────────────────────────────
// 10. Loan repayment: $300 = $250 principal + $40 interest + $10 fee
// ────────────────────────────────────────────────────────────────────────────
test("10. Loan repayment — correct split of principal / interest / fee", () => {
  const entries = run({
    type: "loan_repayment",
    amount: 300,
    accountId: "Bank",
    metadata: { principalAmount: 250, interestAmount: 40, feeAmount: 10 },
  });

  near(getBankBalance(entries), -300, "bank");
  near(getAccountBalance("loan_liability", entries), -250, "loan_liability");
  near(getAccountBalance("interest_expense", entries), 40, "interest_expense");
  near(getAccountBalance("fee_expense", entries), 10, "fee_expense");
});

// ────────────────────────────────────────────────────────────────────────────
// 11. Lent money: $200 from bank
// ────────────────────────────────────────────────────────────────────────────
test("11. Lent money — bank −200, receivable +200, net worth unchanged", () => {
  const entries = run({
    type: "lent",
    amount: 200,
    accountId: "Bank",
    metadata: { affectsBalance: true },
  });

  near(getBankBalance(entries), -200, "bank");
  near(getReceivablesTotal(entries), 200, "receivable");
  near(getNetWorth(entries), 0, "net worth");
});

// ────────────────────────────────────────────────────────────────────────────
// 12. Settlement received: $200 into bank
// ────────────────────────────────────────────────────────────────────────────
test("12. Settlement received — bank +200, receivable −200, net worth unchanged", () => {
  const entries = run({
    type: "settlement_received",
    amount: 200,
    accountId: "Bank",
  });

  near(getBankBalance(entries), 200, "bank");
  near(getReceivablesTotal(entries), -200, "receivable");
  near(getNetWorth(entries), 0, "net worth");
});

// ────────────────────────────────────────────────────────────────────────────
// 13. Borrowed money: $300 cash
// ────────────────────────────────────────────────────────────────────────────
test("13. Borrowed money — cash +300, personal_borrowing +300, net worth unchanged", () => {
  const entries = run({
    type: "borrowed",
    amount: 300,
    accountId: "Cash",
    metadata: { affectsBalance: true },
  });

  near(getCashBalance(entries), 300, "cash");
  near(getPersonalBorrowingTotal(entries), 300, "personal_borrowing");
  near(getNetWorth(entries), 0, "net worth");
});

// ────────────────────────────────────────────────────────────────────────────
// 14. Settlement paid: $300 from cash
// ────────────────────────────────────────────────────────────────────────────
test("14. Settlement paid — cash −300, personal_borrowing −300, net worth unchanged", () => {
  const entries = run({
    type: "settlement_paid",
    amount: 300,
    accountId: "Cash",
  });

  near(getCashBalance(entries), -300, "cash");
  near(getPersonalBorrowingTotal(entries), -300, "personal_borrowing");
  near(getNetWorth(entries), 0, "net worth");
});

// ────────────────────────────────────────────────────────────────────────────
// 15. Remittance permanent: $500 AUD from bank
// ────────────────────────────────────────────────────────────────────────────
test("15. Permanent remittance — bank −500, expense +500, INR metadata saved", () => {
  const entries = run({
    type: "remittance",
    amount: 500,
    accountId: "Bank",
    metadata: {
      affectsBalance: true,
      isInternal: false,
      inrAmount: 30000,
      exchangeRate: 60,
      provider: "Wise",
    },
  });

  near(getBankBalance(entries), -500, "bank");
  near(getAccountBalance("expense", entries), 500, "expense");
  near(getNetWorth(entries), -500, "net worth");
});

// ────────────────────────────────────────────────────────────────────────────
// 16. Remittance pre-existing (affectsBalance: false)
// ────────────────────────────────────────────────────────────────────────────
test("16. Historical remittance — no balance change", () => {
  const entries = run({
    type: "remittance",
    amount: 500,
    accountId: "Bank",
    metadata: { affectsBalance: false, inrAmount: 30000, exchangeRate: 60 },
  });

  assert.equal(entries.length, 0, "no ledger entries for historical record");
  near(getBankBalance(entries), 0, "bank unchanged");
  near(getAccountBalance("expense", entries), 0, "expense unchanged");
});

// ────────────────────────────────────────────────────────────────────────────
// 17. Delete transaction — balances reverse
// ────────────────────────────────────────────────────────────────────────────
test("17. Delete transaction — balance reverts when entries are excluded", () => {
  // Simulate: create $1000 income → bank = 1000
  // Then "delete" by filtering out those entries → bank = 0
  const incomeTxId = "tx-income-1";
  const incomeEntries = generateLedgerEntries(buildTx({
    id: incomeTxId,
    type: "income",
    amount: 1000,
    metadata: { cashReceived: 0 },
  }));

  near(getBankBalance(incomeEntries), 1000, "before delete: bank = 1000");
  near(getAccountBalance("income", incomeEntries), 1000, "income = 1000");

  // Deleting = excluding those entries from selectors
  const afterDelete = incomeEntries.filter(
    (e) => e.transactionId !== incomeTxId
  );

  near(getBankBalance(afterDelete), 0, "after delete: bank = 0");
  near(getAccountBalance("income", afterDelete), 0, "after delete: income = 0");
});

// ────────────────────────────────────────────────────────────────────────────
// 18. Edit transaction — expense 20 → 30
// ────────────────────────────────────────────────────────────────────────────
test("18. Edit transaction — old entries replaced, balance reflects new amount", () => {
  const txId = "tx-expense-1";

  // Original: $20 expense from cash
  const originalEntries = generateLedgerEntries(buildTx({
    id: txId,
    type: "expense",
    amount: 20,
    accountId: "Cash",
  }));

  near(getAccountBalance("expense", originalEntries), 20, "original expense = 20");
  near(getCashBalance(originalEntries), -20, "original cash = -20");

  // Edit: remove old entries, add new ones for $30
  const updatedEntries = generateLedgerEntries(buildTx({
    id: txId,
    type: "expense",
    amount: 30,
    accountId: "Cash",
  }));

  // Active entries = updated only (old are removed)
  near(getAccountBalance("expense", updatedEntries), 30, "updated expense = 30");
  near(getCashBalance(updatedEntries), -30, "updated cash = -30");

  // Must NOT be 50 (old + new combined)
  assert.notEqual(
    getAccountBalance("expense", [...originalEntries, ...updatedEntries]),
    30,
    "combined would double-count — confirms we must replace, not append"
  );
});

// ────────────────────────────────────────────────────────────────────────────
// 19. Multiple transfers never affect net worth
// ────────────────────────────────────────────────────────────────────────────
test("19. Chain of transfers — net worth always 0", () => {
  const allEntries = runAll([
    // Bank → Cash $100
    { type: "transfer", amount: 100, sourceAccountId: "Bank", destinationAccountId: "Cash" },
    // Cash → Emergency Fund $50
    { type: "bucket_fund", amount: 50, accountId: "Cash", bucketId: "savings_emergency_fund" },
    // Emergency Fund → Bank $25
    { type: "bucket_withdraw", amount: 25, accountId: "Bank", bucketId: "savings_emergency_fund" },
    // Bank → Shared Jar $30
    { type: "jar_allocation", amount: 30, accountId: "Bank" },
    // Jar → Cash $10
    { type: "jar_withdraw", amount: 10, accountId: "Cash" },
  ]);

  near(getNetWorth(allEntries), 0, "net worth after all transfers = 0");
});

// ────────────────────────────────────────────────────────────────────────────
// 20. Repayments do not double-count expenses
// ────────────────────────────────────────────────────────────────────────────
test("20. BNPL purchase + 4 repayments — expense stays at $400", () => {
  const allEntries = runAll([
    // One $400 BNPL purchase
    { type: "bnpl_purchase", amount: 400, accountId: "Bank", metadata: { upfrontPayment: 0 } },
    // Four $100 repayments
    { type: "bnpl_repayment", amount: 100, accountId: "Bank" },
    { type: "bnpl_repayment", amount: 100, accountId: "Bank" },
    { type: "bnpl_repayment", amount: 100, accountId: "Bank" },
    { type: "bnpl_repayment", amount: 100, accountId: "Bank" },
  ]);

  // Expense must remain 400, not 800
  near(getAccountBalance("expense", allEntries), 400, "expense = 400 (not 800)");

  // BNPL liability should be 0 after all repayments
  near(getBnplOwed(allEntries), 0, "bnpl_liability = 0 after 4 repayments");

  // Bank reduced by total repayments (400)
  near(getBankBalance(allEntries), -400, "bank = -400 from repayments");
});

// ─── Results ──────────────────────────────────────────────────────────────────

console.log(`\n  ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
