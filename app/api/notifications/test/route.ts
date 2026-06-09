import webPush from "web-push";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

export async function POST() {
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;

    if (!publicKey || !privateKey || !subject) {
      throw new Error("Missing VAPID configuration.");
    }

    webPush.setVapidDetails(subject, publicKey, privateKey);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, subscription")
      .eq("enabled", true);

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    const payload = {
      title: "Finance reminder test",
      body: "Notifications are working. Now keep your money data clean.",
      url: "/",
    };

    for (const subscription of data || []) {
      try {
        await webPush.sendNotification(
          subscription.subscription,
          JSON.stringify(payload)
        );
      } catch (sendError: unknown) {
        const statusCode =
          sendError &&
          typeof sendError === "object" &&
          "statusCode" in sendError &&
          typeof sendError.statusCode === "number"
            ? sendError.statusCode
            : undefined;

        if (statusCode === 410 || statusCode === 404) {
          await supabase
            .from("push_subscriptions")
            .update({ enabled: false })
            .eq("id", subscription.id);
        }
      }
    }

    return Response.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Test notification failed.";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
