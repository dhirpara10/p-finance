"use client";

import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  HandCoins,
  Pencil,
  Plane,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { toast } from "@/lib/toast";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type RecentActivityProps = {
  state: FinanceDashboardState;
  showAll: boolean;
  onToggleShowAll: () => void;
  search?: string;
  typeFilter?: string;
};

type ActivityItem = FinanceDashboardState["recentActivity"][number] & {
  account?: string;
  paymentMethod?: string;
};

function getActivityAccount(item: ActivityItem) {
  const account = String(item.account || "").trim();
  const paymentMethod = String(item.paymentMethod || "").trim();

  if (paymentMethod === "Split") return "";
  if (account.includes("$") || account.includes("•")) return account;
  if (account === "Afterpay" || account === "StepPay" || account === "Credit Card") return account;
  if (account === "Cash") return "Cash";
  if (account === "Bank" || account === "Usable Balance") return "Bank";

  const subtitle = String(item.subtitle || "").toLowerCase();
  const title = String(item.title || "").toLowerCase();
  if (subtitle.includes("cash") || title.includes("cash")) return "Cash";
  if (subtitle.includes("bank") || title.includes("bank")) return "Bank";
  if (item.type === "liability_repayment") return "Bank";

  return "";
}

function getAccountBadgeClass(account: string) {
  if (account.includes("$") || account.includes("•")) {
    return "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20";
  }
  if (account === "Split") return "bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/20";
  if (account === "Cash") return "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/20";
  if (account === "Bank") return "bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/20";
  if (account === "Fund") return "bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/20";
  if (account === "Afterpay" || account === "StepPay" || account === "SharedJar") {
    return "bg-purple-500/15 text-purple-300 ring-1 ring-purple-400/20";
  }
  if (account === "Credit Card") {
    return "bg-orange-500/15 text-orange-300 ring-1 ring-orange-400/20";
  }
  return "bg-neutral-700/60 text-neutral-300 ring-1 ring-white/10";
}

export function formatActivityAmount(
  type: FinanceDashboardState["recentActivity"][number]["type"],
  amount: number,
  currencySymbol: string
) {
  const safeAmount = Number.isFinite(amount) ? Math.abs(amount) : 0;
  const formatted = safeAmount.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

  const isOutflow =
    type === "expense" || type === "lent" || type === "remittance" || type === "liability_repayment";
  const isTransfer = type === "transfer";

  const sign = isTransfer ? "→" : isOutflow ? "−" : "+";

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
    deleteLendingTransaction,
    deleteRemittance,
    setEditingScheduleId,
    deleteRepaymentSchedule,
  } = state;

  const validActivity = (recentActivity as ActivityItem[]).filter((item) => {
    const title = typeof item.title === "string" ? item.title.trim() : "";
    const subtitle = typeof item.subtitle === "string" ? item.subtitle.trim() : "";
    const date = typeof item.date === "string" ? item.date.trim() : "";
    const amount = Number(item.amount);

    if (!title || !date) return false;
    if (!Number.isFinite(amount)) return false;
    if (item.type === "transfer" && amount <= 0) return false;

    if (title === "Untitled activity") return false;
    if (subtitle.includes("[object Object]")) return false;
    if (title.includes("[object Object]")) return false;

    return true;
  });

  const filteredActivity = validActivity.filter((item) => {
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const query = search.trim().toLowerCase();
    const account = getActivityAccount(item).toLowerCase();

    const matchesSearch =
      !query ||
      item.title.toLowerCase().includes(query) ||
      item.subtitle.toLowerCase().includes(query) ||
      account.includes(query);

    return matchesType && matchesSearch;
  });

  const displayedRecentActivity = showAll
    ? filteredActivity
    : filteredActivity.slice(0, 5);

  return (
    <section className="surface-card rounded-[28px] border border-black/[0.07] p-4 dark:border-white/[0.055] sm:p-5">
      <div className="space-y-3">
        {filteredActivity.length === 0 ? (
          <p className="py-8 text-center text-sm text-neutral-500">
            No recent activity
          </p>
        ) : (
          displayedRecentActivity.map((item, index) => {
            const account = getActivityAccount(item);

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
                      : item.type === "remittance"
                        ? Plane
                        : HandCoins;

            const isOutflowType =
              item.type === "expense" ||
              item.type === "lent" ||
              item.type === "remittance" ||
              item.type === "liability_repayment";

            const amountClass =
              item.type === "transfer"
                ? "text-blue-400"
                : isOutflowType
                  ? "text-red-400"
                  : "text-green-400";

            const safeAmount =
              typeof item.amount === "number" && !Number.isNaN(item.amount)
                ? item.amount
                : 0;

            return (
              <div
                key={`${item.source ?? "activity"}-${item.type}-${String(
                  item.id ?? "no-id"
                )}-${index}`}
                className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl px-1.5 py-3 transition hover:bg-black/[0.03] dark:hover:bg-white/[0.025] sm:px-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isJarAllocation
                        ? "bg-purple-500/15 text-purple-300"
                        : item.type === "income" ||
                            item.type === "lent" ||
                            item.type === "borrowed"
                          ? "bg-green-500/15 text-green-300"
                          : item.type === "transfer" ||
                              item.type === "settlement"
                            ? "bg-cyan-500/15 text-cyan-300"
                            : item.type === "liability_repayment"
                              ? "bg-orange-500/15 text-orange-300"
                              : item.type === "remittance"
                                ? "bg-indigo-500/15 text-indigo-300"
                                : "bg-red-500/15 text-red-300"
                    }`}
                  >
                    <Icon size={18} />
                  </span>

                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate font-medium">{item.title.trim()}</p>

                      {account && (
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${getAccountBadgeClass(account)}`}
                        >
                          {account}
                        </span>
                      )}
                    </div>

<div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
  <span>{item.date || "No date"}</span>

  {item.subtitle && (
    <>
      <span>/</span>
      <span>{item.subtitle}</span>
    </>
  )}
</div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-neutral-500 dark:bg-white/[0.055] dark:text-neutral-400">
                        {item.type.replaceAll("_", " ")}
                      </span>

                      {item.isRecurring && (
                        <span className="flex items-center gap-1 rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] text-purple-200">
                          <RefreshCw size={10} /> Recurring
                        </span>
                      )}

                      {item.paymentProgress && (
                        <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[9px] font-semibold text-purple-300 ring-1 ring-purple-400/20">
                          {item.paymentProgress}
                        </span>
                      )}

                      {item.addedBy && (
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ring-1 ${
                          item.addedBy === "spouse"
                            ? "bg-pink-500/15 text-pink-300 ring-pink-400/20"
                            : "bg-blue-500/15 text-blue-300 ring-blue-400/20"
                        }`}>
                          {item.addedBy === "spouse" ? state.userNameSpouse : state.userNameMe}
                        </span>
                      )}

                    </div>
                  </div>
                </div>

                <div className="min-w-[92px] shrink-0 text-right">
                  <p
                    className={`whitespace-nowrap text-sm font-semibold tabular-nums sm:text-base ${amountClass}`}
                  >
                    {formatActivityAmount(
                      item.type,
                      safeAmount,
                      state.currencySymbol
                    )}
                  </p>

                  <div className="mt-1 flex items-center justify-end gap-1 transition sm:opacity-70 sm:group-hover:opacity-100">
                    <button
                      type="button"
                      aria-label={`Edit ${item.title}`}
                      onClick={() =>
                        item.type === "liability_repayment"
                          ? setEditingScheduleId(String(item.id))
                          : startEdit(item)
                      }
                      disabled={(item.source === "lendingTransaction" && item.type === "settlement") || item.source === "liability" || item.type === "remittance"}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-blue-500 hover:bg-neutral-100 dark:text-blue-400 dark:hover:bg-neutral-700 disabled:pointer-events-none disabled:opacity-0"
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
                          toast("Missing row id", "error");
                          return;
                        }

                        if (item.source === "lendingTransaction") {
                          deleteLendingTransaction(item.id);
                          return;
                        }

                        if (item.source === "liability") {
                          toast("Delete this from the Liabilities page", "error");
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

                        if (item.type === "remittance") {
                          deleteRemittance(item.id);
                          return;
                        }
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-red-500 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-red-300"
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
          className="mt-4 w-full rounded-xl border border-black/[0.07] bg-black/[0.03] p-2.5 text-sm font-medium text-neutral-500 transition hover:text-neutral-900 dark:border-white/[0.055] dark:bg-white/[0.025] dark:text-neutral-400 dark:hover:text-white"
        >
          {showAll ? "Show Less" : "Show More"}
        </button>
      )}
    </section>
  );
}