// ─── Transaction Engine — Public API ─────────────────────────────────────────

// Types
export type {
  AccountType,
  AuditLog,
  CreatedBy,
  Direction,
  ExternalAccount,
  FinanceTransaction,
  LedgerEntry,
  TransactionInput,
  TransactionMetadata,
  TransactionResult,
  TransactionStatus,
  TransactionType,
  ValidationError,
  ValidationResult,
} from "./types";

// Core ledger logic (pure functions — safe to import anywhere)
export { generateLedgerEntries, nameToAccount, bucketIdToAccount, DEBIT_NORMAL_ACCOUNTS } from "./ledger";

// Balance selectors (pure functions — read from ledger entries)
export {
  getAccountBalance,
  getBankBalance,
  getBnplOwed,
  getBucketBalance,
  getCashBalance,
  getCategorySpend,
  getCreditCardOwed,
  getJarAvailable,
  getLiabilityBalance,
  getMonthlyExpense,
  getMonthlyIncome,
  getMonthRemaining,
  getNetWorth,
  getPersonalBorrowingTotal,
  getPersonLendingBalance,
  getReceivablesTotal,
  getSavingsRate,
  getTrackerSpend,
  getUsableBalance,
} from "./selectors";

// Validation (pure function)
export { validateTransaction } from "./validate";

// Async operations (require Supabase connection)
export {
  createFinanceTransaction,
  deleteTransaction,
  editTransaction,
  restoreTransaction,
} from "./operations";
