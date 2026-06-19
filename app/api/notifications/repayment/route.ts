import webPush from "web-push";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import type { AppNotification } from "@/lib/types";

// ─── Utilities ────────────────────────────────────────────────────────────────

function jsonResponse(payload: object, status = 200) {
  return Response.json(payload, { status });
}

function getMelbourneDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const fmt = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(d);
  const p: Record<string, string> = {};
  for (const part of parts) if (part.type !== "literal") p[part.type] = part.value;
  return `${p.year}-${p.month}-${p.day}`;
}

// ─── Bank Balance Computation ─────────────────────────────────────────────────

/**
 * computeBankBalance
 *
 * Pure function — computes the actual bank account balance from raw sheet data.
 * Uses Bank balance only (never usable balance, net worth, or jar balance).
 * This is the authoritative figure for push notification eligibility.
 */
export function computeBankBalance(
  initialBank: number,
  data: {
    incomes: Record<string, unknown>[];
    expenses: Record<string, unknown>[];
    transfers: Record<string, unknown>[];
    lendingTransactions: Record<string, unknown>[];
    lentRecords: Record<string, unknown>[];
    borrowedRecords: Record<string, unknown>[];
    remittances: Record<string, unknown>[];
    paidRepaymentSchedules: Record<string, unknown>[];
  }
): number {
  let balance = initialBank;

  // Income → bank portion (total income minus cash received)
  for (const inc of data.incomes) {
    const amount = Number(inc.amount ?? 0);
    const cash = Number(inc.cash_received ?? 0);
    balance += amount - cash;
  }

  // Expenses from bank (skip BNPL / credit card — those deduct via repayments)
  for (const exp of data.expenses) {
    const method = String(exp.paymentMethod ?? "");
    if (method === "Afterpay" || method === "StepPay" || method === "CreditCard" || method === "SharedJar") continue;
    if (exp.account === "Bank" || method === "Bank") {
      balance -= Number(exp.amount ?? 0);
    }
  }

  // Transfers between bank and other accounts/buckets
  for (const t of data.transfers) {
    const from = String(t.from_bucket ?? "");
    const to = String(t.to_bucket ?? "");
    const amt = Number(t.amount ?? 0);
    if (from === "Bank") balance -= amt;
    if (to === "Bank") balance += amt;
  }

  // Paid repayment schedules debited from bank
  for (const s of data.paidRepaymentSchedules) {
    const acct = String(s.linkedRepaymentAccount ?? "Bank");
    if (acct === "Bank") {
      balance -= Number(s.amount ?? 0);
    }
  }

  // Modern lending transactions affecting bank balance
  for (const lt of data.lendingTransactions) {
    const affects =
      lt.affectsAccountBalance === true || lt.affectsAccountBalance === "true";
    if (!affects) continue;
    const acct = String(lt.account ?? "Bank");
    if (acct !== "Bank") continue;
    const amt = Number(lt.amount ?? 0);
    if (lt.type === "lent") balance -= amt;
    else if (lt.type === "borrowed") balance += amt;
  }

  // Legacy lent records
  for (const l of data.lentRecords) {
    const affects =
      l.affectsAccountBalance !== false && l.affectsAccountBalance !== "false";
    if (affects && l.account === "Bank") {
      balance -= Number(l.amount ?? 0);
    }
  }

  // Legacy borrowed records
  for (const b of data.borrowedRecords) {
    const affects =
      b.affectsAccountBalance !== false && b.affectsAccountBalance !== "false";
    if (affects && b.account === "Bank") {
      balance += Number(b.amount ?? 0);
    }
  }

  // Remittances from bank
  for (const r of data.remittances) {
    const affects =
      r.affectsBalance !== false && r.affectsBalance !== "false";
    if (affects && r.account === "Bank") {
      balance -= Number(r.audAmount ?? 0);
    }
  }

  return balance;
}

// ─── Core Logic (pure, exported for tests) ───────────────────────────────────

export type BnplRepaymentItem = {
  scheduleId: string;
  liabilityId: string;
  dueDate: string;
  amount: number;
  providerName: string;
};

export type BnplNotificationResult = {
  newInAppNotifications: Omit<AppNotification, "id">[];
  pushNotificationsToSend: Omit<AppNotification, "id">[];
};

/**
 * processBnplRepaymentNotifications
 *
 * Pure function — no I/O, no side effects.
 *
 * Rules:
 *  - Only processes repayments due: today, overdue (unpaid), or tomorrow.
 *  - If bankBalance >= amount → create in-app notification AND add to push list.
 *  - If bankBalance < amount  → create in-app notification only (no push).
 *  - Dedup: skip if notificationKey already exists.
 *  - One notification per instalment per key (never re-notifies same key).
 */
export function processBnplRepaymentNotifications(params: {
  repayments: BnplRepaymentItem[];
  bankBalance: number;
  existingKeys: Set<string>;
  today: string;
  tomorrow: string;
}): BnplNotificationResult {
  const { repayments, bankBalance, existingKeys, today, tomorrow } = params;

  const newInApp: Omit<AppNotification, "id">[] = [];
  const pushList: Omit<AppNotification, "id">[] = [];

  for (const r of repayments) {
    const isOverdue = r.dueDate < today;
    const isToday = r.dueDate === today;
    const isTomorrow = r.dueDate === tomorrow;

    // Only notify for overdue, today, or tomorrow
    if (!isOverdue && !isToday && !isTomorrow) continue;

    // Stable dedup key: one per instalment, never duplicates on refresh
    const dedupeKey = `bnpl_repayment:${r.liabilityId}:${r.scheduleId}:${r.dueDate}:${r.amount}`;
    if (existingKeys.has(dedupeKey)) continue;

    const amtStr = `$${r.amount.toFixed(2)}`;
    const when = isToday ? "due today" : isOverdue ? "(overdue)" : "due tomorrow";

    if (bankBalance >= r.amount) {
      // Bank has enough — notify and push
      const notif: Omit<AppNotification, "id"> = {
        type: "bnpl_ready",
        title: "BNPL repayment ready",
        message: `You have enough money in your bank for your ${amtStr} ${r.providerName} repayment ${when}.`,
        relatedEntityType: "repayment_schedule",
        relatedEntityId: r.scheduleId,
        isRead: false,
        createdAt: new Date().toISOString(),
        dedupeKey,
      };
      newInApp.push(notif);
      pushList.push(notif);
    } else {
      // Bank too low — in-app only, no push
      const notif: Omit<AppNotification, "id"> = {
        type: "bnpl_low_balance",
        title: "Repayment detected",
        message: `We detected a ${amtStr} ${r.providerName} BNPL repayment, but your Bank balance is not enough. Add money to Bank before repayment.`,
        relatedEntityType: "repayment_schedule",
        relatedEntityId: r.scheduleId,
        isRead: false,
        createdAt: new Date().toISOString(),
        dedupeKey,
      };
      newInApp.push(notif);
      // Deliberately not adding to pushList
    }
  }

  return { newInAppNotifications: newInApp, pushNotificationsToSend: pushList };
}

// ─── API Route ────────────────────────────────────────────────────────────────

export async function POST() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ success: false, error: "Missing Supabase config" }, 500);
  }

  const supabase = getSupabaseAdmin();
  const today = getMelbourneDate(0);
  const tomorrow = getMelbourneDate(1);

  // Fetch all sheets needed to compute bank balance + repayment data
  const { data: rows, error: rowsError } = await supabase
    .from("app_rows")
    .select("sheet, id, data")
    .in("sheet", [
      "RepaymentSchedules",
      "Liabilities",
      "settings",
      "income",
      "expenses",
      "transfers",
      "LendingTransactions",
      "lent",
      "borrowed",
      "remittances",
      "app_notifications",
    ]);

  if (rowsError) {
    return jsonResponse({ success: false, error: rowsError.message }, 500);
  }

  const allRows = rows || [];

  // Parse helper
  function sheet(name: string): Record<string, unknown>[] {
    return allRows
      .filter((r) => r.sheet === name && r.data && typeof r.data === "object")
      .map((r) => r.data as Record<string, unknown>);
  }

  // Settings
  const settingsRows = allRows.filter((r) => r.sheet === "settings");
  function getSetting(key: string, fallback = "0"): string {
    const row = settingsRows.find((r) => r.id === key);
    if (!row) return fallback;
    const d = row.data;
    if (Array.isArray(d) && d.length >= 2) return String(d[1]);
    return fallback;
  }
  const initialBank = Number(getSetting("initial_bank_balance")) || 0;

  // Compute actual bank balance from all transaction history
  const paidSchedules = sheet("RepaymentSchedules").filter(
    (s) => s.status === "paid"
  );
  const bankBalance = computeBankBalance(initialBank, {
    incomes: sheet("income"),
    expenses: sheet("expenses"),
    transfers: sheet("transfers"),
    lendingTransactions: sheet("LendingTransactions"),
    lentRecords: sheet("lent"),
    borrowedRecords: sheet("borrowed"),
    remittances: sheet("remittances"),
    paidRepaymentSchedules: paidSchedules,
  });

  // Active BNPL liabilities only
  const liabilities = sheet("Liabilities").filter(
    (l) => l.status === "active" && l.type === "bnpl"
  );
  const liabilityMap = new Map<string, Record<string, unknown>>();
  for (const l of liabilities) liabilityMap.set(String(l.id), l);

  // Unpaid repayment schedules for active BNPL liabilities
  const unpaidSchedules = sheet("RepaymentSchedules").filter((s) => {
    const lid = String(s.liabilityId ?? "");
    return (
      s.status !== "paid" &&
      s.dueDate &&
      liabilityMap.has(lid)
    );
  });

  // Map to BnplRepaymentItem
  const repayments: BnplRepaymentItem[] = unpaidSchedules.map((s) => {
    const liability = liabilityMap.get(String(s.liabilityId ?? ""));
    const providerName = String(
      liability?.provider ?? liability?.name ?? "BNPL"
    );
    return {
      scheduleId: String(s.id ?? ""),
      liabilityId: String(s.liabilityId ?? ""),
      dueDate: String(s.dueDate ?? ""),
      amount: Number(s.amount ?? 0),
      providerName,
    };
  });

  // Collect existing notification dedup keys.
  // Also treat any existing notification for the same scheduleId as a dedup hit —
  // this prevents re-notification when old records used a different key format.
  const existingNotifications = sheet("app_notifications");
  const existingKeys = new Set<string>([
    ...existingNotifications
      .map((n) => String(n.dedupeKey ?? n.id ?? ""))
      .filter(Boolean),
    // Synthesise the current dedup key format for any old notification that has
    // a relatedEntityId (scheduleId) — prevents duplicate creation across formats.
    ...existingNotifications
      .filter((n) => {
        const t = String(n.type ?? "");
        return t === "bnpl_ready" || t === "bnpl_low_balance" || t === "insufficient_usable_balance" || t === "repayment_due" || t === "repayment_overdue";
      })
      .flatMap((n) => {
        const scheduleId = String(n.relatedEntityId ?? "");
        if (!scheduleId) return [];
        // Find the matching repayment to reconstruct the dedup key
        const match = repayments.find((r) => r.scheduleId === scheduleId);
        if (!match) return [];
        return [`bnpl_repayment:${match.liabilityId}:${match.scheduleId}:${match.dueDate}:${match.amount}`];
      }),
  ]);

  // Process
  const { newInAppNotifications, pushNotificationsToSend } =
    processBnplRepaymentNotifications({
      repayments,
      bankBalance,
      existingKeys,
      today,
      tomorrow,
    });

  // Upsert in-app notifications (deduped by key)
  let created = 0;
  for (const notif of newInAppNotifications) {
    const { error } = await supabase.from("app_rows").upsert(
      {
        sheet: "app_notifications",
        id: notif.dedupeKey,
        data: { ...notif, id: notif.dedupeKey },
      },
      { onConflict: "sheet,id", ignoreDuplicates: true }
    );
    if (!error) created++;
  }

  // Send push notifications ONLY for bank-sufficient repayments
  let pushed = 0;
  if (
    pushNotificationsToSend.length > 0 &&
    publicKey &&
    privateKey &&
    subject
  ) {
    webPush.setVapidDetails(subject, publicKey, privateKey);
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, subscription")
      .eq("enabled", true);

    for (const notif of pushNotificationsToSend) {
      for (const sub of subscriptions ?? []) {
        try {
          await webPush.sendNotification(
            sub.subscription,
            JSON.stringify({
              title: notif.title,
              body: notif.message,
              url: "/",
            })
          );
          pushed++;
        } catch (err: unknown) {
          const code = (err as { statusCode?: number })?.statusCode;
          if (code === 410 || code === 404) {
            await supabase
              .from("push_subscriptions")
              .update({ enabled: false })
              .eq("id", sub.id);
          }
        }
      }
    }
  }

  return jsonResponse({
    success: true,
    bankBalance,
    created,
    pushed,
    total: newInAppNotifications.length,
  });
}

export async function GET() {
  return POST();
}
