import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const subscription = body?.subscription;

    if (!subscription || !subscription.endpoint) {
      return Response.json(
        { success: false, error: "Missing subscription endpoint." },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent") || "";
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          endpoint: subscription.endpoint,
          subscription,
          user_agent: userAgent,
          enabled: true,
        },
        {
          onConflict: "endpoint",
        }
      );

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Subscription failed.";
    return Response.json({ success: false, error: message }, { status: 500 });
  }
}
