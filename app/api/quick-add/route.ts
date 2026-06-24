import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function bad(msg: string) {
  return Response.json({ error: msg }, { status: 400 });
}

function extractToken(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  return auth.replace(/^Bearer\s+/i, "").trim();
}

function makeId() {
  return Date.now();
}

function today() {
  return new Date().toISOString().split("T")[0];
}

async function getUserIdFromToken(supabase: ReturnType<typeof getSupabaseAdmin>, token: string): Promise<string | null> {
  if (!token) return null;
  // Find user whose shortcut_token setting matches
  const { data } = await supabase
    .from("user_settings")
    .select("user_id, settings");
  for (const row of data ?? []) {
    const s = row.settings as Record<string, unknown> | null;
    if (s?.shortcut_token === token) return row.user_id as string;
  }
  return null;
}

// ─── GET /api/quick-add  (meta: categories, buckets, people) ─────────────────
export async function GET(req: Request) {
  const supabase = getSupabaseAdmin();
  const userId = await getUserIdFromToken(supabase, extractToken(req));
  if (!userId) return unauthorized();

  const [categoryRes, bucketRes, peopleRes, settingsRes] = await Promise.all([
    supabase.from("category_definitions").select("*").eq("user_id", userId).neq("is_active", false).eq("kind", "expense").order("sort_order"),
    supabase.from("bucket_definitions").select("*").eq("user_id", userId).neq("is_active", false).order("sort_order"),
    supabase.from("people").select("*").eq("user_id", userId).order("name"),
    supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const userSettings = (settingsRes.data as Record<string, unknown> | null)?.settings as Record<string, unknown> | undefined;

  // Categories — prefer category_definitions table, fall back to user_settings.settings JSON
  let categories = (categoryRes.data ?? []).map((r) => r.name as string);
  if (categories.length === 0 && userSettings) {
    const raw = userSettings.expense_categories;
    if (Array.isArray(raw)) {
      categories = raw.map((c: unknown) => String((c as Record<string, unknown>)?.name ?? c)).filter(Boolean);
    }
  }

  // Buckets — prefer bucket_definitions table, fall back to user_settings.settings JSON
  let buckets = (bucketRes.data ?? []).map((r) => ({ id: r.id as string, name: r.name as string }));
  if (buckets.length === 0 && userSettings) {
    const raw = userSettings.savings_buckets;
    if (Array.isArray(raw)) {
      buckets = (raw as Record<string, unknown>[])
        .filter((b) => b.active !== false)
        .map((b) => ({ id: String(b.id), name: String(b.name) }));
    }
  }

  const transferSources = [
    { id: "Bank", name: "Bank" },
    { id: "Cash", name: "Cash" },
    ...buckets,
  ];

  const people = (peopleRes.data ?? []).map((r) => ({
    id: String(r.id),
    name: String((r as Record<string, unknown>).name ?? ""),
  }));

  return Response.json({ categories, transferSources, people });
}

// ─── POST /api/quick-add  (save transaction) ─────────────────────────────────
export async function POST(req: Request) {
  const supabase = getSupabaseAdmin();
  const userId = await getUserIdFromToken(supabase, extractToken(req));
  if (!userId) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON");
  }

  const type = String(body.type ?? "");
  const id = makeId();
  const date = String(body.date || today());
  const notes = body.notes && String(body.notes).toLowerCase() !== "skip"
    ? `${body.notes} [Shortcut]`
    : "[Shortcut]";

  if (type === "expense") {
    const amount = Number(body.amount);
    const category = String(body.category ?? "");
    const account = String(body.account ?? "Bank");
    if (!amount || !category) return bad("amount and category required");

    const row = {
      id,
      user_id: userId,
      amount,
      category,
      category_id: `category_${category.toLowerCase().replace(/\s+/g, "_")}`,
      account,
      payment_method: account,
      date,
      notes,
      is_recurring: false,
      added_by: "me",
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("expenses").insert(row);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await writeLog(supabase, userId, "created", "expense", id, `${category} $${amount} [Shortcut]`);
    return Response.json({ ok: true, id, message: `Expense saved: ${category} $${amount}` });
  }

  if (type === "income") {
    const amount = Number(body.amount);
    const source = String(body.source ?? "");
    if (!amount || !source) return bad("amount and source required");

    const row = {
      id,
      user_id: userId,
      income_type: "Fixed Amount",
      source,
      rate: amount,
      hours: 1,
      amount,
      cash_received: Number(body.cashReceived ?? 0),
      date,
      notes,
      added_by: "me",
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("income").insert(row);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await writeLog(supabase, userId, "created", "income", id, `${source} $${amount} [Shortcut]`);
    return Response.json({ ok: true, id, message: `Income saved: ${source} $${amount}` });
  }

  if (type === "transfer") {
    const amount = Number(body.amount);
    const from_bucket = String(body.from_bucket ?? "");
    const to_bucket = String(body.to_bucket ?? "");
    if (!amount || !from_bucket || !to_bucket) return bad("amount, from_bucket, to_bucket required");

    const row = { id, user_id: userId, from_bucket, to_bucket, amount, date, notes, added_by: "me" };
    const { error } = await supabase.from("transfers").insert(row);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await writeLog(supabase, userId, "created", "transfer", id, `${from_bucket} → ${to_bucket} $${amount} [Shortcut]`);
    return Response.json({ ok: true, id, message: `Transfer saved: ${from_bucket} → ${to_bucket} $${amount}` });
  }

  if (type === "lent" || type === "borrowed") {
    const amount = Number(body.amount);
    const personName = String(body.personName ?? "").trim();
    const account = String(body.account ?? "Bank");
    if (!amount || !personName) return bad("amount and personName required");

    // Find or create person
    const { data: existingPeople } = await supabase.from("people").select("id, name").eq("user_id", userId);
    let personId: string | null = null;
    for (const p of existingPeople ?? []) {
      if (String(p.name).toLowerCase() === personName.toLowerCase()) {
        personId = String(p.id);
        break;
      }
    }
    if (!personId) {
      personId = String(makeId());
      await supabase.from("people").insert({
        id: personId,
        user_id: userId,
        name: personName,
        phone: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    const row = {
      id,
      user_id: userId,
      person_id: personId,
      type,
      amount,
      account,
      affects_account_balance: true,
      date,
      note: notes,
      added_by: "me",
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("lending_transactions").insert(row);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    const label = type === "lent" ? `Lent $${amount} to ${personName}` : `Borrowed $${amount} from ${personName}`;
    await writeLog(supabase, userId, "created", type, id, `${label} [Shortcut]`);
    return Response.json({ ok: true, id, message: `${label} saved` });
  }

  return bad(`Unknown type: ${type}`);
}

async function writeLog(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  action: "created" | "updated" | "deleted",
  entityType: string,
  entityId: string | number,
  description: string
) {
  await supabase.from("app_logs").insert({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    user_id: userId,
    user: "me",
    user_name: "You (Shortcut)",
    action,
    entity_type: entityType,
    entity_id: String(entityId),
    description,
    timestamp: new Date().toISOString(),
  });
}
