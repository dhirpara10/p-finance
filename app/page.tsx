"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState } from "react";

type Status = "Pending" | "Partly Paid" | "Fully Settled";
type IncomeType = "Hourly" | "Fixed Amount";
type ExpenseAccount = "Usable Balance" | "Cash";
type Bucket =
  | "Usable Balance"
  | "Emergency Fund"
  | "Debt Repayment"
  | "Remittance Fund"
  | "Cash";

type Income = {
  id: number;
  income_type: "Hourly" | "Fixed Amount";
  source: string;
  rate: number;
  hours: number;
  amount: number;
  cash_received: number;
  date: string;
  notes: string;
};
type Expense = {
  id: number;
  amount: number;
  category: string;
  account: ExpenseAccount;
  date: string;
  notes: string;
};

type Transfer = {
  id: number;
  from_bucket: Bucket;
  to_bucket: Bucket;
  amount: number;
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

type EditingItemType = "income" | "expense" | "lent" | "borrowed" | "transfer";

const jobRates: Record<string, number> = {
  "Hawthorn Pizza": 20,
  "Pizza High": 23,
};

export default function Home() {
  const SHEETS_API_URL = "/api/sheets";
  const today = new Date().toISOString().split("T")[0];

  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [appPasscode, setAppPasscode] = useState("2605");
  const [newPasscode, setNewPasscode] = useState("");

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [incomeCashReceived, setIncomeCashReceived] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [lentRecords, setLentRecords] = useState<MoneyRecord[]>([]);
  const [borrowedRecords, setBorrowedRecords] = useState<MoneyRecord[]>([]);

  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showLentForm, setShowLentForm] = useState(false);
  const [showBorrowedForm, setShowBorrowedForm] = useState(false);
  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [detailsView, setDetailsView] = useState<"lent" | "borrowed" | null>(
    null
  );

  const [editingItem, setEditingItem] = useState<{
    type: EditingItemType;
    id: number;
  } | null>(null);

  const [emergencyGoal, setEmergencyGoal] = useState(5000);
  const [remittanceGoal, setRemittanceGoal] = useState(10000);

  const [incomeType, setIncomeType] = useState<IncomeType>("Hourly");
  const [incomeSource, setIncomeSource] = useState("Hawthorn Pizza");
  const [incomeRate, setIncomeRate] = useState("20");
  const [incomeHours, setIncomeHours] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDate, setIncomeDate] = useState(today);
  const [incomeNotes, setIncomeNotes] = useState("");

  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Spending Transfer");
  const [expenseAccount, setExpenseAccount] =
    useState<ExpenseAccount>("Usable Balance");
  const [expenseDate, setExpenseDate] = useState(today);
  const [expenseNotes, setExpenseNotes] = useState("");

  const [fromBucket, setFromBucket] = useState<Bucket>("Usable Balance");
  const [toBucket, setToBucket] = useState<Bucket>("Emergency Fund");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDate, setTransferDate] = useState(today);
  const [transferNotes, setTransferNotes] = useState("");

  const [moneyName, setMoneyName] = useState("");
  const [moneyAmount, setMoneyAmount] = useState("");
  const [moneyDate, setMoneyDate] = useState(today);
  const [moneyPhone, setMoneyPhone] = useState("");
  const [moneyNotes, setMoneyNotes] = useState("");
  const [moneyStatus, setMoneyStatus] = useState<Status>("Pending");

  function toNumber(value: unknown) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function isCurrentMonth(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();

    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }

  function getProgress(current: number, goal: number) {
    if (!goal || goal <= 0) return 0;
    return Math.min((current / goal) * 100, 100);
  }

  function getToday() {
    return new Date().toISOString().split("T")[0];
  }

  function resetIncomeForm() {
  setIncomeType("Hourly");
  setIncomeSource("Hawthorn Pizza");
  setIncomeRate("20");
  setIncomeHours("");
  setIncomeAmount("");
  setIncomeCashReceived("");
  setIncomeDate(today);
  setIncomeNotes("");
}

  function resetExpenseForm() {
    setExpenseAmount("");
    setExpenseCategory("Spending Transfer");
    setExpenseAccount("Usable Balance");
    setExpenseDate(today);
    setExpenseNotes("");
  }

  function resetTransferForm() {
    setFromBucket("Usable Balance");
    setToBucket("Emergency Fund");
    setTransferAmount("");
    setTransferDate(today);
    setTransferNotes("");
  }

  function resetMoneyForm() {
    setMoneyName("");
    setMoneyAmount("");
    setMoneyDate(today);
    setMoneyPhone("");
    setMoneyNotes("");
    setMoneyStatus("Pending");
  }

  function closeAllForms() {
    resetIncomeForm();
    resetExpenseForm();
    resetTransferForm();
    resetMoneyForm();
    setEditingItem(null);
    setShowIncomeForm(false);
    setShowExpenseForm(false);
    setShowTransferForm(false);
    setShowLentForm(false);
    setShowBorrowedForm(false);
  }

  function handleIncomeTypeChange(value: IncomeType) {
    setIncomeType(value);

    if (value === "Hourly") {
      setIncomeRate(String(jobRates[incomeSource] ?? 0));
      setIncomeAmount("");
    } else {
      setIncomeHours("");
      setIncomeRate("0");
    }
  }

  function handleIncomeSourceChange(value: string) {
    setIncomeSource(value);

    if (incomeType === "Hourly") {
      setIncomeRate(String(jobRates[value] ?? 0));
    }
  }

  async function loadFromSheets() {
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch(SHEETS_API_URL, {
        method: "GET",
        signal: controller.signal,
      });

      const text = await res.text();
      const payload = JSON.parse(text);

      if (!payload.success) {
        alert(payload.error || "Failed to load Google Sheets data");
        return;
      }

      const sheetData = payload.data || {};
      const settings = sheetData.settings || [];

      const emergencyGoalSetting = settings.find(
        (item: any) => item.key === "emergency_goal"
      );
      const remittanceGoalSetting = settings.find(
        (item: any) => item.key === "remittance_goal"
      );

      setEmergencyGoal(toNumber(emergencyGoalSetting?.value || 5000));
      setRemittanceGoal(toNumber(remittanceGoalSetting?.value || 10000));

     setIncomes(
  (sheetData.income || []).map((item: any) => ({
    id: toNumber(item.id),
    income_type: item.income_type === "Hourly" ? "Hourly" : "Fixed Amount",
    source: String(item.source || ""),
    rate: toNumber(item.rate),
    hours: toNumber(item.hours),
    amount: toNumber(item.amount),
    cash_received: toNumber(item.cash_received),
    date: String(item.date || ""),
    notes: String(item.notes || ""),
  }))
);

      setExpenses(
        (sheetData.expenses || []).map((item: any) => ({
          id: toNumber(item.id),
          amount: toNumber(item.amount),
          category: String(item.category || ""),
          account:
            item.account === "Cash" || item.account === "cash"
              ? "Cash"
              : "Usable Balance",
          date: String(item.date || ""),
          notes: String(item.notes || ""),
        }))
      );

      setTransfers(
        (sheetData.transfers || []).map((item: any) => ({
          id: toNumber(item.id),
          from_bucket: String(
            item.from_bucket || "Usable Balance"
          ) as Bucket,
          to_bucket: String(item.to_bucket || "Emergency Fund") as Bucket,
          amount: toNumber(item.amount),
          date: String(item.date || ""),
          notes: String(item.notes || ""),
        }))
      );

      setLentRecords(
        (sheetData.lent || []).map((item: any) => ({
          id: toNumber(item.id),
          name: String(item.name || ""),
          amount: toNumber(item.amount),
          date: String(item.date || ""),
          phone: String(item.phone || ""),
          notes: String(item.notes || ""),
          status: item.status || "Pending",
        }))
      );

      setBorrowedRecords(
        (sheetData.borrowed || []).map((item: any) => ({
          id: toNumber(item.id),
          name: String(item.name || ""),
          amount: toNumber(item.amount),
          date: String(item.date || ""),
          phone: String(item.phone || ""),
          notes: String(item.notes || ""),
          status: item.status || "Pending",
        }))
      );
    } catch (error: any) {
      alert(`Failed to load data from Google Sheets: ${error.message}`);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  useEffect(() => {
    const savedPasscode = localStorage.getItem("finance_app_passcode");
    const unlocked = localStorage.getItem("finance_unlocked");
    const lockedUntilValue = localStorage.getItem("finance_locked_until");

    if (savedPasscode) {
      setAppPasscode(savedPasscode);
    }

    if (unlocked === "true") {
      setIsUnlocked(true);
    }

    if (lockedUntilValue) {
      setLockUntil(Number(lockedUntilValue));
    }

    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (authReady && isUnlocked) {
      loadFromSheets();
    }
  }, [authReady, isUnlocked]);

  const activeLent = lentRecords
    .filter((item) => item.status !== "Fully Settled")
    .reduce((sum, item) => sum + item.amount, 0);

  const activeBorrowed = borrowedRecords
    .filter((item) => item.status !== "Fully Settled")
    .reduce((sum, item) => sum + item.amount, 0);

const totalIncomeAll = incomes.reduce((sum, item) => sum + item.amount, 0);

const totalCashReceivedFromIncome = incomes.reduce(
  (sum, item) => sum + item.cash_received,
  0
);

const totalUsableIncome = totalIncomeAll - totalCashReceivedFromIncome;
  const expenseFromUsableBalance = expenses
    .filter((item) => item.account === "Usable Balance")
    .reduce((sum, item) => sum + item.amount, 0);

  const expenseFromCash = expenses
    .filter((item) => item.account === "Cash")
    .reduce((sum, item) => sum + item.amount, 0);

  function bucketIn(bucket: Bucket) {
    return transfers
      .filter((item) => item.to_bucket === bucket)
      .reduce((sum, item) => sum + item.amount, 0);
  }

  function bucketOut(bucket: Bucket) {
    return transfers
      .filter((item) => item.from_bucket === bucket)
      .reduce((sum, item) => sum + item.amount, 0);
  }

 const usableBalance =
  totalUsableIncome -
  expenseFromUsableBalance -
  bucketOut("Usable Balance") +
  bucketIn("Usable Balance");

  const emergencySaved =
    bucketIn("Emergency Fund") - bucketOut("Emergency Fund");

  const debtRepaymentSaved =
    bucketIn("Debt Repayment") - bucketOut("Debt Repayment");

  const remittanceSaved =
    bucketIn("Remittance Fund") - bucketOut("Remittance Fund");

 const cashBalance =
  totalCashReceivedFromIncome +
  bucketIn("Cash") -
  bucketOut("Cash") -
  expenseFromCash;

  const totalMoney =
    usableBalance +
    emergencySaved +
    debtRepaymentSaved +
    remittanceSaved +
    cashBalance;

  const netWorth = totalMoney + activeLent - activeBorrowed;

  const monthlyIncome = incomes
    .filter((item) => isCurrentMonth(item.date))
    .reduce((sum, item) => sum + item.amount, 0);

  const monthlyHours = incomes
    .filter(
      (item) => item.income_type === "Hourly" && isCurrentMonth(item.date)
    )
    .reduce((sum, item) => sum + item.hours, 0);

  const monthlyExpenses = expenses
    .filter((item) => isCurrentMonth(item.date))
    .reduce((sum, item) => sum + item.amount, 0);

  const spendingTransfersThisMonth = expenses.filter(
    (item) =>
      item.category === "Spending Transfer" && isCurrentMonth(item.date)
  );

  const spendThisMonth = spendingTransfersThisMonth.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const spendTransferCount = spendingTransfersThisMonth.length;
  const remaining = monthlyIncome - monthlyExpenses;

  const emergencyProgress = getProgress(emergencySaved, emergencyGoal);
  const debtRepaymentProgress = getProgress(
    debtRepaymentSaved,
    activeBorrowed
  );
  const remittanceProgress = getProgress(remittanceSaved, remittanceGoal);

  const recentActivity = [
    ...incomes.map((item) => ({
      id: item.id,
      type: "income" as const,
      title: item.source,
      subtitle:
        item.income_type === "Hourly"
          ? `${item.hours}h × $${item.rate}/hr`
          : "Fixed amount",
      amount: item.amount,
      date: item.date,
    })),
    ...expenses.map((item) => ({
      id: item.id,
      type: "expense" as const,
      title: item.category,
      subtitle: item.account,
      amount: item.amount,
      date: item.date,
    })),
    ...transfers.map((item) => ({
      id: item.id,
      type: "transfer" as const,
      title: `${item.from_bucket} → ${item.to_bucket}`,
      subtitle: item.notes || "Bucket transfer",
      amount: item.amount,
      date: item.date,
    })),
    ...lentRecords.map((item) => ({
      id: item.id,
      type: "lent" as const,
      title: `Lent to ${item.name}`,
      subtitle: item.status,
      amount: item.amount,
      date: item.date,
    })),
    ...borrowedRecords.map((item) => ({
      id: item.id,
      type: "borrowed" as const,
      title: `Borrowed from ${item.name}`,
      subtitle: item.status,
      amount: item.amount,
      date: item.date,
    })),
  ].sort((a, b) => b.id - a.id);

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

  async function saveToSheet(sheet: string, values: (string | number)[]) {
    return callSheetsApi({ action: "add", sheet, values });
  }

  async function deleteFromSheet(sheet: string, id: number) {
    return callSheetsApi({ action: "delete", sheet, id });
  }

  async function updateSheetRow(
    sheet: string,
    id: string | number,
    values: (string | number)[]
  ) {
    return callSheetsApi({ action: "update", sheet, id, values });
  }

  async function saveSettings() {
    const results = await Promise.all([
      updateSheetRow("settings", "emergency_goal", [
        "emergency_goal",
        emergencyGoal,
      ]),
      updateSheetRow("settings", "remittance_goal", [
        "remittance_goal",
        remittanceGoal,
      ]),
    ]);

    if (results.some((item) => !item)) return;

    if (newPasscode.trim()) {
      if (newPasscode.length < 4) {
        alert("Passcode must be at least 4 digits.");
        return;
      }

      setAppPasscode(newPasscode);
      localStorage.setItem("finance_app_passcode", newPasscode);
      setNewPasscode("");
    }

    setShowSettingsForm(false);
  }

  async function addIncome() {
  const calculatedAmount =
    incomeType === "Hourly"
      ? Number(incomeRate) * Number(incomeHours)
      : Number(incomeAmount);

  const cashReceived = Number(incomeCashReceived || 0);

  if (!calculatedAmount || calculatedAmount <= 0) return;

  if (cashReceived < 0 || cashReceived > calculatedAmount) {
    alert("Cash received cannot be more than total income.");
    return;
  }

  const newIncome: Income = {
    id: editingItem?.type === "income" ? editingItem.id : Date.now(),
    income_type: incomeType,
    source: incomeSource,
    rate: incomeType === "Hourly" ? Number(incomeRate) : 0,
    hours: incomeType === "Hourly" ? Number(incomeHours) : 0,
    amount: calculatedAmount,
    cash_received: cashReceived,
    date: incomeDate || getToday(),
    notes: incomeNotes,
  };

  const values = [
    newIncome.id,
    newIncome.income_type,
    newIncome.source,
    newIncome.rate,
    newIncome.hours,
    newIncome.amount,
    newIncome.cash_received,
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

  resetIncomeForm();
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

    resetExpenseForm();
    setEditingItem(null);
    setShowExpenseForm(false);
  }

  async function addTransfer() {
    if (!transferAmount || Number(transferAmount) <= 0) return;

    if (fromBucket === toBucket) {
      alert("From and To bucket cannot be same.");
      return;
    }

    const newTransfer: Transfer = {
      id: editingItem?.type === "transfer" ? editingItem.id : Date.now(),
      from_bucket: fromBucket,
      to_bucket: toBucket,
      amount: Number(transferAmount),
      date: transferDate || getToday(),
      notes: transferNotes,
    };

    const values = [
      newTransfer.id,
      newTransfer.from_bucket,
      newTransfer.to_bucket,
      newTransfer.amount,
      newTransfer.date,
      newTransfer.notes,
    ];

    const saved =
      editingItem?.type === "transfer"
        ? await updateSheetRow("transfers", newTransfer.id, values)
        : await saveToSheet("transfers", values);

    if (!saved) return;

    if (editingItem?.type === "transfer") {
      setTransfers(
        transfers.map((item) =>
          item.id === newTransfer.id ? newTransfer : item
        )
      );
    } else {
      setTransfers([newTransfer, ...transfers]);
    }

    resetTransferForm();
    setEditingItem(null);
    setShowTransferForm(false);
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

  async function deleteTransfer(id: number) {
    const deleted = await deleteFromSheet("transfers", id);
    if (!deleted) return;
    setTransfers(transfers.filter((item) => item.id !== id));
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

  function startEdit(item: (typeof recentActivity)[number]) {
    setEditingItem({ type: item.type, id: item.id });

    if (item.type === "income") {
      const record = incomes.find((x) => x.id === item.id);
      if (!record) return;

      setIncomeType(record.income_type);
      setIncomeSource(record.source);
      setIncomeRate(String(record.rate));
      setIncomeHours(String(record.hours || ""));
      setIncomeAmount(
        record.income_type === "Fixed Amount" ? String(record.amount) : ""
      );
      setIncomeDate(record.date);
      setIncomeNotes(record.notes);
      setShowIncomeForm(true);
      setIncomeCashReceived(String(record.cash_received || 0));
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

    if (item.type === "transfer") {
      const record = transfers.find((x) => x.id === item.id);
      if (!record) return;

      setFromBucket(record.from_bucket);
      setToBucket(record.to_bucket);
      setTransferAmount(String(record.amount));
      setTransferDate(record.date);
      setTransferNotes(record.notes);
      setShowTransferForm(true);
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

    if (passcodeInput === appPasscode) {
      setIsUnlocked(true);
      setFailedAttempts(0);
      localStorage.setItem("finance_unlocked", "true");
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

  if (!authReady) {
    return null;
  }

  if (!isUnlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-white">
        <div className="w-full max-w-sm rounded-3xl bg-neutral-900 p-6">
          <h1 className="mb-2 text-2xl font-bold">Money Control</h1>
          <p className="mb-5 text-sm text-neutral-400">Enter your passcode</p>

          <input
            type="password"
            inputMode="numeric"
            value={passcodeInput}
            onChange={(e) => setPasscodeInput(e.target.value)}
            placeholder="4-digit passcode"
            className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
          />

          <button
            type="button"
            onClick={unlockApp}
            className="mt-4 w-full rounded-2xl bg-green-500 p-4 font-semibold text-black"
          >
            Unlock
          </button>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="text-center">
          <p className="text-lg font-semibold">Loading Finance Data...</p>
          <p className="mt-2 text-sm text-neutral-500">
            Syncing with Google Sheets
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Money Control</h1>
            <p className="text-sm text-neutral-400">
              {new Date().toLocaleString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettingsForm(true)}
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

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-3xl bg-neutral-900 p-5 shadow-lg">
              <p className="text-sm text-neutral-400">Total Money</p>
              <h2 className="mt-2 text-4xl font-bold">
                ${totalMoney.toLocaleString()}
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-neutral-800 p-4">
                  <p className="text-xs text-neutral-400">Usable Balance</p>
                  <p className="mt-1 text-xl font-semibold">
                    ${usableBalance.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl bg-neutral-800 p-4">
                  <p className="text-xs text-neutral-400">Cash</p>
                  <p className="mt-1 text-xl font-semibold">
                    ${cashBalance.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-neutral-800 p-4">
                <p className="text-xs text-neutral-400">Net Worth</p>
                <p className="mt-1 text-2xl font-semibold">
                  ${netWorth.toLocaleString()}
                </p>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
                onClick={() => setShowTransferForm(true)}
                className="rounded-2xl border border-blue-500 p-4 text-left font-semibold text-blue-400"
              >
                Transfer
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

            <section className="rounded-3xl bg-neutral-900 p-5">
              <h3 className="mb-4 text-lg font-semibold">This Month</h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Income</span>
                  <span className="text-green-400">
                    +${monthlyIncome.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-400">Hours Worked</span>
                  <span>{monthlyHours.toLocaleString()}h</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-400">Expenses</span>
                  <span className="text-red-400">
                    -${monthlyExpenses.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between border-t border-neutral-800 pt-3">
                  <span className="font-medium">Remaining</span>
                  <span className="font-semibold">
                    ${remaining.toLocaleString()}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-neutral-900 p-5">
              <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>

              <div className="space-y-3">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-neutral-500">No activity yet.</p>
                ) : (
                  recentActivity.map((item) => {
                    const amountClass =
                      item.type === "income" || item.type === "lent"
                        ? "text-green-400"
                        : item.type === "transfer"
                          ? "text-blue-400"
                          : "text-red-400";

                    const prefix =
                      item.type === "income" || item.type === "lent"
                        ? "+"
                        : item.type === "transfer"
                          ? "↔"
                          : "-";

                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="flex items-center justify-between rounded-2xl bg-neutral-800 p-4"
                      >
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-neutral-400">
                            {item.date} • {item.subtitle}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className={amountClass}>
                            {prefix}${item.amount.toLocaleString()}
                          </p>

                          <div className="mt-2 flex items-center justify-end gap-4">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="text-xs text-blue-400"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (item.type === "income")
                                  deleteIncome(item.id);
                                if (item.type === "expense")
                                  deleteExpense(item.id);
                                if (item.type === "transfer")
                                  deleteTransfer(item.id);
                                if (item.type === "lent") deleteLent(item.id);
                                if (item.type === "borrowed")
                                  deleteBorrowed(item.id);
                              }}
                              className="text-xs text-neutral-500"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-green-500/30 bg-neutral-900 p-5">
              <p className="text-sm text-neutral-400">Spend This Month</p>
              <h3 className="mt-2 text-3xl font-bold text-green-400">
                ${spendThisMonth.toLocaleString()}
              </h3>
              <p className="mt-2 text-sm text-neutral-500">
                {spendTransferCount} transfer
                {spendTransferCount === 1 ? "" : "s"} this month
              </p>
            </section>

            <section className="rounded-3xl bg-neutral-900 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-400">Emergency Fund</p>
                <p className="text-sm text-green-400">
                  {emergencyProgress.toFixed(0)}%
                </p>
              </div>

              <h3 className="mt-2 text-2xl font-bold">
                ${emergencySaved.toLocaleString()} / $
                {emergencyGoal.toLocaleString()}
              </h3>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${emergencyProgress}%` }}
                />
              </div>
            </section>

            <section className="rounded-3xl bg-neutral-900 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-400">
                  Debt Repayment Collection
                </p>
                <p className="text-sm text-red-400">
                  {debtRepaymentProgress.toFixed(0)}%
                </p>
              </div>

              <h3 className="mt-2 text-2xl font-bold">
                ${debtRepaymentSaved.toLocaleString()} / $
                {activeBorrowed.toLocaleString()}
              </h3>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{ width: `${debtRepaymentProgress}%` }}
                />
              </div>
            </section>

            <section className="rounded-3xl bg-neutral-900 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-400">Remittance Savings</p>
                <p className="text-sm text-blue-400">
                  {remittanceProgress.toFixed(0)}%
                </p>
              </div>

              <h3 className="mt-2 text-2xl font-bold">
                ${remittanceSaved.toLocaleString()} / $
                {remittanceGoal.toLocaleString()}
              </h3>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${remittanceProgress}%` }}
                />
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3">
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
          </div>
        </div>
      </div>

      {showIncomeForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6">
          <div className="mx-auto mt-10 w-full max-w-md rounded-3xl bg-neutral-900 p-5">
            <h2 className="mb-4 text-xl font-bold">
              {editingItem?.type === "income" ? "Edit Income" : "Add Income"}
            </h2>

            <div className="space-y-3">
              <select
                value={incomeType}
                onChange={(e) =>
                  handleIncomeTypeChange(e.target.value as IncomeType)
                }
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              >
                <option value="Hourly">Hourly</option>
                <option value="Fixed Amount">Fixed Amount</option>
              </select>

              <select
                value={incomeSource}
                onChange={(e) => handleIncomeSourceChange(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              >
                <option>Hawthorn Pizza</option>
                <option>Pizza High</option>
                <option>Business</option>
                <option>Refund</option>
                <option>Gift</option>
                <option>Other</option>
              </select>

              {incomeType === "Hourly" ? (
                <>
                  <input
                    type="number"
                    placeholder="Rate"
                    value={incomeRate}
                    onChange={(e) => setIncomeRate(e.target.value)}
                    className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
                  />

                  <input
                    type="number"
                    placeholder="Hours"
                    value={incomeHours}
                    onChange={(e) => setIncomeHours(e.target.value)}
                    className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
                  />
                  <div>
  <label className="mb-2 block text-sm text-neutral-400">
    Cash Received
  </label>
  <input
    type="number"
    placeholder="0"
    value={incomeCashReceived}
    onChange={(e) => setIncomeCashReceived(e.target.value)}
    className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
  />
</div>
<div className="rounded-2xl bg-neutral-800 p-4">
  <p className="text-sm text-neutral-400">Usable Balance Portion</p>
  <p className="mt-1 text-xl font-semibold">
    $
    {Math.max(
      0,
      (
        (incomeType === "Hourly"
          ? toNumber(incomeRate) * toNumber(incomeHours)
          : toNumber(incomeAmount)) - toNumber(incomeCashReceived)
      )
    ).toLocaleString()}
  </p>
</div>
                  <div className="rounded-2xl bg-neutral-800 p-4">
                    <p className="text-sm text-neutral-400">Calculated Amount</p>
                    <p className="mt-1 text-xl font-semibold">
                      $
                      {(
                        toNumber(incomeRate) * toNumber(incomeHours)
                      ).toLocaleString()}
                    </p>
                  </div>
                </>
              ) : (
                <input
                  type="number"
                  placeholder="Amount"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
                />
              )}

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
                onClick={closeAllForms}
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
            <h2 className="mb-4 text-xl font-bold">
              {editingItem?.type === "expense" ? "Edit Expense" : "Add Expense"}
            </h2>

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
                onChange={(e) =>
                  setExpenseAccount(e.target.value as ExpenseAccount)
                }
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              >
                <option value="Usable Balance">Usable Balance</option>
                <option value="Cash">Cash</option>
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
                onClick={closeAllForms}
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

      {showTransferForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6">
          <div className="mx-auto mt-10 w-full max-w-md rounded-3xl bg-neutral-900 p-5">
            <h2 className="mb-4 text-xl font-bold">
              {editingItem?.type === "transfer" ? "Edit Transfer" : "Transfer Funds"}
            </h2>

            <div className="space-y-3">
              <select
                value={fromBucket}
                onChange={(e) => setFromBucket(e.target.value as Bucket)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              >
                <option>Usable Balance</option>
                <option>Emergency Fund</option>
                <option>Debt Repayment</option>
                <option>Remittance Fund</option>
                <option>Cash</option>
              </select>

              <select
                value={toBucket}
                onChange={(e) => setToBucket(e.target.value as Bucket)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              >
                <option>Usable Balance</option>
                <option>Emergency Fund</option>
                <option>Debt Repayment</option>
                <option>Remittance Fund</option>
                <option>Cash</option>
              </select>

              <input
                type="number"
                placeholder="Amount"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <textarea
                placeholder="Notes"
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeAllForms}
                className="rounded-2xl bg-neutral-800 p-4 font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={addTransfer}
                className="rounded-2xl bg-blue-500 p-4 font-semibold text-black"
              >
                Save Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {(showLentForm || showBorrowedForm) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6">
          <div className="mx-auto mt-10 w-full max-w-md rounded-3xl bg-neutral-900 p-5">
            <h2 className="mb-4 text-xl font-bold">
              {showLentForm
                ? editingItem?.type === "lent"
                  ? "Edit Lent Money"
                  : "Add Lent Money"
                : editingItem?.type === "borrowed"
                  ? "Edit Borrowed Money"
                  : "Add Borrowed Money"}
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
                onClick={closeAllForms}
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
                Save
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
              {(detailsView === "lent" ? lentRecords : borrowedRecords).length ===
              0 ? (
                <p className="rounded-2xl bg-neutral-900 p-4 text-sm text-neutral-500">
                  No records yet.
                </p>
              ) : (
                (detailsView === "lent" ? lentRecords : borrowedRecords).map(
                  (item) => (
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
                            if (detailsView === "borrowed")
                              deleteBorrowed(item.id);
                          }}
                          className="mt-3 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-black"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </div>
      )}

      {showSettingsForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6">
          <div className="mx-auto mt-10 w-full max-w-md rounded-3xl bg-neutral-900 p-5">
            <h2 className="mb-4 text-xl font-bold">Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-neutral-400">
                  Emergency Fund Goal
                </label>
                <input
                  type="number"
                  value={String(emergencyGoal)}
                  onChange={(e) => setEmergencyGoal(Number(e.target.value))}
                  className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-neutral-400">
                  Remittance Goal
                </label>
                <input
                  type="number"
                  value={String(remittanceGoal)}
                  onChange={(e) => setRemittanceGoal(Number(e.target.value))}
                  className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-neutral-400">
                  Change Passcode
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  placeholder="Enter new passcode"
                  className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
                />
              </div>
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