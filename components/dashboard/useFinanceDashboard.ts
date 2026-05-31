"use client";

import { useEffect, useState } from "react";
import { calculateDashboardValues, getToday, toNumber } from "@/lib/calculations";
import { deleteFromSheet, loadSheetsData, saveToSheet, updateSheetRow } from "@/lib/sheets";
import type { Bucket, EditingItemType, Expense, ExpenseAccount, Income, IncomeType, MoneyRecord, RecentActivityItem, Status, Transfer } from "@/lib/types";

const jobRates: Record<string, number> = {
  "Hawthorn Pizza": 20,
  "Pizza High": 23,
};

export function useFinanceDashboard() {
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
      const payload = await loadSheetsData(controller.signal);

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

  const dashboardValues = calculateDashboardValues({
    incomes,
    expenses,
    transfers,
    lentRecords,
    borrowedRecords,
    emergencyGoal,
    remittanceGoal,
  });



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

  function startEdit(item: RecentActivityItem) {
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

  return { authReady, loading, isUnlocked, passcodeInput, setPasscodeInput, newPasscode, setNewPasscode, incomes, expenses, transfers, lentRecords, borrowedRecords, showIncomeForm, setShowIncomeForm, showExpenseForm, setShowExpenseForm, showTransferForm, setShowTransferForm, showLentForm, setShowLentForm, showBorrowedForm, setShowBorrowedForm, showSettingsForm, setShowSettingsForm, detailsView, setDetailsView, editingItem, emergencyGoal, setEmergencyGoal, remittanceGoal, setRemittanceGoal, incomeType, incomeSource, incomeRate, setIncomeRate, incomeHours, setIncomeHours, incomeAmount, setIncomeAmount, incomeCashReceived, setIncomeCashReceived, incomeDate, setIncomeDate, incomeNotes, setIncomeNotes, expenseAmount, setExpenseAmount, expenseCategory, setExpenseCategory, expenseAccount, setExpenseAccount, expenseDate, setExpenseDate, expenseNotes, setExpenseNotes, fromBucket, setFromBucket, toBucket, setToBucket, transferAmount, setTransferAmount, transferDate, setTransferDate, transferNotes, setTransferNotes, moneyName, setMoneyName, moneyAmount, setMoneyAmount, moneyDate, setMoneyDate, moneyPhone, setMoneyPhone, moneyNotes, setMoneyNotes, moneyStatus, setMoneyStatus, ...dashboardValues, toNumber, closeAllForms, handleIncomeTypeChange, handleIncomeSourceChange, saveSettings, addIncome, addExpense, addTransfer, addLent, addBorrowed, deleteIncome, deleteExpense, deleteTransfer, deleteLent, deleteBorrowed, startEdit, unlockApp, lockApp() { localStorage.removeItem("finance_unlocked"); setIsUnlocked(false); setPasscodeInput(""); } };
}

export type FinanceDashboardState = ReturnType<typeof useFinanceDashboard>;
