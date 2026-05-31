import type { Bucket, Expense, Income, MoneyRecord, RecentActivityItem, Transfer } from "@/lib/types";

export function toNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function isCurrentMonth(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

export function getProgress(current: number, goal: number) {
  if (!goal || goal <= 0) return 0;
  return Math.min((current / goal) * 100, 100);
}

export function getToday() {
  return new Date().toISOString().split("T")[0];
}

export function calculateDashboardValues({ incomes, expenses, transfers, lentRecords, borrowedRecords, emergencyGoal, remittanceGoal }: { incomes: Income[]; expenses: Expense[]; transfers: Transfer[]; lentRecords: MoneyRecord[]; borrowedRecords: MoneyRecord[]; emergencyGoal: number; remittanceGoal: number; }) {
  const activeLent = lentRecords.filter((item) => item.status !== "Fully Settled").reduce((sum, item) => sum + item.amount, 0);
  const activeBorrowed = borrowedRecords.filter((item) => item.status !== "Fully Settled").reduce((sum, item) => sum + item.amount, 0);
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

  const usableBalance = totalUsableIncome - expenseFromUsableBalance - bucketOut("Usable Balance") + bucketIn("Usable Balance");
  const emergencySaved = bucketIn("Emergency Fund") - bucketOut("Emergency Fund");
  const debtRepaymentSaved = bucketIn("Debt Repayment") - bucketOut("Debt Repayment");
  const remittanceSaved = bucketIn("Remittance Fund") - bucketOut("Remittance Fund");
  const cashBalance = totalCashReceivedFromIncome + bucketIn("Cash") - bucketOut("Cash") - expenseFromCash;
  const totalMoney = usableBalance + emergencySaved + debtRepaymentSaved + remittanceSaved + cashBalance;
  const netWorth = totalMoney + activeLent - activeBorrowed;
  const monthlyIncome = incomes.filter((item) => isCurrentMonth(item.date)).reduce((sum, item) => sum + item.amount, 0);
  const monthlyHours = incomes.filter((item) => item.income_type === "Hourly" && isCurrentMonth(item.date)).reduce((sum, item) => sum + item.hours, 0);
  const monthlyExpenses = expenses.filter((item) => isCurrentMonth(item.date)).reduce((sum, item) => sum + item.amount, 0);
  const spendingTransfersThisMonth = expenses.filter((item) => item.category === "Spending Transfer" && isCurrentMonth(item.date));
  const spendThisMonth = spendingTransfersThisMonth.reduce((sum, item) => sum + item.amount, 0);
  const spendTransferCount = spendingTransfersThisMonth.length;
  const remaining = monthlyIncome - monthlyExpenses;
  const emergencyProgress = getProgress(emergencySaved, emergencyGoal);
  const debtRepaymentProgress = getProgress(debtRepaymentSaved, activeBorrowed);
  const remittanceProgress = getProgress(remittanceSaved, remittanceGoal);
  const recentActivity: RecentActivityItem[] = [
    ...incomes.map((item) => ({ id: item.id, type: "income" as const, title: item.source, subtitle: item.income_type === "Hourly" ? String(item.hours) + "h × $" + String(item.rate) + "/hr" : "Fixed amount", amount: item.amount, date: item.date })),
    ...expenses.map((item) => ({ id: item.id, type: "expense" as const, title: item.category, subtitle: item.account, amount: item.amount, date: item.date })),
    ...transfers.map((item) => ({ id: item.id, type: "transfer" as const, title: item.from_bucket + " → " + item.to_bucket, subtitle: item.notes || "Bucket transfer", amount: item.amount, date: item.date })),
    ...lentRecords.map((item) => ({ id: item.id, type: "lent" as const, title: "Lent to " + item.name, subtitle: item.status, amount: item.amount, date: item.date })),
    ...borrowedRecords.map((item) => ({ id: item.id, type: "borrowed" as const, title: "Borrowed from " + item.name, subtitle: item.status, amount: item.amount, date: item.date })),
  ].sort((a, b) => b.id - a.id);

  return { activeLent, activeBorrowed, totalMoney, usableBalance, cashBalance, netWorth, monthlyIncome, monthlyHours, monthlyExpenses, remaining, spendThisMonth, spendTransferCount, emergencySaved, emergencyProgress, debtRepaymentSaved, debtRepaymentProgress, remittanceSaved, remittanceProgress, recentActivity };
}
