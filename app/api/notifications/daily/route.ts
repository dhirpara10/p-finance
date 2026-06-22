import type { SupabaseClient } from "@supabase/supabase-js";
import webPush from "web-push";
import { getDailyFinanceNotification } from "@/lib/notificationMessages";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

function createJsonResponse(payload: object, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getSettingValue(row: any, fallback: string) {
  if (!row) {
    return fallback;
  }

  const data = row.data;
  if (Array.isArray(data) && data.length >= 2) {
    return String(data[1]);
  }

  if (data && typeof data === "object") {
    return String(data.value ?? data.Value ?? data.val ?? fallback);
  }

  return String(data ?? fallback);
}

function parseBooleanSetting(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return fallback;
}

function parseTimeToMinutes(value: string) {
  const parts = String(value || "").split(":");
  if (parts.length !== 2) return null;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function getMelbourneDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const result: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      result[part.type] = part.value;
    }
  }

  return {
    year: result.year || "0000",
    month: result.month || "00",
    day: result.day || "00",
    hour: result.hour || "00",
    minute: result.minute || "00",
  };
}

function getMelbourneDateString(date = new Date()) {
  const parts = getMelbourneDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function getMelbourneMinutesNow(date = new Date()) {
  const parts = getMelbourneDateParts(date);
  return Number(parts.hour) * 60 + Number(parts.minute);
}

function isWithinReminderWindow(nowMinutes: number, reminderMinutes: number) {
  const windowMinutes = 30;
  const endMinutes = (reminderMinutes + windowMinutes) % 1440;

  if (endMinutes > reminderMinutes) {
    return nowMinutes >= reminderMinutes && nowMinutes < endMinutes;
  }

  return nowMinutes >= reminderMinutes || nowMinutes < endMinutes;
}

async function upsertSetting(supabase: SupabaseClient, userId: string, key: string, value: string) {
  const { data: existing } = await supabase
    .from("user_settings")
    .select("settings")
    .eq("user_id", userId)
    .maybeSingle();
  const updated = { ...(existing?.settings || {}), [key]: value };
  await supabase
    .from("user_settings")
    .upsert({ user_id: userId, settings: updated, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
}

async function loadReminderSettings(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("user_settings")
    .select("settings")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const s = (data?.settings as Record<string, unknown>) || {};
  return {
    enabled: parseBooleanSetting(s["daily_reminder_enabled"], true),
    reminderTime: String(s["daily_reminder_time"] ?? "21:30"),
    reminderTone: String(s["daily_reminder_tone"] ?? "mixed"),
    lastSent: String(s["daily_reminder_last_sent"] ?? ""),
  };
}

async function sendDailyNotification(request?: Request) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  const missing = [
    { name: "SUPABASE_URL", value: supabaseUrl },
    { name: "SUPABASE_SERVICE_ROLE_KEY", value: serviceRoleKey },
    { name: "NEXT_PUBLIC_VAPID_PUBLIC_KEY", value: publicKey },
    { name: "VAPID_PRIVATE_KEY", value: privateKey },
    { name: "VAPID_SUBJECT", value: subject },
  ].filter((item) => !item.value);

  if (missing.length) {
    return createJsonResponse(
      {
        success: false,
        error: `Missing server configuration: ${missing.map((item) => item.name).join(", ")}`,
      },
      500
    );
  }

  webPush.setVapidDetails(subject!, publicKey!, privateKey!);
  const supabase = getSupabaseAdmin();

  let force = false;
  if (request) {
    try {
      const body = await request.json();
      force = Boolean(body?.force === true || String(body?.force).toLowerCase() === "true");
    } catch {
      // ignore missing or invalid body, proceed with cron behavior
    }
  }

  // Find first user who has reminders enabled
  let userId: string | null = null;
  let settings;
  try {
    const { data: allSettings } = await supabase
      .from("user_settings")
      .select("user_id, settings");
    const active = (allSettings || []).find((row: any) => row.settings?.daily_reminder_enabled !== false);
    if (!active) {
      return createJsonResponse({ success: true, skipped: true, reason: "No users with reminders enabled" });
    }
    userId = active.user_id;
    settings = await loadReminderSettings(supabase, userId!);
  } catch (error: any) {
    return createJsonResponse({ success: false, error: error.message || "Failed to load reminder settings" }, 500);
  }

  const nowMelbourneDate = getMelbourneDateString();
  const nowMelbourneMinutes = getMelbourneMinutesNow();
  const reminderMinutes = parseTimeToMinutes(settings.reminderTime) ?? parseTimeToMinutes("21:30") ?? 21 * 60 + 30;

  if (!force) {
    if (!settings.enabled) {
      return createJsonResponse({ success: true, skipped: true, reason: "Daily reminder disabled" });
    }

    if (!isWithinReminderWindow(nowMelbourneMinutes, reminderMinutes)) {
      return createJsonResponse({ success: true, skipped: true, reason: "Outside reminder time window" });
    }

    if (settings.lastSent === nowMelbourneDate) {
      return createJsonResponse({ success: true, skipped: true, reason: "Daily reminder already sent today" });
    }
  }

  const { data: subscriptions, error: subscriptionError } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, subscription")
    .eq("enabled", true);

  if (subscriptionError) {
    return createJsonResponse({ success: false, error: subscriptionError.message }, 500);
  }

  if (!subscriptions || subscriptions.length === 0) {
    return createJsonResponse({ success: false, error: "No push subscriptions found" }, 404);
  }

  const notification = getDailyFinanceNotification();
  const payload = {
    title: notification.title,
    body: notification.body,
    url: "/",
  };

  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    try {
      await webPush.sendNotification(subscription.subscription, JSON.stringify(payload));
      sent += 1;
    } catch (sendError: any) {
      failed += 1;
      const statusCode = sendError?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        await supabase
          .from("push_subscriptions")
          .update({ enabled: false })
          .eq("id", subscription.id);
      }
    }
  }

  if (sent > 0 && userId) {
    await upsertSetting(supabase, userId, "daily_reminder_last_sent", nowMelbourneDate);
  }

  return createJsonResponse({
    success: true,
    sent,
    failed,
    forced: force ? true : undefined,
    message: "Daily notification sent",
  });
}

export async function GET() {
  return sendDailyNotification();
}

export async function POST(request: Request) {
  return sendDailyNotification(request);
}
