import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const CACHE_DAYS = 3;
const CACHE_MS = CACHE_DAYS * 24 * 60 * 60 * 1000;

function supabaseAdmin() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function jsonResponse(data: object, status = 200) {
  return NextResponse.json(data, { status });
}

async function readCachedPrices(supabase: ReturnType<typeof supabaseAdmin>) {
  const { data } = await supabase
    .from("app_rows")
    .select("id, data")
    .eq("sheet", "asset_prices");

  if (!data || data.length < 4) return null;

  const rows: Record<string, { price: number; updatedAt: string }> = {};
  for (const row of data) {
    rows[row.id] = row.data as { price: number; updatedAt: string };
  }

  const required = ["gold_AUD", "gold_INR", "silver_AUD", "silver_INR"];
  if (!required.every((k) => rows[k]?.price)) return null;

  // Check freshness — use oldest timestamp
  const timestamps = required.map((k) => new Date(rows[k].updatedAt).getTime());
  const oldest = Math.min(...timestamps);
  if (Date.now() - oldest > CACHE_MS) return null;

  return {
    goldAud: rows["gold_AUD"].price,
    goldInr: rows["gold_INR"].price,
    silverAud: rows["silver_AUD"].price,
    silverInr: rows["silver_INR"].price,
    updatedAt: rows["gold_AUD"].updatedAt,
  };
}

async function fetchFromMetalsDev(): Promise<{
  goldAud: number;
  goldInr: number;
  silverAud: number;
  silverInr: number;
} | null> {
  const apiKey = process.env.METALS_DEV_API_KEY;
  if (!apiKey) return null;

  try {
    const [audRes, inrRes] = await Promise.all([
      fetch(`https://api.metals.dev/v1/latest?api_key=${apiKey}&currency=AUD&unit=g`),
      fetch(`https://api.metals.dev/v1/latest?api_key=${apiKey}&currency=INR&unit=g`),
    ]);

    if (!audRes.ok || !inrRes.ok) return null;

    const [audData, inrData] = await Promise.all([audRes.json(), inrRes.json()]);

    const goldAud = Number(audData?.metals?.gold);
    const silverAud = Number(audData?.metals?.silver);
    const goldInr = Number(inrData?.metals?.gold);
    const silverInr = Number(inrData?.metals?.silver);

    if (!goldAud || !silverAud || !goldInr || !silverInr) return null;

    return { goldAud, goldInr, silverAud, silverInr };
  } catch {
    return null;
  }
}

async function cachePrices(
  supabase: ReturnType<typeof supabaseAdmin>,
  prices: { goldAud: number; goldInr: number; silverAud: number; silverInr: number }
) {
  const updatedAt = new Date().toISOString();
  const rows = [
    { id: "gold_AUD", data: { asset: "gold", currency: "AUD", price: prices.goldAud, updatedAt } },
    { id: "gold_INR", data: { asset: "gold", currency: "INR", price: prices.goldInr, updatedAt } },
    { id: "silver_AUD", data: { asset: "silver", currency: "AUD", price: prices.silverAud, updatedAt } },
    { id: "silver_INR", data: { asset: "silver", currency: "INR", price: prices.silverInr, updatedAt } },
  ];

  for (const row of rows) {
    await supabase
      .from("app_rows")
      .upsert({ sheet: "asset_prices", id: row.id, data: row.data }, { onConflict: "sheet,id" });
  }
}

export async function GET() {
  const supabase = supabaseAdmin();

  // Try cache first
  const cached = await readCachedPrices(supabase);
  if (cached) {
    return jsonResponse({ success: true, data: cached, source: "cache" });
  }

  // Fetch fresh prices
  const fresh = await fetchFromMetalsDev();
  if (!fresh) {
    // Return stale cache if available, even if expired
    const { data } = await supabase
      .from("app_rows")
      .select("id, data")
      .eq("sheet", "asset_prices");

    if (data && data.length >= 4) {
      const rows: Record<string, { price: number; updatedAt: string }> = {};
      for (const row of data) rows[row.id] = row.data as { price: number; updatedAt: string };

      return jsonResponse({
        success: true,
        data: {
          goldAud: rows["gold_AUD"]?.price ?? 0,
          goldInr: rows["gold_INR"]?.price ?? 0,
          silverAud: rows["silver_AUD"]?.price ?? 0,
          silverInr: rows["silver_INR"]?.price ?? 0,
          updatedAt: rows["gold_AUD"]?.updatedAt ?? null,
        },
        source: "stale_cache",
      });
    }

    return jsonResponse({
      success: true,
      data: { goldAud: 0, goldInr: 0, silverAud: 0, silverInr: 0, updatedAt: null },
      source: "unavailable",
    });
  }

  await cachePrices(supabase, fresh);

  return jsonResponse({
    success: true,
    data: { ...fresh, updatedAt: new Date().toISOString() },
    source: "fresh",
  });
}

// POST allows a forced refresh (cron job)
export async function POST() {
  const supabase = supabaseAdmin();
  const fresh = await fetchFromMetalsDev();
  if (!fresh) {
    return jsonResponse({ success: false, error: "Could not fetch from Metals.dev" }, 502);
  }
  await cachePrices(supabase, fresh);
  return jsonResponse({ success: true, data: { ...fresh, updatedAt: new Date().toISOString() } });
}
