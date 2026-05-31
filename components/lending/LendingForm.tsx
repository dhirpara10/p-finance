"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import type { Status } from "@/lib/types";

type LendingFormProps = { state: FinanceDashboardState; };

export function LendingForm({ state }: LendingFormProps) {
  const { showLentForm, editingItem, moneyName, setMoneyName, moneyAmount, setMoneyAmount, moneyDate, setMoneyDate, moneyPhone, setMoneyPhone, moneyStatus, setMoneyStatus, moneyNotes, setMoneyNotes, closeAllForms, addLent, addBorrowed } = state;

  return (
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
  );
}
