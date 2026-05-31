const API_URL = "/api/sheets";

export type SheetValue = string | number;
export type LendingTransactionType = "lent" | "borrowed" | "settlement";

export type AddPersonPayload = {
  name: string;
  phone?: string;
};

export type AddLendingTransactionPayload = {
  personId: string | number;
  type: LendingTransactionType;
  amount: number;
  date: string;
  note?: string;
};

async function parseJsonResponse(res: Response) {
  const payload = await res.json();

  if (!payload.success) {
    throw new Error(payload.error || "API Error");
  }

  return payload.data || payload;
}

async function callSheetsApi(body: object) {
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    await parseJsonResponse(res);
    return true;
  } catch (error: any) {
    alert(error.message || "Google Sheets request failed.");
    return false;
  }
}

async function trySheetsApi(body: object) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  await parseJsonResponse(res);
  return true;
}

async function postSheetsApi<T>(body: object): Promise<T | null> {
  try {
    console.log("[sheetsApi] request payload", body);

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const payload = await res.json();

    if (!payload.success) {
      throw new Error(payload.error || "API Error");
    }

    return payload as T;
  } catch (error: any) {
    console.error("[sheetsApi] request failed", error);
    alert(error.message || "Google Sheets request failed.");
    return null;
  }
}

export async function getAllData(signal?: AbortSignal) {
  const res = await fetch(`${API_URL}?action=getAllData`, {
    method: "GET",
    cache: "no-store",
    signal,
  });

  return parseJsonResponse(res);
}

export async function loadSheetsData(signal: AbortSignal) {
  return getAllData(signal);
}

export async function saveToSheet(sheet: string, values: SheetValue[]) {
  return callSheetsApi({ action: "addRow", sheet, data: values });
}

export async function deleteFromSheet(sheet: string, id: string | number) {
  return callSheetsApi({ action: "deleteRow", sheet, id });
}

export async function updateSheetRow(
  sheet: string,
  id: string | number,
  values: SheetValue[]
) {
  return callSheetsApi({ action: "updateRow", sheet, id, data: values });
}

export async function saveSetting(key: string, value: SheetValue) {
  console.log("[sheetsApi] saveSetting", key, value);

  try {
    await trySheetsApi({
      action: "updateRow",
      sheet: "settings",
      id: key,
      data: [key, value],
    });
    return true;
  } catch (error: any) {
    console.warn(
      `[sheetsApi] updateRow failed for setting ${key}, falling back to addRow`,
      error?.message || error
    );
    return callSheetsApi({
      action: "addRow",
      sheet: "settings",
      data: [key, value],
    });
  }
}

export async function addRow(sheet: string, data: unknown) {
  return callSheetsApi({ action: "addRow", sheet, data });
}

export async function addPerson(person: AddPersonPayload) {
  if (!person.name.trim()) {
    throw new Error("Person name is required.");
  }

  return postSheetsApi<unknown>({
    action: "addPerson",
    person: {
      name: person.name.trim(),
      phone: person.phone?.trim() || "",
    },
  });
}

export async function addLendingTransaction(
  transaction: AddLendingTransactionPayload
) {
  const validTypes: LendingTransactionType[] = [
    "lent",
    "borrowed",
    "settlement",
  ];

  if (!transaction.personId) {
    throw new Error("personId is required.");
  }

  if (!validTypes.includes(transaction.type)) {
    throw new Error("Invalid lending transaction type.");
  }

  if (!transaction.amount || transaction.amount <= 0) {
    throw new Error("Amount must be greater than 0.");
  }

  return postSheetsApi<unknown>({
    action: "addLendingTransaction",
    transaction: {
      personId: transaction.personId,
      type: transaction.type,
      amount: Number(transaction.amount),
      date: transaction.date,
      note: transaction.note?.trim() || "",
    },
  });
}

export async function updateRow(sheet: string, id: string, data: unknown) {
  return callSheetsApi({ action: "updateRow", sheet, id, data });
}

export async function deleteRow(sheet: string, id: string) {
  return callSheetsApi({ action: "deleteRow", sheet, id });
}
