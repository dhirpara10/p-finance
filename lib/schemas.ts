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

// ── Array-row normalizers ────────────────────────────────────────────────────
// DB may contain positional-array rows from before the object migration.
// These preprocessors convert arrays to objects so Zod schemas don't reject them.

function categoryIdFromName(name: string) {
  return "category_" + String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
}

function normalizeExpenseRow(raw: unknown): unknown {
  if (!Array.isArray(raw)) return raw;
  // [id, amount, category, account, date, notes, metadata?]
  const [id, amount, category, account, date, notes, metadata] = raw;
  const meta = metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata as Record<string, unknown> : {};
  return {
    id: String(id ?? ""),
    amount: Number(amount) || 0,
    category: String(category ?? ""),
    categoryId: meta.categoryId ?? categoryIdFromName(String(category ?? "")),
    account: account === "Cash" ? "Cash" : "Bank",
    paymentMethod: meta.paymentMethod ?? (account === "Cash" ? "Cash" : "Bank"),
    date: String(date ?? ""),
    notes: String(notes ?? ""),
    isRecurring: Boolean(meta.isRecurring),
    recurringFrequency: meta.recurringFrequency,
    recurringEndDate: meta.recurringEndDate,
    liabilityId: meta.liabilityId,
    createdAt: meta.createdAt ?? new Date().toISOString(),
    updatedAt: meta.updatedAt,
    addedBy: meta.addedBy,
  };
}

function normalizeLendingRow(raw: unknown): unknown {
  if (Array.isArray(raw)) {
    // [id, personId, type, amount, account, affectsAccountBalance, date, note, createdAt]
    const [id, personId, type, amount, account, affectsAccountBalance, date, note, createdAt] = raw;
    return {
      id: String(id ?? ""),
      personId: String(personId ?? id ?? ""),
      type: type ?? "lent",
      amount: Number(amount) || 0,
      account: account === "Cash" ? "Cash" : "Bank",
      affectsAccountBalance: affectsAccountBalance !== false,
      date: String(date ?? ""),
      note: String(note ?? ""),
      createdAt: String(createdAt ?? new Date().toISOString()),
    };
  }
  // Object-shaped: also handle rows where "person" is used instead of "personId"
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const r = raw as Record<string, unknown>;
    const patched: Record<string, unknown> = { ...r };
    // Capture display name from any person name field
    const displayName = r.person ?? r.personName ?? r.contactName ?? r.name ?? null;
    if (displayName) patched.personName = String(displayName);
    // Map person name → personId if personId is missing
    if (!r.personId && displayName) {
      patched.personId = String(displayName);
    }
    // Map "notes" → "note" (schema field is "note")
    if (r.notes !== undefined && r.note === undefined) {
      patched.note = r.notes;
    }
    return patched;
  }
  return raw;
}

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

const ExpenseObjectSchema = z.object({
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

export const ExpenseSchema = z.preprocess(normalizeExpenseRow, ExpenseObjectSchema);
export type ParsedExpense = z.infer<typeof ExpenseObjectSchema>;

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

const LendingTransactionObjectSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  personId: z.union([z.string(), z.number(), z.undefined(), z.null()]).transform((v) => String(v ?? "")).catch(""),
  personName: safeStr("").optional(),
  type: z.enum(["lent", "borrowed", "settlement"]).catch("lent"),
  amount: safeNum(),
  account: z.enum(["Bank", "Cash"]).catch("Bank"),
  affectsAccountBalance: safeBool(true),
  date: safeDate(),
  note: safeStr(),
  createdAt: safeStr(),
  addedBy: appUser(),
});

export const LendingTransactionSchema = z.preprocess(normalizeLendingRow, LendingTransactionObjectSchema);

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
