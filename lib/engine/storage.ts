/**
 * storage.ts
 *
 * Supabase persistence for the transaction engine.
 * Uses the existing app_rows(sheet, id, data JSONB) single-table pattern.
 *
 * Sheet names:
 *   ft_transactions   — FinanceTransaction records
 *   ft_ledger_entries — LedgerEntry records
 *   ft_audit_logs     — AuditLog records
 */

import type { AuditLog, FinanceTransaction, LedgerEntry } from "./types";
import {
  createSheetRecord,
  updateSheetRecord,
  deleteFromSheet,
} from "@/lib/sheetsApi";

// ─── Type helpers ─────────────────────────────────────────────────────────────

type JsonRow = Record<string, unknown>;

function txToRow(tx: FinanceTransaction): JsonRow {
  return tx as unknown as JsonRow;
}

function ledgerToRow(entry: LedgerEntry): JsonRow {
  return entry as unknown as JsonRow;
}

function auditToRow(log: AuditLog): JsonRow {
  return log as unknown as JsonRow;
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function saveTransaction(
  tx: FinanceTransaction
): Promise<FinanceTransaction | null> {
  const result = await createSheetRecord<FinanceTransaction>(
    "ft_transactions",
    txToRow(tx)
  );
  return result ?? null;
}

export async function updateTransaction(
  tx: FinanceTransaction
): Promise<FinanceTransaction | null> {
  const result = await updateSheetRecord<FinanceTransaction>(
    "ft_transactions",
    tx.id,
    txToRow(tx)
  );
  return result ?? null;
}

// ─── Ledger Entries ───────────────────────────────────────────────────────────

/**
 * saveLedgerEntries
 *
 * Saves multiple ledger entries for a transaction.
 * In the current single-table model this is N individual inserts.
 * Future: batch insert when Supabase supports it cleanly.
 */
export async function saveLedgerEntries(
  entries: LedgerEntry[]
): Promise<LedgerEntry[]> {
  const results: LedgerEntry[] = [];
  for (const entry of entries) {
    const saved = await createSheetRecord<LedgerEntry>(
      "ft_ledger_entries",
      ledgerToRow(entry)
    );
    if (saved) results.push(saved);
  }
  return results;
}

/**
 * deactivateLedgerEntriesForTransaction
 *
 * Marks all ledger entries for a transaction as inactive by deleting them
 * from the ft_ledger_entries sheet. Called before regenerating entries on edit,
 * or as part of a soft-delete (active entries removed; transaction record kept
 * with status="deleted").
 */
export async function deactivateLedgerEntriesForTransaction(
  transactionId: string,
  allEntries: LedgerEntry[]
): Promise<void> {
  const toDelete = allEntries.filter(
    (e) => e.transactionId === transactionId
  );
  for (const entry of toDelete) {
    await deleteFromSheet("ft_ledger_entries", entry.id);
  }
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export async function saveAuditLog(log: AuditLog): Promise<AuditLog | null> {
  const result = await createSheetRecord<AuditLog>(
    "ft_audit_logs",
    auditToRow(log)
  );
  return result ?? null;
}
