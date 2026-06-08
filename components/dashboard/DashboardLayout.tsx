"use client";

import { useState } from "react";
import { FloatingActionMenu } from "@/components/dashboard/FloatingActionMenu";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import Statistics from "@/components/dashboard/Statistics";
import { bucketMatches, categoryIdFromName, getBucketLabel } from "@/lib/buckets";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type DashboardLayoutProps = { state: FinanceDashboardState; };

export function DashboardLayout({ state }: DashboardLayoutProps) {
  const { currencySymbol, totalMoney, usableBalance, cashBalance, netWorth, setShowSettingsForm, lockApp, setShowIncomeForm, setShowExpenseForm, setShowTransferForm, setShowLentForm, setShowBorrowedForm, monthlyIncome, monthlyHours, monthlyExpenses, remaining, spendThisMonth, spendTransferCount, savingsBucketBalances, trackerSummaries, sharedRolloverJar, transfers, expenses, activeLent, activeBorrowed, setDetailsView } = state;
  const [showAllRecentActivity, setShowAllRecentActivity] = useState(false);
  const [bucketHistory, setBucketHistory] = useState<{
    type: "savings" | "tracker";
    id: string;
  } | null>(null);

  const openIncomeForm = () => setShowIncomeForm(true);
  const openExpenseForm = () => setShowExpenseForm(true);
  const openTransferForm = () => setShowTransferForm(true);
  const openLentForm = () => setShowLentForm(true);
  const openBorrowedForm = () => setShowBorrowedForm(true);
  const selectedSavingsHistory =
    bucketHistory?.type === "savings"
      ? savingsBucketBalances.find((bucket) => bucket.id === bucketHistory.id)
      : null;
  const selectedTrackerHistory =
    bucketHistory?.type === "tracker"
      ? trackerSummaries.find((tracker) => tracker.id === bucketHistory.id)
      : null;
  const savingsHistoryRows = selectedSavingsHistory
    ? transfers
        .filter(
          (transfer) =>
            bucketMatches(transfer.from_bucket, selectedSavingsHistory) ||
            bucketMatches(transfer.to_bucket, selectedSavingsHistory)
        )
        .map((transfer) => ({
          id: transfer.id,
          date: transfer.date,
          amount: transfer.amount,
          title: bucketMatches(transfer.to_bucket, selectedSavingsHistory)
            ? "Transfer in"
            : "Transfer out",
          account: bucketMatches(transfer.from_bucket, selectedSavingsHistory)
            ? getBucketLabel(transfer.to_bucket, savingsBucketBalances)
            : getBucketLabel(transfer.from_bucket, savingsBucketBalances),
          note: transfer.notes,
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];
  const trackerHistoryRows = selectedTrackerHistory
    ? expenses
        .filter((expense) =>
          selectedTrackerHistory.linkedCategoryIds.includes(
            categoryIdFromName(expense.category)
          )
        )
        .map((expense) => ({
          id: expense.id,
          date: expense.date,
          amount: expense.amount,
          category: expense.category,
          account: expense.account,
          note: expense.notes,
          title: "Expense",
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  return (
    <main className="min-h-screen bg-neutral-950 pb-24 text-white md:pb-0">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">
        <header className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Money Control</h1>
            <p className="text-sm text-neutral-400">
              {new Date().toLocaleString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSettingsForm(true)}
              className="rounded-full bg-neutral-900 px-4 py-2 text-sm text-neutral-300"
            >
              Settings
            </button>

            <button
              type="button"
              onClick={lockApp}
              className="rounded-full bg-neutral-900 px-4 py-2 text-sm text-neutral-300"
            >
              Lock
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-3xl bg-neutral-900 p-5 shadow-lg">
              <p className="text-sm text-neutral-400">Total Money</p>
              <h2 className="mt-2 text-4xl font-bold">
                {currencySymbol}{totalMoney.toLocaleString()}
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-neutral-800 p-4">
                  <p className="text-xs text-neutral-400">Available</p>
                  <p className="mt-1 text-xl font-semibold">
                    {currencySymbol}{usableBalance.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl bg-neutral-800 p-4">
                  <p className="text-xs text-neutral-400">Cash</p>
                  <p className="mt-1 text-xl font-semibold">
                    {currencySymbol}{cashBalance.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-neutral-800 p-4">
                <p className="text-xs text-neutral-400">Net Worth</p>
                <p className="mt-1 text-2xl font-semibold">
                  {currencySymbol}{netWorth.toLocaleString()}
                </p>
              </div>
            </section>

            <section className="hidden gap-3 md:grid md:grid-cols-3 lg:grid-cols-5">
              <button
                type="button"
                onClick={openIncomeForm}
                className="rounded-2xl bg-green-500 p-4 text-left font-semibold text-black"
              >
                + Add Income
              </button>

              <button
                type="button"
                onClick={openExpenseForm}
                className="rounded-2xl bg-red-500 p-4 text-left font-semibold text-black"
              >
                - Add Expense
              </button>

              <button
                type="button"
                onClick={openTransferForm}
                className="rounded-2xl border border-blue-500 p-4 text-left font-semibold text-blue-400"
              >
                Transfer
              </button>

              <button
                type="button"
                onClick={openLentForm}
                className="rounded-2xl border border-green-500 p-4 text-left font-semibold text-green-400"
              >
                Lent
              </button>

              <button
                type="button"
                onClick={openBorrowedForm}
                className="rounded-2xl border border-red-500 p-4 text-left font-semibold text-red-400"
              >
                Borrowed
              </button>
            </section>

            <section className="rounded-3xl bg-neutral-900 p-5">
              <h3 className="mb-4 text-lg font-semibold">This Month</h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Income</span>
                  <span className="text-green-400">
                    +{currencySymbol}{monthlyIncome.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-400">Hours Worked</span>
                  <span>{monthlyHours.toLocaleString()}h</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-400">Expenses</span>
                  <span className="text-red-400">
                    -{currencySymbol}{monthlyExpenses.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between border-t border-neutral-800 pt-3">
                  <span className="font-medium">Remaining</span>
                  <span className="font-semibold">
                    {currencySymbol}{remaining.toLocaleString()}
                  </span>
                </div>
              </div>
            </section>

            <div className="hidden lg:block">
              <RecentActivity
                state={state}
                showAll={showAllRecentActivity}
                onToggleShowAll={() =>
                  setShowAllRecentActivity(!showAllRecentActivity)
                }
              />
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-green-500/30 bg-neutral-900 p-5">
              <p className="text-sm text-neutral-400">Spend This Month</p>
              <h3 className="mt-2 text-3xl font-bold text-green-400">
                {currencySymbol}{spendThisMonth.toLocaleString()}
              </h3>
              <p className="mt-2 text-sm text-neutral-500">
                {spendTransferCount} expense{spendTransferCount === 1 ? "" : "s"} this month
              </p>
            </section>

            <Statistics state={state} />

            <section className="space-y-3 rounded-3xl bg-neutral-900 p-5">
              <h3 className="text-lg font-semibold">Savings Buckets</h3>
              {savingsBucketBalances.map((bucket) => (
                <div key={bucket.id} className="rounded-2xl bg-neutral-800 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-300">{bucket.name}</p>
                    <p className="text-sm text-blue-400">
                      {bucket.progress.toFixed(0)}%
                    </p>
                  </div>
                  <h4 className="mt-2 text-xl font-bold">
                    {currencySymbol}{bucket.currentBalance.toLocaleString()} / {currencySymbol}
                    {bucket.targetAmount.toLocaleString()}
                  </h4>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-700">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${bucket.progress}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setBucketHistory({ type: "savings", id: bucket.id })
                    }
                    className="mt-3 text-sm font-semibold text-blue-300"
                  >
                    History
                  </button>
                </div>
              ))}
            </section>

            <section className="space-y-3 rounded-3xl bg-neutral-900 p-5">
              <h3 className="text-lg font-semibold">Bucket List Trackers</h3>
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
                <p className="text-sm text-purple-200">Shared Rollover Jar</p>
                <h4 className="mt-2 text-2xl font-bold">
                  {currencySymbol}{sharedRolloverJar.available.toLocaleString()}
                </h4>
                <p className="mt-2 text-xs text-neutral-400">
                  {currencySymbol}{sharedRolloverJar.previousBalance.toLocaleString()} previous + {currencySymbol}
                  {sharedRolloverJar.monthlyAllocation.toLocaleString()} allocated - {currencySymbol}
                  {sharedRolloverJar.spentThisMonth.toLocaleString()} spent
                </p>
              </div>
              {trackerSummaries.map((tracker) => (
                <div key={tracker.id} className="rounded-2xl bg-neutral-800 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-300">{tracker.name}</p>
                    <p className="text-sm text-purple-300">
                      {tracker.progress.toFixed(0)}%
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-neutral-400">
                    {currencySymbol}{tracker.spentThisMonth.toLocaleString()} spent of {currencySymbol}
                    {tracker.monthlyBudget.toLocaleString()}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setBucketHistory({ type: "tracker", id: tracker.id })
                    }
                    className="mt-3 text-sm font-semibold text-purple-300"
                  >
                    History
                  </button>
                </div>
              ))}
            </section>

            {bucketHistory && (
              <section className="rounded-3xl bg-neutral-900 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-400">Bucket History</p>
                    <h3 className="text-lg font-semibold">
                      {selectedSavingsHistory?.name || selectedTrackerHistory?.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBucketHistory(null)}
                    className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-neutral-300"
                  >
                    Close
                  </button>
                </div>

                {selectedTrackerHistory && (
                  <div className="mb-4 grid gap-2 rounded-2xl bg-neutral-800 p-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-neutral-500">Monthly cap</p>
                      <p className="font-semibold">
                        {currencySymbol}{selectedTrackerHistory.monthlyBudget.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Spent this month</p>
                      <p className="font-semibold">
                        {currencySymbol}{selectedTrackerHistory.spentThisMonth.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Shared jar balance</p>
                      <p className="font-semibold">
                        {currencySymbol}{sharedRolloverJar.previousBalance.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-neutral-500">Available from jar</p>
                      <p className="font-semibold">
                        {currencySymbol}{sharedRolloverJar.available.toLocaleString()}
                      </p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-neutral-500">Monthly result</p>
                      <p className="font-semibold">
                        {currencySymbol}{sharedRolloverJar.monthlyResult.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {selectedSavingsHistory &&
                    savingsHistoryRows.map((row) => (
                      <div key={String(row.id)} className="rounded-2xl bg-neutral-800 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">{row.title}</p>
                            <p className="text-xs text-neutral-500">
                              {row.date} • {row.account}
                            </p>
                            {row.note && (
                              <p className="mt-1 text-xs text-neutral-400">
                                {row.note}
                              </p>
                            )}
                          </div>
                          <p className="font-semibold">
                            {currencySymbol}{row.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}

                  {selectedTrackerHistory &&
                    trackerHistoryRows.map((row) => (
                      <div key={String(row.id)} className="rounded-2xl bg-neutral-800 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold">{row.category}</p>
                            <p className="text-xs text-neutral-500">
                              {row.date} • {row.account} • {row.title}
                            </p>
                            {row.note && (
                              <p className="mt-1 text-xs text-neutral-400">
                                {row.note}
                              </p>
                            )}
                          </div>
                          <p className="font-semibold text-red-300">
                            -{currencySymbol}{row.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}

                  {((selectedSavingsHistory && savingsHistoryRows.length === 0) ||
                    (selectedTrackerHistory && trackerHistoryRows.length === 0)) && (
                    <p className="rounded-2xl bg-neutral-800 p-4 text-sm text-neutral-400">
                      No history yet.
                    </p>
                  )}
                </div>
              </section>
            )}

            <section className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-neutral-900 p-5">
                <p className="text-sm text-neutral-400">Money I Lent</p>
                <p className="mt-2 text-2xl font-bold text-green-400">
                  {currencySymbol}{activeLent.toLocaleString()}
                </p>
                <button
                  type="button"
                  onClick={() => setDetailsView("lent")}
                  className="mt-3 text-sm text-green-400"
                >
                  See More
                </button>
              </div>

              <div className="rounded-3xl bg-neutral-900 p-5">
                <p className="text-sm text-neutral-400">Money I Borrowed</p>
                <p className="mt-2 text-2xl font-bold text-red-400">
                  {currencySymbol}{activeBorrowed.toLocaleString()}
                </p>
                <button
                  type="button"
                  onClick={() => setDetailsView("borrowed")}
                  className="mt-3 text-sm text-red-400"
                >
                  See More
                </button>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-6 lg:hidden">
          <RecentActivity
            state={state}
            showAll={showAllRecentActivity}
            onToggleShowAll={() =>
              setShowAllRecentActivity(!showAllRecentActivity)
            }
          />
        </div>
      </div>

      <FloatingActionMenu
        onAddIncome={openIncomeForm}
        onAddExpense={openExpenseForm}
        onTransfer={openTransferForm}
        onLent={openLentForm}
        onBorrowed={openBorrowedForm}
      />
    </main>
  );
}
