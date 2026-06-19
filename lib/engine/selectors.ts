import { DEBIT_NORMAL_ACCOUNTS } from "./ledger";
import type { AccountType, LedgerEntry } from "./types";

// ─── Core Selector ────────────────────────────────────────────────────────────

/**
 * getAccountBalance
 *
 * Computes the balance of a single ledger account from a slice of entries.
 *
 * Asset / expense accounts (debit-normal):
 *   balance = Σ debits − Σ credits
 *
 * Liability / income accounts (credit-normal):
 *   balance = Σ credits − Σ debits
 *
 * Always pass entries already filtered to status="active" transactions.
 */
export function getAccountBalance(
  account: AccountType,
  entries: LedgerEntry[]
): number {
  const relevant = entries.filter((e) => e.account === account);
  const isDebitNormal = DEBIT_NORMAL_ACCOUNTS.has(account);

  return relevant.reduce((sum, e) => {
    const sign = e.direction === "debit" ? 1 : -1;
    return sum + (isDebitNormal ? sign * e.amount : -sign * e.amount);
  }, 0);
}

// ─── Account Balances ─────────────────────────────────────────────────────────

export function getBankBalance(entries: LedgerEntry[]): number {
  return getAccountBalance("bank", entries);
}

export function getCashBalance(entries: LedgerEntry[]): number {
  return getAccountBalance("cash", entries);
}

/**
 * getNetWorth
 *
 * = (bank + cash + all savings buckets + shared jar + receivables)
 *   − (personal borrowing + BNPL owed + credit card owed + loan outstanding)
 */
export function getNetWorth(entries: LedgerEntry[]): number {
  const assetAccounts: AccountType[] = [
    "bank",
    "cash",
    "emergency_fund",
    "remittance_fund",
    "debt_collection",
    "shared_jar",
    "receivable",
  ];
  const liabilityAccounts: AccountType[] = [
    "personal_borrowing",
    "bnpl_liability",
    "credit_card_liability",
    "loan_liability",
  ];

  const totalAssets = assetAccounts.reduce(
    (sum, a) => sum + getAccountBalance(a, entries),
    0
  );
  const totalLiabilities = liabilityAccounts.reduce(
    (sum, a) => sum + getAccountBalance(a, entries),
    0
  );

  return totalAssets - totalLiabilities;
}

/**
 * getUsableBalance
 *
 * Money you can actually spend:
 * = (bank + cash) − BNPL owed − credit card owed
 *
 * Excludes savings buckets, jar, and lending since those are committed funds.
 */
export function getUsableBalance(entries: LedgerEntry[]): number {
  const liquid = getBankBalance(entries) + getCashBalance(entries);
  const committed =
    getAccountBalance("bnpl_liability", entries) +
    getAccountBalance("credit_card_liability", entries);
  return liquid - committed;
}

// ─── Bucket / Jar Selectors ───────────────────────────────────────────────────

/** Returns the current balance of a savings bucket by its legacy ID. */
export function getBucketBalance(
  bucketId: string,
  entries: LedgerEntry[]
): number {
  const accountMap: Record<string, AccountType> = {
    savings_emergency_fund: "emergency_fund",
    savings_remittance: "remittance_fund",
    savings_debt_collection: "debt_collection",
  };
  const account = accountMap[bucketId];
  if (!account) return 0;
  return getAccountBalance(account, entries);
}

export function getJarAvailable(entries: LedgerEntry[]): number {
  return getAccountBalance("shared_jar", entries);
}

// ─── Liability Selectors ──────────────────────────────────────────────────────

export function getBnplOwed(entries: LedgerEntry[]): number {
  return getAccountBalance("bnpl_liability", entries);
}

export function getCreditCardOwed(entries: LedgerEntry[]): number {
  return getAccountBalance("credit_card_liability", entries);
}

/**
 * getLiabilityBalance
 *
 * Outstanding balance for a single liability (pass its ID to filter entries).
 * If no liabilityId is given, returns the total across all loans.
 */
export function getLiabilityBalance(
  entries: LedgerEntry[],
  liabilityId?: string
): number {
  const relevant = liabilityId
    ? entries.filter((e) => e.liabilityId === liabilityId)
    : entries;
  return getAccountBalance("loan_liability", relevant);
}

// ─── Lending Selectors ────────────────────────────────────────────────────────

export function getReceivablesTotal(entries: LedgerEntry[]): number {
  return getAccountBalance("receivable", entries);
}

export function getPersonalBorrowingTotal(entries: LedgerEntry[]): number {
  return getAccountBalance("personal_borrowing", entries);
}

/**
 * getPersonLendingBalance
 *
 * For a specific person, returns how much they owe you (lent) and
 * how much you owe them (borrowed), and the net.
 */
export function getPersonLendingBalance(
  personId: string | number,
  entries: LedgerEntry[]
): { lent: number; borrowed: number; net: number } {
  const personEntries = entries.filter(
    (e) => String(e.personId) === String(personId)
  );
  const lent = getAccountBalance("receivable", personEntries);
  const borrowed = getAccountBalance("personal_borrowing", personEntries);
  return { lent, borrowed, net: lent - borrowed };
}

// ─── Income / Expense Selectors ───────────────────────────────────────────────

export function getMonthlyIncome(
  entries: LedgerEntry[],
  year: number,
  month: number
): number {
  const relevant = entries.filter((e) => {
    if (e.account !== "income") return false;
    const [y, m] = e.date.split("-").map(Number);
    return y === year && m === month;
  });
  return getAccountBalance("income", relevant);
}

export function getMonthlyExpense(
  entries: LedgerEntry[],
  year: number,
  month: number
): number {
  const relevant = entries.filter((e) => {
    if (e.account !== "expense" && e.account !== "interest_expense" && e.account !== "fee_expense") return false;
    const [y, m] = e.date.split("-").map(Number);
    return y === year && m === month;
  });
  // Sum each expense account separately
  return (
    getAccountBalance("expense", relevant) +
    getAccountBalance("interest_expense", relevant) +
    getAccountBalance("fee_expense", relevant)
  );
}

/**
 * getMonthRemaining
 *
 * Income minus expenses for the given month.
 * Positive = money left over. Negative = overspent.
 */
export function getMonthRemaining(
  entries: LedgerEntry[],
  year: number,
  month: number
): number {
  return (
    getMonthlyIncome(entries, year, month) -
    getMonthlyExpense(entries, year, month)
  );
}

/**
 * getCategorySpend
 *
 * Total expense for a given categoryId, optionally within a date range.
 */
export function getCategorySpend(
  categoryId: string,
  entries: LedgerEntry[],
  range?: { start: string; end: string }
): number {
  const relevant = entries.filter((e) => {
    if (e.account !== "expense") return false;
    if (e.categoryId !== categoryId) return false;
    if (range) return e.date >= range.start && e.date <= range.end;
    return true;
  });
  return getAccountBalance("expense", relevant);
}

/**
 * getTrackerSpend
 *
 * Total expense tagged to a specific lifestyle tracker.
 */
export function getTrackerSpend(
  trackerId: string,
  entries: LedgerEntry[]
): number {
  const relevant = entries.filter(
    (e) => e.account === "expense" && e.trackerId === trackerId
  );
  return getAccountBalance("expense", relevant);
}

/**
 * getSavingsRate
 *
 * (income − expense) / income × 100 for the given month.
 * Returns 0 if income is 0.
 */
export function getSavingsRate(
  entries: LedgerEntry[],
  year: number,
  month: number
): number {
  const income = getMonthlyIncome(entries, year, month);
  if (income === 0) return 0;
  const expense = getMonthlyExpense(entries, year, month);
  return Math.max(0, ((income - expense) / income) * 100);
}
