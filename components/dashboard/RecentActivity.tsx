"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type RecentActivityProps = {
  state: FinanceDashboardState;
  showAll: boolean;
  onToggleShowAll: () => void;
};

export function RecentActivity({
  state,
  showAll,
  onToggleShowAll,
}: RecentActivityProps) {
  const {
    recentActivity,
    startEdit,
    deleteIncome,
    deleteExpense,
    deleteTransfer,
    deleteLendingTransaction,
  } = state;

  const displayedRecentActivity = showAll
    ? recentActivity
    : recentActivity.slice(0, 5);

  return (
    <section className="rounded-3xl bg-neutral-900 p-5">
      <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>

      <div className="space-y-3">
        {recentActivity.length === 0 ? (
          <p className="text-sm text-neutral-500">No recent activity</p>
        ) : (
          displayedRecentActivity.map((item, index) => {
            const amountClass =
              item.type === "income" || item.type === "lent"
                ? "text-green-400"
                : item.type === "transfer" || item.type === "settlement"
                  ? "text-blue-400"
                  : "text-red-400";

            const prefix =
              item.type === "income" || item.type === "lent"
                ? "+"
                : item.type === "transfer" || item.type === "settlement"
                  ? "->"
                  : "-";

            const safeAmount =
              typeof item.amount === "number" && !Number.isNaN(item.amount)
                ? item.amount
                : 0;

            return (
              <div
                key={`${item.source ?? "activity"}-${item.type}-${String(
                  item.id ?? "no-id"
                )}-${index}`}
                className="flex items-center justify-between rounded-2xl bg-neutral-800 p-4"
              >
                <div>
                  <p className="font-medium">
                    {item.title?.trim() || "Untitled activity"}
                  </p>

                  <p className="text-xs text-neutral-400">
                    {item.date || "No date"} - {item.subtitle || "No details"}
                  </p>
                </div>

                <div className="text-right">
                  <p className={amountClass}>
                    {prefix}${safeAmount.toLocaleString()}
                  </p>

                  <div className="mt-2 flex items-center justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      disabled={item.source === "lendingTransaction"}
                      className="text-xs text-blue-400 disabled:text-neutral-600"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (
                          item.id === undefined ||
                          item.id === null ||
                          String(item.id).trim() === ""
                        ) {
                          alert("Missing row id");
                          return;
                        }

                        if (item.source === "lendingTransaction") {
                          deleteLendingTransaction(item.id);
                          return;
                        }

                        if (item.type === "income") {
                          deleteIncome(item.id);
                          return;
                        }

                        if (item.type === "expense") {
                          deleteExpense(item.id);
                          return;
                        }

                        if (item.type === "transfer") {
                          deleteTransfer(item.id);
                          return;
                        }
                      }}
                      className="text-xs text-neutral-500"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {recentActivity.length > 5 && (
        <button
          type="button"
          onClick={onToggleShowAll}
          className="mt-4 w-full rounded-2xl bg-neutral-800 p-3 text-sm font-semibold text-neutral-300"
        >
          {showAll ? "Show Less" : "Show More"}
        </button>
      )}
    </section>
  );
}