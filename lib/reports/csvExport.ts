import type { DateRange } from "./dateRanges";
import { isInRange } from "./dateRanges";
import type {
  Income,
  Expense,
  Transfer,
  LendingTransaction,
  Person,
  Liability,
  RepaymentSchedule,
  SavingsBucket,
  BucketListTracker,
} from "@/lib/types";
import type { AssetRecord, LocationTag } from "@/lib/assetVault";
import type { GoalRecord } from "@/lib/dreamsGoals";
import { getDaysLeft } from "@/lib/dreamsGoals";

export type ReportData = {
  range: DateRange;
  incomes: Income[];
  expenses: Expense[];
  transfers: Transfer[];
  lendingTransactions: LendingTransaction[];
  people: Person[];
  liabilities: Liability[];
  repaymentSchedules: RepaymentSchedule[];
  savingsBuckets: SavingsBucket[];
  bucketListTrackers: BucketListTracker[];
  savingsBucketBalances: Record<string, unknown>[];
  trackerSummaries: Record<string, unknown>[];
  assets: AssetRecord[];
  locationTags: LocationTag[];
  goals: GoalRecord[];
  bankBalance: number;
  cashBalance: number;
  usableBalance: number;
  netWorth: number;
  activeLent: number;
  activeBorrowed: number;
  currencySymbol: string;
  userNameMe: string;
  userNameSpouse: string;
};

function esc(val: unknown): string {
  const s = val == null ? "" : String(val);
  // Escape double quotes and wrap if needed
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function row(...cells: unknown[]): string {
  return cells.map(esc).join(",");
}

function fmt(n: number, sym: string) {
  return `${sym}${n.toFixed(2)}`;
}

function sectionHeader(title: string): string {
  return `\n${title}\n`;
}

function findPersonName(id: unknown, people: Person[]): string {
  const p = people.find((p) => String(p.id) === String(id));
  return p?.name ?? "";
}

export function generateCSV(data: ReportData): string {
  const {
    range,
    incomes,
    expenses,
    transfers,
    lendingTransactions,
    people,
    liabilities,
    savingsBuckets,
    assets,
    locationTags,
    goals,
    bankBalance,
    cashBalance,
    usableBalance,
    netWorth,
    activeLent,
    activeBorrowed,
    currencySymbol: sym,
    userNameMe,
    userNameSpouse,
  } = data;

  const lines: string[] = [];

  // 1. REPORT INFO
  lines.push(sectionHeader("REPORT INFO"));
  lines.push(row("Period", range.label));
  lines.push(row("Generated", new Date().toLocaleString("en-AU")));
  lines.push(row("Currency", sym));
  lines.push(row("Users", `${userNameMe} / ${userNameSpouse}`));

  // 2. FINANCIAL SUMMARY (current snapshot)
  lines.push(sectionHeader("FINANCIAL SUMMARY (Current Snapshot)"));
  lines.push(row("Metric", "Value"));
  lines.push(row("Bank Balance", fmt(bankBalance, sym)));
  lines.push(row("Cash Balance", fmt(cashBalance, sym)));
  lines.push(row("Usable Balance", fmt(usableBalance, sym)));
  lines.push(row("Net Worth", fmt(netWorth, sym)));
  lines.push(row("Active Lent", fmt(activeLent, sym)));
  lines.push(row("Active Borrowed", fmt(activeBorrowed, sym)));

  // 3. INCOME (filtered by range)
  const filteredIncomes = incomes.filter((i) => isInRange(i.date, range));
  lines.push(sectionHeader("INCOME"));
  lines.push(row("Date", "Type", "Source", "Hours", "Rate", "Amount", "Bank", "Cash", "Notes", "Added By"));
  for (const i of filteredIncomes) {
    const bankAmt = i.amount - (i.cash_received ?? 0);
    lines.push(row(
      i.date,
      i.income_type,
      i.source,
      i.income_type === "Hourly" ? i.hours : "",
      i.income_type === "Hourly" ? fmt(i.rate, sym) : "",
      fmt(i.amount, sym),
      fmt(bankAmt, sym),
      fmt(i.cash_received ?? 0, sym),
      i.notes,
      i.addedBy === "spouse" ? userNameSpouse : userNameMe,
    ));
  }
  if (filteredIncomes.length === 0) lines.push(row("No income records in this period."));

  // 4. EXPENSES (filtered by range)
  const filteredExpenses = expenses.filter((e) => isInRange(e.date, range));
  lines.push(sectionHeader("EXPENSES"));
  lines.push(row("Date", "Category", "Amount", "Account", "Payment Method", "Recurring", "Notes", "Added By"));
  for (const e of filteredExpenses) {
    lines.push(row(
      e.date,
      e.category,
      fmt(e.amount, sym),
      e.account,
      e.paymentMethod ?? "",
      e.isRecurring ? `Yes (${e.recurringFrequency ?? ""})` : "No",
      e.notes,
      e.addedBy === "spouse" ? userNameSpouse : userNameMe,
    ));
  }
  if (filteredExpenses.length === 0) lines.push(row("No expense records in this period."));

  // 5. TRANSFERS (filtered by range)
  const filteredTransfers = transfers.filter((t) => isInRange(t.date, range));
  lines.push(sectionHeader("TRANSFERS"));
  lines.push(row("Date", "From", "To", "Amount", "Notes", "Added By"));
  for (const t of filteredTransfers) {
    lines.push(row(
      t.date,
      t.from_bucket,
      t.to_bucket,
      fmt(t.amount, sym),
      t.notes,
      t.addedBy === "spouse" ? userNameSpouse : userNameMe,
    ));
  }
  if (filteredTransfers.length === 0) lines.push(row("No transfers in this period."));

  // 6. LENDING / BORROWING (filtered by range)
  const filteredLending = lendingTransactions.filter((l) => isInRange(l.date, range));
  lines.push(sectionHeader("LENDING / BORROWING"));
  lines.push(row("Date", "Person", "Type", "Amount", "Account", "Affects Balance", "Notes"));
  for (const l of filteredLending) {
    lines.push(row(
      l.date,
      findPersonName(l.personId, people),
      l.type,
      fmt(l.amount, sym),
      l.account ?? "",
      l.affectsAccountBalance ? "Yes" : "No",
      l.note ?? "",
    ));
  }
  if (filteredLending.length === 0) lines.push(row("No lending/borrowing records in this period."));

  // 7. LIABILITIES (full snapshot)
  lines.push(sectionHeader("LIABILITIES (Full Snapshot)"));
  lines.push(row("Name", "Type", "Provider", "Original Amount", "Outstanding", "Status", "Notes"));
  for (const l of liabilities) {
    lines.push(row(
      l.name,
      l.type,
      l.provider,
      fmt(l.originalAmount, sym),
      fmt(l.outstandingBalance, sym),
      l.status,
      l.notes,
    ));
  }
  if (liabilities.length === 0) lines.push(row("No liabilities recorded."));

  // 8. SAVINGS BUCKETS (full snapshot)
  lines.push(sectionHeader("BUCKETS / SAVINGS (Full Snapshot)"));
  lines.push(row("Name", "Storage Label", "Current Balance", "Target", "Progress %", "Active"));
  for (const b of savingsBuckets) {
    const pct = b.targetAmount > 0
      ? ((b.currentBalance / b.targetAmount) * 100).toFixed(1) + "%"
      : "N/A";
    lines.push(row(
      b.name,
      b.linkedStorageLabel,
      fmt(b.currentBalance, sym),
      fmt(b.targetAmount, sym),
      pct,
      b.active ? "Yes" : "No",
    ));
  }
  if (savingsBuckets.length === 0) lines.push(row("No savings buckets recorded."));

  // 9. ASSET VAULT (full snapshot)
  lines.push(sectionHeader("ASSET VAULT (Full Snapshot)"));
  lines.push(row("Title", "Asset Type", "Location Tags", "Date", "Details"));
  for (const a of assets) {
    const tagNames = a.locationTagIds
      .map((tid) => locationTags.find((t) => t.id === tid)?.name ?? "")
      .filter(Boolean)
      .join("; ");
    lines.push(row(a.title, a.assetType, tagNames, a.date, a.details));
  }
  if (assets.length === 0) lines.push(row("No assets recorded."));

  // 10. DREAMS & GOALS (full snapshot)
  lines.push(sectionHeader("DREAMS & GOALS (Full Snapshot)"));
  lines.push(row("Title", "Category", "Occasion", "Target Date", "Days Left", "Status", "Completed At", "Details"));
  for (const g of goals) {
    const daysLeft = g.targetDate ? getDaysLeft(g.targetDate) : null;
    lines.push(row(
      g.title,
      g.category,
      g.occasion ?? "",
      g.targetDate ?? "",
      daysLeft != null ? String(daysLeft) : "",
      g.status,
      g.completedAt ?? "",
      g.details ?? "",
    ));
  }
  if (goals.length === 0) lines.push(row("No goals recorded."));

  return lines.join("\n");
}

export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
