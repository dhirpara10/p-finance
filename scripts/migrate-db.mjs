/**
 * One-time DB migration script.
 * Run: node scripts/migrate-db.mjs
 *
 * Fixes:
 * 1. Renames settings key "budget_buckets" → "savings_buckets"
 * 2. Renames settings key "budget_trackers" → "bucket_list_trackers" (if present)
 * 3. Renames "initial_commbank_balance" → "initial_bank_balance" (if not already set)
 * 4. Removes orphaned notif_read_* keys from settings sheet
 * 5. Converts any remaining array-format expense rows to object format
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const supabase = createClient(
  env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

let fixed = 0;
let skipped = 0;

async function log(msg) {
  console.log(`  ${msg}`);
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function getAllRows(sheet) {
  const { data, error } = await supabase
    .from("app_rows")
    .select("sheet, id, data")
    .eq("sheet", sheet);
  if (error) throw error;
  return data || [];
}

async function upsertRow(sheet, id, data) {
  const { error } = await supabase
    .from("app_rows")
    .upsert({ sheet, id, data }, { onConflict: "sheet,id" });
  if (error) throw error;
}

async function deleteRow(sheet, id) {
  const { error } = await supabase
    .from("app_rows")
    .delete()
    .eq("sheet", sheet)
    .eq("id", id);
  if (error) throw error;
}

function getSettingValue(rows, key) {
  const row = rows.find((r) => r.id === key);
  if (!row) return undefined;
  const d = row.data;
  if (Array.isArray(d) && d.length >= 2) return d[1];
  return d;
}

// ── 1. Settings key renames ───────────────────────────────────────────────────

async function migrateSettingsKeys() {
  console.log("\n── Phase 1: Settings key renames ──");
  const rows = await getAllRows("settings");

  const renames = [
    ["budget_buckets", "savings_buckets"],
    ["budget_trackers", "bucket_list_trackers"],
  ];

  for (const [oldKey, newKey] of renames) {
    const oldRow = rows.find((r) => r.id === oldKey);
    const newRow = rows.find((r) => r.id === newKey);

    if (!oldRow) {
      log(`${oldKey} → not found, skip`);
      skipped++;
      continue;
    }

    if (newRow) {
      // New key already exists — delete the old one to avoid confusion
      await deleteRow("settings", oldKey);
      log(`${oldKey} → ${newKey} already exists, deleted old key`);
      fixed++;
      continue;
    }

    // Rename: write value under new key, delete old key
    const value = Array.isArray(oldRow.data) ? oldRow.data[1] : oldRow.data;
    await upsertRow("settings", newKey, [newKey, value]);
    await deleteRow("settings", oldKey);
    log(`✓ Renamed "${oldKey}" → "${newKey}"`);
    fixed++;
  }

  // Handle initial_commbank_balance / initial_up_balance → initial_bank_balance
  const commbankRow = rows.find((r) => r.id === "initial_commbank_balance");
  const upRow = rows.find((r) => r.id === "initial_up_balance");
  const bankRow = rows.find((r) => r.id === "initial_bank_balance");

  if (!bankRow) {
    // Sum both legacy balances into the canonical key
    const commbal = commbankRow ? Number(getSettingValue(rows, "initial_commbank_balance")) || 0 : 0;
    const upbal = upRow ? Number(getSettingValue(rows, "initial_up_balance")) || 0 : 0;
    const total = commbal + upbal;
    await upsertRow("settings", "initial_bank_balance", ["initial_bank_balance", total]);
    log(`✓ Created initial_bank_balance = ${total} (from commbank ${commbal} + up ${upbal})`);
    fixed++;
  } else {
    log(`initial_bank_balance already exists (${getSettingValue(rows, "initial_bank_balance")}), skip`);
    skipped++;
  }

  if (commbankRow) {
    await deleteRow("settings", "initial_commbank_balance");
    log(`✓ Deleted stale "initial_commbank_balance"`);
    fixed++;
  }
  if (upRow) {
    await deleteRow("settings", "initial_up_balance");
    log(`✓ Deleted stale "initial_up_balance"`);
    fixed++;
  }
}

// ── 2. Remove orphaned notif_read_* from settings ────────────────────────────

async function cleanOrphanedNotifKeys() {
  console.log("\n── Phase 2: Clean orphaned notif_read_* from settings ──");
  const rows = await getAllRows("settings");
  const orphans = rows.filter((r) => r.id.startsWith("notif_read_"));

  if (orphans.length === 0) {
    log("None found");
    return;
  }

  for (const row of orphans) {
    await deleteRow("settings", row.id);
    log(`✓ Deleted "${row.id}"`);
    fixed++;
  }
}

// ── 3. Normalize expense rows array → object ──────────────────────────────────

function categoryIdFromName(name) {
  return "category_" + String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
}

async function normalizeExpenses() {
  console.log("\n── Phase 3: Normalize expense rows (array → object) ──");
  const rows = await getAllRows("expenses");
  let converted = 0;

  for (const row of rows) {
    const d = row.data;
    if (!Array.isArray(d)) {
      // Already an object — ensure paymentMethod is set
      if (!d.paymentMethod) {
        const updated = {
          ...d,
          paymentMethod: d.account === "Cash" ? "Cash" : "Bank",
          categoryId: d.categoryId || categoryIdFromName(d.category),
        };
        await upsertRow("expenses", row.id, updated);
        converted++;
        log(`✓ Patched object row ${row.id} (added paymentMethod/categoryId)`);
      }
      continue;
    }

    // Array format: [id, amount, category, account, date, notes, metadata]
    const [id, amount, category, account, date, notes, metadata] = d;
    const meta = metadata && typeof metadata === "object" ? metadata : {};

    const obj = {
      id: String(id || row.id),
      amount: Number(amount) || 0,
      category: String(category || ""),
      categoryId: meta.categoryId || categoryIdFromName(String(category || "")),
      account: account === "Cash" ? "Cash" : "Bank",
      paymentMethod: meta.paymentMethod || (account === "Cash" ? "Cash" : "Bank"),
      date: String(date || ""),
      notes: String(notes || ""),
      isRecurring: Boolean(meta.isRecurring),
      recurringFrequency: meta.recurringFrequency || undefined,
      recurringEndDate: meta.recurringEndDate || undefined,
      createdAt: meta.createdAt || new Date().toISOString(),
      updatedAt: meta.updatedAt || new Date().toISOString(),
      addedBy: meta.addedBy || undefined,
      liabilityId: meta.liabilityId || undefined,
    };

    // Remove undefined keys
    Object.keys(obj).forEach((k) => obj[k] === undefined && delete obj[k]);

    await upsertRow("expenses", String(id || row.id), obj);
    converted++;
    log(`✓ Converted array expense ${row.id} ("${category}" $${amount})`);
    fixed++;
  }

  if (converted === 0) log("All expenses already in object format");
}

// ── 4. Normalize income rows ──────────────────────────────────────────────────

async function normalizeIncome() {
  console.log("\n── Phase 4: Normalize income rows ──");
  const rows = await getAllRows("income");
  let converted = 0;

  for (const row of rows) {
    const d = row.data;
    if (!Array.isArray(d)) {
      skipped++;
      continue;
    }

    const [id, income_type, source, rate, hours, amount, cash_received, date, notes] = d;
    const obj = {
      id: String(id || row.id),
      income_type: income_type === "Hourly" ? "Hourly" : "Fixed Amount",
      source: String(source || ""),
      rate: Number(rate) || 0,
      hours: Number(hours) || 0,
      amount: Number(amount) || 0,
      cash_received: Number(cash_received) || 0,
      date: String(date || ""),
      notes: String(notes || ""),
      createdAt: new Date().toISOString(),
    };

    await upsertRow("income", String(id || row.id), obj);
    converted++;
    fixed++;
    log(`✓ Converted array income ${row.id} ("${source}" $${amount})`);
  }

  if (converted === 0) log("All income already in object format");
}

// ── 5. Normalize transfer rows ────────────────────────────────────────────────

async function normalizeTransfers() {
  console.log("\n── Phase 5: Normalize transfer rows ──");
  const rows = await getAllRows("transfers");
  let converted = 0;

  for (const row of rows) {
    const d = row.data;
    if (!Array.isArray(d)) {
      skipped++;
      continue;
    }

    const [id, from_bucket, to_bucket, amount, date, notes, metadata] = d;
    const meta = metadata && typeof metadata === "object" ? metadata : {};

    const obj = {
      id: String(id || row.id),
      from_bucket: String(from_bucket || "Bank"),
      to_bucket: String(to_bucket || ""),
      amount: Number(amount) || 0,
      date: String(date || ""),
      notes: String(notes || ""),
      trackerId: meta.trackerId || undefined,
      addedBy: meta.addedBy || undefined,
      createdAt: meta.createdAt || new Date().toISOString(),
    };

    Object.keys(obj).forEach((k) => obj[k] === undefined && delete obj[k]);

    await upsertRow("transfers", String(id || row.id), obj);
    converted++;
    fixed++;
    log(`✓ Converted array transfer ${row.id}`);
  }

  if (converted === 0) log("All transfers already in object format");
}

// ── Main ──────────────────────────────────────────────────────────────────────

console.log("🔧 Personal Finance DB Migration");
console.log("================================");

try {
  await migrateSettingsKeys();
  await cleanOrphanedNotifKeys();
  await normalizeExpenses();
  await normalizeIncome();
  await normalizeTransfers();

  console.log(`\n✅ Done — ${fixed} fixed, ${skipped} skipped`);
} catch (err) {
  console.error("\n❌ Migration failed:", err.message);
  process.exit(1);
}
