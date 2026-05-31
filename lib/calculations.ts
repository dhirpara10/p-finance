import { buildPersonProfiles } from "@/lib/lending";
import type { Bucket, Expense, Income, LendingTransactionRecord, MoneyRecord, Person, RecentActivityItem, Transfer } from "@/lib/types";

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

export function calculateDashboardValues({ incomes, expenses, transfers, people, lendingTransactions, lentRecords, borrowedRecords, initialCashBalance, initialCommbankBalance, initialUpBalance, emergencyGoal, debtRepaymentGoal, remittanceGoal, monthlyResetDay }: { incomes: Income[]; expenses: Expense[]; transfers: Transfer[]; people: Person[]; lendingTransactions: LendingTransactionRecord[]; lentRecords: MoneyRecord[]; borrowedRecords: MoneyRecord[]; initialCashBalance: number; initialCommbankBalance: number; initialUpBalance: number; emergencyGoal: number; debtRepaymentGoal: number; remittanceGoal: number; monthlyResetDay: number; }) {
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
  const expenseFromUsableBalance = expenses.filter((item) => item.account === "Usable Balance").reduce((sum, item) => sum + item.amount, 0);
  const expenseFromCash = expenses.filter((item) => item.account === "Cash").reduce((sum, item) => sum + item.amount, 0);

  function bucketIn(bucket: Bucket) {
    return transfers.filter((item) => item.to_bucket === bucket).reduce((sum, item) => sum + item.amount, 0);
  }

  function bucketOut(bucket: Bucket) {
    return transfers.filter((item) => item.from_bucket === bucket).reduce((sum, item) => sum + item.amount, 0);
  }

  const initialUsableBalance = initialCommbankBalance + initialUpBalance;
  const usableBalance = initialUsableBalance + totalUsableIncome - expenseFromUsableBalance - bucketOut("Usable Balance") + bucketIn("Usable Balance");
  const emergencySaved = bucketIn("Emergency Fund") - bucketOut("Emergency Fund");
  const debtRepaymentSaved = bucketIn("Debt Repayment") - bucketOut("Debt Repayment");
  const remittanceSaved = bucketIn("Remittance Fund") - bucketOut("Remittance Fund");
  const cashBalance = initialCashBalance + totalCashReceivedFromIncome + bucketIn("Cash") - bucketOut("Cash") - expenseFromCash;
  const totalMoney = usableBalance + emergencySaved + debtRepaymentSaved + remittanceSaved + cashBalance;
  const netWorth = totalMoney + activeLent - activeBorrowed;
  const monthlyIncome = incomes.filter((item) => isCurrentMonth(item.date, monthlyResetDay)).reduce((sum, item) => sum + item.amount, 0);
  const monthlyHours = incomes.filter((item) => item.income_type === "Hourly" && isCurrentMonth(item.date, monthlyResetDay)).reduce((sum, item) => sum + item.hours, 0);
  const monthlyExpenses = expenses.filter((item) => isCurrentMonth(item.date, monthlyResetDay)).reduce((sum, item) => sum + item.amount, 0);
  const spendingTransfersThisMonth = expenses.filter((item) => item.category === "Spending Transfer" && isCurrentMonth(item.date, monthlyResetDay));
  const spendThisMonth = spendingTransfersThisMonth.reduce((sum, item) => sum + item.amount, 0);
  const spendTransferCount = spendingTransfersThisMonth.length;
  const remaining = monthlyIncome - monthlyExpenses;
  const emergencyProgress = getProgress(emergencySaved, emergencyGoal);
  const debtRepaymentProgress = getProgress(debtRepaymentSaved, debtRepaymentGoal);
  const remittanceProgress = getProgress(remittanceSaved, remittanceGoal);
  const recentActivity: RecentActivityItem[] = [
    ...incomes.map((item) => ({
      id: item.id,
      type: "income" as const,
      title: item.source,
      subtitle:
        item.income_type === "Hourly"
          ? String(item.hours) + "h × $" + String(item.rate) + "/hr"
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
      title: item.from_bucket + " → " + item.to_bucket,
      subtitle: item.notes || "Bucket transfer",
      amount: item.amount,
      date: item.date,
    })),
    ...lendingTransactions.map((item) => {
      const person = people.find(
        (profile) => String(profile.id) === String(item.personId)
      );
      const name = person?.name || "Unknown";

      return {
        id: item.id,
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
  ].sort(
    (a, b) =>
      getActivityTime(b.date) - getActivityTime(a.date) ||
      compareActivityIds(b.id, a.id)
  );

  return { activeLent, activeBorrowed, personProfiles, totalMoney, usableBalance, cashBalance, netWorth, monthlyIncome, monthlyHours, monthlyExpenses, remaining, spendThisMonth, spendTransferCount, emergencySaved, emergencyProgress, debtRepaymentSaved, debtRepaymentProgress, remittanceSaved, remittanceProgress, recentActivity };
}
