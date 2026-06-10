import {
  bucketMatches,
  defaultBucketListTrackers,
  defaultSavingsBuckets,
  expenseCategoryId,
  getBucketLabel,
  normalizeCategoryId,
} from "@/lib/buckets";
import { buildPersonProfiles } from "@/lib/lending";
import { expandExpensesForRange, getUpcomingRecurringExpenses } from "@/lib/recurring";
import type { Bucket, BucketListTracker, Expense, Income, LendingTransactionRecord, Liability, MoneyRecord, Person, RecentActivityItem, RepaymentSchedule, SavingsBucket, Transfer } from "@/lib/types";

export function toNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function isCurrentMonth(dateString: string, resetDay = 1) {
  const date = new Date(dateString);
  const now = new Date();
  const safeResetDay = Math.min(Math.max(resetDay, 1), 28);
  const periodStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    safeResetDay
  );

  if (now.getDate() < safeResetDay) {
    periodStart.setMonth(periodStart.getMonth() - 1);
  }

  const nextPeriodStart = new Date(periodStart);
  nextPeriodStart.setMonth(nextPeriodStart.getMonth() + 1);

  return date >= periodStart && date < nextPeriodStart;
}

export function getProgress(current: number, goal: number) {
  if (!goal || goal <= 0) return 0;
  return Math.min((current / goal) * 100, 100);
}

export function getToday() {
  return new Date().toISOString().split("T")[0];
}

export function getStatisticsDateRange({
  period,
  customStartDate,
  customEndDate,
}: {
  period: "1M" | "2M" | "3M" | "6M" | "12M" | "LIFETIME" | "CUSTOM";
  customStartDate?: string;
  customEndDate?: string;
}) {
  const now = new Date();
  let startDate: Date | null = new Date();
  let endDate = new Date();

  if (period === "1M") startDate.setMonth(startDate.getMonth() - 1);
  if (period === "2M") startDate.setMonth(startDate.getMonth() - 2);
  if (period === "3M") startDate.setMonth(startDate.getMonth() - 3);
  if (period === "6M") startDate.setMonth(startDate.getMonth() - 6);
  if (period === "12M") startDate.setMonth(startDate.getMonth() - 12);

  if (period === "LIFETIME") {
    startDate = null;
  }

  if (period === "CUSTOM") {
    startDate = customStartDate ? new Date(customStartDate) : null;
    endDate = customEndDate ? new Date(customEndDate) : now;
  }

  return { startDate, endDate };
}

export function getCategoryWiseSpend({
  expenses,
  period,
  customStartDate,
  customEndDate,
}: {
  expenses: Expense[];
  period: "1M" | "2M" | "3M" | "6M" | "12M" | "LIFETIME" | "CUSTOM";
  customStartDate?: string;
  customEndDate?: string;
}) {
  const { startDate, endDate } = getStatisticsDateRange({
    period,
    customStartDate,
    customEndDate,
  });

  const filteredExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);

    if (Number.isNaN(expenseDate.getTime())) return false;
    if (startDate && expenseDate < startDate) return false;
    if (endDate && expenseDate > endDate) return false;

    return true;
  });

  const grouped = filteredExpenses.reduce((acc, expense) => {
    const category = expense.category || "Uncategorized";
    acc[category] = (acc[category] || 0) + toNumber(expense.amount);
    return acc;
  }, {} as Record<string, number>);

  const total = Object.values(grouped).reduce((sum, amount) => sum + amount, 0);

  return Object.entries(grouped)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function getTimeWiseSpend({
  expenses,
  period,
  grouping,
  customStartDate,
  customEndDate,
}: {
  expenses: Expense[];
  period: "1M" | "2M" | "3M" | "6M" | "12M" | "LIFETIME" | "CUSTOM";
  grouping: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  customStartDate?: string;
  customEndDate?: string;
}) {
  const { startDate, endDate } = getStatisticsDateRange({
    period,
    customStartDate,
    customEndDate,
  });

  function getWeekNumber(date: Date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;

    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  function getLabel(date: Date) {
    if (grouping === "DAILY") {
      return date.toISOString().split("T")[0];
    }

    if (grouping === "WEEKLY") {
      return `Week ${getWeekNumber(date)}, ${date.getFullYear()}`;
    }

    if (grouping === "MONTHLY") {
      return date.toLocaleString(undefined, {
        month: "short",
        year: "numeric",
      });
    }

    return String(date.getFullYear());
  }

  const filteredExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);

    if (Number.isNaN(expenseDate.getTime())) return false;
    if (startDate && expenseDate < startDate) return false;
    if (endDate && expenseDate > endDate) return false;

    return true;
  });

  const grouped = filteredExpenses.reduce((acc, expense) => {
    const expenseDate = new Date(expense.date);
    const label = getLabel(expenseDate);

    if (!acc[label]) {
      acc[label] = {
        label,
        amount: 0,
        sortTime: expenseDate.getTime(),
      } as { label: string; amount: number; sortTime: number };
    }

    acc[label].amount += toNumber(expense.amount);
    // Keep earliest sortTime for ordering
    acc[label].sortTime = Math.min(acc[label].sortTime, expenseDate.getTime());

    return acc;
  }, {} as Record<string, { label: string; amount: number; sortTime: number }>);

  const total = Object.values(grouped).reduce((sum, item) => sum + item.amount, 0);

  return Object.values(grouped)
    .map((item) => ({
      label: item.label,
      amount: item.amount,
      percentage: total > 0 ? (item.amount / total) * 100 : 0,
      sortTime: item.sortTime,
    }))
    .sort((a, b) => a.sortTime - b.sortTime);
}

function getActivityTime(dateString: string) {
  const time = new Date(dateString).getTime();
  return Number.isFinite(time) ? time : 0;
}

function compareActivityIds(a: string | number, b: string | number) {
  const first = Number(a);
  const second = Number(b);

  if (Number.isFinite(first) && Number.isFinite(second)) {
    return first - second;
  }

  return String(a).localeCompare(String(b));
}

function isBankAccount(value: unknown) {
  return value === "Bank" || value === "Usable Balance";
}

function isBucket(value: unknown, bucket: Bucket | SavingsBucket) {
  if (bucket === "Bank") return isBankAccount(value);
  return bucketMatches(value, bucket);
}

function getSettlementAccountMovement(
  lendingTransactions: LendingTransactionRecord[]
) {
  const totals = {
    bankIn: 0,
    bankOut: 0,
    cashIn: 0,
    cashOut: 0,
  };
  const transactionsByPerson = new Map<string, LendingTransactionRecord[]>();

  lendingTransactions.forEach((transaction) => {
    const key = String(transaction.personId);
    const transactions = transactionsByPerson.get(key) || [];
    transactions.push(transaction);
    transactionsByPerson.set(key, transactions);
  });

  transactionsByPerson.forEach((transactions) => {
    let balance = 0;
    [...transactions]
      .sort(
        (a, b) =>
          getActivityTime(a.date) - getActivityTime(b.date) ||
          compareActivityIds(a.id, b.id)
      )
      .forEach((transaction) => {
        if (transaction.type === "lent") {
          balance += transaction.amount;
          return;
        }

        if (transaction.type === "borrowed") {
          balance -= transaction.amount;
          return;
        }

        const cashAccount = transaction.account === "Cash";
        if (balance > 0) {
          totals[cashAccount ? "cashIn" : "bankIn"] += transaction.amount;
          balance = Math.max(0, balance - transaction.amount);
        } else if (balance < 0) {
          totals[cashAccount ? "cashOut" : "bankOut"] += transaction.amount;
          balance = Math.min(0, balance + transaction.amount);
        }
      });
  });

  return totals;
}

function analyticsMonthKey(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
  return {
    key,
    label: date.toLocaleString("en-AU", {
      month: "short",
      year: "2-digit",
    }),
    sort: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
  };
}

export function buildFinancialAnalytics({
  incomes,
  expenses,
  transfers,
  repaymentSchedules,
  trackerLinkedCategoryIds,
  currentNetWorth,
}: {
  incomes: Income[];
  expenses: Expense[];
  transfers: Transfer[];
  repaymentSchedules: RepaymentSchedule[];
  trackerLinkedCategoryIds: Set<string>;
  currentNetWorth: number;
}) {
  const grouped = new Map<
    string,
    {
      key: string;
      month: string;
      sort: number;
      income: number;
      expenses: number;
      trackedSpending: number;
      hours: number;
      financeCosts: number;
      jarInflow: number;
      jarWithdrawals: number;
    }
  >();

  function rowFor(dateString: string) {
    const month = analyticsMonthKey(dateString);
    if (!month) return null;
    const existing = grouped.get(month.key);
    if (existing) return existing;
    const row = {
      key: month.key,
      month: month.label,
      sort: month.sort,
      income: 0,
      expenses: 0,
      trackedSpending: 0,
      hours: 0,
      financeCosts: 0,
      jarInflow: 0,
      jarWithdrawals: 0,
    };
    grouped.set(month.key, row);
    return row;
  }

  incomes.forEach((income) => {
    const row = rowFor(income.date);
    if (!row) return;
    row.income += income.amount;
    row.hours += income.hours;
  });

  expenses.forEach((expense) => {
    const row = rowFor(expense.date);
    if (!row) return;
    row.expenses += expense.amount;
    if (trackerLinkedCategoryIds.has(expenseCategoryId(expense))) {
      row.trackedSpending += expense.amount;
    }
  });

  transfers.forEach((transfer) => {
    const row = rowFor(transfer.date);
    if (!row) return;
    if (transfer.to_bucket === "shared_rollover_jar") {
      row.jarInflow += transfer.amount;
    }
    if (transfer.from_bucket === "shared_rollover_jar") {
      row.jarWithdrawals += transfer.amount;
    }
  });

  repaymentSchedules
    .filter((schedule) => schedule.status === "paid")
    .forEach((schedule) => {
      const row = rowFor(schedule.paidDate || schedule.dueDate);
      if (!row) return;
      row.financeCosts += schedule.interestAmount + schedule.feeAmount;
    });

  const baseRows = [...grouped.values()]
    .sort((a, b) => a.sort - b.sort)
    .slice(-12);
  const rows = baseRows.length
    ? baseRows
    : [
        {
          key: analyticsMonthKey(getToday())?.key || "current",
          month: analyticsMonthKey(getToday())?.label || "Current",
          sort: Date.now(),
          income: 0,
          expenses: 0,
          trackedSpending: 0,
          hours: 0,
          financeCosts: 0,
          jarInflow: 0,
          jarWithdrawals: 0,
        },
      ];
  const cumulativeMovement = rows.reduce(
    (sum, row) => sum + row.income - row.expenses - row.financeCosts,
    0
  );
  const openingNetWorth = currentNetWorth - cumulativeMovement;
  const monthly = rows.map((row, index) => ({
    ...row,
    remaining: row.income - row.expenses - row.financeCosts,
    netWorth:
      openingNetWorth +
      rows
        .slice(0, index + 1)
        .reduce(
          (sum, item) =>
            sum + item.income - item.expenses - item.financeCosts,
          0
        ),
  }));

  const categoryMap = new Map<string, number>();
  expenses.forEach((expense) => {
    const category = expense.category.trim() || "Uncategorized";
    categoryMap.set(
      category,
      (categoryMap.get(category) || 0) + expense.amount
    );
  });

  return {
    monthly,
    categories: [...categoryMap.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6),
  };
}

export function calculateDashboardValues({ incomes, expenses, transfers, people, lendingTransactions, lentRecords, borrowedRecords, liabilities = [], repaymentSchedules = [], initialCashBalance, initialBankBalance, savingsBuckets = defaultSavingsBuckets, bucketListTrackers = defaultBucketListTrackers, sharedRolloverJarBalance = 0, monthlyResetDay }: { incomes: Income[]; expenses: Expense[]; transfers: Transfer[]; people: Person[]; lendingTransactions: LendingTransactionRecord[]; lentRecords: MoneyRecord[]; borrowedRecords: MoneyRecord[]; liabilities?: Liability[]; repaymentSchedules?: RepaymentSchedule[]; initialCashBalance: number; initialBankBalance: number; savingsBuckets?: SavingsBucket[]; bucketListTrackers?: BucketListTracker[]; sharedRolloverJarBalance?: number; monthlyResetDay: number; }) {
  const expenseRangeStart = new Date();
  expenseRangeStart.setFullYear(expenseRangeStart.getFullYear() - 3);
  const expenseRangeEnd = new Date();
  expenseRangeEnd.setFullYear(expenseRangeEnd.getFullYear() + 1);
  const effectiveExpenses = expandExpensesForRange(
    expenses,
    expenseRangeStart,
    expenseRangeEnd
  );
  const personProfiles = buildPersonProfiles({
    people,
    lendingTransactions,
    legacyLentRecords: lentRecords,
    legacyBorrowedRecords: borrowedRecords,
  });
  const activeLent = personProfiles.reduce(
    (sum, profile) => sum + Math.max(profile.netBalance, 0),
    0
  );
  const activeBorrowed = personProfiles.reduce(
    (sum, profile) => sum + Math.max(-profile.netBalance, 0),
    0
  );
  const totalIncomeAll = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalCashReceivedFromIncome = incomes.reduce((sum, item) => sum + item.cash_received, 0);
  const totalUsableIncome = totalIncomeAll - totalCashReceivedFromIncome;
  const expenseFromBank = effectiveExpenses.filter((item) => isBankAccount(item.account) && new Date(item.date) <= new Date()).reduce((sum, item) => sum + item.amount, 0);
  const expenseFromCash = effectiveExpenses.filter((item) => item.account === "Cash" && new Date(item.date) <= new Date()).reduce((sum, item) => sum + item.amount, 0);
  const lentFromBank = lendingTransactions
    .filter((item) => item.type === "lent" && item.account !== "Cash")
    .reduce((sum, item) => sum + item.amount, 0);
  const lentFromCash = lendingTransactions
    .filter((item) => item.type === "lent" && item.account === "Cash")
    .reduce((sum, item) => sum + item.amount, 0);
  const borrowedToBank = lendingTransactions
    .filter(
      (item) =>
        item.type === "borrowed" &&
        item.affectsAccountBalance &&
        item.account !== "Cash"
    )
    .reduce((sum, item) => sum + item.amount, 0);
  const borrowedToCash = lendingTransactions
    .filter(
      (item) =>
        item.type === "borrowed" &&
        item.affectsAccountBalance &&
        item.account === "Cash"
    )
    .reduce((sum, item) => sum + item.amount, 0);
  const settlementMovement = getSettlementAccountMovement(lendingTransactions);
  const paidLiabilityRepayments = repaymentSchedules
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + item.amount, 0);
  const activeLiabilities = liabilities.filter(
    (item) => item.status === "active" && item.outstandingBalance > 0
  );
  const totalLiabilities = activeLiabilities.reduce(
    (sum, item) => sum + item.outstandingBalance,
    0
  );
  const bnplOwed = activeLiabilities
    .filter((item) => item.type === "bnpl")
    .reduce((sum, item) => sum + item.outstandingBalance, 0);
  const creditCardOwed = activeLiabilities
    .filter((item) => item.type === "credit_card")
    .reduce((sum, item) => sum + item.outstandingBalance, 0);
  const loanOwed = activeLiabilities
    .filter((item) => item.type === "loan")
    .reduce((sum, item) => sum + item.outstandingBalance, 0);
  const unpaidSchedules = repaymentSchedules.filter(
    (item) => item.status !== "paid"
  );
  const upcomingRepayments = unpaidSchedules.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const obligationCutoff = new Date();
  obligationCutoff.setDate(obligationCutoff.getDate() + 30);
  const upcomingLoanCommitment = unpaidSchedules
    .filter((schedule) => {
      const liability = activeLiabilities.find(
        (item) => item.id === schedule.liabilityId
      );
      const dueDate = new Date(`${schedule.dueDate}T23:59:59`);
      return (
        liability?.type === "loan" &&
        !Number.isNaN(dueDate.getTime()) &&
        dueDate <= obligationCutoff
      );
    })
    .reduce((sum, item) => sum + item.amount, 0);

  function bucketIn(bucket: Bucket | SavingsBucket) {
    return transfers
      .filter((item) => isBucket(item.to_bucket, bucket))
      .reduce((sum, item) => sum + item.amount, 0);
  }

  function bucketOut(bucket: Bucket | SavingsBucket) {
    return transfers
      .filter((item) => isBucket(item.from_bucket, bucket))
      .reduce((sum, item) => sum + item.amount, 0);
  }

  const bankBalance =
    initialBankBalance +
    totalUsableIncome +
    borrowedToBank +
    settlementMovement.bankIn -
    lentFromBank -
    expenseFromBank -
    paidLiabilityRepayments -
    settlementMovement.bankOut -
    bucketOut("Bank") +
    bucketIn("Bank");
  const savingsBucketBalances = savingsBuckets.map((bucket) => {
    const currentBalance =
      toNumber(bucket.currentBalance) + bucketIn(bucket) - bucketOut(bucket);

    return {
      ...bucket,
      currentBalance,
      progress: getProgress(currentBalance, bucket.targetAmount),
    };
  });
  const totalSavingsBuckets = savingsBucketBalances.reduce(
    (sum, bucket) => sum + bucket.currentBalance,
    0
  );
  const cashBalance =
    initialCashBalance +
    totalCashReceivedFromIncome +
    borrowedToCash +
    settlementMovement.cashIn -
    lentFromCash -
    settlementMovement.cashOut +
    bucketIn("Cash") -
    bucketOut("Cash") -
    expenseFromCash;
  const accountBalance = bankBalance + cashBalance;
  const usableBalance = accountBalance - bnplOwed - creditCardOwed;
  const safeToSpend = usableBalance - upcomingLoanCommitment;
  const monthlyIncome = incomes.filter((item) => isCurrentMonth(item.date, monthlyResetDay)).reduce((sum, item) => sum + item.amount, 0);
  const monthlyHours = incomes.filter((item) => item.income_type === "Hourly" && isCurrentMonth(item.date, monthlyResetDay)).reduce((sum, item) => sum + item.hours, 0);
  const monthlyExpenses = effectiveExpenses.filter((item) => isCurrentMonth(item.date, monthlyResetDay)).reduce((sum, item) => sum + item.amount, 0);
  const thisMonthExpenses = effectiveExpenses.filter((item) => isCurrentMonth(item.date, monthlyResetDay));
  const spendThisMonth = thisMonthExpenses.reduce((sum, item) => sum + item.amount, 0);
  const spendTransferCount = thisMonthExpenses.length;
  const remaining = monthlyIncome - monthlyExpenses;
  const emergencyBucket = savingsBucketBalances.find(
    (bucket) => bucket.id === "savings_emergency_fund"
  );
  const debtCollectionBucket = savingsBucketBalances.find(
    (bucket) => bucket.id === "savings_debt_collection"
  );
  const remittanceBucket = savingsBucketBalances.find(
    (bucket) => bucket.id === "savings_remittance"
  );
  const activeTrackers = bucketListTrackers.filter((tracker) => tracker.active);
  function monthlyAllocationForTracker(tracker: BucketListTracker) {
    const allocation = tracker.recurringAllocation;
    if (!allocation?.active || allocation.allocationAmount <= 0) {
      return tracker.monthlyBudget;
    }

    if (allocation.frequency === "weekly") {
      return allocation.allocationAmount * 52 / 12;
    }
    if (allocation.frequency === "biweekly") {
      return allocation.allocationAmount * 26 / 12;
    }
    if (allocation.frequency === "yearly") {
      return allocation.allocationAmount / 12;
    }
    return allocation.allocationAmount;
  }
  const totalMonthlyTrackerAllocation = activeTrackers.reduce(
    (sum, tracker) => sum + monthlyAllocationForTracker(tracker),
    0
  );
  const trackerSummaries = activeTrackers.map((tracker) => {
    const linkedIds = new Set(
      tracker.linkedCategoryIds.map(normalizeCategoryId)
    );
    const trackerExpenses = thisMonthExpenses.filter((expense) =>
      linkedIds.has(expenseCategoryId(expense))
    );
    const spentThisMonth = trackerExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    return {
      ...tracker,
      spentThisMonth,
      remainingThisMonth: tracker.monthlyBudget - spentThisMonth,
      progress: getProgress(spentThisMonth, tracker.monthlyBudget),
      status:
        spentThisMonth > tracker.monthlyBudget
          ? "Overspent"
          : spentThisMonth >= tracker.monthlyBudget * 0.8
            ? "Near Limit"
            : "On Track",
      monthlyAllocation: monthlyAllocationForTracker(tracker),
    };
  });
  const trackerLinkedCategoryIds = new Set(
    activeTrackers.flatMap((tracker) =>
      tracker.linkedCategoryIds.map(normalizeCategoryId)
    )
  );
  const today = new Date();
  const manualJarAllocations = transfers
    .filter((transfer) => transfer.to_bucket === "shared_rollover_jar")
    .reduce((sum, transfer) => sum + transfer.amount, 0);
  const monthlyJarAllocations = transfers
    .filter(
      (transfer) =>
        transfer.to_bucket === "shared_rollover_jar" &&
        isCurrentMonth(transfer.date, monthlyResetDay)
    )
    .reduce((sum, transfer) => sum + transfer.amount, 0);
  const manualJarWithdrawals = transfers
    .filter((transfer) => transfer.from_bucket === "shared_rollover_jar")
    .reduce((sum, transfer) => sum + transfer.amount, 0);
  const monthlyJarWithdrawals = transfers
    .filter(
      (transfer) =>
        transfer.from_bucket === "shared_rollover_jar" &&
        isCurrentMonth(transfer.date, monthlyResetDay)
    )
    .reduce((sum, transfer) => sum + transfer.amount, 0);
  const sharedJarStoredBalance =
    sharedRolloverJarBalance + manualJarAllocations - manualJarWithdrawals;
  const totalMoney =
    accountBalance + totalSavingsBuckets + sharedJarStoredBalance;
  const netWorth =
    totalMoney + activeLent - activeBorrowed - totalLiabilities;
  const totalTrackedSpending = effectiveExpenses
    .filter(
      (expense) =>
        new Date(expense.date) <= today &&
        trackerLinkedCategoryIds.has(expenseCategoryId(expense))
    )
    .reduce((sum, expense) => sum + expense.amount, 0);
  const sharedJarSpentThisMonth = thisMonthExpenses
    .filter((expense) =>
      trackerLinkedCategoryIds.has(expenseCategoryId(expense))
    )
    .reduce((sum, expense) => sum + expense.amount, 0);
  const sharedJarMonthlyResult =
    monthlyJarAllocations -
    sharedJarSpentThisMonth -
    monthlyJarWithdrawals;
  const sharedRolloverJar = {
    previousBalance: sharedRolloverJarBalance,
    plannedMonthlyAllocation: totalMonthlyTrackerAllocation,
    monthlyAllocation: monthlyJarAllocations,
    spentThisMonth: sharedJarSpentThisMonth,
    withdrawalsThisMonth: monthlyJarWithdrawals,
    monthlyResult: sharedJarMonthlyResult,
    manualAllocations: manualJarAllocations,
    manualWithdrawals: manualJarWithdrawals,
    storedBalance: sharedJarStoredBalance,
    carried:
      sharedRolloverJarBalance +
      manualJarAllocations -
      manualJarWithdrawals -
      totalTrackedSpending -
      sharedJarMonthlyResult,
    available:
      sharedRolloverJarBalance +
      manualJarAllocations -
      totalTrackedSpending -
      manualJarWithdrawals,
  };
  const financialAnalytics = buildFinancialAnalytics({
    incomes,
    expenses: effectiveExpenses,
    transfers,
    repaymentSchedules,
    trackerLinkedCategoryIds,
    currentNetWorth: netWorth,
  });
  const recentActivity: RecentActivityItem[] = [
    ...incomes.map((item, index) => ({
      id:
        item.id ||
        `income-${item.date || "no-date"}-${item.amount || 0}-${index}`,
      type: "income" as const,
      title: item.source,
      subtitle:
        item.income_type === "Hourly"
          ? String(item.hours) + "h x $" + String(item.rate) + "/hr"
          : "Fixed amount",
      amount: item.amount,
      date: item.date,
    })),
    ...expenses.map((item, index) => ({
      id:
        item.id ||
        `expense-${item.date || "no-date"}-${item.amount || 0}-${index}`,
      type: "expense" as const,
      title: item.category,
      subtitle: item.account,
      amount: item.amount,
      date: item.date,
      isRecurring: item.isRecurring,
    })),
    ...transfers.map((item, index) => ({
      id:
        item.id ||
        `transfer-${item.date || "no-date"}-${item.amount || 0}-${index}`,
      type: "transfer" as const,
      title:
        getBucketLabel(item.from_bucket, savingsBuckets) +
        " to " +
        getBucketLabel(item.to_bucket, savingsBuckets),
      subtitle:
        item.to_bucket === "shared_rollover_jar"
          ? item.notes || "Shared jar allocation"
          : item.notes || "Money transfer",
      amount: item.amount,
      date: item.date,
    })),
    ...lendingTransactions.map((item, index) => {
      const person = people.find(
        (profile) => String(profile.id) === String(item.personId)
      );
      const name = person?.name || "Unknown";

      return {
        id:
          item.id ||
          `${item.type}-${item.date || "no-date"}-${item.amount || 0}-${index}`,
        type: item.type,
        title:
          item.type === "lent"
            ? "Lent to " + name
            : item.type === "borrowed"
              ? "Borrowed from " + name
              : "Settlement with " + name,
        subtitle: item.note || "Lending profile",
        amount: item.amount,
        date: item.date,
        source: "lendingTransaction" as const,
      };
    }),
    ...repaymentSchedules
      .filter((item) => item.status === "paid")
      .map((item) => {
        const liability = liabilities.find(
          (record) => record.id === item.liabilityId
        );
        return {
          id: item.id,
          type: "liability_repayment" as const,
          title: `${liability?.name || "Liability"} repayment`,
          subtitle: `${liability?.provider || "Liability"} / principal $${item.principalAmount.toFixed(2)}`,
          amount: item.amount,
          date: item.paidDate || item.dueDate,
        };
      }),
  ].sort(
    (a, b) =>
      getActivityTime(b.date) - getActivityTime(a.date) ||
      compareActivityIds(b.id, a.id)
  );

  return {
    activeLent,
    activeBorrowed,
    personProfiles,
    totalMoney,
    usableBalance,
    bankBalance,
    cashBalance,
    safeToSpend,
    netWorth,
    totalLiabilities,
    upcomingRepayments,
    bnplOwed,
    creditCardOwed,
    loanOwed,
    monthlyIncome,
    monthlyHours,
    monthlyExpenses,
    remaining,
    spendThisMonth,
    spendTransferCount,
    savingsBucketBalances,
    trackerSummaries,
    sharedRolloverJar,
    financialAnalytics,
    emergencySaved: emergencyBucket?.currentBalance || 0,
    emergencyProgress: emergencyBucket?.progress || 0,
    emergencyGoal: emergencyBucket?.targetAmount || 0,
    debtRepaymentSaved: debtCollectionBucket?.currentBalance || 0,
    debtRepaymentProgress: debtCollectionBucket?.progress || 0,
    debtRepaymentGoal: debtCollectionBucket?.targetAmount || 0,
    remittanceSaved: remittanceBucket?.currentBalance || 0,
    remittanceProgress: remittanceBucket?.progress || 0,
    remittanceGoal: remittanceBucket?.targetAmount || 0,
    recentActivity,
    effectiveExpenses,
    upcomingRecurringExpenses: getUpcomingRecurringExpenses(expenses),
  };
}
