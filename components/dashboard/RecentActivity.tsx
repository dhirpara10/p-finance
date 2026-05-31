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
          displayedRecentActivity.map((item) => {
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

            return (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-center justify-between rounded-2xl bg-neutral-800 p-4"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-neutral-400">
                    {item.date} - {item.subtitle}
                  </p>
                </div>

                <div className="text-right">
                  <p className={amountClass}>
                    {prefix}${item.amount.toLocaleString()}
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
                        const numericId = Number(item.id);
                        if (item.type === "income") deleteIncome(numericId);
                        if (item.type === "expense") deleteExpense(numericId);
                        if (item.type === "transfer") deleteTransfer(numericId);
                        if (item.source === "lendingTransaction") {
                          deleteLendingTransaction(item.id);
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
