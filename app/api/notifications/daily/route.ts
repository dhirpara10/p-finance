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

async function sendDailyNotification() {
  const missing = [
    { name: "SUPABASE_URL", value: SUPABASE_URL },
    { name: "SUPABASE_SERVICE_ROLE_KEY", value: SUPABASE_SERVICE_ROLE_KEY },
    { name: "NEXT_PUBLIC_VAPID_PUBLIC_KEY", value: VAPID_PUBLIC_KEY },
    { name: "VAPID_PRIVATE_KEY", value: VAPID_PRIVATE_KEY },
    { name: "VAPID_SUBJECT", value: VAPID_SUBJECT },
  ].filter((item) => !item.value);

  if (missing.length) {
    const keys = missing.map((item) => item.name);
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

  const notification = getDailyFinanceNotification();

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, subscription")
    .eq("enabled", true);

  if (error) {
    return createJsonResponse({ success: false, error: error.message }, 500);
  }

  if (!data || data.length === 0) {
    return createJsonResponse({ success: false, error: "No push subscriptions found" }, 404);
  }

  const payload = {
    title: notification.title,
    body: notification.body,
    url: "/",
  };

  let sent = 0;
  let failed = 0;

  for (const subscription of data) {
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

  return createJsonResponse({
    success: true,
    sent,
    failed,
    message: "Daily notification sent",
  });
}

export async function GET() {
  return sendDailyNotification();
}

export async function POST() {
  return sendDailyNotification();
}
