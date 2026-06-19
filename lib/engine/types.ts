// ─── Account Types ────────────────────────────────────────────────────────────

/** All ledger account identifiers. */
export type AccountType =
  // Asset accounts (debit = increase)
  | "bank"
  | "cash"
  | "emergency_fund"
  | "remittance_fund"
  | "debt_collection"
  | "shared_jar"
  | "receivable"
  // Liability accounts (credit = increase)
  | "personal_borrowing"
  | "bnpl_liability"
  | "credit_card_liability"
  | "loan_liability"
  // Income accounts (credit = increase)
  | "income"
  // Expense accounts (debit = increase)
  | "expense"
  | "interest_expense"
  | "fee_expense";

/** External account names used by forms → maps to AccountType. */
export type ExternalAccount = "Bank" | "Cash" | "RemittanceFund" | string;

// ─── Transaction Types ────────────────────────────────────────────────────────

export type TransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "bucket_fund"
  | "bucket_withdraw"
  | "jar_allocation"
  | "jar_withdraw"
  | "bnpl_purchase"
  | "bnpl_repayment"
  | "credit_card_purchase"
  | "credit_card_repayment"
  | "loan_created"
  | "loan_repayment"
  | "lent"
  | "borrowed"
  | "settlement_received"
  | "settlement_paid"
  | "remittance"
  | "asset_added"
  | "goal_funded"
  | "adjustment";

export type TransactionStatus = "active" | "deleted" | "reversed";
export type Direction = "debit" | "credit";
export type CreatedBy = "me" | "spouse";

// ─── Core Models ─────────────────────────────────────────────────────────────

/**
 * The master transaction record.
 * Every financial action must create one of these.
 */
export interface FinanceTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  date: string;
  note: string;
  categoryId?: string;
  /** Primary account — source for expenses/lent, destination for income/borrowed. */
  accountId?: string;
  /** Transfer source account. */
  sourceAccountId?: string;
  /** Transfer destination account. */
  destinationAccountId?: string;
  personId?: string | number;
  bucketId?: string;
  trackerId?: string;
  liabilityId?: string;
  assetId?: string;
  goalId?: string;
  remittanceId?: string;
  status: TransactionStatus;
  createdBy: CreatedBy;
  /** Links related transactions (e.g. expense + auto-created BNPL liability). */
  linkedGroupId?: string;
  /** Type-specific extra fields. */
  metadata: TransactionMetadata;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

/** Typed metadata for each transaction kind. */
export interface TransactionMetadata {
  // income
  cashReceived?: number;
  incomeType?: "fixed" | "hourly";
  rate?: number;
  hours?: number;
  // bnpl_purchase
  upfrontPayment?: number;
  installments?: number;
  frequency?: string;
  // loan
  affectsBalance?: boolean;
  // loan_repayment
  principalAmount?: number;
  interestAmount?: number;
  feeAmount?: number;
  // remittance
  inrAmount?: number;
  exchangeRate?: number;
  provider?: string;
  isInternal?: boolean;
  // lent/borrowed
  isLegacy?: boolean;
  // catch-all
  [key: string]: unknown;
}

/**
 * A single double-entry ledger line.
 * Every FinanceTransaction produces ≥ 2 ledger entries.
 */
export interface LedgerEntry {
  id: string;
  transactionId: string;
  account: AccountType;
  direction: Direction;
  amount: number;
  currency: string;
  date: string;
  categoryId?: string;
  bucketId?: string;
  trackerId?: string;
  liabilityId?: string;
  personId?: string | number;
  remittanceId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

/** Audit trail for every mutation. */
export interface AuditLog {
  id: string;
  transactionId: string;
  action: "created" | "edited" | "deleted" | "restored" | "reversed";
  oldValue?: Partial<FinanceTransaction>;
  newValue?: Partial<FinanceTransaction>;
  performedBy: CreatedBy;
  createdAt: string;
}

// ─── Input Types ─────────────────────────────────────────────────────────────

/** Input to createFinanceTransaction — id/timestamps generated internally. */
export type TransactionInput = Omit<
  FinanceTransaction,
  "id" | "status" | "createdAt" | "updatedAt" | "deletedAt"
>;

/** Result returned from createFinanceTransaction. */
export interface TransactionResult {
  transaction: FinanceTransaction;
  ledgerEntries: LedgerEntry[];
  auditLog: AuditLog;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
