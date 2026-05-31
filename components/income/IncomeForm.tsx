"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import type { IncomeType } from "@/lib/types";

type IncomeFormProps = { state: FinanceDashboardState; };

export function IncomeForm({ state }: IncomeFormProps) {
  const { editingItem, incomeType, handleIncomeTypeChange, incomeSource, handleIncomeSourceChange, incomeRate, setIncomeRate, incomeHours, setIncomeHours, incomeCashReceived, setIncomeCashReceived, toNumber, incomeAmount, setIncomeAmount, incomeDate, setIncomeDate, incomeNotes, setIncomeNotes, closeAllForms, addIncome } = state;

  return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6">
          <div className="mx-auto mt-10 w-full max-w-md rounded-3xl bg-neutral-900 p-5">
            <h2 className="mb-4 text-xl font-bold">
              {editingItem?.type === "income" ? "Edit Income" : "Add Income"}
            </h2>

            <div className="space-y-3">
              <select
                value={incomeType}
                onChange={(e) =>
                  handleIncomeTypeChange(e.target.value as IncomeType)
                }
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              >
                <option value="Hourly">Hourly</option>
                <option value="Fixed Amount">Fixed Amount</option>
              </select>

              <select
                value={incomeSource}
                onChange={(e) => handleIncomeSourceChange(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              >
                <option>Hawthorn Pizza</option>
                <option>Pizza High</option>
                <option>Business</option>
                <option>Refund</option>
                <option>Gift</option>
                <option>Other</option>
              </select>

              {incomeType === "Hourly" ? (
                <>
                  <input
                    type="number"
                    placeholder="Rate"
                    value={incomeRate}
                    onChange={(e) => setIncomeRate(e.target.value)}
                    className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
                  />

                  <input
                    type="number"
                    placeholder="Hours"
                    value={incomeHours}
                    onChange={(e) => setIncomeHours(e.target.value)}
                    className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
                  />
                  <div>
  <label className="mb-2 block text-sm text-neutral-400">
    Cash Received
  </label>
  <input
    type="number"
    placeholder="0"
    value={incomeCashReceived}
    onChange={(e) => setIncomeCashReceived(e.target.value)}
    className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
  />
</div>
<div className="rounded-2xl bg-neutral-800 p-4">
  <p className="text-sm text-neutral-400">Usable Balance Portion</p>
  <p className="mt-1 text-xl font-semibold">
    $
    {Math.max(
      0,
      (
        (incomeType === "Hourly"
          ? toNumber(incomeRate) * toNumber(incomeHours)
          : toNumber(incomeAmount)) - toNumber(incomeCashReceived)
      )
    ).toLocaleString()}
  </p>
</div>
                  <div className="rounded-2xl bg-neutral-800 p-4">
                    <p className="text-sm text-neutral-400">Calculated Amount</p>
                    <p className="mt-1 text-xl font-semibold">
                      $
                      {(
                        toNumber(incomeRate) * toNumber(incomeHours)
                      ).toLocaleString()}
                    </p>
                  </div>
                </>
              ) : (
                <input
                  type="number"
                  placeholder="Amount"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
                />
              )}

              <input
                type="date"
                value={incomeDate}
                onChange={(e) => setIncomeDate(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <textarea
                placeholder="Notes"
                value={incomeNotes}
                onChange={(e) => setIncomeNotes(e.target.value)}
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
                onClick={addIncome}
                className="rounded-2xl bg-green-500 p-4 font-semibold text-black"
              >
                Save Income
              </button>
            </div>
          </div>
        </div>
  );
}
