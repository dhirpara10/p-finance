"use client";

import { useEffect, useRef, useState } from "react";
import { categoryIdFromName, defaultBucketListTrackers, defaultSavingsBuckets, findDuplicateTrackerCategory, getBucketLabel, normalizeBucketId, normalizeSavingsBuckets, normalizeTrackerLinks, parseJsonArray } from "@/lib/buckets";
import { calculateDashboardValues, getToday, toNumber } from "@/lib/calculations";
import { findPersonByName } from "@/lib/lending";
import { addLendingTransaction, addPerson, deleteFromSheet, getAllData, saveSetting, saveToSheet, updateSheetRow } from "@/lib/sheetsApi";
import type { Bucket, BucketListTracker, EditingItemType, Expense, ExpenseAccount, Income, IncomeType, LendingTransactionRecord, MoneyRecord, Person, RecentActivityItem, SavingsBucket, Status, Transfer, IncomeSourceRate } from "@/lib/types";
import { useLiabilities } from "@/components/liabilities/useLiabilities";



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
  const [loadError, setLoadError] = useState("");

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [appPasscode, setAppPasscode] = useState("2605");
  const [newPasscode, setNewPasscode] = useState("");

  const [incomes, setIncomes] = useState<Income[]>([]);
  const [incomeCashReceived, setIncomeCashReceived] = useState("");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [lendingTransactions, setLendingTransactions] = useState<LendingTransactionRecord[]>([]);
  const [lentRecords, setLentRecords] = useState<MoneyRecord[]>([]);
  const [borrowedRecords, setBorrowedRecords] = useState<MoneyRecord[]>([]);

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
    useState(false);
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
    setBorrowedAffectsAccountBalance(false);
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
    setEditingItem(null);
    setShowIncomeForm(false);
    setShowExpenseForm(false);
    setShowTransferForm(false);
    setShowLentForm(false);
    setShowBorrowedForm(false);
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
        date: String(date || ""),
        notes: String(notes || ""),
        isRecurring: Boolean(recurring.isRecurring),
        recurringFrequency: recurring.recurringFrequency,
        recurringStartDate: recurring.recurringStartDate,
        recurringEndDate: recurring.recurringEndDate,
        recurringStatus: recurring.recurringStatus,
        createdAt: String(recurring.createdAt || ""),
        updatedAt: recurring.updatedAt,
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
      date: String(item?.date || ""),
      notes: String(item?.notes || ""),
      isRecurring: Boolean(item?.isRecurring),
      recurringFrequency: item?.recurringFrequency,
      recurringStartDate: String(item?.recurringStartDate || item?.date || ""),
      recurringEndDate: String(item?.recurringEndDate || ""),
      recurringStatus: item?.recurringStatus || (item?.isRecurring ? "active" : undefined),
      createdAt: String(item?.createdAt || ""),
      updatedAt: item?.updatedAt,
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
    if (value === "AUD" || value === "USD" || value === "CAD") return "$";
    if (value === "GBP") return "GBP ";
    if (value === "EUR") return "EUR ";
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
    setLoading(true);
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
          [],
        Liabilities:
          sheetDataRaw.Liabilities ||
          sheetDataRaw.liabilities ||
          [],
        RepaymentSchedules:
          sheetDataRaw.RepaymentSchedules ||
          sheetDataRaw.repaymentSchedules ||
          [],
      };

      console.log("sheetData keys", Object.keys(sheetDataRaw));
      console.log("People", sheetData.People);
      console.log("LendingTransactions", sheetData.LendingTransactions);

      const settings = sheetData.settings || [];

      console.log("loaded settings", settings);

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
      setEmergencyGoal(toNumber(getSettingValue(settings, "emergency_goal", "0")));
      setDebtRepaymentGoal(
        toNumber(getSettingValue(settings, "debt_repayment_goal", "0"))
      );
      setRemittanceGoal(toNumber(getSettingValue(settings, "remittance_goal", "0")));
      const loadedSavingsBuckets = parseJsonArray<SavingsBucket>(
        getSettingValue(settings, "savings_buckets", "[]"),
        []
      );
      const legacyEmergencyGoal = toNumber(
        getSettingValue(settings, "emergency_goal", "0")
      );
      const legacyDebtGoal = toNumber(
        getSettingValue(settings, "debt_repayment_goal", "0")
      );
      const legacyRemittanceGoal = toNumber(
        getSettingValue(settings, "remittance_goal", "0")
      );
      setSavingsBuckets(
        loadedSavingsBuckets.length
          ? normalizeSavingsBuckets(loadedSavingsBuckets)
          : defaultSavingsBuckets.map((bucket) => {
              if (bucket.id === "savings_emergency_fund") {
                return { ...bucket, targetAmount: legacyEmergencyGoal };
              }
              if (bucket.id === "savings_debt_collection") {
                return { ...bucket, targetAmount: legacyDebtGoal };
              }
              if (bucket.id === "savings_remittance") {
                return { ...bucket, targetAmount: legacyRemittanceGoal };
              }
              return bucket;
            })
      );
      setBucketListTrackers(
        normalizeTrackerLinks(
          parseJsonArray<BucketListTracker>(
            getSettingValue(settings, "bucket_list_trackers", "[]"),
            defaultBucketListTrackers
          )
        )
      );
      setSharedRolloverJarBalance(
        toNumber(getSettingValue(settings, "shared_rollover_jar_balance", "0"))
      );
      setMonthlyResetDay(
        Math.min(
          Math.max(toNumber(getSettingValue(settings, "monthly_reset_day", "1")), 1),
          28
        )
      );
      setCurrency(getSettingValue(settings, "currency", "AUD"));
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

      const loadedExpenseCategories = parseExpenseCategories(
        getSettingValue(
          settings,
          "expense_categories",
          JSON.stringify(defaultExpenseCategories)
        )
      );
      setExpenseCategories(loadedExpenseCategories);
      if (!loadedExpenseCategories.some((cat) => cat === expenseCategory)) {
        setExpenseCategory(loadedExpenseCategories[0] || "Food");
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
        )
      );
      await liabilityModule.processDueBnplRepayments(
        hydratedLiabilities.liabilities,
        hydratedLiabilities.repaymentSchedules
      );

     const cleanIncomes = (sheetData.income || [])
  .map(parseIncomeRow)
  .filter(isValidIncomeRow);

const cleanExpenses = (sheetData.expenses || [])
  .map(parseExpenseRow)
  .filter(isValidExpenseRow);

const cleanTransfers = (sheetData.transfers || [])
  .map(parseTransferRow)
  .filter(isValidTransferRow);

setIncomes(cleanIncomes);
setExpenses(cleanExpenses);
setTransfers(cleanTransfers);

      setLentRecords((sheetData.lent || []).map(parseMoneyRecordRow));

      setBorrowedRecords((sheetData.borrowed || []).map(parseMoneyRecordRow));

      setPeople(
        (sheetData.People || []).map((item: any) => ({
          id: getSheetId(item.id) || "",
          name: String(item.name || ""),
          phone: String(item.phone || ""),
          createdAt: String(item.createdAt || ""),
          updatedAt: String(item.updatedAt || ""),
        }))
      );

      setLendingTransactions(
        (sheetData.LendingTransactions || []).map((item: any) => ({
          id: getSheetId(item.id) || "",
          personId: getSheetId(item.personId) || "",
          type:
            item.type === "borrowed" || item.type === "settlement"
              ? item.type
              : "lent",
          amount: toNumber(item.amount),
          account: item.account === "Cash" ? "Cash" : "Bank",
          affectsAccountBalance:
            item.affectsAccountBalance === true ||
            item.affectsAccountBalance === "true",
          date: String(item.date || ""),
          note: String(item.note || ""),
          createdAt: String(item.createdAt || ""),
        }))
      );
      hasLoadedData.current = true;
    } catch (error: any) {
      setLoadError(error.message || "Failed to load data from Google Sheets.");
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  useEffect(() => {
    const savedPasscode = localStorage.getItem("finance_app_passcode");

    if (savedPasscode) {
      setAppPasscode(savedPasscode);
    }

    localStorage.removeItem("finance_unlocked");
    localStorage.removeItem("finance_locked_until");

    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (authReady && isUnlocked && !hasLoadedData.current) {
      loadFromSheets();
    }
  }, [authReady, isUnlocked]);

  useEffect(() => {
    if (!isUnlocked) return;

    const timeoutId = window.setTimeout(() => {
      setIsUnlocked(false);
      setPasscodeInput("");
      setPasscodeError("");
      closeSettings();
    }, 5 * 60 * 1000);

    return () => window.clearTimeout(timeoutId);
  }, [isUnlocked]);

  const dashboardValues = calculateDashboardValues({
    incomes,
    expenses,
    transfers,
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
    sharedRolloverJarBalance,
    monthlyResetDay,
  });


  async function saveSettings() {
    const cleanIncomeSources = incomeSources
      .map((source) => ({
        name: source.name.trim(),
        rate: toNumber(source.rate),
      }))
      .filter((source) => source.name);

    if (!cleanIncomeSources.length) {
      alert("Add at least one income source.");
      return;
    }

    const results = await Promise.all([
      saveSetting("initial_cash_balance", initialCashBalance),
      saveSetting("initial_bank_balance", initialBankBalance),
      saveSetting("emergency_goal", emergencyGoal),
      saveSetting("debt_repayment_goal", debtRepaymentGoal),
      saveSetting("remittance_goal", remittanceGoal),
      saveSetting("savings_buckets", JSON.stringify(savingsBuckets)),
      saveSetting("bucket_list_trackers", JSON.stringify(bucketListTrackers)),
      saveSetting("shared_rollover_jar_balance", sharedRolloverJarBalance),
      saveSetting("monthly_reset_day", monthlyResetDay),
      saveSetting("currency", currency),
      saveSetting("income_sources", JSON.stringify(cleanIncomeSources)),
      saveSetting("expense_categories", JSON.stringify(expenseCategories)),
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
        alert("Passcode must be at least 4 digits.");
        return;
      }

      setAppPasscode(newPasscode);
      localStorage.setItem("finance_app_passcode", newPasscode);
      setNewPasscode("");
    }

    setIncomeSources(cleanIncomeSources);
    closeSettings();
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
      incomes.map((item) =>
        String(item.id) === String(newIncome.id) ? newIncome : item
      )
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
      type: "expense",
      amount: Number(expenseAmount),
      category: expenseCategory,
      categoryId: categoryIdFromName(expenseCategory),
      account: expenseAccount,
      date: expenseDate || getToday(),
      notes: expenseNotes,
      isRecurring: expenseIsRecurring,
      recurringFrequency: expenseIsRecurring
        ? expenseRecurringFrequency
        : undefined,
      recurringStartDate: expenseIsRecurring
        ? expenseDate || getToday()
        : undefined,
      recurringEndDate: expenseIsRecurring
        ? expenseRecurringEndDate || undefined
        : undefined,
      recurringStatus: expenseIsRecurring ? "active" : undefined,
      createdAt:
        editingItem?.type === "expense"
          ? expenses.find((item) => String(item.id) === String(editingItem.id))
              ?.createdAt || new Date().toISOString()
          : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const values = [
      newExpense.id,
      newExpense.amount,
      newExpense.category,
      newExpense.account,
      newExpense.date,
      newExpense.notes,
      {
        categoryId: newExpense.categoryId,
        isRecurring: newExpense.isRecurring,
        recurringFrequency: newExpense.recurringFrequency,
        recurringStartDate: newExpense.recurringStartDate,
        recurringEndDate: newExpense.recurringEndDate,
        recurringStatus: newExpense.recurringStatus,
        createdAt: newExpense.createdAt,
        updatedAt: newExpense.updatedAt,
      },
    ];

    const saved =
      editingItem?.type === "expense"
        ? await updateSheetRow("expenses", newExpense.id, values)
        : await saveToSheet("expenses", values);

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

    resetExpenseForm();
    setEditingItem(null);
    setShowExpenseForm(false);
  }

  async function addTransfer() {
    const amount = Number(transferAmount);
    if (!amount || amount <= 0) return;

    if (fromBucket === toBucket) {
      alert("From and To bucket cannot be same.");
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
    const previousTransfer =
      editingItem?.type === "transfer"
        ? transfers.find((item) => String(item.id) === String(editingItem.id))
        : null;
    const availableBalance =
      Number(sourceBalance || 0) +
      (previousTransfer && previousTransfer.from_bucket === fromBucket
        ? previousTransfer.amount
        : 0);

    if (amount > availableBalance) {
      alert(`Only ${currencySymbolFor(currency)}${availableBalance.toLocaleString()} is available in ${getBucketLabel(fromBucket, savingsBuckets)}.`);
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
    };

    const values = [
      newTransfer.id,
      newTransfer.from_bucket,
      newTransfer.to_bucket,
      newTransfer.amount,
      newTransfer.date,
      newTransfer.notes,
      { trackerId: newTransfer.trackerId || "" },
    ];

    const saved =
      editingItem?.type === "transfer"
        ? await updateSheetRow("transfers", newTransfer.id, values)
        : await saveToSheet("transfers", values);

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

    resetTransferForm();
    setEditingItem(null);
    setShowTransferForm(false);
  }

  async function ensurePerson(name: string, phone: string) {
    const cleanedName = name.trim().replace(/\s+/g, " ");
    const cleanedPhone = phone.trim();

    if (!cleanedName) {
      alert("Person name is required.");
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
      alert("Person profile is missing an id.");
      return null;
    }

    if (!validTypes.includes(type)) {
      alert("Invalid lending transaction type.");
      return null;
    }

    if (!amount || amount <= 0) {
      alert("Amount must be greater than 0.");
      return null;
    }

    const newTransaction: LendingTransactionRecord = {
      id: "",
      personId,
      type,
      amount,
      account: account || "Bank",
      affectsAccountBalance:
        type === "lent" || (type === "borrowed" && Boolean(affectsAccountBalance)),
      date,
      note,
      createdAt: new Date().toISOString(),
    };

    const payload = {
      personId: newTransaction.personId,
      type: newTransaction.type,
      amount: newTransaction.amount,
      account: newTransaction.account,
      affectsAccountBalance: newTransaction.affectsAccountBalance,
      date: newTransaction.date,
      note: newTransaction.note,
    };

    console.log("Final transaction payload:", payload);

    const saved = await addLendingTransaction(payload);

    if (!saved) return null;

    const transactionId = extractCreatedId(saved);

    if (!transactionId) {
      await loadFromSheets();
      return newTransaction;
    }

    const savedTransaction = {
      ...newTransaction,
      id: transactionId,
    };

    setLendingTransactions([savedTransaction, ...lendingTransactions]);
    return savedTransaction;
  }

  async function addMoneyTransaction(type: LendingTransactionRecord["type"]) {
    const amount = Number(moneyAmount);

    if (!amount || amount <= 0) {
      alert("Amount must be greater than 0.");
      return;
    }

    try {
      let person: Person | null = null;

      if (lendingPersonMode === "existing") {
        person = getSelectedPerson();

        if (!getPersonId(person)) {
          alert("Select an existing person profile.");
          return;
        }
      } else {
        const existing = findPersonByName(people, moneyName);

        if (existing) {
          alert("This person already exists. Select existing profile instead.");
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
        affectsAccountBalance: type === "borrowed" ? borrowedAffectsAccountBalance : true,
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
      alert(error.message || "Failed to save lending transaction.");
    }
  }

  async function addLent() {
    await addMoneyTransaction("lent");
  }

  async function addBorrowed() {
    await addMoneyTransaction("borrowed");
  }

  function openSettlement(profileId: string | number, amount?: number) {
    setSettlementProfileId(profileId);
    setSettlementAmount(amount ? String(amount) : "");
    setSettlementAccount("Bank");
    setSettlementDate(getToday());
    setSettlementNotes("");
  }

  async function saveSettlement() {
    const profile = dashboardValues.personProfiles.find(
      (item) => String(item.id) === String(settlementProfileId)
    );
    const amount = Number(settlementAmount);

    if (!profile || !amount || amount <= 0) return;

    const openBalance = Math.abs(profile.netBalance);
    if (openBalance > 0 && amount > openBalance) {
      alert("Settlement amount cannot be more than the open balance.");
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

    if (!saved) return;

    resetSettlementForm();
  }

  async function deleteSettlement(id: string | number) {
    if (!window.confirm("Delete this settlement?")) return;
    const deleted = await deleteFromSheet("LendingTransactions", id);
    if (!deleted) return;
    setLendingTransactions(
      lendingTransactions.filter((item) => String(item.id) !== String(id))
    );
  }

  async function deleteLendingTransaction(id: string | number) {
    if (!window.confirm("Delete this lending transaction?")) return;
    const deleted = await deleteFromSheet("LendingTransactions", id);
    if (!deleted) return;
    setLendingTransactions(
      lendingTransactions.filter((item) => String(item.id) !== String(id))
    );
  }

  async function deleteIncome(id: string | number) {
    if (!window.confirm("Delete this income transaction?")) return;
    const deleted = await deleteFromSheet("income", id);
    if (!deleted) return;
    setIncomes(incomes.filter((item) => String(item.id) !== String(id)));
  }

  async function deleteExpense(id: string | number) {
    if (!window.confirm("Delete this expense transaction?")) return;
    const deleted = await deleteFromSheet("expenses", id);
    if (!deleted) return;
    setExpenses(expenses.filter((item) => String(item.id) !== String(id)));
  }

  async function deleteTransfer(id: string | number) {
    if (!window.confirm("Delete this transfer?")) return;
    const deleted = await deleteFromSheet("transfers", id);
    if (!deleted) return;
    setTransfers(transfers.filter((item) => String(item.id) !== String(id)));
  }

  async function deleteLent(id: string | number) {
    if (!window.confirm("Delete this legacy lending record?")) return;
    const deleted = await deleteFromSheet("lent", id);
    if (!deleted) return;
    setLentRecords(lentRecords.filter((item) => String(item.id) !== String(id)));
  }

  async function deleteBorrowed(id: string | number) {
    if (!window.confirm("Delete this legacy borrowing record?")) return;
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

    if (item.type === "settlement" || item.source === "lendingTransaction") {
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
      const record = lentRecords.find(
        (x) => String(x.id) === String(item.id)
      );
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
      const record = borrowedRecords.find(
        (x) => String(x.id) === String(item.id)
      );
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
    if (passcodeInput === appPasscode) {
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
      alert("Category already exists.");
      return;
    }

    const nextCategories = [...expenseCategories, cleanName];

    const saved = await saveSetting(
      "expense_categories",
      JSON.stringify(nextCategories)
    );

    if (!saved) return;

    setExpenseCategories(nextCategories);
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
    const saved = await updateSheetRow("expenses", updated.id, [
      updated.id,
      updated.amount,
      updated.category,
      updated.account,
      updated.date,
      updated.notes,
      {
        categoryId: updated.categoryId,
        isRecurring: true,
        recurringFrequency: updated.recurringFrequency,
        recurringStartDate: updated.recurringStartDate,
        recurringEndDate: updated.recurringEndDate,
        recurringStatus: updated.recurringStatus,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
    ]);
    if (!saved) return;
    setExpenses(
      expenses.map((item) =>
        String(item.id) === String(id) ? updated : item
      )
    );
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
      alert(
        `This category is already linked to ${duplicate.owner.name}. Remove it there first.`
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


  return { authReady, loading, loadError, retryLoad: loadFromSheets, isUnlocked, passcodeInput, setPasscodeInput, passcodeError, setPasscodeError, newPasscode, setNewPasscode, incomes, expenses, transfers, people, lendingTransactions, lentRecords, borrowedRecords, showIncomeForm, setShowIncomeForm, showExpenseForm, setShowExpenseForm, showTransferForm, setShowTransferForm, showLentForm, setShowLentForm, showBorrowedForm, setShowBorrowedForm, settingsPage, settingsPageHistory, navigateToSettingsPage, goBackSettingsPage, closeSettings, settingsBucketHistory, setSettingsBucketHistory, detailsView, setDetailsView, editingItem, initialCashBalance, setInitialCashBalance, initialBankBalance, setInitialBankBalance, savingsBuckets, setSavingsBuckets, bucketListTrackers, setBucketListTrackers, updateBucketListTrackerCategoryLinks, sharedRolloverJarBalance, setSharedRolloverJarBalance, monthlyResetDay, setMonthlyResetDay, currency, setCurrency, dailyReminderEnabled, setDailyReminderEnabled, dailyReminderTime, setDailyReminderTime, dailyReminderTone, setDailyReminderTone, incomeSources, setIncomeSources, updateIncomeSource, addIncomeSourceSetting, removeIncomeSourceSetting, incomeType, incomeSource, incomeRate, setIncomeRate, incomeHours, setIncomeHours, incomeAmount, setIncomeAmount, incomeCashReceived, setIncomeCashReceived, incomeDate, setIncomeDate, incomeNotes, setIncomeNotes, expenseAmount, setExpenseAmount, expenseCategory, setExpenseCategory, expenseAccount, setExpenseAccount, expenseDate, setExpenseDate, expenseNotes, setExpenseNotes, expenseIsRecurring, setExpenseIsRecurring, expenseRecurringFrequency, setExpenseRecurringFrequency, expenseRecurringEndDate, setExpenseRecurringEndDate, expenseCategories, setExpenseCategories, newExpenseCategory, setNewExpenseCategory, statisticsMode, setStatisticsMode, statisticsPeriod, setStatisticsPeriod, statisticsStartDate, setStatisticsStartDate, statisticsEndDate, setStatisticsEndDate, timeGrouping, setTimeGrouping, fromBucket, setFromBucket, toBucket, setToBucket, transferAmount, setTransferAmount, transferDate, setTransferDate, transferNotes, setTransferNotes, transferTrackerId, setTransferTrackerId, moneyName, setMoneyName, moneyAmount, setMoneyAmount, moneyDate, setMoneyDate, moneyPhone, setMoneyPhone, moneyNotes, setMoneyNotes, moneyStatus, setMoneyStatus, moneyAccount, setMoneyAccount, borrowedAffectsAccountBalance, setBorrowedAffectsAccountBalance, lendingPersonMode, setLendingPersonMode, selectedPersonId, setSelectedPersonId, personSearch, setPersonSearch, settlementProfileId, settlementAmount, setSettlementAmount, settlementAccount, setSettlementAccount, settlementDate, setSettlementDate, settlementNotes, setSettlementNotes, ...liabilityModule, ...dashboardValues, currencySymbol: currencySymbolFor(currency), toNumber, closeAllForms, handleIncomeTypeChange, handleIncomeSourceChange, saveSettings, addIncome, addExpense, addTransfer, addLent, addBorrowed, openSettlement, saveSettlement, deleteSettlement, deleteLendingTransaction, deleteIncome, deleteExpense, updateRecurringExpenseStatus, deleteTransfer, deleteLent, deleteBorrowed, startEdit, unlockApp, addExpenseCategory, lockApp() { localStorage.removeItem("finance_unlocked"); localStorage.removeItem("finance_locked_until"); setIsUnlocked(false); setPasscodeInput(""); setPasscodeError(""); setSettingsBucketHistory(null); closeSettings(); } };
}

export type FinanceDashboardState = ReturnType<typeof useFinanceDashboard>;
