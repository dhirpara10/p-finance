import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function POST(request: Request) {
  const body = await request.json();
  const subscription = body?.subscription;

  if (!subscription || !subscription.endpoint) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing subscription endpoint." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const userAgent = request.headers.get("user-agent") || "";

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
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
