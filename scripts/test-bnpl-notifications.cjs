/**
 * test-bnpl-notifications.cjs
 *
 * Tests for BNPL repayment notification logic.
 * Run: node scripts/test-bnpl-notifications.cjs
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

// Stub web-push and supabase (not needed for pure function tests)
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "web-push") return { setVapidDetails: () => {}, sendNotification: async () => {} };
  if (request === "@/lib/server/supabaseAdmin") return { getSupabaseAdmin: () => ({}) };
  return originalLoad.apply(this, arguments);
};

// ─── Load pure functions ──────────────────────────────────────────────────────

const { computeBankBalance, processBnplRepaymentNotifications } =
  require("../app/api/notifications/repayment/route.ts");

// ─── Test harness ─────────────────────────────────────────────────────────────

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

function eq(actual, expected, label) {
  assert.strictEqual(actual, expected, `${label}: expected ${expected}, got ${actual}`);
}

function near(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) < 0.001, `${label}: expected ${expected}, got ${actual}`);
}

// ─── computeBankBalance ───────────────────────────────────────────────────────

console.log("\n── computeBankBalance ──────────────────────────────────────────");

const empty = { incomes: [], expenses: [], transfers: [], lendingTransactions: [], lentRecords: [], borrowedRecords: [], remittances: [], paidRepaymentSchedules: [] };

test("starts at initial balance", () => {
  near(computeBankBalance(1000, empty), 1000, "balance");
});

test("income adds bank portion (total minus cash_received)", () => {
  near(computeBankBalance(500, {
    ...empty,
    incomes: [{ amount: 200, cash_received: 50 }],
  }), 650, "balance"); // 500 + (200-50) = 650
});

test("bank expense deducts", () => {
  near(computeBankBalance(1000, {
    ...empty,
    expenses: [{ amount: 100, paymentMethod: "Bank", account: "Bank" }],
  }), 900, "balance");
});

test("Afterpay/StepPay/CreditCard skip bank", () => {
  near(computeBankBalance(1000, {
    ...empty,
    expenses: [
      { amount: 100, paymentMethod: "Afterpay" },
      { amount: 50, paymentMethod: "StepPay" },
      { amount: 75, paymentMethod: "CreditCard" },
    ],
  }), 1000, "balance");
});

test("transfer from Bank deducts, to Bank adds", () => {
  near(computeBankBalance(1000, {
    ...empty,
    transfers: [
      { from_bucket: "Bank", to_bucket: "Savings", amount: 200 },
      { from_bucket: "Savings", to_bucket: "Bank", amount: 50 },
    ],
  }), 850, "balance"); // 1000 - 200 + 50
});

test("paid Bank repayment schedule deducts, Cash does not", () => {
  near(computeBankBalance(1000, {
    ...empty,
    paidRepaymentSchedules: [
      { amount: 200, linkedRepaymentAccount: "Bank" },
      { amount: 100, linkedRepaymentAccount: "Cash" },
    ],
  }), 800, "balance"); // only Bank deducts
});

// ─── processBnplRepaymentNotifications ───────────────────────────────────────

console.log("\n── processBnplRepaymentNotifications ───────────────────────────");

const TODAY = "2026-06-20";
const TOMORROW = "2026-06-21";
const YESTERDAY = "2026-06-19";
const NEXT_WEEK = "2026-06-27";

function mkR(overrides = {}) {
  return {
    scheduleId: "sched-1",
    liabilityId: "liab-1",
    dueDate: TODAY,
    amount: 100,
    providerName: "Afterpay",
    ...overrides,
  };
}

// Test 1: Bank sufficient → in-app + push
test("bank sufficient → in-app AND push", () => {
  const { newInAppNotifications: inApp, pushNotificationsToSend: push } =
    processBnplRepaymentNotifications({
      repayments: [mkR()],
      bankBalance: 500,
      existingKeys: new Set(),
      today: TODAY,
      tomorrow: TOMORROW,
    });
  eq(inApp.length, 1, "in-app count");
  eq(push.length, 1, "push count");
  eq(inApp[0].type, "bnpl_ready", "type");
});

// Test 2: Bank insufficient → in-app only, no push
test("bank insufficient → in-app only, no push", () => {
  const { newInAppNotifications: inApp, pushNotificationsToSend: push } =
    processBnplRepaymentNotifications({
      repayments: [mkR({ amount: 500 })],
      bankBalance: 100,
      existingKeys: new Set(),
      today: TODAY,
      tomorrow: TOMORROW,
    });
  eq(inApp.length, 1, "in-app count");
  eq(push.length, 0, "push count");
  eq(inApp[0].type, "bnpl_low_balance", "type");
});

// Test 3: Same repayment already exists → skip (no duplicate)
test("existing dedupeKey → skipped", () => {
  const r = mkR();
  const key = `bnpl_repayment:${r.liabilityId}:${r.scheduleId}:${r.dueDate}:${r.amount}`;
  const { newInAppNotifications: inApp, pushNotificationsToSend: push } =
    processBnplRepaymentNotifications({
      repayments: [r],
      bankBalance: 500,
      existingKeys: new Set([key]),
      today: TODAY,
      tomorrow: TOMORROW,
    });
  eq(inApp.length, 0, "in-app count (deduped)");
  eq(push.length, 0, "push count (deduped)");
});

// Test 4: Future repayment (beyond tomorrow) → no notification
test("repayment next week → no notification", () => {
  const { newInAppNotifications: inApp } = processBnplRepaymentNotifications({
    repayments: [mkR({ dueDate: NEXT_WEEK })],
    bankBalance: 500,
    existingKeys: new Set(),
    today: TODAY,
    tomorrow: TOMORROW,
  });
  eq(inApp.length, 0, "in-app count");
});

// Test 5: Exact boundary — bank = amount should push; bank = amount-0.01 should not
test("push eligibility: exact boundary and one cent under", () => {
  const r1 = mkR({ amount: 100, scheduleId: "s1" });
  const exact = processBnplRepaymentNotifications({
    repayments: [r1], bankBalance: 100, existingKeys: new Set(), today: TODAY, tomorrow: TOMORROW,
  });
  eq(exact.pushNotificationsToSend.length, 1, "push at exact boundary");

  const r2 = mkR({ amount: 100, scheduleId: "s2" });
  const under = processBnplRepaymentNotifications({
    repayments: [r2], bankBalance: 99.99, existingKeys: new Set(), today: TODAY, tomorrow: TOMORROW,
  });
  eq(under.pushNotificationsToSend.length, 0, "no push one cent under");
});

// Test 6: Tomorrow repayment → notified with "due tomorrow"
test("repayment due tomorrow → notified with 'due tomorrow'", () => {
  const { newInAppNotifications: inApp } = processBnplRepaymentNotifications({
    repayments: [mkR({ dueDate: TOMORROW })],
    bankBalance: 200,
    existingKeys: new Set(),
    today: TODAY,
    tomorrow: TOMORROW,
  });
  eq(inApp.length, 1, "in-app count");
  assert.ok(inApp[0].message.includes("due tomorrow"), `message: "${inApp[0].message}"`);
});

// Test 7: Overdue repayment → notified with "(overdue)"
test("overdue repayment → notified with '(overdue)'", () => {
  const { newInAppNotifications: inApp } = processBnplRepaymentNotifications({
    repayments: [mkR({ dueDate: YESTERDAY })],
    bankBalance: 200,
    existingKeys: new Set(),
    today: TODAY,
    tomorrow: TOMORROW,
  });
  eq(inApp.length, 1, "in-app count");
  assert.ok(inApp[0].message.includes("(overdue)"), `message: "${inApp[0].message}"`);
});

// Test 8: dedupeKey format
test("dedupeKey matches expected format", () => {
  const r = mkR({ scheduleId: "s1", liabilityId: "l1", dueDate: TODAY, amount: 120 });
  const { newInAppNotifications: inApp } = processBnplRepaymentNotifications({
    repayments: [r], bankBalance: 500, existingKeys: new Set(), today: TODAY, tomorrow: TOMORROW,
  });
  eq(inApp[0].dedupeKey, `bnpl_repayment:l1:s1:${TODAY}:120`, "dedupeKey");
});

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n${"─".repeat(55)}`);
console.log(`  ${passed + failed} tests: ${passed} passed, ${failed} failed`);
console.log(`${"─".repeat(55)}\n`);

process.exit(failed > 0 ? 1 : 0);
