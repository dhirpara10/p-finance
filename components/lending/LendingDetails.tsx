"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type LendingDetailsProps = { state: FinanceDashboardState; };

export function LendingDetails({ state }: LendingDetailsProps) {
  const { detailsView, setDetailsView, lentRecords, borrowedRecords, deleteLent, deleteBorrowed } = state;

  return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950 px-4 py-6 text-white">
          <div className="mx-auto max-w-md">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {detailsView === "lent" ? "Money I Lent" : "Money I Borrowed"}
                </h2>
                <p className="text-sm text-neutral-400">
                  {detailsView === "lent"
                    ? "People who owe you money"
                    : "People you owe money to"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDetailsView(null)}
                className="rounded-full bg-neutral-900 px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              {(detailsView === "lent" ? lentRecords : borrowedRecords).length ===
              0 ? (
                <p className="rounded-2xl bg-neutral-900 p-4 text-sm text-neutral-500">
                  No records yet.
                </p>
              ) : (
                (detailsView === "lent" ? lentRecords : borrowedRecords).map(
                  (item) => (
                    <div key={item.id} className="rounded-3xl bg-neutral-900 p-5">
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold">{item.name}</p>
                          <p className="text-sm text-neutral-400">{item.date}</p>
                        </div>

                        <p
                          className={
                            detailsView === "lent"
                              ? "text-xl font-bold text-green-400"
                              : "text-xl font-bold text-red-400"
                          }
                        >
                          ${item.amount.toLocaleString()}
                        </p>
                      </div>

                      <div className="space-y-2 text-sm text-neutral-300">
                        <p>Status: {item.status}</p>
                        {item.phone && <p>Phone: {item.phone}</p>}
                        {item.notes && <p>Notes: {item.notes}</p>}

                        <button
                          type="button"
                          onClick={() => {
                            if (detailsView === "lent") deleteLent(item.id);
                            if (detailsView === "borrowed")
                              deleteBorrowed(item.id);
                          }}
                          className="mt-3 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-black"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </div>
  );
}
