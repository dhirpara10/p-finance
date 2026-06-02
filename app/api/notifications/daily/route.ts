import { createClient } from "@supabase/supabase-js";
import webPush from "web-push";
import { getDailyFinanceNotification } from "@/lib/notificationMessages";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT;

const supabase = createClient(SUPABASE_URL || "", SUPABASE_SERVICE_ROLE_KEY || "");

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

async function upsertSetting(id: string, value: string) {
  await supabase
    .from("app_rows")
    .upsert(
      {
        sheet: "settings",
        id,
        data: [id, value],
      },
      {
        onConflict: "sheet,id",
      }
    );
}

async function loadReminderSettings() {
  const ids = [
    "daily_reminder_enabled",
    "daily_reminder_time",
    "daily_reminder_tone",
    "daily_reminder_last_sent",
  ];

  const { data, error } = await supabase
    .from("app_rows")
    .select("id,data")
    .eq("sheet", "settings")
    .in("id", ids);

  if (error) {
    throw error;
  }

  const rowsById = new Map<string, any>();
  for (const row of data || []) {
    if (row?.id) {
      rowsById.set(row.id, row);
    }
  }

  const rawEnabled = getSettingValue(rowsById.get("daily_reminder_enabled"), "true");
  const rawTime = getSettingValue(rowsById.get("daily_reminder_time"), "21:30");
  const rawTone = getSettingValue(rowsById.get("daily_reminder_tone"), "mixed");
  const lastSent = getSettingValue(rowsById.get("daily_reminder_last_sent"), "");

  return {
    enabled: parseBooleanSetting(rawEnabled, true),
    reminderTime: rawTime,
    reminderTone: rawTone,
    lastSent,
  };
}

async function sendDailyNotification(request?: Request) {
  const missing = [
    { name: "SUPABASE_URL", value: SUPABASE_URL },
    { name: "SUPABASE_SERVICE_ROLE_KEY", value: SUPABASE_SERVICE_ROLE_KEY },
    { name: "NEXT_PUBLIC_VAPID_PUBLIC_KEY", value: VAPID_PUBLIC_KEY },
    { name: "VAPID_PRIVATE_KEY", value: VAPID_PRIVATE_KEY },
    { name: "VAPID_SUBJECT", value: VAPID_SUBJECT },
  ].filter((item) => !item.value);

  if (missing.length) {
    const publicKeyPresent = Boolean(VAPID_PUBLIC_KEY);
    const privateKeyPresent = Boolean(VAPID_PRIVATE_KEY);
    const subjectPresent = Boolean(VAPID_SUBJECT);

    return createJsonResponse(
      {
        success: false,
        error: `Missing VAPID configuration. public=${publicKeyPresent}, private=${privateKeyPresent}, subject=${subjectPresent}`,
      },
      500
    );
  }

  webPush.setVapidDetails(
    VAPID_SUBJECT as string,
    VAPID_PUBLIC_KEY as string,
    VAPID_PRIVATE_KEY as string
  );

  let force = false;
  if (request) {
    try {
      const body = await request.json();
      force = Boolean(body?.force === true || String(body?.force).toLowerCase() === "true");
    } catch {
      // ignore missing or invalid body, proceed with cron behavior
    }
  }

  let settings;
  try {
    settings = await loadReminderSettings();
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

  if (sent > 0) {
    await upsertSetting("daily_reminder_last_sent", nowMelbourneDate);
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
