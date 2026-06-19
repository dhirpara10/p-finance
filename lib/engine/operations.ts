/**
 * operations.ts
 *
 * The three core engine operations:
 *   createFinanceTransaction  — validate → generate ledger → save atomically
 *   deleteTransaction         — soft delete + deactivate ledger entries
 *   editTransaction           — regenerate ledger entries for updated transaction
 *
 * Every financial mutation in the app must go through one of these.
 */

import type {
  AuditLog,
  CreatedBy,
  FinanceTransaction,
  LedgerEntry,
  TransactionInput,
  TransactionResult,
} from "./types";
import { generateLedgerEntries } from "./ledger";
import { validateTransaction } from "./validate";
import {
  deactivateLedgerEntriesForTransaction,
  saveAuditLog,
  saveLedgerEntries,
  saveTransaction,
  updateTransaction,
} from "./storage";

// ─── ID generation ────────────────────────────────────────────────────────────

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function now(): string {
  return new Date().toISOString();
}

// ─── createFinanceTransaction ─────────────────────────────────────────────────

/**
 * createFinanceTransaction
 *
 * Flow:
 *   1. Validate input — throws on validation failure
 *   2. Build FinanceTransaction record
 *   3. Generate ledger entries (pure)
 *   4. Save transaction + ledger entries (parallel where possible)
 *   5. Write audit log
 *   6. Return {transaction, ledgerEntries, auditLog}
 */
export async function createFinanceTransaction(
  input: TransactionInput,
  performedBy: CreatedBy = "me"
): Promise<TransactionResult> {
  const validation = validateTransaction(input);
  if (!validation.valid) {
    throw new Error(
      `Transaction validation failed: ${validation.errors
        .map((e) => `${e.field}: ${e.message}`)
        .join("; ")}`
    );
  }

  const ts = now();
  const transaction: FinanceTransaction = {
    ...input,
    id: uid(),
    status: "active",
    createdBy: performedBy,
    metadata: input.metadata ?? {},
    createdAt: ts,
    updatedAt: ts,
  };

  const ledgerEntries = generateLedgerEntries(transaction).map(
    (e): LedgerEntry => ({ ...e, transactionId: transaction.id })
  );

  // Save transaction first (ledger entries reference it)
  const savedTx = await saveTransaction(transaction);
  if (!savedTx) {
    throw new Error("Failed to save transaction to database.");
  }

  // Save ledger entries
  const savedEntries = await saveLedgerEntries(ledgerEntries);

  // Audit log
  const auditLog: AuditLog = {
    id: uid(),
    transactionId: transaction.id,
    action: "created",
    newValue: transaction as unknown as Record<string, unknown>,
    performedBy,
    createdAt: ts,
  };
  await saveAuditLog(auditLog);

  return { transaction: savedTx, ledgerEntries: savedEntries, auditLog };
}

// ─── deleteTransaction ────────────────────────────────────────────────────────

/**
 * deleteTransaction
 *
 * Soft deletes a transaction:
 *   1. Sets status = "deleted", deletedAt = now
 *   2. Removes all ledger entries for this transaction from the active pool
 *   3. Writes audit log
 *
 * The transaction record is kept (with status="deleted") so it can be
 * restored and to maintain audit trail integrity.
 *
 * @param allCurrentEntries — the caller must pass all currently active ledger
 *   entries so we can find and remove the ones for this transaction.
 */
export async function deleteTransaction(
  transactionId: string,
  currentTransaction: FinanceTransaction,
  allCurrentEntries: LedgerEntry[],
  performedBy: CreatedBy = "me"
): Promise<void> {
  if (currentTransaction.status === "deleted") {
    throw new Error("Transaction is already deleted.");
  }

  const ts = now();
  const updated: FinanceTransaction = {
    ...currentTransaction,
    status: "deleted",
    deletedAt: ts,
    updatedAt: ts,
  };

  // Remove ledger entries first (so balance selectors update immediately)
  await deactivateLedgerEntriesForTransaction(transactionId, allCurrentEntries);

  // Update transaction status
  await updateTransaction(updated);

  // Audit log
  const auditLog: AuditLog = {
    id: uid(),
    transactionId,
    action: "deleted",
    oldValue: currentTransaction as unknown as Record<string, unknown>,
    newValue: updated as unknown as Record<string, unknown>,
    performedBy,
    createdAt: ts,
  };
  await saveAuditLog(auditLog);
}

// ─── editTransaction ──────────────────────────────────────────────────────────

/**
 * editTransaction
 *
 * Updates a transaction and regenerates its ledger entries:
 *   1. Validate new input
 *   2. Remove old ledger entries for this transaction
 *   3. Generate new ledger entries from updated transaction
 *   4. Save updated transaction + new ledger entries
 *   5. Write audit log with old/new values
 *
 * The old/new ledger entries are never mixed — this prevents double-counting.
 */
export async function editTransaction(
  transactionId: string,
  currentTransaction: FinanceTransaction,
  updates: Partial<TransactionInput>,
  allCurrentEntries: LedgerEntry[],
  performedBy: CreatedBy = "me"
): Promise<TransactionResult> {
  if (currentTransaction.status === "deleted") {
    throw new Error("Cannot edit a deleted transaction. Restore it first.");
  }

  const updatedInput: TransactionInput = {
    ...currentTransaction,
    ...updates,
    metadata: { ...currentTransaction.metadata, ...(updates.metadata ?? {}) },
  };

  const validation = validateTransaction(updatedInput);
  if (!validation.valid) {
    throw new Error(
      `Edit validation failed: ${validation.errors
        .map((e) => `${e.field}: ${e.message}`)
        .join("; ")}`
    );
  }

  const ts = now();
  const updatedTx: FinanceTransaction = {
    ...currentTransaction,
    ...updatedInput,
    id: transactionId,
    status: "active",
    updatedAt: ts,
  };

  // Remove old ledger entries before creating new ones
  await deactivateLedgerEntriesForTransaction(transactionId, allCurrentEntries);

  // Generate and save new ledger entries
  const newEntries = generateLedgerEntries(updatedTx).map(
    (e): LedgerEntry => ({ ...e, transactionId })
  );
  const savedEntries = await saveLedgerEntries(newEntries);

  // Save updated transaction
  const savedTx = await updateTransaction(updatedTx);
  if (!savedTx) {
    throw new Error("Failed to update transaction in database.");
  }

  // Audit log
  const auditLog: AuditLog = {
    id: uid(),
    transactionId,
    action: "edited",
    oldValue: currentTransaction as unknown as Record<string, unknown>,
    newValue: updatedTx as unknown as Record<string, unknown>,
    performedBy,
    createdAt: ts,
  };
  await saveAuditLog(auditLog);

  return { transaction: savedTx, ledgerEntries: savedEntries, auditLog };
}

// ─── restoreTransaction ───────────────────────────────────────────────────────

/**
 * restoreTransaction
 *
 * Reverses a soft-delete:
 *   1. Sets status = "active", clears deletedAt
 *   2. Regenerates ledger entries from the transaction
 *   3. Writes audit log
 */
export async function restoreTransaction(
  currentTransaction: FinanceTransaction,
  performedBy: CreatedBy = "me"
): Promise<TransactionResult> {
  if (currentTransaction.status !== "deleted") {
    throw new Error("Transaction is not deleted.");
  }

  const ts = now();
  const restored: FinanceTransaction = {
    ...currentTransaction,
    status: "active",
    deletedAt: undefined,
    updatedAt: ts,
  };

  const newEntries = generateLedgerEntries(restored).map(
    (e): LedgerEntry => ({ ...e, transactionId: restored.id })
  );

  const savedEntries = await saveLedgerEntries(newEntries);
  const savedTx = await updateTransaction(restored);
  if (!savedTx) throw new Error("Failed to restore transaction.");

  const auditLog: AuditLog = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    transactionId: restored.id,
    action: "restored",
    oldValue: currentTransaction as unknown as Record<string, unknown>,
    newValue: restored as unknown as Record<string, unknown>,
    performedBy,
    createdAt: ts,
  };
  await saveAuditLog(auditLog);

  return { transaction: savedTx, ledgerEntries: savedEntries, auditLog };
}
