"use client";


import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";


type Account = "cash" | "bank";
type Status = "Pending" | "Partly Paid" | "Fully Settled";

type Income = {
  id: number;
  amount: number;
  source: string;
  account: Account;
  date: string;
  notes: string;
};

type Expense = {
  id: number;
  amount: number;
  category: string;
  account: Account;
  date: string;
  notes: string;
};

type MoneyRecord = {
  id: number;
  name: string;
  amount: number;
  date: string;
  phone: string;
  notes: string;
  status: Status;
};

export default function Home() {
const SHEETS_API_URL = "/api/sheets";

  // default ISO date for form fields and when sheet rows have no date
  const today = new Date().toISOString().split("T")[0];
  

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [lentRecords, setLentRecords] = useState<MoneyRecord[]>([]);
  const [borrowedRecords, setBorrowedRecords] = useState<MoneyRecord[]>([]);

  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showLentForm, setShowLentForm] = useState(false);
  const [showBorrowedForm, setShowBorrowedForm] = useState(false);
  const [detailsView, setDetailsView] = useState<"lent" | "borrowed" | null>(null);

  const [editingItem, setEditingItem] = useState<{
    type: "income" | "expense" | "lent" | "borrowed";
    id: number;
  } | null>(null);

  // Settings UI state
  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [settingsCash, setSettingsCash] = useState("");
  const [settingsBank, setSettingsBank] = useState("");

  const [baseCash, setBaseCash] = useState(0);
  const [baseBank, setBaseBank] = useState(0);
  const [loading, setLoading] = useState(true);

  // simple passcode unlock state
  const APP_PASSCODE = "2605";
  const [passcodeInput, setPasscodeInput] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  
  async function loadFromSheets() {
  if (!SHEETS_API_URL) {
    alert("Sheets API URL missing. Check server API route /api/sheets.");
    setLoading(false);
    return;
  }

  setLoading(true);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(SHEETS_API_URL, {
      method: "GET",
      signal: controller.signal,
    });

    const text = await res.text();
    console.log("Sheets raw response:", text);

    const payload = JSON.parse(text);

    if (!payload.success) {
      console.error("Sheets load failed:", payload);
      alert(payload.error || "Failed to load Google Sheets data");
      return;
    }

    const sheetData = payload.data || {};

    const settings = sheetData.settings || [];
    const cashSetting = settings.find((item: any) => item.key === "base_cash");
    const bankSetting = settings.find((item: any) => item.key === "base_bank");

    setBaseCash(Number(cashSetting?.value || 0));
    setBaseBank(Number(bankSetting?.value || 0));

    setIncomes(
      (sheetData.income || []).map((item: any) => ({
        id: Number(item.id),
        amount: Number(item.amount),
        source: String(item.source || ""),
        account: item.account === "cash" ? "cash" : "bank",
        date: String(item.date || ""),
        notes: String(item.notes || ""),
      }))
    );

    setExpenses(
      (sheetData.expenses || []).map((item: any) => ({
        id: Number(item.id),
        amount: Number(item.amount),
        category: String(item.category || ""),
        account: item.account === "cash" ? "cash" : "bank",
        date: String(item.date || ""),
        notes: String(item.notes || ""),
      }))
    );

    setLentRecords(
      (sheetData.lent || []).map((item: any) => ({
        id: Number(item.id),
        name: String(item.name || ""),
        amount: Number(item.amount),
        date: String(item.date || ""),
        phone: String(item.phone || ""),
        notes: String(item.notes || ""),
        status: item.status || "Pending",
      }))
    );

    setBorrowedRecords(
      (sheetData.borrowed || []).map((item: any) => ({
        id: Number(item.id),
        name: String(item.name || ""),
        amount: Number(item.amount),
        date: String(item.date || ""),
        phone: String(item.phone || ""),
        notes: String(item.notes || ""),
        status: item.status || "Pending",
      }))
    );
  } catch (error: any) {
    console.error("Load Sheets error:", error);
    alert(`Failed to load data from Google Sheets: ${error.message}`);
  } finally {
    clearTimeout(timeoutId);
    setLoading(false);
  }
}
  
  useEffect(() => {
    loadFromSheets();
  }, []);

  useEffect(() => {
    const unlocked = localStorage.getItem("finance_unlocked");
    const lockedUntil = localStorage.getItem("finance_locked_until");

    if (unlocked === "true") {
      setIsUnlocked(true);
    }

    if (lockedUntil) {
      setLockUntil(Number(lockedUntil));
    }
  }, []);

  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeSource, setIncomeSource] = useState("Job 1");
  const [incomeAccount, setIncomeAccount] = useState<Account>("bank");
  const [incomeDate, setIncomeDate] = useState(today);
  const [incomeNotes, setIncomeNotes] = useState("");

  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Spending Transfer");
  const [expenseAccount, setExpenseAccount] = useState<Account>("bank");
  const [expenseDate, setExpenseDate] = useState(today);
  const [expenseNotes, setExpenseNotes] = useState("");

  const [moneyName, setMoneyName] = useState("");
  const [moneyAmount, setMoneyAmount] = useState("");
  const [moneyDate, setMoneyDate] = useState(today);
  const [moneyPhone, setMoneyPhone] = useState("");
  const [moneyNotes, setMoneyNotes] = useState("");
  const [moneyStatus, setMoneyStatus] = useState<Status>("Pending");

  function isCurrentMonth(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();

    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }

  const incomeCash = incomes
    .filter((item) => item.account === "cash")
    .reduce((sum, item) => sum + item.amount, 0);

  const incomeBank = incomes
    .filter((item) => item.account === "bank")
    .reduce((sum, item) => sum + item.amount, 0);

  const expenseCash = expenses
    .filter((item) => item.account === "cash")
    .reduce((sum, item) => sum + item.amount, 0);

  const expenseBank = expenses
    .filter((item) => item.account === "bank")
    .reduce((sum, item) => sum + item.amount, 0);

  const activeLent = lentRecords
    .filter((item) => item.status !== "Fully Settled")
    .reduce((sum, item) => sum + item.amount, 0);

  const activeBorrowed = borrowedRecords
    .filter((item) => item.status !== "Fully Settled")
    .reduce((sum, item) => sum + item.amount, 0);

  const cash = baseCash + incomeCash - expenseCash;
  const bank = baseBank + incomeBank - expenseBank;

  const monthlyIncome = incomes
    .filter((item) => isCurrentMonth(item.date))
    .reduce((sum, item) => sum + item.amount, 0);

  const monthlyExpenses = expenses
    .filter((item) => isCurrentMonth(item.date))
    .reduce((sum, item) => sum + item.amount, 0);

  const totalMoney = cash + bank;
  const netWorth = cash + bank + activeLent - activeBorrowed;
  const remaining = monthlyIncome - monthlyExpenses;

  const recentActivity = [
    ...incomes.map((item) => ({
      id: item.id,
      type: "income",
      title: item.source,
      amount: item.amount,
      date: item.date,
      account: item.account,
    })),
    ...expenses.map((item) => ({
      id: item.id,
      type: "expense",
      title: item.category,
      amount: item.amount,
      date: item.date,
      account: item.account,
    })),
    ...lentRecords.map((item) => ({
      id: item.id,
      type: "lent",
      title: `Lent to ${item.name}`,
      amount: item.amount,
      date: item.date,
      account: item.status,
    })),
    ...borrowedRecords.map((item) => ({
      id: item.id,
      type: "borrowed",
      title: `Borrowed from ${item.name}`,
      amount: item.amount,
      date: item.date,
      account: item.status,
    })),
  ].sort((a, b) => b.id - a.id);

  function getToday() {
    return new Date().toISOString().split("T")[0];
  }

  function resetMoneyForm() {
    setMoneyName("");
    setMoneyAmount("");
    setMoneyDate("");
    setMoneyPhone("");
    setMoneyNotes("");
    setMoneyStatus("Pending");
  }

  async function callSheetsApi(body: object) {
  if (!SHEETS_API_URL) {
    alert("Sheets API URL missing. Ensure /api/sheets exists.");
    return false;
  }

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
  } catch (error) {
    console.error("Sheets API error:", error);
    alert("Google Sheets request failed.");
    return false;
  }
}

async function saveToSheet(sheet: string, values: (string | number)[]) {
  return callSheetsApi({
    action: "add",
    sheet,
    values,
  });
}

async function deleteFromSheet(sheet: string, id: number) {
  return callSheetsApi({
    action: "delete",
    sheet,
    id,
  });
}

async function updateSheetRow(
  sheet: string,
  id: number,
  values: (string | number)[]
) {
  return callSheetsApi({
    action: "update",
    sheet,
    id,
    values,
  });
}

// Save settings to sheet (note: updateSheetRow expects an id in first column;
// this will only work if your settings sheet rows use 'base_cash' and 'base_bank' as IDs)
async function saveSettings() {
  const cashSaved = await updateSheetRow("settings", "base_cash" as any, [
    "base_cash",
    Number(settingsCash || 0),
  ]);

  const bankSaved = await updateSheetRow("settings", "base_bank" as any, [
    "base_bank",
    Number(settingsBank || 0),
  ]);

  if (!cashSaved || !bankSaved) return;

  setBaseCash(Number(settingsCash || 0));
  setBaseBank(Number(settingsBank || 0));
  setShowSettingsForm(false);
}

  async function addIncome() {
    if (!incomeAmount || Number(incomeAmount) <= 0) return;

    const newIncome: Income = {
      id: editingItem?.type === "income" ? editingItem.id : Date.now(),
      amount: Number(incomeAmount),
      source: incomeSource,
      account: incomeAccount,
      date: incomeDate || getToday(),
      notes: incomeNotes,
    };

    const values = [
      newIncome.id,
      newIncome.amount,
      newIncome.source,
      newIncome.account,
      newIncome.date,
      newIncome.notes,
    ];

    const saved =
      editingItem?.type === "income"
        ? await updateSheetRow("income", newIncome.id, values)
        : await saveToSheet("income", values);

    if (!saved) return;

    if (editingItem?.type === "income") {
      setIncomes(
        incomes.map((item) => (item.id === newIncome.id ? newIncome : item))
      );
    } else {
      setIncomes([newIncome, ...incomes]);
    }

    setIncomeAmount("");
    setIncomeSource("Job 1");
    setIncomeAccount("bank");
    setIncomeDate(today);
    setIncomeNotes("");
    setEditingItem(null);
    setShowIncomeForm(false);
  }

  async function addExpense() {
    if (!expenseAmount || Number(expenseAmount) <= 0) return;

    const newExpense: Expense = {
      id: editingItem?.type === "expense" ? editingItem.id : Date.now(),
      amount: Number(expenseAmount),
      category: expenseCategory,
      account: expenseAccount,
      date: expenseDate || getToday(),
      notes: expenseNotes,
    };

    const values = [
      newExpense.id,
      newExpense.amount,
      newExpense.category,
      newExpense.account,
      newExpense.date,
      newExpense.notes,
    ];

    const saved =
      editingItem?.type === "expense"
        ? await updateSheetRow("expenses", newExpense.id, values)
        : await saveToSheet("expenses", values);

    if (!saved) return;

    if (editingItem?.type === "expense") {
      setExpenses(
        expenses.map((item) => (item.id === newExpense.id ? newExpense : item))
      );
    } else {
      setExpenses([newExpense, ...expenses]);
    }

    setExpenseAmount("");
    setExpenseCategory("Spending Transfer");
    setExpenseAccount("bank");
    setExpenseDate(today);
    setExpenseNotes("");
    setEditingItem(null);
    setShowExpenseForm(false);
  }

  async function addLent() {
    if (!moneyName || !moneyAmount || Number(moneyAmount) <= 0) return;

    const newRecord: MoneyRecord = {
      id: editingItem?.type === "lent" ? editingItem.id : Date.now(),
      name: moneyName,
      amount: Number(moneyAmount),
      date: moneyDate || getToday(),
      phone: moneyPhone,
      notes: moneyNotes,
      status: moneyStatus,
    };

    const values = [
      newRecord.id,
      newRecord.name,
      newRecord.amount,
      newRecord.date,
      newRecord.phone,
      newRecord.notes,
      newRecord.status,
    ];

    const saved =
      editingItem?.type === "lent"
        ? await updateSheetRow("lent", newRecord.id, values)
        : await saveToSheet("lent", values);

    if (!saved) return;

    if (editingItem?.type === "lent") {
      setLentRecords(
        lentRecords.map((item) => (item.id === newRecord.id ? newRecord : item))
      );
    } else {
      setLentRecords([newRecord, ...lentRecords]);
    }

    resetMoneyForm();
    setEditingItem(null);
    setShowLentForm(false);
  }

  async function addBorrowed() {
    if (!moneyName || !moneyAmount || Number(moneyAmount) <= 0) return;

    const newRecord: MoneyRecord = {
      id: editingItem?.type === "borrowed" ? editingItem.id : Date.now(),
      name: moneyName,
      amount: Number(moneyAmount),
      date: moneyDate || getToday(),
      phone: moneyPhone,
      notes: moneyNotes,
      status: moneyStatus,
    };

    const values = [
      newRecord.id,
      newRecord.name,
      newRecord.amount,
      newRecord.date,
      newRecord.phone,
      newRecord.notes,
      newRecord.status,
    ];

    const saved =
      editingItem?.type === "borrowed"
        ? await updateSheetRow("borrowed", newRecord.id, values)
        : await saveToSheet("borrowed", values);

    if (!saved) return;

    if (editingItem?.type === "borrowed") {
      setBorrowedRecords(
        borrowedRecords.map((item) =>
          item.id === newRecord.id ? newRecord : item
        )
      );
    } else {
      setBorrowedRecords([newRecord, ...borrowedRecords]);
    }

    resetMoneyForm();
    setEditingItem(null);
    setShowBorrowedForm(false);
  }

  function closeMoneyForms() {
    resetMoneyForm();
    setShowLentForm(false);
    setShowBorrowedForm(false);
  }

  async function deleteIncome(id: number) {
    const deleted = await deleteFromSheet("income", id);
    if (!deleted) return;

    setIncomes(incomes.filter((item) => item.id !== id));
  }

  async function deleteExpense(id: number) {
    const deleted = await deleteFromSheet("expenses", id);
    if (!deleted) return;

    setExpenses(expenses.filter((item) => item.id !== id));
  }

  async function deleteLent(id: number) {
    const deleted = await deleteFromSheet("lent", id);
    if (!deleted) return;

    setLentRecords(lentRecords.filter((item) => item.id !== id));
  }

  async function deleteBorrowed(id: number) {
    const deleted = await deleteFromSheet("borrowed", id);
    if (!deleted) return;

    setBorrowedRecords(borrowedRecords.filter((item) => item.id !== id));
  }

  function startEdit(item: any) {
    setEditingItem({
      type: item.type,
      id: item.id,
    });

    if (item.type === "income") {
      const record = incomes.find((x) => x.id === item.id);
      if (!record) return;

      setIncomeAmount(String(record.amount));
      setIncomeSource(record.source);
      setIncomeAccount(record.account);
      setIncomeDate(record.date);
      setIncomeNotes(record.notes);
      setShowIncomeForm(true);
    }

    if (item.type === "expense") {
      const record = expenses.find((x) => x.id === item.id);
      if (!record) return;

      setExpenseAmount(String(record.amount));
      setExpenseCategory(record.category);
      setExpenseAccount(record.account);
      setExpenseDate(record.date);
      setExpenseNotes(record.notes);
      setShowExpenseForm(true);
    }

    if (item.type === "lent") {
      const record = lentRecords.find((x) => x.id === item.id);
      if (!record) return;

      setMoneyName(record.name);
      setMoneyAmount(String(record.amount));
      setMoneyDate(record.date);
      setMoneyPhone(record.phone);
      setMoneyNotes(record.notes);
      setMoneyStatus(record.status);
      setShowLentForm(true);
    }

    if (item.type === "borrowed") {
      const record = borrowedRecords.find((x) => x.id === item.id);
      if (!record) return;

      setMoneyName(record.name);
      setMoneyAmount(String(record.amount));
      setMoneyDate(record.date);
      setMoneyPhone(record.phone);
      setMoneyNotes(record.notes);
      setMoneyStatus(record.status);
      setShowBorrowedForm(true);
    }
  }

  function unlockApp() {
    const now = Date.now();

    if (lockUntil && now < lockUntil) {
      const minutesLeft = Math.ceil((lockUntil - now) / 60000);
      alert(`Too many wrong attempts. Try again in ${minutesLeft} minutes.`);
      return;
    }

    if (passcodeInput === APP_PASSCODE) {
      setIsUnlocked(true);
      localStorage.setItem("finance_unlocked", "true");

      setFailedAttempts(0);
      localStorage.removeItem("finance_locked_until");

      return;
    }

    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);

    if (nextAttempts >= 2) {
      const nextLock = Date.now() + 10 * 60 * 1000;
      setLockUntil(nextLock);
      localStorage.setItem("finance_locked_until", String(nextLock));
      alert("Too many wrong attempts. Locked for 10 minutes.");
      return;
    }

    alert("Wrong passcode.");
  }

  // show passcode unlock before rendering the main app
  if (!isUnlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
        <div className="w-full max-w-sm rounded-3xl bg-neutral-900 p-6">
          <h1 className="mb-2 text-2xl font-bold">Money Control</h1>

          <p className="mb-5 text-sm text-neutral-400">Enter passcode</p>

          <input
            type="password"
            value={passcodeInput}
            onChange={(e) => setPasscodeInput(e.target.value)}
            className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
            placeholder="Passcode"
          />

          <button
            type="button"
            onClick={unlockApp}
            className="mt-4 w-full rounded-2xl bg-white p-4 font-semibold text-black"
          >
            Unlock
          </button>
        </div>
      </main>
    );
  }
  
  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-md px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Money Control</h1>
            <p className="text-sm text-neutral-400">
              {new Date().toLocaleString(undefined, { month: "long", year: "numeric" })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSettingsCash(String(baseCash));
                setSettingsBank(String(baseBank));
                setShowSettingsForm(true);
              }}
              className="rounded-full bg-neutral-900 px-4 py-2 text-sm text-neutral-300"
            >
              Settings
            </button>

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("finance_unlocked");
                setIsUnlocked(false);
                setPasscodeInput("");
              }}
              className="rounded-full bg-neutral-900 px-4 py-2 text-sm text-neutral-300"
            >
              Lock
            </button>
          </div>
        </header>

        <section className="mb-5 rounded-3xl bg-neutral-900 p-5 shadow-lg">
          <p className="text-sm text-neutral-400">Total Money</p>
          <h2 className="mt-2 text-4xl font-bold">${totalMoney.toLocaleString()}</h2>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-neutral-800 p-4">
              <p className="text-xs text-neutral-400">Cash</p>
              <p className="mt-1 text-xl font-semibold">${cash.toLocaleString()}</p>
            </div>

            <div className="rounded-2xl bg-neutral-800 p-4">
              <p className="text-xs text-neutral-400">Bank</p>
              <p className="mt-1 text-xl font-semibold">${bank.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-neutral-800 p-4">
            <p className="text-xs text-neutral-400">Net Worth</p>
            <p className="mt-1 text-2xl font-semibold">${netWorth.toLocaleString()}</p>
          </div>
        </section>

        <section className="mb-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setShowIncomeForm(true)}
            className="rounded-2xl bg-green-500 p-4 text-left font-semibold text-black"
          >
            + Add Income
          </button>

          <button
            type="button"
            onClick={() => setShowExpenseForm(true)}
            className="rounded-2xl bg-red-500 p-4 text-left font-semibold text-black"
          >
            - Add Expense
          </button>

          <button
            type="button"
            onClick={() => setShowLentForm(true)}
            className="rounded-2xl border border-green-500 p-4 text-left font-semibold text-green-400"
          >
            Lent
          </button>

          <button
            type="button"
            onClick={() => setShowBorrowedForm(true)}
            className="rounded-2xl border border-red-500 p-4 text-left font-semibold text-red-400"
          >
            Borrowed
          </button>
        </section>

        <section className="mb-5 rounded-3xl bg-neutral-900 p-5">
          <h3 className="mb-4 text-lg font-semibold">This Month</h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-neutral-400">Income</span>
              <span className="text-green-400">+${monthlyIncome.toLocaleString()}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-neutral-400">Expenses</span>
              <span className="text-red-400">-${monthlyExpenses.toLocaleString()}</span>
            </div>

            <div className="flex justify-between border-t border-neutral-800 pt-3">
              <span className="font-medium">Remaining</span>
              <span className="font-semibold">${remaining.toLocaleString()}</span>
            </div>
          </div>
        </section>

        <section className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-neutral-900 p-5">
            <p className="text-sm text-neutral-400">Money I Lent</p>
            <p className="mt-2 text-2xl font-bold text-green-400">
              ${activeLent.toLocaleString()}
            </p>
            <button
              type="button"
              onClick={() => setDetailsView("lent")}
              className="mt-3 text-sm text-green-400"
            >
              See More
            </button>
          </div>

          <div className="rounded-3xl bg-neutral-900 p-5">
            <p className="text-sm text-neutral-400">Money I Borrowed</p>
            <p className="mt-2 text-2xl font-bold text-red-400">
              ${activeBorrowed.toLocaleString()}
            </p>
            <button
              type="button"
              onClick={() => setDetailsView("borrowed")}
              className="mt-3 text-sm text-red-400"
            >
              See More
            </button>
          </div>
        </section>

        <section className="rounded-3xl bg-neutral-900 p-5">
          <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>

          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-neutral-500">No activity yet.</p>
            ) : (
              recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl bg-neutral-800 p-4"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-neutral-400">
                      {item.date} • {item.account}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className={item.type === "income" ? "text-green-400" : "text-red-400"}>
                      {item.type === "income" ? "+" : "-"}${item.amount.toLocaleString()}
                    </p>

                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="mt-1 block text-xs text-blue-400"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </button>
                    

                    <button
                      type="button"
                      onClick={() => {
                        if (item.type === "income") deleteIncome(item.id);
                        if (item.type === "expense") deleteExpense(item.id);
                        if (item.type === "lent") deleteLent(item.id);
                        if (item.type === "borrowed") deleteBorrowed(item.id);
                      }}
                      className="mt-1 block text-xs text-neutral-500"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {showIncomeForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6">
          <div className="mx-auto mt-10 w-full max-w-md rounded-3xl bg-neutral-900 p-5">
            <h2 className="mb-4 text-xl font-bold">Add Income</h2>

            <div className="space-y-3">
              <input
                type="number"
                placeholder="Amount"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <select
                value={incomeSource}
                onChange={(e) => setIncomeSource(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              >
                <option>Job 1</option>
                <option>Job 2</option>
                <option>Side Hustle</option>
                <option>Business</option>
                <option>Refund</option>
                <option>Gift</option>
              </select>

              <select
                value={incomeAccount}
                onChange={(e) => setIncomeAccount(e.target.value as Account)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              >
                <option value="bank">Bank</option>
                <option value="cash">Cash</option>
              </select>

              <input
                type="date"
                value={incomeDate}
                onChange={(e) => setIncomeDate(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <textarea
                placeholder="Notes"
                value={incomeNotes}
                onChange={(e) => setIncomeNotes(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowIncomeForm(false)}
                className="rounded-2xl bg-neutral-800 p-4 font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={addIncome}
                className="rounded-2xl bg-green-500 p-4 font-semibold text-black"
              >
                Save Income
              </button>
            </div>
          </div>
        </div>
      )}

      {showExpenseForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6">
          <div className="mx-auto mt-10 w-full max-w-md rounded-3xl bg-neutral-900 p-5">
            <h2 className="mb-4 text-xl font-bold">Add Expense</h2>

            <div className="space-y-3">
              <input
                type="number"
                placeholder="Amount"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              >
                <option>Spending Transfer</option>
                <option>Rent</option>
                <option>Food</option>
                <option>Transport</option>
                <option>Laundry</option>
                <option>Phone</option>
                <option>Visa</option>
                <option>College</option>
                <option>Gym</option>
                <option>Subscriptions</option>
                <option>Business</option>
                <option>Shopify</option>
                <option>Ads</option>
                <option>Emergency</option>
                <option>Other</option>
              </select>

              <select
                value={expenseAccount}
                onChange={(e) => setExpenseAccount(e.target.value as Account)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              >
                <option value="bank">Bank</option>
                <option value="cash">Cash</option>
              </select>

              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <textarea
                placeholder="Notes"
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowExpenseForm(false)}
                className="rounded-2xl bg-neutral-800 p-4 font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={addExpense}
                className="rounded-2xl bg-red-500 p-4 font-semibold text-black"
              >
                Save Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {(showLentForm || showBorrowedForm) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6">
          <div className="mx-auto mt-10 w-full max-w-md rounded-3xl bg-neutral-900 p-5">
            <h2 className="mb-4 text-xl font-bold">
              {showLentForm ? "Add Lent Money" : "Add Borrowed Money"}
            </h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder={showLentForm ? "Borrower name" : "Lender name"}
                value={moneyName}
                onChange={(e) => setMoneyName(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <input
                type="number"
                placeholder="Amount"
                value={moneyAmount}
                onChange={(e) => setMoneyAmount(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <input
                type="date"
                value={moneyDate}
                onChange={(e) => setMoneyDate(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <input
                type="tel"
                placeholder="Phone number optional"
                value={moneyPhone}
                onChange={(e) => setMoneyPhone(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <select
                value={moneyStatus}
                onChange={(e) => setMoneyStatus(e.target.value as Status)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              >
                <option>Pending</option>
                <option>Partly Paid</option>
                <option>Fully Settled</option>
              </select>

              <textarea
                placeholder="Notes"
                value={moneyNotes}
                onChange={(e) => setMoneyNotes(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeMoneyForms}
                className="rounded-2xl bg-neutral-800 p-4 font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={showLentForm ? addLent : addBorrowed}
                className={`rounded-2xl p-4 font-semibold text-black ${
                  showLentForm ? "bg-green-500" : "bg-red-500"
                }`}
              >
                {showLentForm ? "Save Lent" : "Save Borrowed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsView && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950 px-4 py-6 text-white">
          <div className="mx-auto max-w-md">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {detailsView === "lent" ? "Money I Lent" : "Money I Borrowed"}
                </h2>
                <p className="text-sm text-neutral-400">
                  {detailsView === "lent"
                    ? "People who owe you money"
                    : "People you owe money to"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDetailsView(null)}
                className="rounded-full bg-neutral-900 px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              {(detailsView === "lent" ? lentRecords : borrowedRecords).length === 0 ? (
                <p className="rounded-2xl bg-neutral-900 p-4 text-sm text-neutral-500">
                  No records yet.
                </p>
              ) : (
                (detailsView === "lent" ? lentRecords : borrowedRecords).map((item) => (
                  <div key={item.id} className="rounded-3xl bg-neutral-900 p-5">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold">{item.name}</p>
                        <p className="text-sm text-neutral-400">{item.date}</p>
                      </div>

                      <p
                        className={
                          detailsView === "lent"
                            ? "text-xl font-bold text-green-400"
                            : "text-xl font-bold text-red-400"
                        }
                      >
                        ${item.amount.toLocaleString()}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm text-neutral-300">
                      <p>Status: {item.status}</p>
                      {item.phone && <p>Phone: {item.phone}</p>}
                      {item.notes && <p>Notes: {item.notes}</p>}

                      <button
                        type="button"
                        onClick={() => {
                          if (detailsView === "lent") deleteLent(item.id);
                          if (detailsView === "borrowed") deleteBorrowed(item.id);
                        }}
                        className="mt-3 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-black"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showSettingsForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6">
          <div className="mx-auto mt-10 w-full max-w-md rounded-3xl bg-neutral-900 p-5">
            <h2 className="mb-4 text-xl font-bold">Settings</h2>

            <div className="space-y-3">
              <input
                type="number"
                placeholder="Base cash balance"
                value={settingsCash}
                onChange={(e) => setSettingsCash(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <input
                type="number"
                placeholder="Base bank balance"
                value={settingsBank}
                onChange={(e) => setSettingsBank(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowSettingsForm(false)}
                className="rounded-2xl bg-neutral-800 p-4 font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveSettings}
                className="rounded-2xl bg-green-500 p-4 font-semibold text-black"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/*
  Server-side Google Apps Script code removed from this client page.

  This file is a Next.js client component (app/page.tsx). Any Google Apps Script
  / SpreadsheetApp logic must run in a separate Apps Script project or be exposed
  via a proper API route; keeping that code here produced syntax errors and
  prevented the page from compiling.

  If you need the original Apps Script, move it to a GAS project or to a server
  endpoint and call it from this client using fetch().
*/

