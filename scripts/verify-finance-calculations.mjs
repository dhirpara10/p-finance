/**
 * Finance calculation verification script.
 * Run: node scripts/verify-finance-calculations.mjs
 *
 * Loads all rows from Supabase, runs the same normalization the app uses,
 * then prints a full breakdown of every balance component.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(resolve(__dirname, "../.env.local"), "utf-8")
    .split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const supabase = createClient(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ── helpers ──────────────────────────────────────────────────────────────────

function num(v) { const n = Number(v); return isFinite(n) ? n : 0; }
function str(v) { return String(v ?? ""); }
function isCurrentMonth(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

const JAR_IDS = new Set(["shared_rollover_jar", "shared jar", "lifestyle jar", "jar", "rollover jar", "shared rollover jar"]);

function normalizeBucketName(v) {
  const t = str(v).toLowerCase().trim();
  if (t === "cash") return "Cash";
  if (t === "bank" || t === "usable balance") return "Bank";
  if (JAR_IDS.has(t)) return "shared_rollover_jar";
  return str(v).trim();
}

// Savings bucket IDs the app uses
const BUCKET_ID_BY_NAME = {
  "emergency fund": "savings_emergency_fund",
  "remittance": "savings_remittance",
  "debt collection": "savings_debt_collection",
  "adventure": "savings_adventure",
  "wonders": "savings_wonders",
};

function normalizeSavingsBucketId(v) {
  const t = str(v).toLowerCase().trim();
  return BUCKET_ID_BY_NAME[t] || t;
}

// ── load data ─────────────────────────────────────────────────────────────────

const { data: rows } = await supabase.from("app_rows").select("sheet,id,data").order("sheet");
const grouped = {};
for (const r of rows || []) {
  if (!grouped[r.sheet]) grouped[r.sheet] = [];
  grouped[r.sheet].push(r.data);
}

const income = grouped["income"] || [];
const expenses = grouped["expenses"] || [];
const transfers = (grouped["transfers"] || []).map(r => ({
  ...r,
  from_bucket: normalizeBucketName(r.from_bucket ?? r.from ?? r.fromAccount ?? "Bank"),
  to_bucket: normalizeBucketName(r.to_bucket ?? r.to ?? r.toAccount ?? ""),
}));
const lending = grouped["lending"] || grouped["LendingTransactions"] || grouped["lendingTransactions"] || [];
const liabilities = grouped["liabilities"] || grouped["Liabilities"] || [];
const payments = grouped["liability_payments"] || grouped["RepaymentSchedules"] || grouped["repaymentSchedules"] || [];
const assets = grouped["asset_vault"] || [];
const settings = grouped["settings"] || [];
const goals = grouped["goals"] || grouped["dreams_goals"] || [];

function getSetting(key, fallback = 0) {
  const row = settings.find(r => (Array.isArray(r) ? r[0] : r?.id ?? r?.key) === key);
  if (!row) return fallback;
  const val = Array.isArray(row) ? row[1] : (row?.value ?? row);
  return val;
}

const initialBank = num(getSetting("initial_bank_balance"));
const initialCash = num(getSetting("initial_cash_balance"));

// ── Income ────────────────────────────────────────────────────────────────────

const totalIncome = income.reduce((s, r) => s + num(r.amount), 0);
const totalCashReceived = income.reduce((s, r) => s + num(r.cash_received), 0);
const bankIncome = totalIncome - totalCashReceived;
const cashIncome = totalCashReceived;
const monthlyIncome = income.filter(r => isCurrentMonth(r.date)).reduce((s, r) => s + num(r.amount), 0);

// ── Expenses ──────────────────────────────────────────────────────────────────

function isImmediateDeduction(pm) {
  return !["BNPL", "Afterpay", "StepPay", "CreditCard", "SharedJar"].includes(pm);
}

const bankExpenses = expenses
  .filter(r => (r.account === "Bank" || !r.account) && isImmediateDeduction(r.paymentMethod) && !r.liabilityId)
  .reduce((s, r) => s + num(r.amount), 0);
const cashExpenses = expenses
  .filter(r => r.account === "Cash" && isImmediateDeduction(r.paymentMethod) && !r.liabilityId)
  .reduce((s, r) => s + num(r.amount), 0);
const monthlyExpenses = expenses
  .filter(r => isCurrentMonth(r.date) && !r.liabilityId)
  .reduce((s, r) => s + num(r.amount), 0);

// ── Lending ───────────────────────────────────────────────────────────────────

const lentFromBank = lending.filter(r => r.type === "lent" && r.affectsAccountBalance !== false && r.account !== "Cash").reduce((s, r) => s + num(r.amount), 0);
const lentFromCash = lending.filter(r => r.type === "lent" && r.affectsAccountBalance !== false && r.account === "Cash").reduce((s, r) => s + num(r.amount), 0);
const borrowedToBank = lending.filter(r => r.type === "borrowed" && r.affectsAccountBalance !== false && r.account !== "Cash").reduce((s, r) => s + num(r.amount), 0);
const borrowedToCash = lending.filter(r => r.type === "borrowed" && r.affectsAccountBalance !== false && r.account === "Cash").reduce((s, r) => s + num(r.amount), 0);

// Settlement: net per person
const settlementBankIn = (() => {
  const byPerson = {};
  for (const r of lending) { (byPerson[str(r.personId || r.person)] ??= []).push(r); }
  let total = 0;
  for (const txns of Object.values(byPerson)) {
    const lent = txns.filter(t => t.type === "lent").reduce((s, t) => s + num(t.amount), 0);
    const borrowed = txns.filter(t => t.type === "borrowed").reduce((s, t) => s + num(t.amount), 0);
    const gross = lent - borrowed;
    for (const s of txns.filter(t => t.type === "settlement")) {
      if (gross > 0 && s.account !== "Cash") total += num(s.amount);
    }
  }
  return total;
})();
const settlementCashIn = (() => {
  const byPerson = {};
  for (const r of lending) { (byPerson[str(r.personId || r.person)] ??= []).push(r); }
  let total = 0;
  for (const txns of Object.values(byPerson)) {
    const lent = txns.filter(t => t.type === "lent").reduce((s, t) => s + num(t.amount), 0);
    const borrowed = txns.filter(t => t.type === "borrowed").reduce((s, t) => s + num(t.amount), 0);
    const gross = lent - borrowed;
    for (const s of txns.filter(t => t.type === "settlement")) {
      if (gross > 0 && s.account === "Cash") total += num(s.amount);
    }
  }
  return total;
})();

const receivables = lending.reduce((acc, r) => {
  const key = str(r.personId || r.person);
  acc[key] = (acc[key] || 0) + (r.type === "lent" ? num(r.amount) : r.type === "borrowed" ? -num(r.amount) : r.type === "settlement" ? -num(r.amount) : 0);
  return acc;
}, {});
const totalReceivables = Object.values(receivables).filter(v => v > 0).reduce((s, v) => s + v, 0);
const totalBorrowed = Math.abs(Object.values(receivables).filter(v => v < 0).reduce((s, v) => s + v, 0));

// ── Transfers ─────────────────────────────────────────────────────────────────

function isBucket(fromTo, bucketId) {
  if (bucketId === "Bank") return ["bank", "usable balance"].includes(fromTo.toLowerCase());
  if (bucketId === "Cash") return fromTo.toLowerCase() === "cash";
  if (bucketId === "shared_rollover_jar") return JAR_IDS.has(fromTo.toLowerCase());
  // savings buckets: match by id or by display name
  return normalizeSavingsBucketId(fromTo) === bucketId || fromTo === bucketId;
}

const bucketNames = ["savings_emergency_fund", "savings_remittance", "savings_debt_collection", "savings_adventure", "savings_wonders"];

const bucketBalances = {};
for (const bid of bucketNames) {
  const inflow = transfers.filter(t => isBucket(t.to_bucket, bid)).reduce((s, t) => s + num(t.amount), 0);
  const outflow = transfers.filter(t => isBucket(t.from_bucket, bid)).reduce((s, t) => s + num(t.amount), 0);
  bucketBalances[bid] = inflow - outflow;
}
const totalSavings = Object.values(bucketBalances).reduce((s, v) => s + v, 0);

const bucketOutBank = transfers.filter(t => isBucket(t.from_bucket, "Bank")).reduce((s, t) => s + num(t.amount), 0);
const bucketInBank = transfers.filter(t => isBucket(t.to_bucket, "Bank")).reduce((s, t) => s + num(t.amount), 0);
const bucketOutCash = transfers.filter(t => isBucket(t.from_bucket, "Cash")).reduce((s, t) => s + num(t.amount), 0);
const bucketInCash = transfers.filter(t => isBucket(t.to_bucket, "Cash")).reduce((s, t) => s + num(t.amount), 0);

const jarAllocationsTotal = transfers.filter(t => isBucket(t.to_bucket, "shared_rollover_jar")).reduce((s, t) => s + num(t.amount), 0);
const jarWithdrawalsTotal = transfers.filter(t => isBucket(t.from_bucket, "shared_rollover_jar")).reduce((s, t) => s + num(t.amount), 0);
const jarAllocationsThisMonth = transfers.filter(t => isBucket(t.to_bucket, "shared_rollover_jar") && isCurrentMonth(t.date)).reduce((s, t) => s + num(t.amount), 0);
const jarBalance = jarAllocationsTotal - jarWithdrawalsTotal;

// ── Bank / Cash ───────────────────────────────────────────────────────────────

const bankBalance = initialBank + bankIncome + borrowedToBank + settlementBankIn - lentFromBank - bankExpenses - bucketOutBank + bucketInBank;
const cashBalance = initialCash + cashIncome + borrowedToCash + settlementCashIn - lentFromCash - cashExpenses - bucketOutCash + bucketInCash;

// ── Liabilities ───────────────────────────────────────────────────────────────

function outstandingFor(liability) {
  const original = num(liability.originalAmount);
  const remaining = num(liability.remainingAmount ?? liability.outstandingBalance ?? original);
  // Apply any payments
  const paid = payments
    .filter(p => str(p.liabilityId) === str(liability.id))
    .reduce((s, p) => s + num(p.amount), 0);
  return Math.max(remaining - paid, 0);
}

const activeLiabilities = liabilities.filter(l => l.status === "active");
const bnplOwed = activeLiabilities.filter(l => l.type === "bnpl").reduce((s, l) => s + outstandingFor(l), 0);
const creditCardOwed = activeLiabilities.filter(l => l.type === "credit_card").reduce((s, l) => s + outstandingFor(l), 0);
const loanOwed = activeLiabilities.filter(l => l.type === "loan").reduce((s, l) => s + outstandingFor(l), 0);
const totalLiabilities = bnplOwed + creditCardOwed + loanOwed;
const totalDebtCommitments = totalLiabilities;

// Upcoming repayments (payments where status !== paid and due date in future)
const upcomingRepayments = payments
  .filter(p => p.status !== "paid" && p.type !== "credit_card_payment" && p.type !== "loan_payment" && p.type !== "bnpl_payment")
  .reduce((s, p) => s + num(p.amount), 0);

// ── Asset vault ───────────────────────────────────────────────────────────────

const totalAssetValue = assets.reduce((s, a) => s + num(a.currentValue ?? a.amount ?? a.purchaseValue), 0);

// ── Tracked spend (Jar tracker logic) ────────────────────────────────────────

// Categories linked to trackers spend from jar — we approximate with tracker-linked expenses
// For now, show all expense categories that could be tracker-linked
const trackerLinkedSpend = expenses
  .filter(r => isCurrentMonth(r.date) && (r.paymentMethod === "SharedJar" || r.account === "Jar"))
  .reduce((s, r) => s + num(r.amount), 0);

// ── KPI ───────────────────────────────────────────────────────────────────────

const availableCash = bankBalance + cashBalance;
const usableBalance = availableCash - totalLiabilities;
const totalMoney = availableCash + totalSavings + jarBalance;
const netWorth = totalMoney + totalReceivables - totalBorrowed - totalLiabilities;
const monthRemaining = monthlyIncome - monthlyExpenses;

// ── Activity ──────────────────────────────────────────────────────────────────

const activityRows = [
  ...income.map(r => ({ key: `income:${r.id}`, title: str(r.source || r.name), type: "income", date: r.date })),
  ...expenses.map(r => ({ key: `expense:${r.id}`, title: str(r.category), type: "expense", date: r.date })),
  ...transfers.map(r => ({ key: `transfer:${r.id}`, title: `${r.from_bucket} to ${r.to_bucket}`, type: "transfer", date: r.date })),
  ...lending.map(r => ({ key: `lending:${r.id}`, title: str(r.person || r.personName || r.personId || "Unknown"), type: r.type, date: r.date })),
  ...liabilities.map(r => ({ key: `liability:${r.id}`, title: str(r.name), type: "liability", date: r.date || r.createdAt })),
  ...payments.map(r => ({ key: `payment:${r.id}`, title: str(r.name || r.notes), type: "payment", date: r.date })),
];
const undefinedTitles = activityRows.filter(r => !r.title || r.title === "undefined");
const duplicateKeys = activityRows.filter((r, i) => activityRows.findIndex(x => x.key === r.key) !== i);

// ── Print report ──────────────────────────────────────────────────────────────

function fmt(n) { return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function line(label, value, expected) {
  const val = fmt(value);
  const exp = expected !== undefined ? ` (expected ${fmt(expected)})` : "";
  const ok = expected !== undefined ? (Math.abs(value - expected) < 0.01 ? " ✅" : " ❌") : "";
  console.log(`  ${label.padEnd(30)} ${val}${exp}${ok}`);
}

console.log("\n══════════════════════════════════════════");
console.log("  Finance Verification Report");
console.log("══════════════════════════════════════════");

console.log("\n📊 ACCOUNTS");
line("Initial bank", initialBank);
line("Bank income", bankIncome);
line("Cash income", cashIncome);
line("Bank expenses (immediate)", -bankExpenses);
line("Cash expenses (immediate)", -cashExpenses);
line("Lent from bank", -lentFromBank);
line("Borrowed to bank", borrowedToBank);
line("Settlement bank in", settlementBankIn);
line("Bucket out (bank)", -bucketOutBank);
line("Bucket in (bank)", bucketInBank);
console.log("  " + "─".repeat(40));
line("Bank balance", bankBalance);
line("Cash balance", cashBalance);
line("Available cash", availableCash);

console.log("\n🔒 PROTECTED SAVINGS");
line("Emergency Fund", bucketBalances["savings_emergency_fund"]);
line("Remittance", bucketBalances["savings_remittance"]);
line("Debt Collection", bucketBalances["savings_debt_collection"]);
line("Adventure", bucketBalances["savings_adventure"] || 0);
line("Total savings", totalSavings);

console.log("\n🫙 SHARED JAR");
line("Total allocations", jarAllocationsTotal);
line("This month allocations", jarAllocationsThisMonth);
line("Total withdrawals", jarWithdrawalsTotal);
line("Jar balance", jarBalance);
console.log(`  Tracker-linked expenses (jar)  $${trackerLinkedSpend.toFixed(2)}`);

console.log("\n🤝 LENDING");
line("Receivables", totalReceivables);
line("Personal borrowing", totalBorrowed);

console.log("\n⚠️  LIABILITIES");
line("BNPL owed", bnplOwed);
line("Credit card owed", creditCardOwed);
line("Loan owed", loanOwed);
line("Total debt", totalLiabilities);
line("Upcoming repayments", upcomingRepayments);
console.log(`\n  Active liabilities (${activeLiabilities.length}):`);
for (const l of activeLiabilities) {
  console.log(`    ${str(l.name).padEnd(35)} type=${l.type} original=${fmt(l.originalAmount)} outstanding=${fmt(outstandingFor(l))}`);
}

console.log("\n🏦 ASSET VAULT");
line("Total asset value", totalAssetValue);
console.log(`  Assets (${assets.length}):`);
for (const a of assets) {
  console.log(`    ${str(a.name || a.title).padEnd(35)} ${fmt(num(a.currentValue ?? a.amount))}`);
}

console.log("\n📅 MONTHLY FLOWS");
line("Monthly income", monthlyIncome);
line("Monthly expenses", monthlyExpenses);
line("Month remaining", monthRemaining);

console.log("\n🎯 KPI SUMMARY");
line("Available cash", availableCash);
line("Total savings (buckets)", totalSavings);
line("Jar balance", jarBalance);
line("Receivables", totalReceivables);
line("Personal borrowing", -totalBorrowed);
line("Total liabilities", -totalLiabilities);
console.log("  " + "─".repeat(40));
line("Total money (cash+savings+jar)", totalMoney);
line("Net worth", netWorth);
line("Usable balance", usableBalance);

console.log("\n📋 ACTIVITY");
console.log(`  Total rows:              ${activityRows.length}`);
console.log(`  Income rows:             ${income.length}`);
console.log(`  Expense rows:            ${expenses.length}`);
console.log(`  Transfer rows:           ${transfers.length}`);
console.log(`  Lending rows:            ${lending.length}`);
console.log(`  Liability rows:          ${liabilities.length}`);
console.log(`  Payment rows:            ${payments.length}`);
console.log(`  Goal rows:               ${goals.length}`);
console.log(`  Asset rows:              ${assets.length}`);
if (undefinedTitles.length) {
  console.log(`\n  ❌ Undefined/empty titles (${undefinedTitles.length}):`);
  undefinedTitles.forEach(r => console.log(`     ${r.key}`));
} else {
  console.log(`\n  ✅ No undefined/empty titles`);
}
if (duplicateKeys.length) {
  console.log(`  ❌ Duplicate keys (${duplicateKeys.length}): ${duplicateKeys.map(r => r.key).join(", ")}`);
} else {
  console.log(`  ✅ No duplicate activity keys`);
}

console.log("\n══════════════════════════════════════════\n");
