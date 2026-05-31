"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faTrash } from "@fortawesome/free-solid-svg-icons";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type DashboardLayoutProps = { state: FinanceDashboardState; };

export function DashboardLayout({ state }: DashboardLayoutProps) {
  const { totalMoney, usableBalance, cashBalance, netWorth, setShowSettingsForm, lockApp, setShowIncomeForm, setShowExpenseForm, setShowTransferForm, setShowLentForm, setShowBorrowedForm, monthlyIncome, monthlyHours, monthlyExpenses, remaining, recentActivity, startEdit, deleteIncome, deleteExpense, deleteTransfer, deleteLent, deleteBorrowed, spendThisMonth, spendTransferCount, emergencyProgress, emergencySaved, emergencyGoal, debtRepaymentProgress, debtRepaymentSaved, activeBorrowed, remittanceProgress, remittanceSaved, remittanceGoal, activeLent, setDetailsView } = state;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
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
                ${totalMoney.toLocaleString()}
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-neutral-800 p-4">
                  <p className="text-xs text-neutral-400">Usable Balance</p>
                  <p className="mt-1 text-xl font-semibold">
                    ${usableBalance.toLocaleString()}
                  </p>
                </div>

                <div className="rounded-2xl bg-neutral-800 p-4">
                  <p className="text-xs text-neutral-400">Cash</p>
                  <p className="mt-1 text-xl font-semibold">
                    ${cashBalance.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-neutral-800 p-4">
                <p className="text-xs text-neutral-400">Net Worth</p>
                <p className="mt-1 text-2xl font-semibold">
                  ${netWorth.toLocaleString()}
                </p>
              </div>
            </section>

            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <button
                type="button"
                onClick={() => setShowIncomeForm(true)}
                className="rounded-2xl bg-green-500 p-4 text-left font-semibold text-black"
              >
                + Add Income
              </button>

              <button
                type="button"
                onClick={() => setShowExpenseForm(true)}
                className="rounded-2xl bg-red-500 p-4 text-left font-semibold text-black"
              >
                - Add Expense
              </button>

              <button
                type="button"
                onClick={() => setShowTransferForm(true)}
                className="rounded-2xl border border-blue-500 p-4 text-left font-semibold text-blue-400"
              >
                Transfer
              </button>

              <button
                type="button"
                onClick={() => setShowLentForm(true)}
                className="rounded-2xl border border-green-500 p-4 text-left font-semibold text-green-400"
              >
                Lent
              </button>

              <button
                type="button"
                onClick={() => setShowBorrowedForm(true)}
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
                    +${monthlyIncome.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-400">Hours Worked</span>
                  <span>{monthlyHours.toLocaleString()}h</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-400">Expenses</span>
                  <span className="text-red-400">
                    -${monthlyExpenses.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between border-t border-neutral-800 pt-3">
                  <span className="font-medium">Remaining</span>
                  <span className="font-semibold">
                    ${remaining.toLocaleString()}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-neutral-900 p-5">
              <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>

              <div className="space-y-3">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-neutral-500">No activity yet.</p>
                ) : (
                  recentActivity.map((item) => {
                    const amountClass =
                      item.type === "income" || item.type === "lent"
                        ? "text-green-400"
                        : item.type === "transfer"
                          ? "text-blue-400"
                          : "text-red-400";

                    const prefix =
                      item.type === "income" || item.type === "lent"
                        ? "+"
                        : item.type === "transfer"
                          ? "↔"
                          : "-";

                    return (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="flex items-center justify-between rounded-2xl bg-neutral-800 p-4"
                      >
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-neutral-400">
                            {item.date} • {item.subtitle}
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
                              className="text-xs text-blue-400"
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (item.type === "income")
                                  deleteIncome(item.id);
                                if (item.type === "expense")
                                  deleteExpense(item.id);
                                if (item.type === "transfer")
                                  deleteTransfer(item.id);
                                if (item.type === "lent") deleteLent(item.id);
                                if (item.type === "borrowed")
                                  deleteBorrowed(item.id);
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
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-3xl border border-green-500/30 bg-neutral-900 p-5">
              <p className="text-sm text-neutral-400">Spend This Month</p>
              <h3 className="mt-2 text-3xl font-bold text-green-400">
                ${spendThisMonth.toLocaleString()}
              </h3>
              <p className="mt-2 text-sm text-neutral-500">
                {spendTransferCount} transfer
                {spendTransferCount === 1 ? "" : "s"} this month
              </p>
            </section>

            <section className="rounded-3xl bg-neutral-900 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-neutral-400">Emergency Fund</p>
                <p className="text-sm text-green-400">
                  {emergencyProgress.toFixed(0)}%
                </p>
              </div>

              <h3 className="mt-2 text-2xl font-bold">
                ${emergencySaved.toLocaleString()} / $
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
                ${debtRepaymentSaved.toLocaleString()} / $
                {activeBorrowed.toLocaleString()}
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
                ${remittanceSaved.toLocaleString()} / $
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
                  ${activeLent.toLocaleString()}
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
                  ${activeBorrowed.toLocaleString()}
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
      </div>
    </main>
  );
}
