const SHEETS_API_URL = "/api/sheets";

export type SheetValue = string | number;

async function callSheetsApi(body: object) {
  try {
    const res = await fetch(SHEETS_API_URL, {
      method: "POST",
      body: JSON.stringify(body),
    });

    const text = await res.text();
    const payload = JSON.parse(text);

    if (!payload.success) {
      alert(payload.error || "Google Sheets action failed");
      return false;
    }

    return true;
  } catch {
    alert("Google Sheets request failed.");
    return false;
  }
}

export async function loadSheetsData(signal: AbortSignal) {
  const res = await fetch(SHEETS_API_URL, {
    method: "GET",
    signal,
  });

  const text = await res.text();
  return JSON.parse(text);
}

export async function saveToSheet(sheet: string, values: SheetValue[]) {
  return callSheetsApi({ action: "add", sheet, values });
}

export async function deleteFromSheet(sheet: string, id: number) {
  return callSheetsApi({ action: "delete", sheet, id });
}

export async function updateSheetRow(
  sheet: string,
  id: string | number,
  values: SheetValue[]
) {
  return callSheetsApi({ action: "update", sheet, id, values });
}
