import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/server/supabaseAdmin";

type LendingTransactionType = "lent" | "borrowed" | "settlement";

function jsonResponse(payload: unknown, status = 200) {
  return Response.json(payload, { status });
}

function makeId() {
  return crypto.randomUUID();
}

function normalizeSheetName(sheet: string) {
  return String(sheet || "").trim();
}

function getRowId(sheet: string, data: any, explicitId?: string | number) {
  const cleanSheet = normalizeSheetName(sheet);

  if (explicitId !== undefined && explicitId !== null && String(explicitId).trim()) {
    return String(explicitId);
  }

  // Settings use key as ID: ["emergency_goal", 5000]
  if (cleanSheet === "settings") {
    if (Array.isArray(data) && data[0] !== undefined && data[0] !== null) {
      return String(data[0]);
    }

    if (data?.key) {
      return String(data.key);
    }

    throw new Error("Missing setting key");
  }

  // Normal sheet rows usually already have ID as first column.
  // Example: [1780341568628, 121, "Food", "Usable Balance", "2026-06-01", ""]
  if (Array.isArray(data) && data[0] !== undefined && data[0] !== null && String(data[0]).trim()) {
    return String(data[0]);
  }

  // Object rows can use object.id
  if (data && typeof data === "object" && !Array.isArray(data) && data.id) {
    return String(data.id);
  }

  return makeId();
}

function ensureRowHasId(sheet: string, id: string, data: any) {
  const cleanSheet = normalizeSheetName(sheet);

  // Settings must stay [key, value]
  if (cleanSheet === "settings") {
    if (Array.isArray(data)) {
      return [id, data[1]];
    }

    return [id, data];
  }

  // For array rows, preserve existing shape if first column exists.
  // If missing, add ID only once.
  if (Array.isArray(data)) {
    if (data[0] !== undefined && data[0] !== null && String(data[0]).trim()) {
      return data;
    }

    return [id, ...data];
  }

  // For object rows, make sure id exists.
  if (data && typeof data === "object") {
    return {
      ...data,
      id,
    };
  }

  return {
    id,
    value: data,
  };
}

async function getAllData(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("app_rows")
    .select("sheet,id,data,created_at,updated_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const grouped: Record<string, any[]> = {};

  for (const row of data || []) {
    if (!grouped[row.sheet]) {
      grouped[row.sheet] = [];
    }

    // Important:
    // Return exactly stored data.
    // Do NOT prepend UUID here.
    grouped[row.sheet].push(row.data);
  }

  return grouped;
}

async function addRow(supabase: SupabaseClient, sheet: string, rowData: any) {
  const cleanSheet = normalizeSheetName(sheet);

  if (!cleanSheet) {
    throw new Error("Missing sheet name");
  }

  const id = getRowId(cleanSheet, rowData);
  const finalData = ensureRowHasId(cleanSheet, id, rowData);

  // Settings should upsert, not duplicate.
  if (cleanSheet === "settings") {
    const { data, error } = await supabase
      .from("app_rows")
      .upsert(
        {
          sheet: cleanSheet,
          id,
          data: finalData,
        },
        {
          onConflict: "sheet,id",
        }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data.data;
  }

  const { data, error } = await supabase
    .from("app_rows")
    .insert({
      sheet: cleanSheet,
      id,
      data: finalData,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data.data;
}

async function updateRow(
  supabase: SupabaseClient,
  sheet: string,
  id: string | number,
  rowData: any
) {
  const cleanSheet = normalizeSheetName(sheet);

  if (!cleanSheet) {
    throw new Error("Missing sheet name");
  }

  if (id === undefined || id === null || !String(id).trim()) {
    throw new Error("Missing row id");
  }

  const cleanId = String(id);
  const finalData = ensureRowHasId(cleanSheet, cleanId, rowData);

  const { data, error } = await supabase
    .from("app_rows")
    .upsert(
      {
        sheet: cleanSheet,
        id: cleanId,
        data: finalData,
      },
      {
        onConflict: "sheet,id",
      }
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data.data;
}

async function deleteRow(supabase: SupabaseClient, sheet: string, id: string | number) {
  const cleanSheet = normalizeSheetName(sheet);

  if (!cleanSheet) {
    throw new Error("Missing sheet name");
  }

  if (id === undefined || id === null || !String(id).trim()) {
    throw new Error("Missing row id");
  }

  const { error } = await supabase
    .from("app_rows")
    .delete()
    .eq("sheet", cleanSheet)
    .eq("id", String(id));

  if (error) {
    throw error;
  }

  return true;
}

async function addPerson(
  supabase: SupabaseClient,
  person: { name: string; phone?: string }
) {
  const name = person?.name?.trim();

  if (!name) {
    throw new Error("Person name is required.");
  }

  const id = makeId();

  const personData = {
    id,
    name,
    phone: person.phone?.trim() || "",
    createdAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("app_rows")
    .insert({
      sheet: "People",
      id,
      data: personData,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data.data;
}

async function addLendingTransaction(
  supabase: SupabaseClient,
  transaction: {
    personId: string | number;
    type: LendingTransactionType;
    amount: number;
    account?: "Bank" | "Cash";
    affectsAccountBalance?: boolean;
    date: string;
    note?: string;
  }
) {
  if (!transaction.personId) {
    throw new Error("personId is required.");
  }

  if (!["lent", "borrowed", "settlement"].includes(transaction.type)) {
    throw new Error("Invalid lending transaction type.");
  }

  if (!transaction.amount || Number(transaction.amount) <= 0) {
    throw new Error("Amount must be greater than 0.");
  }

  const id = makeId();

  const transactionData = {
    id,
    personId: String(transaction.personId),
    type: transaction.type,
    amount: Number(transaction.amount),
    account: transaction.account === "Cash" ? "Cash" : "Bank",
    affectsAccountBalance: Boolean(transaction.affectsAccountBalance),
    date: transaction.date,
    note: transaction.note || "",
    createdAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("app_rows")
    .insert({
      sheet: "LendingTransactions",
      id,
      data: transactionData,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data.data;
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const action = new URL(request.url).searchParams.get("action");

    if (!action) {
      return jsonResponse(
        {
          success: false,
          error: "Missing GET action",
        },
        400
      );
    }

    if (action === "getAllData") {
      const data = await getAllData(supabase);

      return jsonResponse({
        success: true,
        data,
      });
    }

    return jsonResponse(
      {
        success: false,
        error: `Unknown GET action: ${action}`,
      },
      400
    );
  } catch (error: any) {
    return jsonResponse(
      {
        success: false,
        error: error.message || "GET failed",
      },
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const payload = await request.json();
    const action = payload.action;

    if (!action) {
      return jsonResponse(
        {
          success: false,
          error: "Missing POST action",
        },
        400
      );
    }

    if (action === "addRow") {
      const data = await addRow(supabase, payload.sheet, payload.data);

      return jsonResponse({
        success: true,
        data,
      });
    }

    if (action === "updateRow") {
      const data = await updateRow(supabase, payload.sheet, payload.id, payload.data);

      return jsonResponse({
        success: true,
        data,
      });
    }

    if (action === "deleteRow") {
      await deleteRow(supabase, payload.sheet, payload.id);

      return jsonResponse({
        success: true,
        data: true,
      });
    }

    if (action === "addPerson") {
      const data = await addPerson(supabase, payload.person);

      return jsonResponse({
        success: true,
        data,
      });
    }

    if (action === "addLendingTransaction") {
      const data = await addLendingTransaction(supabase, payload.transaction);

      return jsonResponse({
        success: true,
        data,
      });
    }

    if (action === "resetAllData") {
      const financeSheets = [
        "income",
        "expenses",
        "transfers",
        "lent",
        "borrowed",
        "People",
        "LendingTransactions",
        "Liabilities",
        "RepaymentSchedules",
        "remittances",
        "app_notifications",
      ];
      for (const sheet of financeSheets) {
        const { error } = await supabase
          .from("app_rows")
          .delete()
          .eq("sheet", sheet);
        if (error) throw error;
      }
      return jsonResponse({ success: true, data: true });
    }

    return jsonResponse(
      {
        success: false,
        error: `Unknown POST action: ${action}`,
      },
      400
    );
  } catch (error: any) {
    return jsonResponse(
      {
        success: false,
        error: error.message || "POST failed",
      },
      500
    );
  }
}
