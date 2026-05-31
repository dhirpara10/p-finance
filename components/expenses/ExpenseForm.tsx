"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import type { ExpenseAccount } from "@/lib/types";

type ExpenseFormProps = { state: FinanceDashboardState; };

export function ExpenseForm({ state }: ExpenseFormProps) {
  const { editingItem, expenseAmount, setExpenseAmount, expenseCategory, setExpenseCategory, expenseAccount, setExpenseAccount, expenseDate, setExpenseDate, expenseNotes, setExpenseNotes, closeAllForms, addExpense } = state;

  return (
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
  );
}
