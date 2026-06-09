"use client";

import { ArrowDownLeft, ArrowRightLeft, ArrowUpRight, HandCoins, Pencil, RefreshCw, Trash2 } from "lucide-react";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type RecentActivityProps = {
  state: FinanceDashboardState;
  showAll: boolean;
  onToggleShowAll: () => void;
  search?: string;
  typeFilter?: string;
};

export function formatActivityAmount(
  type: FinanceDashboardState["recentActivity"][number]["type"],
  amount: number,
  currencySymbol: string
) {
  const safeAmount = Number.isFinite(amount) ? Math.abs(amount) : 0;
  const formatted = safeAmount.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
  const sign =
    type === "income" || type === "lent"
      ? "+"
      : type === "transfer" || type === "settlement"
        ? "→"
        : "−";

  return `${sign} ${currencySymbol}${formatted}`;
}

export function RecentActivity({
  state,
  showAll,
  onToggleShowAll,
  search = "",
  typeFilter = "all",
}: RecentActivityProps) {
  const {
    recentActivity,
    startEdit,
    deleteIncome,
    deleteExpense,
    deleteTransfer,
    reverseTransfer,
    deleteLendingTransaction,
    deleteLent,
    deleteBorrowed,
    setEditingScheduleId,
    deleteRepaymentSchedule,
  } = state;

  const filteredActivity = recentActivity.filter((item) => {
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.subtitle.toLowerCase().includes(query);
    return matchesType && matchesSearch;
  });
  const displayedRecentActivity = showAll
    ? filteredActivity
    : filteredActivity.slice(0, 5);

  return (
    <section className="surface-card rounded-[28px] border border-white/[0.055] p-4 sm:p-5">

      <div className="space-y-3">
        {filteredActivity.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">No recent activity</p>
        ) : (
          displayedRecentActivity.map((item, index) => {
            const isJarAllocation =
              item.type === "transfer" &&
              item.subtitle.toLowerCase().includes("shared jar");
            const Icon =
              item.type === "income"
                ? ArrowDownLeft
                : item.type === "expense"
                  ? ArrowUpRight
                    : item.type === "transfer"
                      ? ArrowRightLeft
                      : item.type === "liability_repayment"
                        ? RefreshCw
                    : HandCoins;
            const amountClass =
              item.type === "income" || item.type === "lent"
                ? "text-green-400"
                : item.type === "transfer" || item.type === "settlement"
                  ? "text-blue-400"
                  : "text-red-400";

            const safeAmount =
              typeof item.amount === "number" && !Number.isNaN(item.amount)
                ? item.amount
                : 0;

            return (
              <div
                key={`${item.source ?? "activity"}-${item.type}-${String(
                  item.id ?? "no-id"
                )}-${index}`}
                className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-1.5 py-3 transition hover:bg-white/[0.025] sm:px-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isJarAllocation ? "bg-purple-500/15 text-purple-300" : item.type === "income" || item.type === "lent" ? "bg-green-500/15 text-green-300" : item.type === "transfer" || item.type === "settlement" ? "bg-cyan-500/15 text-cyan-300" : item.type === "liability_repayment" ? "bg-orange-500/15 text-orange-300" : "bg-red-500/15 text-red-300"}`}>
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate font-medium">
                        {item.title?.trim() || "Untitled activity"}
                      </p>
                    </div>
                    <p className="truncate text-xs text-neutral-400">
                      {item.date || "No date"} / {item.subtitle || "No details"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-white/[0.055] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-neutral-400">
                        {item.type.replaceAll("_", " ")}
                      </span>
                      {item.isRecurring && (
                        <span className="flex items-center gap-1 rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] text-purple-200">
                          <RefreshCw size={10} /> Recurring
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="min-w-[92px] shrink-0 text-right">
                  <p className={`whitespace-nowrap text-sm font-semibold tabular-nums sm:text-base ${amountClass}`}>
                    {formatActivityAmount(item.type, safeAmount, state.currencySymbol)}
                  </p>

                  <div className="mt-1 flex items-center justify-end gap-1 transition sm:opacity-70 sm:group-hover:opacity-100">
                    {item.type === "transfer" && (
                      <button
                        type="button"
                        aria-label={`Reverse ${item.title}`}
                        onClick={() => reverseTransfer(item.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-700 hover:text-orange-200"
                      >
                        <RefreshCw size={15} />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={`Edit ${item.title}`}
                      onClick={() =>
                        item.type === "liability_repayment"
                          ? setEditingScheduleId(String(item.id))
                          : startEdit(item)
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-blue-400 hover:bg-neutral-700"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      type="button"
                      aria-label={`Delete ${item.title}`}
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
                        if (item.source === "legacyLent") {
                          deleteLent(item.id);
                          return;
                        }
                        if (item.source === "legacyBorrowed") {
                          deleteBorrowed(item.id);
                          return;
                        }

                        if (item.type === "liability_repayment") {
                          deleteRepaymentSchedule(String(item.id));
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
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-700 hover:text-red-300"
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

      {filteredActivity.length > 5 && (
        <button
          type="button"
          onClick={onToggleShowAll}
          className="mt-4 w-full rounded-xl border border-white/[0.055] bg-white/[0.025] p-2.5 text-sm font-medium text-neutral-400 transition hover:text-white"
        >
          {showAll ? "Show Less" : "Show More"}
        </button>
      )}
    </section>
  );
}
