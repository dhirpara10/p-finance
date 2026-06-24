import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

const TOKEN = process.env.QUICK_ADD_TOKEN;

function unauthorized() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

function bad(msg: string) {
  return Response.json({ error: msg }, { status: 400 });
}

function checkAuth(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  return TOKEN && token === TOKEN;
}

function makeId() {
  return Date.now();
}

function today() {
  return new Date().toISOString().split("T")[0];
}

// ─── GET /api/quick-add  (meta: categories, buckets, people) ─────────────────
export async function GET(req: Request) {
  if (!checkAuth(req)) return unauthorized();

  const supabase = getSupabaseAdmin();

  const [settingsRes, lendingPeopleRes, bucketDefsRes, categoryDefsRes] = await Promise.all([
    supabase.from("app_rows").select("*").eq("sheet", "settings"),
    supabase.from("app_rows").select("*").eq("sheet", "people"),
    supabase.from("app_rows").select("*").eq("sheet", "bucket_definitions"),
    supabase.from("app_rows").select("*").eq("sheet", "category_definitions"),
  ]);

  // Parse settings for expense_categories and savings_buckets (fallback)
  const settings: Record<string, unknown> = {};
  for (const row of settingsRes.data ?? []) {
    const d = row.data as unknown[];
    if (Array.isArray(d) && d.length >= 2) settings[String(d[0])] = d[1];
  }

  // Categories: prefer new category_definitions sheet, fall back to settings
  let categories: string[] = [];
  if ((categoryDefsRes.data ?? []).length > 0) {
    categories = (categoryDefsRes.data ?? [])
      .map((r) => {
        const d = r.data as Record<string, unknown>;
        return d;
      })
      .filter((d) => d.kind === "expense" && d.isActive !== false)
      .sort((a, b) => Number(a.sortOrder ?? 99) - Number(b.sortOrder ?? 99))
      .map((d) => String(d.name));
  } else {
    const raw = settings["expense_categories"];
    if (Array.isArray(raw)) categories = raw.map((c: unknown) => String((c as Record<string,unknown>)?.name ?? c));
  }

  // Buckets: prefer bucket_definitions, fall back to settings
  let buckets: Array<{ id: string; name: string }> = [];
  if ((bucketDefsRes.data ?? []).length > 0) {
    buckets = (bucketDefsRes.data ?? [])
      .map((r) => r.data as Record<string, unknown>)
      .filter((d) => d.isActive !== false)
      .sort((a, b) => Number(a.sortOrder ?? 99) - Number(b.sortOrder ?? 99))
      .map((d) => ({ id: String(d.id), name: String(d.name) }));
  } else {
    const raw = settings["savings_buckets"];
    if (Array.isArray(raw)) {
      buckets = raw.map((b: unknown) => {
        const bucket = b as Record<string, unknown>;
        return { id: String(bucket.id), name: String(bucket.name) };
      });
    }
  }
  // Add standard accounts
  const transferSources = [
    { id: "Bank", name: "Bank" },
    { id: "Cash", name: "Cash" },
    ...buckets,
  ];

  // People (for lending)
  const people = (lendingPeopleRes.data ?? [])
    .map((r) => {
      const d = r.data as Record<string, unknown>;
      return { id: String(d.id ?? r.id), name: String(d.name) };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return Response.json({ categories, transferSources, people });
}

// ─── POST /api/quick-add  (save transaction) ─────────────────────────────────
export async function POST(req: Request) {
  if (!checkAuth(req)) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON");
  }

  const type = String(body.type ?? "");
  const supabase = getSupabaseAdmin();
  const id = makeId();
  const date = String(body.date || today());
  const notes = body.notes ? `${body.notes} [Shortcut]` : "[Shortcut]";

  if (type === "expense") {
    const amount = Number(body.amount);
    const category = String(body.category ?? "");
    const account = String(body.account ?? "Bank");
    if (!amount || !category) return bad("amount and category required");

    const row = {
      id,
      amount,
      category,
      categoryId: `category_${category.toLowerCase().replace(/\s+/g, "_")}`,
      account,
      paymentMethod: account,
      date,
      notes,
      isRecurring: false,
      addedBy: "me",
      createdAt: new Date().toISOString(),
    };
    const { error } = await supabase.from("app_rows").insert({ id: String(id), sheet: "expenses", data: row });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await writeLog(supabase, "created", "expense", id, `${category} $${amount}`);
    return Response.json({ ok: true, id });
  }

  if (type === "income") {
    const amount = Number(body.amount);
    const source = String(body.source ?? "");
    if (!amount || !source) return bad("amount and source required");

    const cashReceived = Number(body.cashReceived ?? 0);
    const row = {
      id,
      income_type: "Fixed Amount",
      source,
      rate: amount,
      hours: 1,
      amount,
      cash_received: cashReceived,
      date,
      notes,
      addedBy: "me",
      createdAt: new Date().toISOString(),
    };
    const { error } = await supabase.from("app_rows").insert({ id: String(id), sheet: "income", data: row });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await writeLog(supabase, "created", "income", id, `${source} $${amount}`);
    return Response.json({ ok: true, id });
  }

  if (type === "transfer") {
    const amount = Number(body.amount);
    const from_bucket = String(body.from_bucket ?? "");
    const to_bucket = String(body.to_bucket ?? "");
    if (!amount || !from_bucket || !to_bucket) return bad("amount, from_bucket, to_bucket required");

    const row = { id, from_bucket, to_bucket, amount, date, notes, addedBy: "me" };
    const { error } = await supabase.from("app_rows").insert({ id: String(id), sheet: "transfers", data: row });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await writeLog(supabase, "created", "transfer", id, `${from_bucket} → ${to_bucket} $${amount}`);
    return Response.json({ ok: true, id });
  }

  if (type === "lent" || type === "borrowed") {
    const amount = Number(body.amount);
    const personName = String(body.personName ?? "").trim();
    const account = String(body.account ?? "Bank");
    if (!amount || !personName) return bad("amount and personName required");

    // Find or create person
    const { data: existingPeople } = await supabase.from("app_rows").select("*").eq("sheet", "people");
    let personId: string | null = null;
    for (const p of existingPeople ?? []) {
      const d = p.data as Record<string, unknown>;
      if (String(d.name).toLowerCase() === personName.toLowerCase()) {
        personId = String(d.id ?? p.id);
        break;
      }
    }
    if (!personId) {
      personId = String(makeId());
      const personRow = { id: personId, name: personName, phone: "", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      await supabase.from("app_rows").insert({ id: personId, sheet: "people", data: personRow });
    }

    const row = {
      id,
      personId,
      type,
      amount,
      account,
      affectsAccountBalance: true,
      date,
      note: notes,
      addedBy: "me",
      createdAt: new Date().toISOString(),
    };
    const { error } = await supabase.from("app_rows").insert({ id: String(id), sheet: "lending_transactions", data: row });
    if (error) return Response.json({ error: error.message }, { status: 500 });
    await writeLog(supabase, "created", type, id, `${type === "lent" ? "Lent" : "Borrowed"} $${amount} ${type === "lent" ? "to" : "from"} ${personName}`);
    return Response.json({ ok: true, id });
  }

  return bad(`Unknown type: ${type}`);
}

async function writeLog(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  action: "created" | "updated" | "deleted",
  entityType: string,
  entityId: string | number,
  description: string
) {
  const log = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    user: "me",
    userName: "You (Shortcut)",
    action,
    entityType,
    entityId: String(entityId),
    description,
    timestamp: new Date().toISOString(),
  };
  await supabase.from("app_rows").insert({ id: log.id, sheet: "activity_logs", data: log });
}
