import type {
  AccountType,
  Direction,
  FinanceTransaction,
  LedgerEntry,
} from "./types";

// ─── Account Classification ───────────────────────────────────────────────────

/**
 * Asset and expense accounts have a "debit-normal" balance:
 * debits increase them, credits decrease them.
 * Liability and income accounts are "credit-normal".
 */
export const DEBIT_NORMAL_ACCOUNTS = new Set<AccountType>([
  "bank",
  "cash",
  "emergency_fund",
  "remittance_fund",
  "debt_collection",
  "shared_jar",
  "receivable",
  "expense",
  "interest_expense",
  "fee_expense",
]);

// ─── Account Name Mapping ─────────────────────────────────────────────────────

/** Maps legacy external string names to internal AccountType. */
export function nameToAccount(name: string): AccountType {
  const map: Record<string, AccountType> = {
    Bank: "bank",
    Cash: "cash",
    bank: "bank",
    cash: "cash",
    RemittanceFund: "remittance_fund",
    remittance_fund: "remittance_fund",
    savings_emergency_fund: "emergency_fund",
    savings_remittance: "remittance_fund",
    savings_debt_collection: "debt_collection",
    shared_jar: "shared_jar",
  };
  return map[name] ?? "bank";
}

/** Maps a savings bucket ID to its ledger AccountType. */
export function bucketIdToAccount(bucketId: string): AccountType {
  const map: Record<string, AccountType> = {
    savings_emergency_fund: "emergency_fund",
    savings_remittance: "remittance_fund",
    savings_debt_collection: "debt_collection",
  };
  return map[bucketId] ?? "emergency_fund";
}

// ─── Entry Builder ────────────────────────────────────────────────────────────

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeEntry(
  partial: Omit<LedgerEntry, "id" | "createdAt">
): LedgerEntry {
  return { ...partial, id: uid(), createdAt: new Date().toISOString() };
}

// ─── Core Generator ───────────────────────────────────────────────────────────

/**
 * generateLedgerEntries
 *
 * Pure function. Given a FinanceTransaction, returns the complete set of
 * double-entry ledger lines. No side effects, no I/O.
 *
 * Rules:
 *   Asset accounts:   debit  = increase, credit = decrease
 *   Liability accounts: credit = increase, debit  = decrease
 *   Income accounts:  credit = increase
 *   Expense accounts: debit  = increase
 */
export function generateLedgerEntries(
  transaction: FinanceTransaction
): LedgerEntry[] {
  const { type, amount, date, currency, metadata } = transaction;

  const base = {
    transactionId: transaction.id,
    currency,
    date,
    categoryId: transaction.categoryId,
    bucketId: transaction.bucketId,
    trackerId: transaction.trackerId,
    liabilityId: transaction.liabilityId,
    personId: transaction.personId,
    remittanceId: transaction.remittanceId,
    metadata: {},
  };

  const D = (account: AccountType, amt: number): LedgerEntry =>
    makeEntry({ ...base, account, direction: "debit" as Direction, amount: amt });
  const C = (account: AccountType, amt: number): LedgerEntry =>
    makeEntry({ ...base, account, direction: "credit" as Direction, amount: amt });

  // Primary account for this transaction (Bank or Cash usually)
  const acct = nameToAccount(transaction.accountId ?? "bank");

  switch (type) {
    // ── 1. Income ────────────────────────────────────────────────────────────
    case "income": {
      const cashReceived = Number(metadata.cashReceived ?? 0);
      const bankAmt = amount - cashReceived;
      const entries: LedgerEntry[] = [];
      if (bankAmt > 0) entries.push(D("bank", bankAmt));
      if (cashReceived > 0) entries.push(D("cash", cashReceived));
      entries.push(C("income", amount));
      return entries;
    }

    // ── 2. Normal expense (bank or cash) ─────────────────────────────────────
    case "expense":
      return [D("expense", amount), C(acct, amount)];

    // ── 3. Credit card purchase ───────────────────────────────────────────────
    case "credit_card_purchase":
      return [D("expense", amount), C("credit_card_liability", amount)];

    // ── 4. Credit card repayment ──────────────────────────────────────────────
    case "credit_card_repayment":
      return [D("credit_card_liability", amount), C(acct, amount)];

    // ── 5. BNPL purchase ──────────────────────────────────────────────────────
    case "bnpl_purchase": {
      const upfront = Number(metadata.upfrontPayment ?? 0);
      const liabilityAmt = amount - upfront;
      const entries: LedgerEntry[] = [D("expense", amount)];
      if (upfront > 0) entries.push(C(acct, upfront));
      if (liabilityAmt > 0) entries.push(C("bnpl_liability", liabilityAmt));
      return entries;
    }

    // ── 6. BNPL repayment ─────────────────────────────────────────────────────
    case "bnpl_repayment":
      return [D("bnpl_liability", amount), C(acct, amount)];

    // ── 7. Loan created ───────────────────────────────────────────────────────
    case "loan_created": {
      const affectsBalance = metadata.affectsBalance !== false;
      const entries: LedgerEntry[] = [C("loan_liability", amount)];
      if (affectsBalance) entries.push(D(acct, amount));
      return entries;
    }

    // ── 8. Loan repayment ─────────────────────────────────────────────────────
    case "loan_repayment": {
      const principal = Number(metadata.principalAmount ?? amount);
      const interest = Number(metadata.interestAmount ?? 0);
      const fee = Number(metadata.feeAmount ?? 0);
      const entries: LedgerEntry[] = [];
      if (principal > 0) entries.push(D("loan_liability", principal));
      if (interest > 0) entries.push(D("interest_expense", interest));
      if (fee > 0) entries.push(D("fee_expense", fee));
      entries.push(C(acct, amount));
      return entries;
    }

    // ── 9. Transfer ───────────────────────────────────────────────────────────
    case "transfer": {
      const src = nameToAccount(
        transaction.sourceAccountId ?? transaction.accountId ?? "bank"
      );
      const dst = nameToAccount(transaction.destinationAccountId ?? "cash");
      return [D(dst, amount), C(src, amount)];
    }

    // ── 10. Bucket fund ───────────────────────────────────────────────────────
    case "bucket_fund": {
      const bucketAcct = bucketIdToAccount(transaction.bucketId ?? "");
      return [D(bucketAcct, amount), C(acct, amount)];
    }

    // ── 11. Bucket withdraw ───────────────────────────────────────────────────
    case "bucket_withdraw": {
      const bucketAcct = bucketIdToAccount(transaction.bucketId ?? "");
      return [D(acct, amount), C(bucketAcct, amount)];
    }

    // ── 12. Jar allocation ────────────────────────────────────────────────────
    case "jar_allocation":
      return [D("shared_jar", amount), C(acct, amount)];

    // ── 13. Jar withdraw ──────────────────────────────────────────────────────
    case "jar_withdraw":
      return [D(acct, amount), C("shared_jar", amount)];

    // ── 14. Lent money ────────────────────────────────────────────────────────
    case "lent": {
      const affectsBalance = metadata.affectsBalance !== false;
      const entries: LedgerEntry[] = [D("receivable", amount)];
      if (affectsBalance) entries.push(C(acct, amount));
      return entries;
    }

    // ── 15. Settlement received ───────────────────────────────────────────────
    case "settlement_received":
      return [D(acct, amount), C("receivable", amount)];

    // ── 16. Borrowed money ────────────────────────────────────────────────────
    case "borrowed": {
      const affectsBalance = metadata.affectsBalance !== false;
      const entries: LedgerEntry[] = [C("personal_borrowing", amount)];
      if (affectsBalance) entries.push(D(acct, amount));
      return entries;
    }

    // ── 17. Settlement paid ───────────────────────────────────────────────────
    case "settlement_paid":
      return [D("personal_borrowing", amount), C(acct, amount)];

    // ── 18. Remittance ────────────────────────────────────────────────────────
    case "remittance": {
      const affectsBalance = metadata.affectsBalance !== false;
      if (!affectsBalance) return []; // historical record only

      const isInternal = Boolean(metadata.isInternal);
      if (isInternal) {
        // Moving money into the remittance savings fund
        return [D("remittance_fund", amount), C(acct, amount)];
      } else {
        // Sending money away permanently
        return [D("expense", amount), C(acct, amount)];
      }
    }

    // ── Non-financial tracking types ──────────────────────────────────────────
    case "asset_added":
    case "goal_funded":
      return [];

    // ── Adjustment (direct balance correction) ────────────────────────────────
    case "adjustment":
      return amount >= 0
        ? [D(acct, amount)]
        : [C(acct, Math.abs(amount))];

    default:
      return [];
  }
}
