/**
 * Zod schemas for every sheet type.
 * All parsers are safe — invalid rows return null, never throw.
 * Import parseRow<T> from here instead of casting raw Supabase data.
 */

import { z } from "zod";

// ── Primitives ────────────────────────────────────────────────────────────────

const safeStr = (fallback = "") => z.coerce.string().catch(fallback);
const safeNum = (fallback = 0) => z.coerce.number().catch(fallback);
const safeBool = (fallback = false) => z.coerce.boolean().catch(fallback);
const safeDate = () => safeStr("");
const appUser = () => z.enum(["me", "spouse"]).optional().catch(undefined);

// ── Income ────────────────────────────────────────────────────────────────────

export const IncomeSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  income_type: z.enum(["Hourly", "Fixed Amount"]).catch("Fixed Amount"),
  source: safeStr(),
  rate: safeNum(),
  hours: safeNum(),
  amount: safeNum(),
  cash_received: safeNum(),
  date: safeDate(),
  notes: safeStr(),
  addedBy: appUser(),
  createdAt: safeStr(),
  updatedAt: safeStr().optional(),
});

export type ParsedIncome = z.infer<typeof IncomeSchema>;

// ── Expense ───────────────────────────────────────────────────────────────────

const ExpensePaymentMethod = z.enum(["Bank", "Cash", "SharedJar", "Afterpay", "StepPay", "CreditCard"]).catch("Bank");

export const ExpenseSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  amount: safeNum(),
  category: safeStr(),
  categoryId: safeStr(),
  account: z.enum(["Bank", "Cash"]).catch("Bank"),
  paymentMethod: ExpensePaymentMethod.optional(),
  liabilityId: z.string().optional().catch(undefined),
  date: safeDate(),
  notes: safeStr(),
  isRecurring: safeBool(),
  recurringFrequency: z.enum(["weekly", "biweekly", "monthly", "yearly"]).optional().catch(undefined),
  recurringStartDate: z.string().optional().catch(undefined),
  recurringEndDate: z.string().optional().catch(undefined),
  recurringStatus: z.enum(["active", "paused", "cancelled"]).optional().catch(undefined),
  createdAt: safeStr(),
  updatedAt: z.string().optional().catch(undefined),
  addedBy: appUser(),
});

export type ParsedExpense = z.infer<typeof ExpenseSchema>;

// ── Transfer ──────────────────────────────────────────────────────────────────

export const TransferSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  from_bucket: safeStr("Bank"),
  to_bucket: safeStr(),
  amount: safeNum(),
  date: safeDate(),
  notes: safeStr(),
  trackerId: z.string().optional().catch(undefined),
  addedBy: appUser(),
  createdAt: safeStr(),
});

export type ParsedTransfer = z.infer<typeof TransferSchema>;

// ── Remittance ────────────────────────────────────────────────────────────────

export const RemittanceSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  audAmount: safeNum(),
  exchangeRate: safeNum(),
  inrAmount: safeNum(),
  account: z.enum(["Bank", "Cash", "RemittanceFund"]).catch("Bank"),
  date: safeDate(),
  provider: safeStr(),
  notes: safeStr(),
  chargesAud: safeNum().optional(),
  taxAud: safeNum().optional(),
  preExisting: safeBool().optional(),
  addedBy: appUser(),
  createdAt: safeStr(),
});

export type ParsedRemittance = z.infer<typeof RemittanceSchema>;

// ── Person ────────────────────────────────────────────────────────────────────

export const PersonSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  name: safeStr(),
  phone: safeStr(),
  createdAt: safeStr(),
  updatedAt: safeStr(),
});

// ── LendingTransaction ────────────────────────────────────────────────────────

export const LendingTransactionSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  personId: z.union([z.string(), z.number()]).transform(String),
  type: z.enum(["lent", "borrowed", "settlement"]).catch("lent"),
  amount: safeNum(),
  account: z.enum(["Bank", "Cash"]).catch("Bank"),
  affectsAccountBalance: safeBool(true),
  date: safeDate(),
  note: safeStr(),
  createdAt: safeStr(),
  addedBy: appUser(),
});

// ── MoneyRecord (legacy lent/borrowed) ───────────────────────────────────────

export const MoneyRecordSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  name: safeStr(),
  amount: safeNum(),
  date: safeDate(),
  phone: safeStr(),
  notes: safeStr(),
  status: z.enum(["Pending", "Partly Paid", "Fully Settled"]).catch("Pending"),
  affectsAccountBalance: safeBool(true),
  account: z.enum(["Bank", "Cash"]).catch("Bank"),
  addedBy: appUser(),
});

// ── AppNotification ───────────────────────────────────────────────────────────

export const AppNotificationSchema = z.object({
  id: safeStr(),
  type: z.string().catch("info"),
  title: safeStr(),
  message: safeStr(),
  isRead: safeBool(),
  createdAt: safeStr(),
  dedupeKey: z.string().optional().catch(undefined),
  relatedEntityType: z.string().optional().catch(undefined),
  relatedEntityId: z.string().optional().catch(undefined),
});

// ── Safe row parser ───────────────────────────────────────────────────────────

/**
 * Safely parse a raw DB row with a Zod schema.
 * Returns null if the row is completely unusable (missing id, etc).
 * Otherwise returns the parsed value with all coercions applied.
 */
export function safeParseRow<T>(
  schema: z.ZodType<T>,
  raw: unknown,
  context?: string
): T | null {
  const result = schema.safeParse(raw);
  if (!result.success) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[schema] Failed to parse${context ? ` ${context}` : ""}:`, result.error.flatten(), raw);
    }
    return null;
  }
  return result.data;
}

/**
 * Parse an array of raw DB rows, dropping any that fail validation.
 */
export function parseRows<T>(
  schema: z.ZodType<T>,
  rows: unknown[],
  context?: string
): T[] {
  return rows
    .map((row, i) => safeParseRow(schema, row, context ? `${context}[${i}]` : undefined))
    .filter((r): r is T => r !== null);
}
