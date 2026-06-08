"use client";

import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, HandCoins, Pencil, RefreshCw, Trash2 } from "lucide-react";
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
            const Icon =
              item.type === "income"
                ? ArrowDownLeft
                : item.type === "expense"
                  ? ArrowUpRight
                  : item.type === "transfer"
                    ? ArrowRightLeft
                    : HandCoins;
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
                className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-800 p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${item.type === "income" || item.type === "lent" ? "bg-green-500/15 text-green-300" : item.type === "transfer" || item.type === "settlement" ? "bg-cyan-500/15 text-cyan-300" : "bg-red-500/15 text-red-300"}`}>
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate font-medium">
                        {item.title?.trim() || "Untitled activity"}
                      </p>
                      <span className="rounded-full bg-neutral-700 px-2 py-0.5 text-[10px] uppercase text-neutral-300">
                        {item.type}
                      </span>
                      {item.isRecurring && (
                        <span className="flex items-center gap-1 rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] text-purple-200">
                          <RefreshCw size={10} /> Recurring
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-neutral-400">
                      {item.date || "No date"} - {item.subtitle || "No details"}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p className={`font-semibold ${amountClass}`}>
                    {prefix}${safeAmount.toLocaleString()}
                  </p>

                  <div className="mt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      disabled={item.source === "lendingTransaction"}
                      className="rounded-full p-1 text-blue-400 hover:bg-neutral-700 disabled:text-neutral-600"
                    >
                      <Pencil size={15} />
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
                      className="rounded-full p-1 text-neutral-500 hover:bg-neutral-700 hover:text-red-300"
                    >
                      <Trash2 size={15} />
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
