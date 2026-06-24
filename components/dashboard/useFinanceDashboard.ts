"use client";

import { useEffect, useRef, useState } from "react";
import { categoryIdFromName, defaultBucketListTrackers, defaultSavingsBuckets, findDuplicateTrackerCategory, getBucketLabel, normalizeBucketId, normalizeSavingsBuckets, normalizeTrackerLinks, parseJsonArray } from "@/lib/buckets";
import { useFinanceDefinitions } from "@/hooks/useFinanceDefinitions";
import { calculateDashboardValues, getToday, toNumber } from "@/lib/calculations";
import { findPersonByName } from "@/lib/lending";
import { defaultLiabilityChannels } from "@/lib/liabilities";
import { createSheetRecord,updateSheetRecord,addLendingTransaction, addPerson, deleteFromSheet, getAllData, saveSetting, saveToSheet, updateSheetRow, resetAllData as apiResetAllData } from "@/lib/sheetsApi";
import { supabase } from "@/lib/supabase";
import type { ActivityLog, AppNotification, AppUser, Bucket, BucketListTracker, EditingItemType, Expense, ExpenseAccount, ExpensePaymentMethod, Income, IncomeType, LendingTransactionRecord, MoneyRecord, Person, RecentActivityItem, Remittance, RemittanceAccount, SavingsBucket, Status, Transfer, IncomeSourceRate } from "@/lib/types";
import { parseRows, IncomeSchema, ExpenseSchema, TransferSchema, RemittanceSchema, PersonSchema, LendingTransactionSchema, MoneyRecordSchema, AppNotificationSchema } from "@/lib/schemas";
import { useLiabilities } from "@/components/liabilities/useLiabilities";
import { toast } from "@/lib/toast";
import { showConfirm } from "@/lib/confirm";



const defaultIncomeSources = [
  { name: "Hawthorn Pizza", rate: 20 },
  { name: "Pizza High", rate: 23 },
];

const defaultExpenseCategories = [
  "Food",
  "Transport",
  "Rent",
  "Laundry",
  "Phone",
  "Visa",
  "Fees",
  "Tech",
  "College",
  "Gym",
  "Subscriptions",
  "Business",
  "Shopify",
  "Ads",
  "Emergency",
  "Other",
];


export function useFinanceDashboard() {
  const today = new Date().toISOString().split("T")[0];
  const hasLoadedData = useRef(false);
  const finDefs = useFinanceDefinitions();
  const [activeBucketHistoryId, setActiveBucketHistoryId] = useState<
    string | null
  >(null);
  const [activeTrackerHistoryId, setActiveTrackerHistoryId] = useState<
    string | null
  >(null);
  const liabilityModule = Object.assign(useLiabilities(), {
    activeBucketHistoryId,
    activeTrackerHistoryId,
    openSavingsBucketHistory,
    openTrackerHistory,
    clearBucketHistory,
  });

  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [loadError, setLoadError] = useState("");

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [appPasscode, setAppPasscode] = useState("2605");
  const [newPasscode, setNewPasscode] = useState("");
  const [spousePasscode, setSpousePasscode] = useState("");
  const [newSpousePasscode, setNewSpousePasscode] = useState("");
  const [currentUser, setCurrentUser] = useState<AppUser>("me");
  const [userNameMe, setUserNameMe] = useState("You");
  const [userNameSpouse, setUserNameSpouse] = useState("Wife");
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [incomeCashReceived, setIncomeCashReceived] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [lendingTransactions, setLendingTransactions] = useState<LendingTransactionRecord[]>([]);
  const [lentRecords, setLentRecords] = useState<MoneyRecord[]>([]);
  const [borrowedRecords, setBorrowedRecords] = useState<MoneyRecord[]>([]);
  const [remittances, setRemittances] = useState<Remittance[]>([]);
  const [appNotifications, setAppNotifications] = useState<AppNotification[]>([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [showRemittanceForm, setShowRemittanceForm] = useState(false);
  const [remittanceAudAmount, setRemittanceAudAmount] = useState("");
  const [remittanceExchangeRate, setRemittanceExchangeRate] = useState("");
  const [remittanceAccount, setRemittanceAccount] = useState<RemittanceAccount>("Bank");
  const [remittanceDate, setRemittanceDate] = useState(today);
  const [remittanceProvider, setRemittanceProvider] = useState("");
  const [remittanceNotes, setRemittanceNotes] = useState("");
  const [remittanceIsPreExisting, setRemittanceIsPreExisting] = useState(false);
  const [remittanceChargesAud, setRemittanceChargesAud] = useState("");
  const [remittanceTaxAud, setRemittanceTaxAud] = useState("");

  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showLentForm, setShowLentForm] = useState(false);
  const [showBorrowedForm, setShowBorrowedForm] = useState(false);
  const [settingsPage, setSettingsPage] = useState<
    | "hub"
    | "accounts"
    | "buckets"
    | "categories"
    | "income"
    | "security"
    | "notifications"
    | "recurring"
    | "liabilities"
    | "appearance"
    | "bucket-history"
    | null
  >(null);
  const [settingsPageHistory, setSettingsPageHistory] = useState<
    NonNullable<typeof settingsPage>[]
  >([]);
  const [settingsBucketHistory, setSettingsBucketHistory] = useState<{
    type: "savings" | "tracker";
    id: string;
  } | null>(null);
  const [detailsView, setDetailsView] = useState<"lent" | "borrowed" | null>(
    null
  );

  const [editingItem, setEditingItem] = useState<{
    type: EditingItemType;
    id: string | number;
  } | null>(null);

  const [initialCashBalance, setInitialCashBalance] = useState(0);
  const [initialBankBalance, setInitialBankBalance] = useState(0);
  const [emergencyGoal, setEmergencyGoal] = useState(0);
  const [debtRepaymentGoal, setDebtRepaymentGoal] = useState(0);
  const [remittanceGoal, setRemittanceGoal] = useState(0);
  const [savingsBuckets, setSavingsBuckets] =
    useState<SavingsBucket[]>(defaultSavingsBuckets);
  const [bucketListTrackers, setBucketListTrackers] =
    useState<BucketListTracker[]>(defaultBucketListTrackers);
  const [sharedRolloverJarBalance, setSharedRolloverJarBalance] = useState(0);
  const [monthlyResetDay, setMonthlyResetDay] = useState(1);
  const [currency, setCurrency] = useState("AUD");
  const [dailyReminderEnabled, setDailyReminderEnabled] = useState(false);
  const [dailyReminderTime, setDailyReminderTime] = useState("21:30");
  const [dailyReminderTone, setDailyReminderTone] = useState("mixed");
  const [incomeSources, setIncomeSources] =
    useState<IncomeSourceRate[]>(defaultIncomeSources);

  type StatisticsMode = "CATEGORY" | "TIME";
  type StatisticsPeriod =
    | "1M"
    | "2M"
    | "3M"
    | "6M"
    | "12M"
    | "LIFETIME"
    | "CUSTOM";
  type TimeGrouping = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

  const [statisticsMode, setStatisticsMode] = useState<StatisticsMode>("CATEGORY");
  const [statisticsPeriod, setStatisticsPeriod] = useState<StatisticsPeriod>("1M");
  const [statisticsStartDate, setStatisticsStartDate] = useState("");
  const [statisticsEndDate, setStatisticsEndDate] = useState("");
  const [timeGrouping, setTimeGrouping] = useState<TimeGrouping>("MONTHLY");

  const [incomeType, setIncomeType] = useState<IncomeType>("Hourly");
  const [incomeSource, setIncomeSource] = useState("Hawthorn Pizza");
  const [incomeRate, setIncomeRate] = useState("20");
  const [incomeHours, setIncomeHours] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDate, setIncomeDate] = useState(today);
  const [incomeNotes, setIncomeNotes] = useState("");

  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Food");
  const [expenseAccount, setExpenseAccount] =
    useState<ExpenseAccount>("Bank");
  const [expensePaymentMethod, setExpensePaymentMethod] =
    useState<ExpensePaymentMethod>("Bank");
  const [expenseCashPortion, setExpenseCashPortion] = useState("");
  const [expenseDate, setExpenseDate] = useState(today);
  const [expenseNotes, setExpenseNotes] = useState("");
  const [expenseIsRecurring, setExpenseIsRecurring] = useState(false);
  const [expenseRecurringFrequency, setExpenseRecurringFrequency] =
    useState<NonNullable<Expense["recurringFrequency"]>>("monthly");
  const [expenseRecurringEndDate, setExpenseRecurringEndDate] = useState("");
  const [expenseCategories, setExpenseCategories] = useState<string[]>(defaultExpenseCategories);
  const [newExpenseCategory, setNewExpenseCategory] = useState("");


  const [fromBucket, setFromBucket] = useState<Bucket>("Bank");
  const [toBucket, setToBucket] = useState<Bucket>("savings_emergency_fund");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferDate, setTransferDate] = useState(today);
  const [transferNotes, setTransferNotes] = useState("");
  const [transferTrackerId, setTransferTrackerId] = useState("");

  const [moneyName, setMoneyName] = useState("");
  const [moneyAmount, setMoneyAmount] = useState("");
  const [moneyDate, setMoneyDate] = useState(today);
  const [moneyPhone, setMoneyPhone] = useState("");
  const [moneyNotes, setMoneyNotes] = useState("");
  const [moneyStatus, setMoneyStatus] = useState<Status>("Pending");
  const [moneyAccount, setMoneyAccount] = useState<ExpenseAccount>("Bank");
  const [borrowedAffectsAccountBalance, setBorrowedAffectsAccountBalance] =
    useState(true);
  const [lentAffectsAccountBalance, setLentAffectsAccountBalance] =
    useState(true);
  const [lendingPersonMode, setLendingPersonMode] = useState<
    "existing" | "new"
  >("existing");
  const [selectedPersonId, setSelectedPersonId] = useState<string | number | null>(
    null
  );
  const [personSearch, setPersonSearch] = useState("");
  const [settlementProfileId, setSettlementProfileId] = useState<
    string | number | null
  >(null);
  const [settlementAmount, setSettlementAmount] = useState("");
  const [settlementAccount, setSettlementAccount] =
    useState<ExpenseAccount>("Bank");
  const [settlementDate, setSettlementDate] = useState(today);
  const [settlementNotes, setSettlementNotes] = useState("");


  function resetIncomeForm() {
    const firstSource = incomeSources[0] || defaultIncomeSources[0];
    setIncomeType("Hourly");
    setIncomeSource(firstSource.name);
    setIncomeRate(String(firstSource.rate));
    setIncomeHours("");
    setIncomeAmount("");
    setIncomeCashReceived("");
    setIncomeDate(today);
    setIncomeNotes("");
  }

  function resetExpenseForm() {
    setExpenseAmount("");
    setExpenseCategory(expenseCategories[0] || "Food");
    setExpenseAccount("Bank");
    setExpensePaymentMethod("Bank");
    setExpenseCashPortion("");
    setExpenseDate(today);
    setExpenseNotes("");
    setExpenseIsRecurring(false);
    setExpenseRecurringFrequency("monthly");
    setExpenseRecurringEndDate("");
  }

  function resetTransferForm() {
    setFromBucket("Bank");
    setToBucket("savings_emergency_fund");
    setTransferAmount("");
    setTransferDate(today);
    setTransferNotes("");
    setTransferTrackerId("");
  }

  function resetMoneyForm() {
    setLendingPersonMode("existing");
    setSelectedPersonId(null);
    setPersonSearch("");
    setMoneyName("");
    setMoneyAmount("");
    setMoneyDate(today);
    setMoneyPhone("");
    setMoneyNotes("");
    setMoneyStatus("Pending");
    setMoneyAccount("Bank");
    setBorrowedAffectsAccountBalance(true);
    setLentAffectsAccountBalance(true);
  }

  function resetRemittanceForm() {
    setRemittanceAudAmount("");
    setRemittanceExchangeRate("");
    setRemittanceAccount("Bank");
    setRemittanceDate(today);
    setRemittanceProvider("");
    setRemittanceNotes("");
    setRemittanceIsPreExisting(false);
    setRemittanceChargesAud("");
    setRemittanceTaxAud("");
  }

  function resetSettlementForm() {
    setSettlementProfileId(null);
    setSettlementAmount("");
    setSettlementAccount("Bank");
    setSettlementDate(today);
    setSettlementNotes("");
  }

  function closeAllForms() {
    resetIncomeForm();
    resetExpenseForm();
    resetTransferForm();
    resetMoneyForm();
    resetSettlementForm();
    resetRemittanceForm();
    setEditingItem(null);
    setShowIncomeForm(false);
    setShowExpenseForm(false);
    setShowTransferForm(false);
    setShowLentForm(false);
    setShowBorrowedForm(false);
    setShowRemittanceForm(false);
    liabilityModule.closeLiabilityForm();
    liabilityModule.setEditingScheduleId(null);
  }

  function openSavingsBucketHistory(bucketId: string) {
    setActiveBucketHistoryId(bucketId);
    setActiveTrackerHistoryId(null);
  }

  function openTrackerHistory(trackerId: string) {
    setActiveTrackerHistoryId(trackerId);
    setActiveBucketHistoryId(null);
  }

  function clearBucketHistory() {
    setActiveBucketHistoryId(null);
    setActiveTrackerHistoryId(null);
  }

  function navigateToSettingsPage(page: NonNullable<typeof settingsPage>) {
    setSettingsPageHistory((history) =>
      settingsPage ? [...history, settingsPage] : history
    );
    setSettingsPage(page);
  }

  function goBackSettingsPage() {
    setSettingsPageHistory((history) => {
      const previous = history[history.length - 1] || null;
      setSettingsPage(previous);
      return history.slice(0, -1);
    });
  }

  function closeSettings() {
    setSettingsPage(null);
    setSettingsPageHistory([]);
    setSettingsBucketHistory(null);
  }

  function getSheetId(value: unknown) {
    if (typeof value === "number" && value > 0) return value;
    if (typeof value === "string" && value.trim()) return value.trim();
    return null;
  }

  function looksLikeExistingId(value: unknown) {
    if (value === undefined || value === null) return false;

    const text = String(value).trim();
    if (!text) return false;

    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(text)) {
      return true;
    }

    if (/^\d{10,}$/.test(text)) {
      return true;
    }

    if (text.length >= 12 && /[a-zA-Z]/.test(text)) {
      return true;
    }

    return false;
  }

  function normalizeSheetRow(item: any) {
    if (!Array.isArray(item)) return item;

    if (
      item.length >= 2 &&
      looksLikeExistingId(item[0]) &&
      looksLikeExistingId(item[1])
    ) {
      return item.slice(1);
    }

    return item;
  }

  function normalizeRowId(value: any): string | number {
    const idValue = getSheetId(value);
    if (idValue !== null) return idValue;
    if (value === undefined || value === null) return "";
    return String(value);
  }

  function hasUsableDate(value: unknown) {
  if (typeof value !== "string") return false;
  const text = value.trim();
  if (!text) return false;

  const time = new Date(text).getTime();
  return Number.isFinite(time);
}

function hasCleanText(value: unknown) {
  return typeof value === "string" && value.trim() !== "";
}

function isValidIncomeRow(item: Income) {
  return (
    hasCleanText(item.source) &&
    hasUsableDate(item.date) &&
    Number.isFinite(Number(item.amount)) &&
    Number(item.amount) > 0
  );
}

function isValidExpenseRow(item: Expense) {
  return (
    hasCleanText(item.category) &&
    hasUsableDate(item.date) &&
    Number.isFinite(Number(item.amount)) &&
    Number(item.amount) > 0
  );
}

function isValidTransferRow(item: Transfer) {
  return (
    hasCleanText(item.from_bucket) &&
    hasCleanText(item.to_bucket) &&
    hasUsableDate(item.date) &&
    Number.isFinite(Number(item.amount)) &&
    Number(item.amount) > 0
  );
}

  function parseIncomeRow(item: any): Income {
    const row = normalizeSheetRow(item);

    if (Array.isArray(row)) {
      const [id, income_type, source, rate, hours, amount, cash_received, date, notes] = row;

      

      return {
        id: normalizeRowId(id),
        income_type: income_type === "Hourly" ? "Hourly" : "Fixed Amount",
        source: String(source || ""),
        rate: toNumber(rate),
        hours: toNumber(hours),
        amount: toNumber(amount),
        cash_received: toNumber(cash_received),
        date: String(date || ""),
        notes: String(notes || ""),
      };
    }

    return {
      id: normalizeRowId(item?.id ?? item?.[0]),
      income_type: item?.income_type === "Hourly" ? "Hourly" : "Fixed Amount",
      source: String(item?.source || ""),
      rate: toNumber(item?.rate),
      hours: toNumber(item?.hours),
      amount: toNumber(item?.amount),
      cash_received: toNumber(item?.cash_received),
      date: String(item?.date || ""),
      notes: String(item?.notes || ""),
      addedBy: (item?.addedBy === "spouse" ? "spouse" : item?.addedBy === "me" ? "me" : undefined) as AppUser | undefined,
    };
  }

  function parseExpenseRow(item: any): Expense {
    const row = normalizeSheetRow(item);

    if (Array.isArray(row)) {
      const [id, amount, category, account, date, notes, metadata] = row;
      const recurring = metadata && typeof metadata === "object" ? metadata : {};

      return {
        id: normalizeRowId(id),
        type: "expense",
        amount: toNumber(amount),
        category: String(category || ""),
        categoryId: categoryIdFromName(String(category || "")),
        account:
          account === "Cash" || account === "cash" ? "Cash" : "Bank",
        paymentMethod: (recurring.paymentMethod as ExpensePaymentMethod) || undefined,
        liabilityId: recurring.liabilityId ? String(recurring.liabilityId) : undefined,
        date: String(date || ""),
        notes: String(notes || ""),
        isRecurring: Boolean(recurring.isRecurring),
        recurringFrequency: recurring.recurringFrequency,
        recurringStartDate: recurring.recurringStartDate,
        recurringEndDate: recurring.recurringEndDate,
        recurringStatus: recurring.recurringStatus,
        createdAt: String(recurring.createdAt || ""),
        updatedAt: recurring.updatedAt,
        addedBy: (recurring.addedBy === "spouse" ? "spouse" : recurring.addedBy === "me" ? "me" : undefined) as AppUser | undefined,
      };
    }

    return {
      id: normalizeRowId(item?.id ?? item?.[0]),
      type: "expense",
      amount: toNumber(item?.amount),
      category: String(item?.category || ""),
      categoryId: String(item?.categoryId || categoryIdFromName(String(item?.category || ""))),
      account:
        item?.account === "Cash" || item?.account === "cash" ? "Cash" : "Bank",
      paymentMethod: (item?.paymentMethod as ExpensePaymentMethod) || undefined,
      liabilityId: item?.liabilityId ? String(item.liabilityId) : undefined,
      date: String(item?.date || ""),
      notes: String(item?.notes || ""),
      isRecurring: Boolean(item?.isRecurring),
      recurringFrequency: item?.recurringFrequency,
      recurringStartDate: String(item?.recurringStartDate || item?.date || ""),
      recurringEndDate: String(item?.recurringEndDate || ""),
      recurringStatus: item?.recurringStatus || (item?.isRecurring ? "active" : undefined),
      createdAt: String(item?.createdAt || ""),
      updatedAt: item?.updatedAt,
      addedBy: (item?.addedBy === "spouse" ? "spouse" : item?.addedBy === "me" ? "me" : undefined) as AppUser | undefined,
    };
  }

  function parseTransferRow(item: any): Transfer {
    const row = normalizeSheetRow(item);

    if (Array.isArray(row)) {
      const [id, from_bucket, to_bucket, amount, date, notes, metadata] = row;
      const details =
        metadata && typeof metadata === "object" ? metadata : {};

      return {
        id: normalizeRowId(id),
        from_bucket: normalizeBucketId(from_bucket || "Bank"),
        to_bucket: normalizeBucketId(to_bucket || "savings_emergency_fund"),
        amount: toNumber(amount),
        date: String(date || ""),
        notes: String(notes || ""),
        trackerId: String((details as { trackerId?: string }).trackerId || ""),
      };
    }

    return {
      id: normalizeRowId(item?.id ?? item?.[0]),
      from_bucket: normalizeBucketId(item?.from_bucket || "Bank"),
      to_bucket: normalizeBucketId(item?.to_bucket || "savings_emergency_fund"),
      amount: toNumber(item?.amount),
      date: String(item?.date || ""),
      notes: String(item?.notes || ""),
      trackerId: String(item?.trackerId || ""),
      addedBy: (item?.addedBy === "spouse" ? "spouse" : item?.addedBy === "me" ? "me" : undefined) as AppUser | undefined,
    };
  }

  function parseMoneyRecordRow(item: any): MoneyRecord {
    const row = normalizeSheetRow(item);

    if (Array.isArray(row)) {
      const [id, name, amount, date, phone, notes, status] = row;

      return {
        id: normalizeRowId(id),
        name: String(name || ""),
        amount: toNumber(amount),
        date: String(date || ""),
        phone: String(phone || ""),
        notes: String(notes || ""),
        status: String(status || "Pending") as Status,
      };
    }

    return {
      id: normalizeRowId(item?.id ?? item?.[0]),
      name: String(item?.name || ""),
      amount: toNumber(item?.amount),
      date: String(item?.date || ""),
      phone: String(item?.phone || ""),
      notes: String(item?.notes || ""),
      status: item?.status || "Pending",
    };
  }

  function extractCreatedId(payload: unknown) {
    if (payload && typeof payload === "object") {
      const record = payload as Record<string, any>;
      return getSheetId(
        record.id ??
          record.personId ??
          record.person?.id ??
          record.transaction?.id ??
          record.data?.id ??
          record.data?.personId ??
          record.data?.person?.id ??
          record.data?.transaction?.id
      );
    }

    return null;
  }

  function getPersonId(person: Person | null | undefined) {
    return getSheetId(person?.id);
  }

  function getSelectedPerson() {
    if (!selectedPersonId) return null;
    return (
      people.find((person) => String(person.id) === String(selectedPersonId)) ||
      null
    );
  }

  function getSettingValue(settings: any[], key: string, fallback: string) {
    const getKey = (item: any) => {
      if (item == null) return null;
      if (typeof item.key === "string") return item.key;
      if (typeof item.Key === "string") return item.Key;
      if (typeof item.name === "string") return item.name;
      if (typeof item.id === "string") return item.id;
      return null;
    };

    const getValue = (item: any) => {
      if (Array.isArray(item) && item.length >= 2) return item[1];
      if (item == null || typeof item !== "object") return undefined;
      return item.value ?? item.Value ?? item.val ?? item[1];
    };

    const normalizedKey = key.toString().toLowerCase();
    const setting = settings.find((item: any) => {
      const itemKey = getKey(item);
      return itemKey?.toString().toLowerCase() === normalizedKey;
    });

    const rawValue = setting ? getValue(setting) : undefined;
    if (rawValue !== undefined && rawValue !== null) {
      return String(rawValue);
    }

    const fallbackRow = settings.find(
      (item: any) => Array.isArray(item) && String(item[0]).toLowerCase() === normalizedKey
    );
    if (fallbackRow) {
      return String(fallbackRow[1]);
    }

    return String(fallback);
  }

  function parseIncomeSources(value: string) {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        const sources = parsed
          .map((item) => ({
            name: String(item.name || "").trim(),
            rate: toNumber(item.rate),
          }))
          .filter((item) => item.name);

        if (sources.length) return sources;
      }
    } catch {}

    return defaultIncomeSources;
  }

  function parseExpenseCategories(value: string) {
    try {
      const parsed = JSON.parse(value);

      if (Array.isArray(parsed)) {
        const categories = parsed
          .map((item) => String(item || "").trim())
          .filter(Boolean);

        if (categories.length) return categories;
      }
    } catch {}

    return defaultExpenseCategories;
  }


  function currencySymbolFor(value: string) {
    if (value === "AUD" || value === "USD" || value === "CAD" || value === "SGD") return "$";
    if (value === "GBP") return "£";
    if (value === "EUR") return "€";
    if (value === "INR") return "₹";
    if (value === "NZD") return "$";
    return "$";
  }

  function updateIncomeSource(index: number, field: "name" | "rate", value: string) {
    setIncomeSources(
      incomeSources.map((source, sourceIndex) =>
        sourceIndex === index
          ? {
              ...source,
              [field]: field === "rate" ? toNumber(value) : value,
            }
          : source
      )
    );
  }

  function addIncomeSourceSetting() {
    setIncomeSources([...incomeSources, { name: "", rate: 0 }]);
  }

  function removeIncomeSourceSetting(index: number) {
    const nextSources = incomeSources.filter((_, sourceIndex) => sourceIndex !== index);
    setIncomeSources(nextSources.length ? nextSources : defaultIncomeSources);
  }

  function handleIncomeTypeChange(value: IncomeType) {
    setIncomeType(value);

    if (value === "Hourly") {
      setIncomeRate(
        String(
          incomeSources.find((source) => source.name === incomeSource)?.rate ??
            0
        )
      );
      setIncomeAmount("");
    } else {
      setIncomeHours("");
      setIncomeRate("0");
    }
  }

  function handleIncomeSourceChange(value: string) {
    setIncomeSource(value);

    if (incomeType === "Hourly") {
      setIncomeRate(
        String(incomeSources.find((source) => source.name === value)?.rate ?? 0)
      );
    }
  }

  async function loadFromSheets() {
  const isFirstLoad = !hasLoadedData.current;
  if (isFirstLoad) {
    setLoading(true);
  } else {
    setLoadingMessage("Fetching latest data...");
  }
  setLoadError("");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const sheetDataRaw = await getAllData(controller.signal);
    const sheetData = {
      ...sheetDataRaw,
      People:
        sheetDataRaw.People ||
        sheetDataRaw.people ||
        sheetDataRaw.PEOPLE ||
        [],
      LendingTransactions:
        sheetDataRaw.LendingTransactions ||
        sheetDataRaw.lendingTransactions ||
        sheetDataRaw.Lendingtransactions ||
        sheetDataRaw.lendingtransactions ||
        sheetDataRaw.lending ||
        [],
      Liabilities: (() => {
        const all = [
          ...(sheetDataRaw.Liabilities || []),
          ...(sheetDataRaw.liabilities || []),
        ] as Record<string, unknown>[];
        const seen = new Set<unknown>();
        return all.filter(item => {
          const id = item?.id;
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        });
      })(),
      RepaymentSchedules:
        sheetDataRaw.RepaymentSchedules ||
        sheetDataRaw.repaymentSchedules ||
        [],
      LiabilityPayments: (() => {
        const all = [
          ...(sheetDataRaw.liability_payments || []),
          ...(sheetDataRaw.liabilityPayments || []),
        ] as Record<string, unknown>[];
        const seen = new Set<unknown>();
        return all.filter(item => {
          const id = item?.id;
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        });
      })(),
    };

    const settings = sheetData.settings || [];

    // Load definition sheets (buckets, trackers, categories) + migrate from settings if needed
    await finDefs.load(sheetData as Record<string, unknown[]>, settings);

    setInitialCashBalance(
      toNumber(getSettingValue(settings, "initial_cash_balance", "0"))
    );

    setInitialBankBalance(
      toNumber(
        getSettingValue(
          settings,
          "initial_bank_balance",
          getSettingValue(settings, "initial_commbank_balance", "0")
        )
      )
    );

    setEmergencyGoal(
      toNumber(getSettingValue(settings, "emergency_goal", "0"))
    );

    setDebtRepaymentGoal(
      toNumber(getSettingValue(settings, "debt_repayment_goal", "0"))
    );

    setRemittanceGoal(
      toNumber(getSettingValue(settings, "remittance_goal", "0"))
    );

    setSharedRolloverJarBalance(
      toNumber(getSettingValue(settings, "shared_rollover_jar_balance", "0"))
    );

    setMonthlyResetDay(
      Math.min(
        Math.max(
          toNumber(getSettingValue(settings, "monthly_reset_day", "1")),
          1
        ),
        28
      )
    );

    setCurrency(getSettingValue(settings, "currency", "AUD"));

    setUserNameMe(getSettingValue(settings, "user_name_me", "You"));
    setUserNameSpouse(getSettingValue(settings, "user_name_spouse", "Wife"));

    const loadedIncomeSources = parseIncomeSources(
      getSettingValue(
        settings,
        "income_sources",
        JSON.stringify(defaultIncomeSources)
      )
    );

    setIncomeSources(loadedIncomeSources);

    if (!loadedIncomeSources.some((source) => source.name === incomeSource)) {
      setIncomeSource(loadedIncomeSources[0]?.name || "Hawthorn Pizza");
      setIncomeRate(String(loadedIncomeSources[0]?.rate || 0));
    }

    setDailyReminderEnabled(
      String(getSettingValue(settings, "daily_reminder_enabled", "false"))
        .toLowerCase() === "true"
    );

    setDailyReminderTime(
      getSettingValue(settings, "daily_reminder_time", "21:30") || "21:30"
    );

    setDailyReminderTone(
      getSettingValue(settings, "daily_reminder_tone", "mixed") || "mixed"
    );

    const hydratedLiabilities = liabilityModule.hydrateLiabilities(
      sheetData.Liabilities,
      sheetData.RepaymentSchedules,
      getSettingValue(
        settings,
        "liability_settings",
        JSON.stringify(liabilityModule.liabilitySettings)
      ),
      sheetData.LiabilityPayments
    );

    await liabilityModule.processDueBnplRepayments(
      hydratedLiabilities.liabilities,
      hydratedLiabilities.repaymentSchedules
    );

    const cleanIncomes = parseRows(IncomeSchema, sheetData.income || [], "income")
      .filter(isValidIncomeRow) as Income[];

    const cleanExpenses = parseRows(ExpenseSchema, sheetData.expenses || [], "expenses")
      .filter(isValidExpenseRow) as Expense[];

    const cleanTransfers = parseRows(TransferSchema, sheetData.transfers || [], "transfers")
      .filter(isValidTransferRow) as Transfer[];

    setIncomes(cleanIncomes);
    setExpenses(cleanExpenses);
    setTransfers(cleanTransfers);

    setLentRecords(parseRows(MoneyRecordSchema, sheetData.lent || [], "lent") as MoneyRecord[]);

    setBorrowedRecords(parseRows(MoneyRecordSchema, sheetData.borrowed || [], "borrowed") as MoneyRecord[]);

    setPeople(parseRows(PersonSchema, sheetData.People || [], "People") as Person[]);

    setLendingTransactions(
      parseRows(LendingTransactionSchema, sheetData.LendingTransactions || [], "LendingTransactions") as any[]
    );

    setRemittances(parseRows(RemittanceSchema, sheetData.remittances || [], "remittances") as Remittance[]);

    // Load in-app notifications — drop stale ones whose repayment schedule no longer exists
    const repaymentScheduleIds = new Set(
      (sheetData.RepaymentSchedules || []).map((s: any) => String(s?.id || ""))
    );
    const parsedNotifications = parseRows(AppNotificationSchema, sheetData.app_notifications || [], "app_notifications");
    setAppNotifications(
      parsedNotifications.filter((item) => {
        if (
          item.relatedEntityType === "repayment_schedule" &&
          item.relatedEntityId &&
          !repaymentScheduleIds.has(item.relatedEntityId)
        ) {
          deleteFromSheet("app_notifications", item.id).catch(() => {});
          return false;
        }
        return true;
      }) as AppNotification[]
    );

    setActivityLogs(
      (sheetData.app_logs || []).map((item: any) => ({
        id: String(item?.id || ""),
        user: (item?.user === "spouse" ? "spouse" : "me") as AppUser,
        userName: String(item?.userName || item?.user_name || ""),
        action: (["created","updated","deleted"].includes(item?.action) ? item.action : "created") as ActivityLog["action"],
        entityType: String(item?.entityType || item?.entity_type || "") as ActivityLog["entityType"],
        entityId: item?.entityId ?? item?.entity_id ?? "",
        description: String(item?.description || ""),
        beforeValue: item?.beforeValue ?? undefined,
        afterValue: item?.afterValue ?? undefined,
        // DB stores as created_at → normalizeRow converts to createdAt
        timestamp: String(item?.createdAt || item?.timestamp || ""),
      }))
    );

    // Trigger repayment notification check in background (no await — non-blocking)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      fetch("/api/notifications/repayment", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => {});
    });

    hasLoadedData.current = true;
  } catch (error: any) {
    setLoadError(error.message || "Failed to load data from Google Sheets.");
  } finally {
    clearTimeout(timeoutId);
    setLoading(false);
    setLoadingMessage(null);
  }
}

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        // No Supabase session — redirect to auth page
        window.location.replace("/auth");
        return;
      }

      // Session exists — restore local preferences
      const savedPasscode = localStorage.getItem("finance_app_passcode");
      if (savedPasscode) setAppPasscode(savedPasscode);

      const savedSpousePasscode = localStorage.getItem("finance_app_spouse_passcode");
      if (savedSpousePasscode) setSpousePasscode(savedSpousePasscode);

      const savedUser = localStorage.getItem("finance_current_user") as AppUser | null;
      if (savedUser) setCurrentUser(savedUser);

      // Auto-unlock if the user unlocked within the last 24 hours
      const unlockedAt = localStorage.getItem("finance_unlocked_at");
      const UNLOCK_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
      if (unlockedAt && Date.now() - Number(unlockedAt) < UNLOCK_TTL_MS) {
        setIsUnlocked(true);
      }

      localStorage.removeItem("finance_locked_until");

      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authReady && isUnlocked && !hasLoadedData.current) {
      loadFromSheets();
    }
  }, [authReady, isUnlocked]);

  // ── Real-time sync ────────────────────────────────────────────────────────
  // Reload whenever another device/session writes to any finance table.
  useEffect(() => {
    if (!authReady || !isUnlocked) return;

    const WATCHED_TABLES = [
      "income", "expenses", "transfers", "remittances",
      "lending_transactions", "people",
      "liabilities", "repayment_schedules", "liability_payments",
      "dreams_goals", "app_logs",
      "bucket_definitions", "tracker_definitions",
      "category_definitions", "category_tracker_links",
    ];

    // Debounce: avoid hammering the DB if several rows arrive at once
    let reloadTimer: ReturnType<typeof setTimeout> | null = null;
    function scheduleReload() {
      if (reloadTimer) clearTimeout(reloadTimer);
      reloadTimer = setTimeout(() => { loadFromSheets(); }, 800);
    }

    const channel = supabase
      .channel("realtime-finance")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        (payload) => {
          if (WATCHED_TABLES.includes((payload.table as string))) {
            scheduleReload();
          }
        }
      )
      .subscribe();

    return () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      supabase.removeChannel(channel);
    };
  }, [authReady, isUnlocked]);

  const AUTO_LOCK_TIMEOUT_MS = 15 * 60 * 1000;

  useEffect(() => {
    if (!isUnlocked) return;

    const timeoutId = window.setTimeout(() => {
      setIsUnlocked(false);
      localStorage.removeItem("finance_unlocked_at");
      setPasscodeInput("");
      setPasscodeError("");
      closeSettings();
    }, AUTO_LOCK_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [isUnlocked]);

  // Sync expenseCategories from finDefs when definitions load
  useEffect(() => {
    if (!finDefs.loaded || finDefs.categoryDefs.length === 0) return;
    const names = finDefs.categoryDefs
      .filter((c) => c.isActive && c.kind === "expense")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => c.name);
    setExpenseCategories(names);
    if (!names.includes(expenseCategory)) {
      setExpenseCategory(names[0] || "Food");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finDefs.loaded, finDefs.categoryDefs]);

  const dashboardValues = calculateDashboardValues({
    incomes,
    expenses,
    transfers,
    remittances,
    people,
    lendingTransactions,
    lentRecords,
    borrowedRecords,
    liabilities: liabilityModule.liabilities,
    repaymentSchedules: liabilityModule.repaymentSchedules,
    initialCashBalance,
    initialBankBalance,
    savingsBuckets,
    bucketListTrackers,
    bucketDefinitions: finDefs.bucketDefs.length > 0 ? finDefs.bucketDefs : undefined,
    trackerDefinitions: finDefs.trackerDefs.length > 0 ? finDefs.trackerDefs : undefined,
    categoryTrackerLinks: finDefs.ctLinks,
    sharedRolloverJarBalance,
    monthlyResetDay,
  });


  async function withStatus<T>(message: string, fn: () => Promise<T>): Promise<T> {
    setLoadingMessage(message);
    try {
      return await fn();
    } finally {
      setLoadingMessage(null);
    }
  }

  async function saveSettings() {
    const cleanIncomeSources = incomeSources
      .map((source) => ({
        name: source.name.trim(),
        rate: toNumber(source.rate),
      }))
      .filter((source) => source.name);

    if (!cleanIncomeSources.length) {
      toast("Add at least one income source.", "error");
      return;
    }

    const results = await Promise.all([
      saveSetting("initial_cash_balance", initialCashBalance),
      saveSetting("initial_bank_balance", initialBankBalance),
      saveSetting("emergency_goal", emergencyGoal),
      saveSetting("debt_repayment_goal", debtRepaymentGoal),
      saveSetting("remittance_goal", remittanceGoal),
      saveSetting("shared_rollover_jar_balance", sharedRolloverJarBalance),
      saveSetting("monthly_reset_day", monthlyResetDay),
      saveSetting("currency", currency),
      saveSetting("income_sources", JSON.stringify(cleanIncomeSources)),
      saveSetting(
        "daily_reminder_enabled",
        dailyReminderEnabled ? "true" : "false"
      ),
      saveSetting("daily_reminder_time", dailyReminderTime),
      saveSetting("daily_reminder_tone", dailyReminderTone),
    ]);

    if (results.some((item) => !item)) return;

    if (newPasscode.trim()) {
      if (newPasscode.length < 4) {
        toast("Passcode must be at least 4 digits.", "error");
        return;
      }

      setAppPasscode(newPasscode);
      localStorage.setItem("finance_app_passcode", newPasscode);
      setNewPasscode("");
    }

    if (newSpousePasscode.trim()) {
      if (newSpousePasscode.length < 4) {
        toast("Partner passcode must be at least 4 digits.", "error");
        return;
      }
      setSpousePasscode(newSpousePasscode);
      localStorage.setItem("finance_app_spouse_passcode", newSpousePasscode);
      setNewSpousePasscode("");
    }

    await Promise.all([
      saveSetting("user_name_me", userNameMe.trim() || "You"),
      saveSetting("user_name_spouse", userNameSpouse.trim() || "Wife"),
    ]);

    setIncomeSources(cleanIncomeSources);
    closeSettings();
  }

async function writeLog(
  action: "created" | "updated" | "deleted",
  entityType: ActivityLog["entityType"],
  entityId: string | number,
  description: string,
  beforeValue?: Record<string, unknown>,
  afterValue?: Record<string, unknown>
) {
  try {
    const log: ActivityLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      user: currentUser,
      userName: currentUser === "spouse" ? userNameSpouse : userNameMe,
      action,
      entityType,
      entityId,
      description,
      timestamp: new Date().toISOString(),
      beforeValue,
      afterValue,
    };
    await createSheetRecord<ActivityLog>("app_logs", log as unknown as Record<string, unknown>);
    setActivityLogs((prev) => [log, ...prev]);
  } catch {
    // non-blocking — log failures are silent
  }
}

async function addIncome() {
  setLoadingMessage(editingItem ? "Updating income..." : "Saving income...");
  const cleanSource = incomeSource.trim();
  const cleanDate = incomeDate || getToday();

  const totalAmount =
    incomeType === "Hourly"
      ? Number(incomeRate) * Number(incomeHours)
      : Number(incomeAmount);

  const cashReceived = Number(incomeCashReceived || 0);

  if (!cleanSource) {
    toast("Select an income source.", "error");
    return;
  }

  if (!cleanDate) {
    toast("Select a date.", "error");
    return;
  }

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    toast("Enter a valid income amount.", "error");
    return;
  }

  if (!Number.isFinite(cashReceived) || cashReceived < 0) {
    toast("Cash received cannot be negative.", "error");
    return;
  }

  if (cashReceived > totalAmount) {
    toast("Cash received cannot be more than total income.", "error");
    return;
  }

  const newIncome: Income = {
    id: editingItem?.type === "income" ? editingItem.id : Date.now(),
    income_type: incomeType,
    source: cleanSource,
    rate: incomeType === "Hourly" ? Number(incomeRate) : 0,
    hours: incomeType === "Hourly" ? Number(incomeHours) : 0,
    amount: totalAmount,
    cash_received: cashReceived,
    date: cleanDate,
    notes: incomeNotes.trim(),
    addedBy: currentUser,
  };

  console.log("SAVING INCOME PAYLOAD", newIncome);

  const saved =
    editingItem?.type === "income"
      ? await updateSheetRecord("income", newIncome.id, newIncome)
      : await createSheetRecord("income", newIncome);

  console.log("SAVED INCOME RESULT", saved);

  if (!saved) {
    toast("Income was not saved to database.", "error");
    return;
  }

  if (editingItem?.type === "income") {
    setIncomes((current) =>
      current.map((item) =>
        String(item.id) === String(newIncome.id) ? newIncome : item
      )
    );
  } else {
    setIncomes((current) => [newIncome, ...current]);
  }

  if (editingItem?.type === "income") {
    const before = incomes.find((i) => String(i.id) === String(newIncome.id));
    await writeLog("updated", "income", newIncome.id, `${cleanSource} ${currencySymbolFor(currency)}${totalAmount}`, before as unknown as Record<string, unknown>, newIncome as unknown as Record<string, unknown>);
  } else {
    await writeLog("created", "income", newIncome.id, `${cleanSource} ${currencySymbolFor(currency)}${totalAmount}`, undefined, newIncome as unknown as Record<string, unknown>);
  }
  setLoadingMessage(null);
  resetIncomeForm();
  setEditingItem(null);
  setShowIncomeForm(false);
}

function getEditableCashBalance(previousAmount = 0) {
  return dashboardValues.cashBalance + previousAmount;
}

function blockNegativeCash(amount: number, previousAmount = 0) {
  const availableCash = getEditableCashBalance(previousAmount);

  if (amount > availableCash) {
    toast("Not enough cash balance.", "error");
    return true;
  }

  return false;
}


function getAvailableAccountBalance(
  account: ExpenseAccount | string,
  previousAmount = 0
) {
  return account === "Cash"
    ? dashboardValues.cashBalance + previousAmount
    : dashboardValues.bankBalance + previousAmount;
}

function blockNegativeAccountBalance(
  account: ExpenseAccount | string,
  amount: number,
  previousAmount = 0
) {
  const available = getAvailableAccountBalance(account, previousAmount);

  if (amount > available) {
    toast(`Not enough ${account} balance.`, "error");
    return true;
  }

  return false;
}

  async function addExpense() {
  setLoadingMessage(editingItem ? "Updating expense..." : "Saving expense...");
  const amount = Number(expenseAmount);

  if (!amount || amount <= 0) return;

  

 const previousExpense =
  editingItem?.type === "expense"
    ? expenses.find((item) => String(item.id) === String(editingItem.id))
    : null;

  const isLiabilityPayment = expensePaymentMethod === "Afterpay" || expensePaymentMethod === "StepPay" || expensePaymentMethod === "CreditCard";
  const isJarPayment = expensePaymentMethod === "SharedJar";

  // BNPL channel validation (StepPay minimum, etc.)
  if (expensePaymentMethod === "Afterpay" || expensePaymentMethod === "StepPay") {
    const savedChannels = liabilityModule.liabilitySettings.liabilityChannels;
    const channels = (savedChannels && savedChannels.length > 0) ? savedChannels : defaultLiabilityChannels;
    const channelId = expensePaymentMethod.toLowerCase();
    const channel = channels.find((ch) => ch.id === channelId && ch.enabled);
    if (channel) {
      const minSplit = channel.minimumSplitAmount ?? 0;
      if (minSplit > 0 && amount < minSplit) {
        if ((channel.underMinimumBehaviour ?? "block") === "block") {
          toast(`${channel.name} split repayment is only available for purchases of $${minSplit} or more.`, "error");
          return;
        }
        // else single_deduction — allow, handled in createLiabilityFromExpense
      }
      // Balance check for immediate first payment
      if (!editingItem && !(channel.noPaymentUpfrontEnabled ?? false)) {
        const installmentCount = channel.installmentCount || 4;
        const firstInstallment = Math.floor((amount / installmentCount) * 100) / 100;
        const linkedAccount = channel.linkedRepaymentAccount ?? "Bank";
        const availableBalance = linkedAccount === "Cash" ? dashboardValues.cashBalance : dashboardValues.bankBalance;
        if (firstInstallment > availableBalance) {
          toast(`Not enough ${linkedAccount} balance for the first repayment of $${firstInstallment.toFixed(2)} due today.`, "error");
          return;
        }
      }
    }
  }

  if (!isLiabilityPayment && !isJarPayment) {
    const previousAccountAmount =
      previousExpense?.account === expenseAccount ? previousExpense.amount : 0;

    if (blockNegativeAccountBalance(expenseAccount, amount, previousAccountAmount)) {
      return;
    }

    const previousCashAmount =
      previousExpense?.account === "Cash" ? previousExpense.amount : 0;

    if (expenseAccount === "Cash" && blockNegativeCash(amount, previousCashAmount)) {
      return;
    }
  }

  const newExpense: Expense = {
    id: editingItem?.type === "expense" ? editingItem.id : Date.now(),
    type: "expense",
    amount,
    category: expenseCategory,
    categoryId: categoryIdFromName(expenseCategory),
    account: expenseAccount,
    paymentMethod: expensePaymentMethod,
    cashPortion: expensePaymentMethod === "Split" ? (parseFloat(expenseCashPortion) || 0) : undefined,
    date: expenseDate || getToday(),
    notes: expenseNotes,
    isRecurring: expenseIsRecurring,
    recurringFrequency: expenseIsRecurring ? expenseRecurringFrequency : undefined,
    recurringStartDate: expenseIsRecurring ? expenseDate || getToday() : undefined,
    recurringEndDate: expenseIsRecurring ? expenseRecurringEndDate || undefined : undefined,
    recurringStatus: expenseIsRecurring ? "active" : undefined,
    createdAt:
      editingItem?.type === "expense"
        ? expenses.find((item) => String(item.id) === String(editingItem.id))
            ?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    addedBy: currentUser,
  };

  // Strip client-only discriminator — expenses table has no `type` column
  const { type: _expType, ...expenseDbData } = newExpense;

  const saved =
    editingItem?.type === "expense"
      ? await updateSheetRecord("expenses", newExpense.id, expenseDbData as unknown as Record<string, unknown>)
      : await createSheetRecord("expenses", expenseDbData as unknown as Record<string, unknown>);

  if (!saved) return;

  if (editingItem?.type === "expense") {
    setExpenses(
      expenses.map((item) =>
        String(item.id) === String(newExpense.id) ? newExpense : item
      )
    );
  } else {
    setExpenses([newExpense, ...expenses]);
  }

  // Auto-create liability for BNPL channels when adding new (not editing)
  if (!editingItem && (expensePaymentMethod === "Afterpay" || expensePaymentMethod === "StepPay")) {
    const savedChannels = liabilityModule.liabilitySettings.liabilityChannels;
    const channels = (savedChannels && savedChannels.length > 0) ? savedChannels : defaultLiabilityChannels;
    const channelId = expensePaymentMethod.toLowerCase();
    const channel = channels.find((ch) => ch.id === channelId && ch.enabled);
    console.log("[addExpense] BNPL auto-create: paymentMethod=", expensePaymentMethod, "channelId=", channelId, "channel=", channel, "channels=", channels);
    if (channel) {
      try {
        const result = await liabilityModule.createLiabilityFromExpense({
          channel,
          amount: newExpense.amount,
          expenseDate: newExpense.date,
          expenseCategory: newExpense.category,
          expenseNotes: newExpense.notes,
        });
        console.log("[addExpense] BNPL liability created. deductedToday=", result?.deductedToday);
        // Backfill liabilityId onto the expense so deletion can cascade
        if (result?.liability?.id) {
          const liabilityId = result.liability.id;
          const { type: _t, ...expPatch } = { ...newExpense, liabilityId, updatedAt: new Date().toISOString() };
          await updateSheetRecord("expenses", newExpense.id, expPatch as unknown as Record<string, unknown>);
          setExpenses((prev) =>
            prev.map((e) =>
              String(e.id) === String(newExpense.id) ? { ...e, liabilityId } : e
            )
          );
        }
      } catch (err: any) {
        console.error("[addExpense] Failed to auto-create liability:", err);
        toast(`Expense saved, but liability creation failed: ${err?.message || "unknown error"}`, "error");
      }
    } else {
      console.warn("[addExpense] No enabled channel found for", expensePaymentMethod, "- skipping liability creation");
    }
  }

  if (editingItem?.type === "expense") {
    const before = expenses.find((e) => String(e.id) === String(newExpense.id));
    await writeLog("updated", "expense", newExpense.id, `${expenseCategory} ${currencySymbolFor(currency)}${amount}`, before as unknown as Record<string, unknown>, newExpense as unknown as Record<string, unknown>);
  } else {
    await writeLog("created", "expense", newExpense.id, `${expenseCategory} ${currencySymbolFor(currency)}${amount}`, undefined, newExpense as unknown as Record<string, unknown>);
  }
  setLoadingMessage(null);
  resetExpenseForm();
  setEditingItem(null);
  setShowExpenseForm(false);
}

async function addTransfer() {
  setLoadingMessage(editingItem ? "Updating transfer..." : "Saving transfer...");
  const amount = Number(transferAmount);

  if (!amount || amount <= 0) return;

  if (fromBucket === toBucket) {
    toast("From and To bucket cannot be same.", "error");
    return;
  }

  const previousTransfer =
    editingItem?.type === "transfer"
      ? transfers.find((item) => String(item.id) === String(editingItem.id))
      : null;

  const previousAccountAmount =
    previousTransfer?.from_bucket === fromBucket &&
    (fromBucket === "Bank" || fromBucket === "Cash")
      ? previousTransfer.amount
      : 0;

  if (
    (fromBucket === "Bank" || fromBucket === "Cash") &&
    blockNegativeAccountBalance(fromBucket, amount, previousAccountAmount)
  ) {
    return;
  }

  const sourceBalance =
    fromBucket === "Bank"
      ? dashboardValues.bankBalance
      : fromBucket === "Cash"
        ? dashboardValues.cashBalance
        : dashboardValues.savingsBucketBalances.find(
            (bucket) => bucket.id === fromBucket
          )?.currentBalance;

  const availableBalance =
    Number(sourceBalance || 0) +
    (previousTransfer && previousTransfer.from_bucket === fromBucket
      ? previousTransfer.amount
      : 0);

  if (amount > availableBalance) {
    toast(
      `Only ${currencySymbolFor(currency)}${availableBalance.toLocaleString()} is available in ${getBucketLabel(
        fromBucket,
        savingsBuckets
      )}.`,
      "error"
    );
    return;
  }

  const newTransfer: Transfer = {
    id: editingItem?.type === "transfer" ? editingItem.id : Date.now(),
    from_bucket: fromBucket,
    to_bucket: toBucket,
    amount,
    date: transferDate || getToday(),
    notes: transferNotes,
    trackerId:
      toBucket === "shared_rollover_jar" && transferTrackerId
        ? transferTrackerId
        : undefined,
    addedBy: currentUser,
  };

  const saved =
    editingItem?.type === "transfer"
      ? await updateSheetRecord("transfers", newTransfer.id, newTransfer as unknown as Record<string, unknown>)
      : await createSheetRecord("transfers", newTransfer as unknown as Record<string, unknown>);

  if (!saved) return;

  if (editingItem?.type === "transfer") {
    setTransfers(
      transfers.map((item) =>
        String(item.id) === String(newTransfer.id) ? newTransfer : item
      )
    );
  } else {
    setTransfers([newTransfer, ...transfers]);
  }

  if (!editingItem) {
    const fromLabel = getBucketLabel(fromBucket);
    const toLabel = getBucketLabel(toBucket);
    await writeLog("created", "transfer", newTransfer.id, `${fromLabel} → ${toLabel} ${currencySymbolFor(currency)}${amount}`);
  }
  setLoadingMessage(null);
  resetTransferForm();
  setEditingItem(null);
  setShowTransferForm(false);
}

  async function ensurePerson(name: string, phone: string) {
    const cleanedName = name.trim().replace(/\s+/g, " ");
    const cleanedPhone = phone.trim();

    if (!cleanedName) {
      toast("Person name is required.", "error");
      return null;
    }

    const existingPerson = findPersonByName(people, name);
    const now = new Date().toISOString();

    if (existingPerson) {
      return existingPerson;
    }

    const saved = await addPerson({
      name: cleanedName,
      phone: cleanedPhone,
    });

    console.log("Created person response:", saved);

    if (!saved) return null;

    const personId = extractCreatedId(saved);
    console.log("Extracted personId:", personId);

    if (!personId) {
      throw new Error("Person profile is missing an id.");
    }

    const savedPerson: Person = {
      id: personId,
      name: cleanedName,
      phone: cleanedPhone,
      createdAt: now,
      updatedAt: now,
    };

    setPeople([savedPerson, ...people]);
    return savedPerson;
  }

  async function saveLendingTransaction({
  person,
  type,
  amount,
  account,
  affectsAccountBalance,
  date,
  note,
}: {
  person: Person;
  type: LendingTransactionRecord["type"];
  amount: number;
  account?: ExpenseAccount;
  affectsAccountBalance?: boolean;
  date: string;
  note: string;
}) {
  const validTypes: LendingTransactionRecord["type"][] = [
    "lent",
    "borrowed",
    "settlement",
  ];

  const personId = getPersonId(person);

  if (!personId) {
    toast("Person profile is missing an id.", "error");
    return null;
  }

  if (!validTypes.includes(type)) {
    toast("Invalid lending transaction type.", "error");
    return null;
  }

  if (!amount || amount <= 0) {
    toast("Amount must be greater than 0.", "error");
    return null;
  }

  const payload = {
    personId,
    type,
    amount: Number(amount),
    account: account || "Bank",
    affectsAccountBalance: Boolean(affectsAccountBalance),
    date: date || getToday(),
    note: note?.trim() || "",
  };

  console.log("Final transaction payload:", payload);

  const saved = await addLendingTransaction(payload);

  if (!saved) return null;

  await writeLog(
    "created",
    type === "lent" ? "lent" : "borrowed",
    `${Date.now()}`,
    `${type === "settlement" ? "Settlement" : type === "lent" ? "Lent to" : "Borrowed from"} ${person.name} ${currencySymbolFor(currency)}${amount}`
  );

  await loadFromSheets();

  return saved;
}

  async function addMoneyTransaction(type: LendingTransactionRecord["type"]) {
  const amount = Number(moneyAmount);

  if (!amount || amount <= 0) {
    toast("Amount must be greater than 0.", "error");
    return;
  }

  const affectsBalance =
    type === "borrowed" ? borrowedAffectsAccountBalance : lentAffectsAccountBalance;
  const isMoneyOutflow = type === "lent" && affectsBalance;

  if (
    isMoneyOutflow &&
    blockNegativeAccountBalance(moneyAccount, amount)
  ) {
    return;
  }

  try {
    // ── Update path ──────────────────────────────────────────────────────────
    if (editingItem && (editingItem.type === "lent" || editingItem.type === "borrowed")) {
      const updatePayload = {
        amount: Number(amount),
        account: moneyAccount === "Cash" ? "Cash" : "Bank",
        affectsAccountBalance: affectsBalance,
        date: moneyDate || getToday(),
        note: moneyNotes?.trim() || "",
        updatedAt: new Date().toISOString(),
      };
      await updateSheetRecord(
        "lending_transactions",
        editingItem.id,
        updatePayload as unknown as Record<string, unknown>
      );
      await writeLog(
        "updated",
        type === "lent" ? "lent" : "borrowed",
        String(editingItem.id),
        `${type === "lent" ? "Lent" : "Borrowed"} ${currencySymbolFor(currency)}${amount} (edited)`,
      );
      await loadFromSheets();
      resetMoneyForm();
      setEditingItem(null);
      setShowLentForm(false);
      setShowBorrowedForm(false);
      return;
    }

    // ── Create path ──────────────────────────────────────────────────────────
    let person: Person | null = null;

    if (lendingPersonMode === "existing") {
      person = getSelectedPerson();

      if (!getPersonId(person)) {
        toast("Select an existing person profile.", "error");
        return;
      }
    } else {
      const existing = findPersonByName(people, moneyName);

      if (existing) {
        toast("This person already exists. Select existing profile instead.", "error");
        return;
      }

      person = await ensurePerson(moneyName, moneyPhone);
    }

    if (!person) return;

    const saved = await saveLendingTransaction({
      person,
      type,
      amount,
      account: moneyAccount,
      affectsAccountBalance:
        type === "borrowed" ? borrowedAffectsAccountBalance : lentAffectsAccountBalance,
      date: moneyDate || getToday(),
      note: moneyNotes,
    });

    if (!saved) return;

    resetMoneyForm();
    setEditingItem(null);
    setShowLentForm(false);
    setShowBorrowedForm(false);
  } catch (error: any) {
    console.error(error);
    toast(error.message || "Failed to save lending transaction.", "error");
  }
}

  async function addLent() {
    await addMoneyTransaction("lent");
  }

  async function addBorrowed() {
    await addMoneyTransaction("borrowed");
  }

  async function addRemittance() {
    const aud = toNumber(remittanceAudAmount);
    const rate = toNumber(remittanceExchangeRate);
    if (!aud || aud <= 0) { toast("Enter a valid AUD amount.", "error"); return; }
    if (!rate || rate <= 0) { toast("Enter a valid exchange rate.", "error"); return; }
    const inr = parseFloat((aud * rate).toFixed(2));
    const charges = toNumber(remittanceChargesAud) || undefined;
    const tax = toNumber(remittanceTaxAud) || undefined;
    const id = Date.now();
    const record: Remittance = {
      id,
      audAmount: aud,
      exchangeRate: rate,
      inrAmount: inr,
      account: remittanceAccount,
      date: remittanceDate,
      provider: remittanceProvider.trim(),
      chargesAud: charges,
      taxAud: tax,
      notes: remittanceNotes.trim(),
      createdAt: new Date().toISOString(),
      fromFund: remittanceAccount === "RemittanceFund" && !remittanceIsPreExisting,
      preExisting: remittanceIsPreExisting,
      addedBy: currentUser,
    };
    const saved = await createSheetRecord<Remittance>("remittances", record as unknown as Record<string, unknown>);
    if (!saved) return;
    setRemittances([...remittances, record]);
    await writeLog("created", "remittance", record.id, `${currencySymbolFor(currency)}${aud} at ${rate}`);
    closeAllForms();
  }

  async function deleteRemittance(id: string | number) {
    if (!await showConfirm("Delete this remittance?")) return;
    setLoadingMessage("Deleting remittance...");
    await deleteFromSheet("remittances", id);
    setRemittances(remittances.filter((r) => String(r.id) !== String(id)));
    await writeLog("deleted", "remittance", id, "Remittance");
    setLoadingMessage(null);
  }

  function openSettlement(profileId: string | number, amount?: number) {
    setSettlementProfileId(profileId);
    setSettlementAmount(amount ? String(amount) : "");
    setSettlementAccount("Bank");
    setSettlementDate(getToday());
    setSettlementNotes("");
  }

  async function saveSettlement() {
  setLoadingMessage("Saving settlement...");
  const profile = dashboardValues.personProfiles.find(
    (item) => String(item.id) === String(settlementProfileId)
  );
  const amount = Number(settlementAmount);

  if (!profile || !amount || amount <= 0) return;

  const openBalance = Math.abs(profile.netBalance);

  if (openBalance > 0 && amount > openBalance) {
    toast("Settlement amount cannot be more than the open balance.", "error");
    return;
  }

  const isPayingSomeoneBack = profile.netBalance < 0;

  if (
    isPayingSomeoneBack &&
    blockNegativeAccountBalance(settlementAccount, amount)
  ) {
    return;
  }

  const person = await ensurePerson(profile.name, profile.phone || "");
  if (!person) return;

  const saved = await saveLendingTransaction({
    person,
    type: "settlement",
    amount,
    account: settlementAccount,
    date: settlementDate || getToday(),
    note: settlementNotes,
  });

  if (!saved) { setLoadingMessage(null); return; }

  setLoadingMessage(null);
  resetSettlementForm();
}

  async function deleteSettlement(id: string | number) {
    if (!await showConfirm("Delete this settlement?")) return;
    setLoadingMessage("Deleting settlement...");
    const deleted = await deleteFromSheet("LendingTransactions", id);
    if (!deleted) return;
    setLendingTransactions(
      lendingTransactions.filter((item) => String(item.id) !== String(id))
    );
    setLoadingMessage(null);
  }

  async function deleteLendingTransaction(id: string | number) {
    if (!await showConfirm("Delete this lending transaction?")) return;
    setLoadingMessage("Deleting transaction...");
    const deleted = await deleteFromSheet("LendingTransactions", id);
    if (!deleted) { setLoadingMessage(null); return; }
    setLendingTransactions(
      lendingTransactions.filter((item) => String(item.id) !== String(id))
    );
    setLoadingMessage(null);
  }

  async function updateLendingTransaction(
    id: string | number,
    payload: { amount: number; account: string; date: string; note: string }
  ) {
    setLoadingMessage("Updating transaction...");
    const before = lendingTransactions.find((item) => String(item.id) === String(id));
    const updated = await updateSheetRecord("lending_transactions", id, {
      amount: payload.amount,
      account: payload.account,
      date: payload.date,
      note: payload.note,
      updatedAt: new Date().toISOString(),
    } as unknown as Record<string, unknown>);
    if (!updated) return false;
    const next = { ...before, amount: payload.amount, account: payload.account, date: payload.date, note: payload.note };
    setLendingTransactions((prev) =>
      prev.map((item) =>
        String(item.id) === String(id)
          ? { ...item, amount: payload.amount, account: payload.account as "Bank" | "Cash", date: payload.date, note: payload.note }
          : item
      )
    );
    await writeLog("updated", "lent", id, `Settlement ${currencySymbolFor(currency)}${payload.amount}`, before as unknown as Record<string, unknown>, next as unknown as Record<string, unknown>);
    setLoadingMessage(null);
    return true;
  }

  async function deleteIncome(id: string | number) {
    if (!await showConfirm("Delete this income transaction?")) return;
    setLoadingMessage("Deleting income...");
    const deleted = await deleteFromSheet("income", id);
    if (!deleted) { setLoadingMessage(null); return; }
    setIncomes(incomes.filter((item) => String(item.id) !== String(id)));
    await writeLog("deleted", "income", id, "Income record");
    setLoadingMessage(null);
  }

  async function deleteExpense(id: string | number) {
    setLoadingMessage("Deleting expense...");
    const expense = expenses.find((e) => String(e.id) === String(id));
    const hasLinkedLiability = Boolean(expense?.liabilityId);
    const confirmMsg = hasLinkedLiability
      ? "Delete this expense and its linked BNPL liability + repayment schedule?"
      : "Delete this expense transaction?";
    if (!await showConfirm(confirmMsg)) { setLoadingMessage(null); return; }
    const deleted = await deleteFromSheet("expenses", id);
    if (!deleted) return;
    setExpenses(expenses.filter((item) => String(item.id) !== String(id)));
    await writeLog("deleted", "expense", id, expense?.category ? `${expense.category} ${currencySymbolFor(currency)}${expense.amount}` : "Expense");
    if (expense?.liabilityId) {
      await liabilityModule.deleteLiabilityNoConfirm(expense.liabilityId);
    }
    setLoadingMessage(null);
  }

  async function deleteFullLiability(id: string) {
    const linkedExpense = expenses.find((e) => e.liabilityId === id);
    const confirmMsg = linkedExpense
      ? "Delete this liability, its repayment schedule, and the linked expense?"
      : "Delete this liability and its repayment schedule?";
    if (!await showConfirm(confirmMsg)) return;
    if (linkedExpense) {
      await deleteFromSheet("expenses", linkedExpense.id);
      setExpenses((prev) => prev.filter((e) => String(e.id) !== String(linkedExpense.id)));
    }
    await liabilityModule.deleteLiabilityNoConfirm(id);
  }

  async function deleteTransfer(id: string | number) {
    if (!await showConfirm("Delete this transfer?")) return;
    setLoadingMessage("Deleting transfer...");
    const deleted = await deleteFromSheet("transfers", id);
    if (!deleted) { setLoadingMessage(null); return; }
    setTransfers(transfers.filter((item) => String(item.id) !== String(id)));
    await writeLog("deleted", "transfer", id, "Transfer");
    setLoadingMessage(null);
  }

  async function deleteLent(id: string | number) {
    if (!await showConfirm("Delete this legacy lending record?")) return;
    const deleted = await deleteFromSheet("lent", id);
    if (!deleted) return;
    setLentRecords(lentRecords.filter((item) => String(item.id) !== String(id)));
  }

  async function deleteBorrowed(id: string | number) {
    if (!await showConfirm("Delete this legacy borrowing record?")) return;
    const deleted = await deleteFromSheet("borrowed", id);
    if (!deleted) return;
    setBorrowedRecords(
      borrowedRecords.filter((item) => String(item.id) !== String(id))
    );
  }

  function startEdit(item: RecentActivityItem) {
    if (item.type === "liability_repayment") {
      liabilityModule.setEditingScheduleId(String(item.id));
      return;
    }

    if (item.type === "settlement") {
      return;
    }

    setEditingItem({ type: item.type, id: item.id });

    if (item.type === "income") {
      const record = incomes.find(
        (x) => String(x.id) === String(item.id)
      );
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
      const record = expenses.find(
        (x) => String(x.id) === String(item.id)
      );
      if (!record) return;

      setExpenseAmount(String(record.amount));
      setExpenseCategory(record.category);
      setExpenseAccount(record.account);
      const rawPm: string = (record.paymentMethod as string) || record.account;
      const pm = rawPm === "BNPL" ? "Afterpay" : rawPm;
      setExpensePaymentMethod(pm as ExpensePaymentMethod);
      setExpenseCashPortion(record.cashPortion != null ? String(record.cashPortion) : "");
      setExpenseDate(record.date);
      setExpenseNotes(record.notes);
      setExpenseIsRecurring(record.isRecurring);
      setExpenseRecurringFrequency(record.recurringFrequency || "monthly");
      setExpenseRecurringEndDate(record.recurringEndDate || "");
      setShowExpenseForm(true);
    }

    if (item.type === "transfer") {
      const record = transfers.find(
        (x) => String(x.id) === String(item.id)
      );
      if (!record) return;

      setFromBucket(record.from_bucket);
      setToBucket(record.to_bucket);
      setTransferAmount(String(record.amount));
      setTransferDate(record.date);
      setTransferNotes(record.notes);
      setTransferTrackerId(record.trackerId || "");
      setShowTransferForm(true);
    }

    if (item.type === "lent") {
      const record = lendingTransactions.find(
        (x) => String(x.id) === String(item.id) && x.type === "lent"
      );
      if (!record) return;

      setMoneyAmount(String(record.amount));
      setMoneyDate(record.date);
      setMoneyNotes(record.note || "");
      setMoneyAccount(record.account || "Bank");
      setLentAffectsAccountBalance(record.affectsAccountBalance ?? true);
      setLendingPersonMode("existing");
      setSelectedPersonId(String(record.personId || ""));
      setShowLentForm(true);
    }

    if (item.type === "borrowed") {
      const record = lendingTransactions.find(
        (x) => String(x.id) === String(item.id) && x.type === "borrowed"
      );
      if (!record) return;

      setMoneyAmount(String(record.amount));
      setMoneyDate(record.date);
      setMoneyNotes(record.note || "");
      setMoneyAccount(record.account || "Bank");
      setBorrowedAffectsAccountBalance(record.affectsAccountBalance ?? false);
      setLendingPersonMode("existing");
      setSelectedPersonId(String(record.personId || ""));
      setShowBorrowedForm(true);
    }
  }

  function unlockApp() {
    if (passcodeInput === appPasscode) {
      setCurrentUser("me");
      localStorage.setItem("finance_current_user", "me");
      localStorage.setItem("finance_unlocked_at", String(Date.now()));
      setLoading(!hasLoadedData.current);
      setIsUnlocked(true);
      setFailedAttempts(0);
      setLockUntil(null);
      setPasscodeError("");
      setPasscodeInput("");
      return;
    }

    if (spousePasscode && passcodeInput === spousePasscode) {
      setCurrentUser("spouse");
      localStorage.setItem("finance_current_user", "spouse");
      localStorage.setItem("finance_unlocked_at", String(Date.now()));
      setLoading(!hasLoadedData.current);
      setIsUnlocked(true);
      setFailedAttempts(0);
      setLockUntil(null);
      setPasscodeError("");
      setPasscodeInput("");
      return;
    }

    setFailedAttempts(failedAttempts + 1);
    setPasscodeInput("");
    setPasscodeError("Wrong passcode");
  }

  async function addExpenseCategory() {
    const cleanName = newExpenseCategory.trim();
    if (!cleanName) return;

    const alreadyExists = expenseCategories.some(
      (category) => category.toLowerCase() === cleanName.toLowerCase()
    );
    if (alreadyExists) {
      toast("Category already exists.", "error");
      return;
    }

    await finDefs.addCategoryDef({
      name: cleanName,
      kind: "expense",
      isActive: true,
      sortOrder: finDefs.categoryDefs.length,
    });

    setExpenseCategory(cleanName);
    setNewExpenseCategory("");
  }

  async function updateRecurringExpenseStatus(
    id: string | number,
    status: "active" | "paused" | "cancelled"
  ) {
    const expense = expenses.find((item) => String(item.id) === String(id));
    if (!expense || !expense.isRecurring) return;
    const updated: Expense = {
      ...expense,
      recurringStatus: status,
      updatedAt: new Date().toISOString(),
    };
    const { type: _t, ...updatedDbData } = updated;
    const saved = await updateSheetRecord("expenses", updated.id, updatedDbData as unknown as Record<string, unknown>);
    if (!saved) return;
    setExpenses(
      expenses.map((item) =>
        String(item.id) === String(id) ? updated : item
      )
    );
  }

  async function handleResetAllData() {
    try {
      await apiResetAllData();
    } catch (err: any) {
      toast(`Reset failed: ${err?.message || "Supabase delete error. Check console."}`, "error");
      console.error("[Reset] API delete failed:", err);
      throw err;
    }
    // Clear all local React state — must happen after confirmed API success
    setIncomes([]);
    setExpenses([]);
    setTransfers([]);
    setPeople([]);
    setLendingTransactions([]);
    setLentRecords([]);
    setBorrowedRecords([]);
    setRemittances([]);
    setAppNotifications([]);
    setActivityLogs([]);
    liabilityModule.resetLiabilityData();
    setInitialBankBalance(0);
    setInitialCashBalance(0);
    setSavingsBuckets(defaultSavingsBuckets);
    setBucketListTrackers(defaultBucketListTrackers);
    setSharedRolloverJarBalance(0);
  }

  async function markNotificationRead(id: string) {
    setAppNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    await saveSetting(`notif_read_${id}`, "true").catch(() => {});
    // Update in app_rows
    try {
      const notif = appNotifications.find((n) => n.id === id);
      if (notif) {
        await createSheetRecord("app_notifications", { ...notif, isRead: true, id });
      }
    } catch {
      // non-critical
    }
  }

  function markAllNotificationsRead() {
    setAppNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  async function deleteNotification(id: string) {
    setAppNotifications((prev) => prev.filter((n) => n.id !== id));
    await deleteFromSheet("app_notifications", id).catch(() => {});
  }

  async function clearAllNotifications() {
    const ids = appNotifications.map((n) => n.id);
    setAppNotifications([]);
    await Promise.all(ids.map((id) => deleteFromSheet("app_notifications", id).catch(() => {})));
  }

  function updateBucketListTrackerCategoryLinks(
    trackerId: string,
    linkedCategoryIds: string[]
  ) {
    const cleanLinkedCategoryIds = [...new Set(linkedCategoryIds)];
    const duplicate = findDuplicateTrackerCategory(
      bucketListTrackers,
      trackerId,
      cleanLinkedCategoryIds
    );

    if (duplicate) {
      toast(
        `This category is already linked to ${duplicate.owner.name}. Remove it there first.`,
        "error"
      );
      return;
    }

    setBucketListTrackers(
      bucketListTrackers.map((tracker) =>
        tracker.id === trackerId
          ? {
              ...tracker,
              linkedCategoryIds: cleanLinkedCategoryIds,
              updatedAt: new Date().toISOString(),
            }
          : tracker
      )
    );
  }


  async function signOut() {
    await supabase.auth.signOut();
    window.location.replace("/auth");
  }

  return { finDefs, authReady, loading, loadingMessage, loadError, retryLoad: loadFromSheets, signOut, isUnlocked, passcodeInput, setPasscodeInput, passcodeError, setPasscodeError, newPasscode, setNewPasscode, newSpousePasscode, setNewSpousePasscode, currentUser, userNameMe, setUserNameMe, userNameSpouse, setUserNameSpouse, activityLogs, incomes, expenses, transfers, people, lendingTransactions, lentRecords, borrowedRecords, showIncomeForm, setShowIncomeForm, showExpenseForm, setShowExpenseForm, showTransferForm, setShowTransferForm, showLentForm, setShowLentForm, showBorrowedForm, setShowBorrowedForm, settingsPage, settingsPageHistory, navigateToSettingsPage, goBackSettingsPage, closeSettings, settingsBucketHistory, setSettingsBucketHistory, detailsView, setDetailsView, editingItem, initialCashBalance, setInitialCashBalance, initialBankBalance, setInitialBankBalance, savingsBuckets, setSavingsBuckets, bucketListTrackers, setBucketListTrackers, updateBucketListTrackerCategoryLinks, sharedRolloverJarBalance, setSharedRolloverJarBalance, monthlyResetDay, setMonthlyResetDay, currency, setCurrency, dailyReminderEnabled, setDailyReminderEnabled, dailyReminderTime, setDailyReminderTime, dailyReminderTone, setDailyReminderTone, incomeSources, setIncomeSources, updateIncomeSource, addIncomeSourceSetting, removeIncomeSourceSetting, incomeType, incomeSource, incomeRate, setIncomeRate, incomeHours, setIncomeHours, incomeAmount, setIncomeAmount, incomeCashReceived, setIncomeCashReceived, incomeDate, setIncomeDate, incomeNotes, setIncomeNotes, expenseAmount, setExpenseAmount, expenseCategory, setExpenseCategory, expenseAccount, setExpenseAccount, expensePaymentMethod, setExpensePaymentMethod, expenseCashPortion, setExpenseCashPortion, expenseDate, setExpenseDate, expenseNotes, setExpenseNotes, expenseIsRecurring, setExpenseIsRecurring, expenseRecurringFrequency, setExpenseRecurringFrequency, expenseRecurringEndDate, setExpenseRecurringEndDate, expenseCategories, setExpenseCategories, newExpenseCategory, setNewExpenseCategory, statisticsMode, setStatisticsMode, statisticsPeriod, setStatisticsPeriod, statisticsStartDate, setStatisticsStartDate, statisticsEndDate, setStatisticsEndDate, timeGrouping, setTimeGrouping, fromBucket, setFromBucket, toBucket, setToBucket, transferAmount, setTransferAmount, transferDate, setTransferDate, transferNotes, setTransferNotes, transferTrackerId, setTransferTrackerId, moneyName, setMoneyName, moneyAmount, setMoneyAmount, moneyDate, setMoneyDate, moneyPhone, setMoneyPhone, moneyNotes, setMoneyNotes, moneyStatus, setMoneyStatus, moneyAccount, setMoneyAccount, borrowedAffectsAccountBalance, setBorrowedAffectsAccountBalance, lentAffectsAccountBalance, setLentAffectsAccountBalance, lendingPersonMode, setLendingPersonMode, selectedPersonId, setSelectedPersonId, personSearch, setPersonSearch, settlementProfileId, settlementAmount, setSettlementAmount, settlementAccount, setSettlementAccount, settlementDate, setSettlementDate, settlementNotes, setSettlementNotes, ...liabilityModule, ...dashboardValues, currencySymbol: currencySymbolFor(currency), toNumber, closeAllForms, handleIncomeTypeChange, handleIncomeSourceChange, saveSettings, addIncome, addExpense, addTransfer, addLent, addBorrowed, openSettlement, saveSettlement, deleteSettlement, deleteLendingTransaction, updateLendingTransaction, deleteIncome, deleteExpense, deleteFullLiability, updateRecurringExpenseStatus, deleteTransfer, deleteLent, deleteBorrowed, startEdit, unlockApp, addExpenseCategory, lockApp() { localStorage.removeItem("finance_unlocked_at"); localStorage.removeItem("finance_locked_until"); localStorage.removeItem("finance_current_user"); setIsUnlocked(false); setPasscodeInput(""); setPasscodeError(""); setSettingsBucketHistory(null); closeSettings(); }, handleResetAllData, remittances, showRemittanceForm, setShowRemittanceForm, remittanceAudAmount, setRemittanceAudAmount, remittanceExchangeRate, setRemittanceExchangeRate, remittanceAccount, setRemittanceAccount, remittanceDate, setRemittanceDate, remittanceProvider, setRemittanceProvider, remittanceNotes, setRemittanceNotes, remittanceIsPreExisting, setRemittanceIsPreExisting, remittanceChargesAud, setRemittanceChargesAud, remittanceTaxAud, setRemittanceTaxAud, addRemittance, deleteRemittance, appNotifications, showNotificationPanel, setShowNotificationPanel, markNotificationRead, markAllNotificationsRead, deleteNotification, clearAllNotifications };
}

export type FinanceDashboardState = ReturnType<typeof useFinanceDashboard>;
