import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env = Object.fromEntries(
  envContent.split("\n").filter(l => l.includes("=") && !l.startsWith("#")).map(l => {
    const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  })
);

const supabase = createClient(
  env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await supabase.from("app_rows").select("sheet,id,data").order("sheet");
const grouped = {};
for (const r of data || []) {
  if (!grouped[r.sheet]) grouped[r.sheet] = [];
  grouped[r.sheet].push({ id: r.id, data: r.data });
}

for (const [sheet, rows] of Object.entries(grouped)) {
  console.log(`\n=== ${sheet} (${rows.length} rows) ===`);
  console.log("Sample:", JSON.stringify(rows[0]?.data));
  if (rows.length > 1) console.log("Sample2:", JSON.stringify(rows[1]?.data));
}
