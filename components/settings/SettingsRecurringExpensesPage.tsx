"use client";

import { CalendarClock, CirclePause, CirclePlay, Pencil, XCircle } from "lucide-react";
import { SettingsPanel } from "@/components/settings/SettingsAccountsPage";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

export function SettingsRecurringExpensesPage({ state }: { state: FinanceDashboardState }) {
  const rules = state.expenses.filter((expense) => expense.isRecurring);

  return (
    <SettingsPanel title="Recurring Expenses" onBack={state.goBackSettingsPage}>
      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
        <p className="text-sm font-semibold text-purple-200">Upcoming</p>
        <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{state.upcomingRecurringExpenses.length}</p>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">occurrences in the next 45 days</p>
      </div>
      {rules.length === 0 ? (
        <p className="rounded-2xl bg-neutral-100 p-4 text-sm text-neutral-600 dark:bg-neutral-950 dark:text-neutral-400">No recurring expenses yet.</p>
      ) : (
        rules.map((expense) => (
          <div key={String(expense.id)} className="rounded-2xl border border-neutral-200 bg-neutral-100 p-4 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300"><CalendarClock size={18} /></span>
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">{expense.category}</p>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">${expense.amount.toLocaleString()} · {expense.recurringFrequency}</p>
                  <span className="mt-2 inline-block rounded-full bg-neutral-200 px-2 py-1 text-xs capitalize text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">{expense.recurringStatus}</span>
                </div>
              </div>
              <button type="button" onClick={() => state.startEdit({ id: expense.id, type: "expense", title: expense.category, subtitle: expense.account, amount: expense.amount, date: expense.date })} className="rounded-xl bg-neutral-200 p-2 text-blue-500 dark:bg-neutral-800 dark:text-blue-300"><Pencil size={16} /></button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button type="button" onClick={() => state.updateRecurringExpenseStatus(expense.id, expense.recurringStatus === "paused" ? "active" : "paused")} className="flex items-center justify-center gap-2 rounded-xl bg-neutral-200 p-3 text-sm font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-white">
                {expense.recurringStatus === "paused" ? <CirclePlay size={16} /> : <CirclePause size={16} />}
                {expense.recurringStatus === "paused" ? "Resume" : "Pause"}
              </button>
              <button type="button" onClick={() => state.updateRecurringExpenseStatus(expense.id, "cancelled")} className="flex items-center justify-center gap-2 rounded-xl border border-neutral-300 p-3 text-sm font-semibold text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"><XCircle size={16} />Cancel</button>
              <button type="button" onClick={() => state.deleteExpense(expense.id)} className="rounded-xl border border-neutral-300 p-3 text-sm font-semibold text-neutral-600 dark:border-neutral-700 dark:text-neutral-400">Delete future</button>
            </div>
          </div>
        ))
      )}
    </SettingsPanel>
  );
}
