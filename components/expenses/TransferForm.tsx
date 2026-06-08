"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import type { Bucket } from "@/lib/types";

type TransferFormProps = { state: FinanceDashboardState; };

export function TransferForm({ state }: TransferFormProps) {
  const { editingItem, fromBucket, setFromBucket, toBucket, setToBucket, transferAmount, setTransferAmount, transferDate, setTransferDate, transferNotes, setTransferNotes, closeAllForms, addTransfer } = state;

  return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6">
          <div className="mx-auto mt-10 w-full max-w-md rounded-3xl bg-neutral-900 p-5">
            <h2 className="mb-4 text-xl font-bold">
              {editingItem?.type === "transfer" ? "Edit Transfer" : "Transfer Funds"}
            </h2>

            <div className="space-y-3">
              <select
                value={fromBucket}
                onChange={(e) => setFromBucket(e.target.value as Bucket)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              >
                <option>Bank</option>
                <option>Emergency Fund</option>
                <option>Debt Repayment</option>
                <option>Remittance Fund</option>
                <option>Cash</option>
              </select>

              <select
                value={toBucket}
                onChange={(e) => setToBucket(e.target.value as Bucket)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              >
                <option>Bank</option>
                <option>Emergency Fund</option>
                <option>Debt Repayment</option>
                <option>Remittance Fund</option>
                <option>Cash</option>
              </select>

              <input
                type="number"
                placeholder="Amount"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <input
                type="date"
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <textarea
                placeholder="Notes"
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
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
                onClick={addTransfer}
                className="rounded-2xl bg-blue-500 p-4 font-semibold text-black"
              >
                Save Transfer
              </button>
            </div>
          </div>
        </div>
  );
}
