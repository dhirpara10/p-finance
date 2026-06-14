import webPush from "web-push";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";
import type { AppNotification } from "@/lib/types";

function jsonResponse(payload: object, status = 200) {
  return Response.json(payload, { status });
}

function getMelbourneDateString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const p: Record<string, string> = {};
  for (const part of parts) if (part.type !== "literal") p[part.type] = part.value;
  return `${p.year}-${p.month}-${p.day}`;
}

function makeDedupeKey(repaymentId: string, type: string, dateStr: string) {
  return `${repaymentId}__${type}__${dateStr}`;
}

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
  const today = getMelbourneDateString();

  // Load all repayment schedules + liabilities from app_rows
  const { data: rows, error: rowsError } = await supabase
    .from("app_rows")
    .select("sheet, id, data")
    .in("sheet", ["RepaymentSchedules", "Liabilities", "settings"]);

  if (rowsError) {
    return jsonResponse({ success: false, error: rowsError.message }, 500);
  }

  const schedules = (rows || [])
    .filter((r) => r.sheet === "RepaymentSchedules" && r.data && typeof r.data === "object")
    .map((r) => r.data as Record<string, unknown>)
    .filter((d) => d.status !== "paid" && d.dueDate);

  const liabilities = (rows || [])
    .filter((r) => r.sheet === "Liabilities" && r.data && typeof r.data === "object")
    .map((r) => r.data as Record<string, unknown>)
    .filter((d) => d.status === "active");

  // Get usable balance from settings (initial balances only — approximate)
  // Full calc not available server-side; use a heuristic for the warning
  const settingsRows = (rows || []).filter((r) => r.sheet === "settings");
  function getSetting(key: string, fallback = "0") {
    const row = settingsRows.find((r) => r.id === key);
    if (!row) return fallback;
    const d = row.data;
    if (Array.isArray(d) && d.length >= 2) return String(d[1]);
    return fallback;
  }
  const initialBank = Number(getSetting("initial_bank_balance")) || 0;
  const initialCash = Number(getSetting("initial_cash_balance")) || 0;
  const approxUsable = initialBank + initialCash; // rough fallback

  const liabilityMap = new Map<string, Record<string, unknown>>();
  for (const l of liabilities) liabilityMap.set(String(l.id), l);

  const notifications: Omit<AppNotification, "id">[] = [];

  for (const sched of schedules) {
    const id = String(sched.id || "");
    const dueDate = String(sched.dueDate || "");
    const amount = Number(sched.amount) || 0;
    const liability = liabilityMap.get(String(sched.liabilityId || ""));
    const providerName = String(liability?.provider || liability?.name || "Liability");

    if (!id || !dueDate) continue;

    let type: AppNotification["type"] | null = null;
    let title = "";
    let message = "";

    if (dueDate < today) {
      type = "repayment_overdue";
      title = "Repayment overdue";
      message = `Your ${providerName} repayment of $${amount.toFixed(2)} is overdue.`;
    } else if (dueDate === today) {
      type = "repayment_due";
      title = "Repayment due today";
      message = `Your ${providerName} repayment of $${amount.toFixed(2)} is due today.`;
    } else {
      const diff = Math.ceil((new Date(dueDate).getTime() - new Date(today).getTime()) / 86400000);
      if (diff <= 7) {
        type = "repayment_upcoming";
        title = "Upcoming repayment";
        message = `Your ${providerName} repayment of $${amount.toFixed(2)} is due in ${diff} day${diff !== 1 ? "s" : ""}.`;
      }
    }

    if (type) {
      const dedupeKey = makeDedupeKey(id, type, today);
      notifications.push({
        type,
        title,
        message,
        relatedEntityType: "repayment_schedule",
        relatedEntityId: id,
        isRead: false,
        createdAt: new Date().toISOString(),
        dedupeKey,
      });
    }

    // Insufficient usable balance warning
    if (amount > approxUsable && dueDate >= today) {
      const dedupeKey = makeDedupeKey(id, "insufficient_usable_balance", today);
      notifications.push({
        type: "insufficient_usable_balance",
        title: "Repayment risk",
        message: `Your usable balance may be lower than your upcoming $${amount.toFixed(2)} repayment.`,
        relatedEntityType: "repayment_schedule",
        relatedEntityId: id,
        isRead: false,
        createdAt: new Date().toISOString(),
        dedupeKey,
      });
    }
  }

  // Upsert notifications (dedupe by id = dedupeKey)
  let created = 0;
  for (const notif of notifications) {
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

  // Send push notifications for critical ones (due today, overdue, insufficient balance)
  const criticalTypes: AppNotification["type"][] = ["repayment_due", "repayment_overdue", "insufficient_usable_balance"];
  const criticalNotifs = notifications.filter((n) => criticalTypes.includes(n.type));

  let pushed = 0;
  if (criticalNotifs.length > 0 && publicKey && privateKey && subject) {
    webPush.setVapidDetails(subject, publicKey, privateKey);
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, subscription")
      .eq("enabled", true);

    for (const notif of criticalNotifs) {
      for (const sub of subscriptions || []) {
        try {
          await webPush.sendNotification(sub.subscription, JSON.stringify({ title: notif.title, body: notif.message, url: "/" }));
          pushed++;
        } catch (err: any) {
          const code = err?.statusCode;
          if (code === 410 || code === 404) {
            await supabase.from("push_subscriptions").update({ enabled: false }).eq("id", sub.id);
          }
        }
      }
    }
  }

  return jsonResponse({ success: true, created, pushed, total: notifications.length });
}

export async function GET() {
  return POST();
}
