"use client";

import { useState } from "react";
import { FloatingActionMenu } from "@/components/dashboard/FloatingActionMenu";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import Statistics from "@/components/dashboard/Statistics";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type DashboardLayoutProps = { state: FinanceDashboardState; };

export function DashboardLayout({ state }: DashboardLayoutProps) {
  const { currencySymbol, totalMoney, usableBalance, cashBalance, netWorth, setShowSettingsForm, lockApp, setShowIncomeForm, setShowExpenseForm, setShowTransferForm, setShowLentForm, setShowBorrowedForm, monthlyIncome, monthlyHours, monthlyExpenses, remaining, spendThisMonth, spendTransferCount, emergencyProgress, emergencySaved, emergencyGoal, debtRepaymentProgress, debtRepaymentSaved, debtRepaymentGoal, remittanceProgress, remittanceSaved, remittanceGoal, activeLent, activeBorrowed, setDetailsView } = state;
  const [showAllRecentActivity, setShowAllRecentActivity] = useState(false);

  const openIncomeForm = () => setShowIncomeForm(true);
  const openExpenseForm = () => setShowExpenseForm(true);
  const openTransferForm = () => setShowTransferForm(true);
  const openLentForm = () => setShowLentForm(true);
  const openBorrowedForm = () => setShowBorrowedForm(true);

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
                  <p className="text-xs text-neutral-400">Usable Balance</p>
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

            <section className="rounded-3xl bg-neutral-900 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-400">Emergency Fund</p>
                <p className="text-sm text-green-400">
                  {emergencyProgress.toFixed(0)}%
                </p>
              </div>

              <h3 className="mt-2 text-2xl font-bold">
                {currencySymbol}{emergencySaved.toLocaleString()} / {currencySymbol}
                {emergencyGoal.toLocaleString()}
              </h3>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${emergencyProgress}%` }}
                />
              </div>
            </section>

            <section className="rounded-3xl bg-neutral-900 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-400">
                  Debt Repayment Collection
                </p>
                <p className="text-sm text-red-400">
                  {debtRepaymentProgress.toFixed(0)}%
                </p>
              </div>

              <h3 className="mt-2 text-2xl font-bold">
                {currencySymbol}{debtRepaymentSaved.toLocaleString()} / {currencySymbol}
                {debtRepaymentGoal.toLocaleString()}
              </h3>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full rounded-full bg-red-500"
                  style={{ width: `${debtRepaymentProgress}%` }}
                />
              </div>
            </section>

            <section className="rounded-3xl bg-neutral-900 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-400">Remittance Savings</p>
                <p className="text-sm text-blue-400">
                  {remittanceProgress.toFixed(0)}%
                </p>
              </div>

              <h3 className="mt-2 text-2xl font-bold">
                {currencySymbol}{remittanceSaved.toLocaleString()} / {currencySymbol}
                {remittanceGoal.toLocaleString()}
              </h3>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-neutral-800">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${remittanceProgress}%` }}
                />
              </div>
            </section>

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
