/**
 * Data access layer — wraps Supabase client with the same API surface
 * that the rest of the app was already using (createSheetRecord, saveSetting, etc.)
 * so callers don't need to change.
 */

import { supabase } from "@/lib/supabase";

// ─── Types (kept for compatibility) ──────────────────────────────────────────

export type SheetValue = string | number | boolean | Record<string, unknown>;

export type LendingTransactionType = "lent" | "borrowed" | "settlement";

export type AddPersonPayload = {
  name: string;
  phone?: string;
};

export type AddLendingTransactionPayload = {
  personId: string | number;
  type: LendingTransactionType;
  amount: number;
  account?: "Bank" | "Cash";
  affectsAccountBalance?: boolean;
  date: string;
  note?: string;
};

// ─── Row normalizers ──────────────────────────────────────────────────────────

// Columns that should NOT be converted to camelCase (schema expects snake_case)
const KEEP_SNAKE = new Set(["from_bucket", "to_bucket", "income_type", "cash_received"]);

// Specific snake_case → camelCase field remaps that the generic converter can't infer
const READ_REMAP: Record<string, string> = {
  affects_balance: "affectsAccountBalance",
  user_label: "user",             // app_logs: DB "user_label" → JS "user"
  is_read: "isRead",              // app_notifications
  dedupe_key: "dedupeKey",
  related_entity_type: "relatedEntityType",
  related_entity_id: "relatedEntityId",
  // dreams_goals: DB column names → JS field names (target_date only — name/notes are generic)
  target_date: "targetDate",
  completed_at: "completedAt",
  archived_at: "archivedAt",
  // app_logs
  before_value: "beforeValue",
  after_value: "afterValue",
};

// JS camelCase → DB column remaps for writes
const WRITE_REMAP: Record<string, string> = {
  affectsAccountBalance: "affects_balance",
  isRead: "is_read",
  dedupeKey: "dedupe_key",
  relatedEntityType: "related_entity_type",
  relatedEntityId: "related_entity_id",
  // app_logs: JS writes "timestamp" → DB column "created_at"
  timestamp: "created_at",
  // app_logs: JS writes "user" → DB column "user_label"
  user: "user_label",
  // app_logs: JS writes "userName" → DB column "user_name"
  userName: "user_name",
  // app_logs: JS writes "entityType" → DB column "entity_type"
  entityType: "entity_type",
  entityId: "entity_id",
  beforeValue: "before_value",
  afterValue: "after_value",
  // dreams_goals: JS field names differ from DB column names
  title: "name",
  details: "notes",
  targetDate: "target_date",
  completedAt: "completed_at",
  archivedAt: "archived_at",
  occasion: "occasion",
};

// Fields to skip when reading from DB (internal Supabase fields)
const READ_SKIP = new Set(["user_id"]);

// Fields to skip when writing to DB (let DB handle timestamps, client provides id)
const WRITE_SKIP = new Set(["createdAt", "updatedAt"]);

function snake(str: string): string {
  return str.replace(/([A-Z])/g, (c) => `_${c.toLowerCase()}`);
}

function camel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/** Convert a DB row (snake_case) to JS format (camelCase where appropriate) */
function normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (READ_SKIP.has(k)) continue;
    if (READ_REMAP[k]) {
      result[READ_REMAP[k]] = v;
      continue;
    }
    result[KEEP_SNAKE.has(k) ? k : camel(k)] = v;
  }
  return result;
}

/** Convert a JS data object (camelCase) to DB columns (snake_case) */
function toDbRow(
  data: Record<string, unknown>,
  userId: string
): Record<string, unknown> {
  const result: Record<string, unknown> = { user_id: userId };
  for (const [k, v] of Object.entries(data)) {
    if (WRITE_SKIP.has(k)) continue;
    if (k === "id") {
      result["id"] = String(v);
      continue;
    }
    if (WRITE_REMAP[k]) {
      result[WRITE_REMAP[k]] = v;
      continue;
    }
    // Columns that are already snake_case in JS (from_bucket, income_type etc)
    result[KEEP_SNAKE.has(k) ? k : snake(k)] = v;
  }
  return result;
}

// ─── Sheet → table mapping ────────────────────────────────────────────────────

const SHEET_TABLE: Record<string, string> = {
  income: "income",
  expenses: "expenses",
  transfers: "transfers",
  People: "people",
  people: "people",
  LendingTransactions: "lending_transactions",
  lendingTransactions: "lending_transactions",
  remittances: "remittances",
  Liabilities: "liabilities",
  liabilities: "liabilities",
  RepaymentSchedules: "repayment_schedules",
  repaymentSchedules: "repayment_schedules",
  liability_payments: "liability_payments",
  liabilityPayments: "liability_payments",
  app_notifications: "app_notifications",
  app_logs: "app_logs",
  asset_vault: "asset_vault",
  asset_location_tags: "asset_location_tags",
  dreams_goals: "dreams_goals",
  bucket_definitions: "bucket_definitions",
  tracker_definitions: "tracker_definitions",
  category_definitions: "category_definitions",
  category_tracker_links: "category_tracker_links",
};

// Definition tables use composite PK (user_id, id) — need upsert on conflict
// Note: category_tracker_links is excluded — its PK is just `id` (single column)
const DEFINITION_TABLES = new Set([
  "bucket_definitions",
  "tracker_definitions",
  "category_definitions",
]);

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ─── Settings helpers ─────────────────────────────────────────────────────────

async function ensureUserSettings(userId: string) {
  const { data } = await supabase
    .from("user_settings")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) {
    await supabase.from("user_settings").insert({
      user_id: userId,
      settings: {},
      features: {
        remittance: false,
        lending: true,
        liabilities: true,
        asset_vault: true,
        goals: true,
        shared_jar: true,
        multi_user: false,
      },
    });
  }
}

function settingsRowToArray(row: { settings: Record<string, unknown>; features: Record<string, unknown> } | null) {
  if (!row) return [];
  const entries = Object.entries(row.settings || {}).map(([id, value]) => ({
    id,
    value: typeof value === "object" ? JSON.stringify(value) : value,
  }));
  // Expose features as a single setting entry (features JSON string)
  entries.push({ id: "features", value: JSON.stringify(row.features || {}) });
  return entries;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Load all data for the current user, grouped by "sheet" name. */
export async function getAllData(_signal?: AbortSignal) {
  const userId = await getUserId();
  await ensureUserSettings(userId);

  const [
    settingsRes,
    incomeRes,
    expensesRes,
    transfersRes,
    peopleRes,
    lendingRes,
    remittancesRes,
    liabilitiesRes,
    repaymentRes,
    liabilityPaymentsRes,
    notificationsRes,
    logsRes,
    assetVaultRes,
    assetTagsRes,
    goalsRes,
    bucketDefsRes,
    trackerDefsRes,
    categoryDefsRes,
    ctLinksRes,
  ] = await Promise.all([
    supabase.from("user_settings").select("settings, features").eq("user_id", userId).maybeSingle(),
    supabase.from("income").select("*").eq("user_id", userId).order("date", { ascending: false }),
    supabase.from("expenses").select("*").eq("user_id", userId).order("date", { ascending: false }),
    supabase.from("transfers").select("*").eq("user_id", userId).order("date", { ascending: false }),
    supabase.from("people").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("lending_transactions").select("*").eq("user_id", userId).order("date", { ascending: false }),
    supabase.from("remittances").select("*").eq("user_id", userId).order("date", { ascending: false }),
    supabase.from("liabilities").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("repayment_schedules").select("*").eq("user_id", userId).order("due_date", { ascending: true }),
    supabase.from("liability_payments").select("*").eq("user_id", userId).order("payment_date", { ascending: false }),
    supabase.from("app_notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("app_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("asset_vault").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("asset_location_tags").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("dreams_goals").select("*").eq("user_id", userId).order("created_at", { ascending: true }),
    supabase.from("bucket_definitions").select("*").eq("user_id", userId).order("sort_order", { ascending: true }),
    supabase.from("tracker_definitions").select("*").eq("user_id", userId).order("sort_order", { ascending: true }),
    supabase.from("category_definitions").select("*").eq("user_id", userId).order("sort_order", { ascending: true }),
    supabase.from("category_tracker_links").select("*").eq("user_id", userId),
  ]);

  const norm = (rows: unknown[] | null) =>
    (rows || []).map((r) => normalizeRow(r as Record<string, unknown>));

  const normPeople = norm(peopleRes.data);
  const normLending = norm(lendingRes.data);
  const normLiabilities = norm(liabilitiesRes.data);
  const normRepayments = norm(repaymentRes.data);
  const normLiabilityPayments = norm(liabilityPaymentsRes.data);
  const normGoals = norm(goalsRes.data);

  return {
    settings: settingsRowToArray(settingsRes.data as any),
    income: norm(incomeRes.data),
    expenses: norm(expensesRes.data),
    transfers: norm(transfersRes.data),
    // People variants (code checks all of these)
    People: normPeople,
    people: normPeople,
    // People variants
    PEOPLE: normPeople,
    // LendingTransactions variants
    LendingTransactions: normLending,
    lendingTransactions: normLending,
    Lendingtransactions: normLending,
    lendingtransactions: normLending,
    lending: normLending,
    // Legacy lent/borrowed sheets — now empty (all lending uses LendingTransactions)
    lent: [] as Record<string, unknown>[],
    borrowed: [] as Record<string, unknown>[],
    remittances: norm(remittancesRes.data),
    // Liabilities variants
    Liabilities: normLiabilities,
    liabilities: normLiabilities,
    // RepaymentSchedules variants
    RepaymentSchedules: normRepayments,
    repaymentSchedules: normRepayments,
    // LiabilityPayments variants
    LiabilityPayments: normLiabilityPayments,
    liabilityPayments: normLiabilityPayments,
    liability_payments: normLiabilityPayments,
    app_notifications: norm(notificationsRes.data),
    app_logs: norm(logsRes.data),
    asset_vault: norm(assetVaultRes.data),
    asset_location_tags: norm(assetTagsRes.data),
    // Goals variants
    dreams_goals: normGoals,
    goals: normGoals,
    bucket_definitions: norm(bucketDefsRes.data),
    tracker_definitions: norm(trackerDefsRes.data),
    category_definitions: norm(categoryDefsRes.data),
    category_tracker_links: norm(ctLinksRes.data),
  };
}

export const loadSheetsData = getAllData;

/** Insert a new row into the given sheet/table. */
export async function createSheetRecord<T = unknown>(
  sheet: string,
  data: Record<string, unknown>
): Promise<T> {
  const table = SHEET_TABLE[sheet];
  if (!table) throw new Error(`Unknown sheet: ${sheet}`);

  const userId = await getUserId();
  const row = toDbRow(data, userId);

  if (DEFINITION_TABLES.has(table)) {
    // Composite PK tables — upsert on (user_id, id)
    const { data: result, error } = await supabase
      .from(table)
      .upsert(row, { onConflict: "user_id,id" })
      .select()
      .maybeSingle();
    if (error) throw error;
    return (result ? normalizeRow(result as Record<string, unknown>) : row) as T;
  }

  const { data: result, error } = await supabase
    .from(table)
    .insert(row)
    .select()
    .maybeSingle();
  if (error) throw error;
  return (result ? normalizeRow(result as Record<string, unknown>) : row) as T;
}

/** Update an existing row by id. */
export async function updateSheetRecord<T = unknown>(
  sheet: string,
  id: string | number,
  data: Record<string, unknown>
): Promise<T> {
  const table = SHEET_TABLE[sheet];
  if (!table) throw new Error(`Unknown sheet: ${sheet}`);

  const userId = await getUserId();
  const { id: _id, ...rest } = toDbRow(data, userId);
  const patch = { ...rest, updated_at: new Date().toISOString() };
  const cleanId = String(id);

  if (DEFINITION_TABLES.has(table)) {
    const { data: result, error } = await supabase
      .from(table)
      .update(patch)
      .eq("user_id", userId)
      .eq("id", cleanId)
      .select()
      .maybeSingle();
    if (error) throw error;
    return (result ? normalizeRow(result as Record<string, unknown>) : patch) as T;
  }

  const { data: result, error } = await supabase
    .from(table)
    .update(patch)
    .eq("user_id", userId)
    .eq("id", cleanId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return (result ? normalizeRow(result as Record<string, unknown>) : patch) as T;
}

/** Delete a row by id. */
export async function deleteSheetRecord(sheet: string, id: string | number) {
  const table = SHEET_TABLE[sheet];
  if (!table) throw new Error(`Unknown sheet: ${sheet}`);

  const userId = await getUserId();
  const cleanId = String(id);

  if (DEFINITION_TABLES.has(table)) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("user_id", userId)
      .eq("id", cleanId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("user_id", userId)
      .eq("id", cleanId);
    if (error) throw error;
  }
}

/** Save/update a single setting key. */
export async function saveSetting(key: string, value: SheetValue): Promise<boolean> {
  try {
    const jsonValue = typeof value === "string" ? value : JSON.stringify(value);
    const { error } = await supabase.rpc("upsert_setting", {
      p_key: key,
      p_value: jsonValue,
    });
    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error("[saveSetting]", key, err);
    import("@/lib/toast").then(({ toast }) => toast(err.message || "Failed to save setting.", "error"));
    return false;
  }
}

/** Add a person to the people table. */
export async function addPerson(person: AddPersonPayload) {
  if (!person.name.trim()) throw new Error("Person name is required.");

  const userId = await getUserId();
  const id = crypto.randomUUID();
  const row = {
    id,
    user_id: userId,
    name: person.name.trim(),
    phone: person.phone?.trim() || "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("people")
    .insert(row)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeRow(data as Record<string, unknown>) : row;
}

/** Add a lending transaction. */
export async function addLendingTransaction(transaction: AddLendingTransactionPayload) {
  if (!transaction.personId) throw new Error("personId is required.");
  if (!["lent", "borrowed", "settlement"].includes(transaction.type))
    throw new Error("Invalid lending transaction type.");
  if (!transaction.amount || Number(transaction.amount) <= 0)
    throw new Error("Amount must be greater than 0.");

  const userId = await getUserId();
  const id = crypto.randomUUID();
  const row = {
    id,
    user_id: userId,
    person_id: String(transaction.personId),
    type: transaction.type,
    amount: Number(transaction.amount),
    account: transaction.account === "Cash" ? "Cash" : "Bank",
    affects_balance: Boolean(transaction.affectsAccountBalance),
    date: transaction.date,
    note: transaction.note?.trim() || "",
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("lending_transactions")
    .insert(row)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data ? normalizeRow(data as Record<string, unknown>) : normalizeRow(row);
}

// ─── Compat shims (used by older call sites) ──────────────────────────────────

export async function saveToSheet(sheet: string, values: SheetValue[]) {
  const data = Array.isArray(values) ? { id: values[0], data: values } : values;
  return createSheetRecord(sheet, data as Record<string, unknown>).then(() => true).catch(() => false);
}

export async function deleteFromSheet(sheet: string, id: string | number) {
  return deleteSheetRecord(sheet, id).then(() => true).catch(() => false);
}

export async function updateSheetRow(sheet: string, id: string | number, values: SheetValue[]) {
  return updateSheetRecord(sheet, id, { id, data: values }).then(() => true).catch(() => false);
}

export async function addRow(sheet: string, data: unknown) {
  return createSheetRecord(sheet, data as Record<string, unknown>).then(() => true).catch(() => false);
}

export async function updateRow(sheet: string, id: string, data: unknown) {
  return updateSheetRecord(sheet, id, data as Record<string, unknown>).then(() => true).catch(() => false);
}

export async function deleteRow(sheet: string, id: string) {
  return deleteSheetRecord(sheet, id).then(() => true).catch(() => false);
}

export async function resetAllData(): Promise<boolean> {
  try {
    const userId = await getUserId();
    const tables = [
      "income", "expenses", "transfers", "people", "lending_transactions",
      "remittances", "liabilities", "repayment_schedules", "liability_payments",
      "app_notifications", "app_logs", "asset_vault", "asset_location_tags",
      "dreams_goals", "bucket_definitions", "tracker_definitions",
      "category_definitions", "category_tracker_links",
    ];

    await Promise.all(
      tables.map((t) =>
        supabase.from(t).delete().eq("user_id", userId)
      )
    );

    // Reset settings to defaults
    await supabase
      .from("user_settings")
      .update({ settings: {}, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    return true;
  } catch (err: any) {
    import("@/lib/toast").then(({ toast }) => toast(err.message || "Reset failed.", "error"));
    return false;
  }
}
