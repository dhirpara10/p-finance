import type { Expense } from "@/lib/types";

function addFrequency(date: Date, frequency: Expense["recurringFrequency"]) {
  const next = new Date(date);
  if (frequency === "weekly") next.setDate(next.getDate() + 7);
  if (frequency === "biweekly") next.setDate(next.getDate() + 14);
  if (frequency === "monthly") next.setMonth(next.getMonth() + 1);
  if (frequency === "yearly") next.setFullYear(next.getFullYear() + 1);
  return next;
}

export function getRecurringOccurrences(
  expense: Expense,
  rangeStart: Date,
  rangeEnd: Date
) {
  if (
    !expense.isRecurring ||
    expense.recurringStatus !== "active" ||
    !expense.recurringFrequency
  ) {
    return [];
  }

  const start = new Date(expense.recurringStartDate || expense.date);
  const end = expense.recurringEndDate
    ? new Date(expense.recurringEndDate)
    : rangeEnd;
  const occurrences: Expense[] = [];
  let cursor = start;
  let guard = 0;

  while (cursor <= rangeEnd && cursor <= end && guard < 600) {
    if (cursor >= rangeStart) {
      const date = cursor.toISOString().split("T")[0];
      occurrences.push({
        ...expense,
        id: `${expense.id}:${date}`,
        date,
      });
    }
    cursor = addFrequency(cursor, expense.recurringFrequency);
    guard += 1;
  }

  return occurrences;
}

export function expandExpensesForRange(
  expenses: Expense[],
  rangeStart: Date,
  rangeEnd: Date
) {
  return expenses.flatMap((expense) =>
    expense.isRecurring
      ? getRecurringOccurrences(expense, rangeStart, rangeEnd)
      : [expense]
  );
}

export function getUpcomingRecurringExpenses(expenses: Expense[], days = 45) {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + days);
  return expenses
    .flatMap((expense) => getRecurringOccurrences(expense, now, end))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
