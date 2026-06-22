import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const env = Object.fromEntries(
  readFileSync(resolve(__dirname, "../.env.local"), "utf-8")
    .split("\n")
    .filter(l => l.includes("=") && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const supabase = createClient(env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { data: rows } = await supabase.from("app_rows").select("sheet,id,data")
  .in("sheet", ["liabilities", "Liabilities", "liability_payments", "RepaymentSchedules", "repaymentSchedules"]);

console.log("=== RAW DB ROWS ===\n");
for (const r of rows || []) {
  console.log(`[${r.sheet}] ${r.id}`);
  console.log(JSON.stringify(r.data, null, 2));
  console.log();
}
