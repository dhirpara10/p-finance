"use client";

import { useState } from "react";
import { FloatingActionMenu } from "@/components/dashboard/FloatingActionMenu";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import Statistics from "@/components/dashboard/Statistics";
import { bucketMatches, categoryIdFromName, getBucketLabel } from "@/lib/buckets";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { ArrowDown, ArrowRightLeft, ArrowUp, BarChart3, Compass, Dumbbell, HandCoins, Home, Laptop, Layers3, List, LockKeyhole, PiggyBank, Settings, Shirt, ShoppingBag, Sparkles, TrendingUp, Wallet, WalletCards } from "lucide-react";
import { SettingsAccountsPage } from "@/components/settings/SettingsAccountsPage";
import { SettingsAppearancePage } from "@/components/settings/SettingsAppearancePage";
import { SettingsBucketHistoryPage } from "@/components/settings/SettingsBucketHistoryPage";
import { SettingsBucketsPage } from "@/components/settings/SettingsBucketsPage";
import { SettingsCategoriesPage } from "@/components/settings/SettingsCategoriesPage";
import { SettingsHub } from "@/components/settings/SettingsHub";
import { SettingsIncomeSourcesPage } from "@/components/settings/SettingsIncomeSourcesPage";
import { SettingsNotificationsPage } from "@/components/settings/SettingsNotificationsPage";
import { SettingsSecurityPage } from "@/components/settings/SettingsSecurityPage";
import { SettingsRecurringExpensesPage } from "@/components/settings/SettingsRecurringExpensesPage";

type DashboardLayoutProps = { state: FinanceDashboardState; };

export function DashboardLayout({ state }: DashboardLayoutProps) {
  const { currencySymbol, usableBalance, netWorth, settingsPage, navigateToSettingsPage, lockApp, setShowIncomeForm, setShowExpenseForm, setShowTransferForm, setShowLentForm, setShowBorrowedForm, monthlyIncome, monthlyHours, monthlyExpenses, remaining, spendThisMonth, spendTransferCount, savingsBucketBalances, trackerSummaries, sharedRolloverJar, transfers, effectiveExpenses, activeLent, activeBorrowed, setDetailsView } = state;
  const [showAllRecentActivity, setShowAllRecentActivity] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "buckets" | "activity" | "stats" | "settings">("home");
  const [bucketHistory, setBucketHistory] = useState<{
    type: "savings" | "tracker";
    id: string;
  } | null>(null);

  const openIncomeForm = () => setShowIncomeForm(true);
  const openExpenseForm = () => setShowExpenseForm(true);
  const openTransferForm = () => setShowTransferForm(true);
  const openLentForm = () => setShowLentForm(true);
  const openBorrowedForm = () => setShowBorrowedForm(true);
  const tabs = [
    { id: "home", label: "Home", icon: Home },
    { id: "buckets", label: "Buckets", icon: Layers3 },
    { id: "activity", label: "Activity", icon: List },
    { id: "stats", label: "Stats", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;
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
    ? effectiveExpenses
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
            <p className="text-xs font-semibold text-emerald-300">PERSONAL FINANCE</p>
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
              onClick={() => {
                setActiveTab("settings");
                navigateToSettingsPage("hub");
              }}
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

        <nav className="mb-6 hidden grid-cols-5 gap-2 rounded-3xl bg-neutral-900 p-2 md:grid">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "settings") navigateToSettingsPage("hub");
                  if (tab.id !== "settings") state.closeSettings();
                }}
                className={`flex items-center justify-center gap-2 rounded-2xl p-3 text-sm font-semibold ${selected ? "bg-emerald-500 text-black" : "text-neutral-400"}`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {activeTab === "settings" && settingsPage ? (
          <SettingsRouter state={state} />
        ) : activeTab === "activity" ? (
          <RecentActivity
            state={state}
            showAll={showAllRecentActivity}
            onToggleShowAll={() =>
              setShowAllRecentActivity(!showAllRecentActivity)
            }
          />
        ) : activeTab === "stats" ? (
          <Statistics state={state} />
        ) : activeTab === "buckets" ? (
          <div className="space-y-6">
            <BucketsView
              state={state}
              bucketHistory={bucketHistory}
              setBucketHistory={setBucketHistory}
              selectedSavingsHistory={selectedSavingsHistory}
              selectedTrackerHistory={selectedTrackerHistory}
              savingsHistoryRows={savingsHistoryRows}
              trackerHistoryRows={trackerHistoryRows}
            />
          </div>
        ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="grid grid-cols-2 gap-3">
              {[
                { label: "Usable Balance", value: usableBalance, helper: "Bank + cash", icon: Wallet, style: "border-emerald-500/25 bg-gradient-to-br from-emerald-500/25 to-neutral-900" },
                { label: "Net Worth", value: netWorth, helper: "Assets minus debt", icon: BarChart3, style: "border-sky-500/25 bg-gradient-to-br from-sky-500/25 to-neutral-900" },
                { label: "Month Remaining", value: remaining, helper: "Income minus spend", icon: TrendingUp, style: "border-lime-500/25 bg-gradient-to-br from-lime-500/25 to-neutral-900" },
                { label: "Jar Available", value: sharedRolloverJar.available, helper: "Shared rollover jar", icon: PiggyBank, style: "border-purple-500/25 bg-gradient-to-br from-purple-500/30 to-neutral-900" },
              ].map((card) => {
                const Icon = card.icon;
                return <div key={card.label} className={`min-h-40 rounded-3xl border p-4 ${card.style}`}><div className="flex items-start justify-between gap-2"><div><p className="text-sm text-neutral-300">{card.label}</p><p className="mt-2 text-2xl font-bold md:text-3xl">{currencySymbol}{card.value.toLocaleString()}</p></div><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><Icon size={21}/></span></div><p className="mt-8 text-sm text-neutral-400">{card.helper}</p></div>;
              })}
            </section>

            <section className="hidden gap-3 md:grid md:grid-cols-3 lg:grid-cols-5">
              <button
                type="button"
                onClick={openIncomeForm}
                className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 p-4 text-left font-semibold text-black"
              >
                <ArrowDown size={20}/> Add Income
              </button>

              <button
                type="button"
                onClick={openExpenseForm}
                className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 p-4 text-left font-semibold text-black"
              >
                <ArrowUp size={20}/> Add Expense
              </button>

              <button
                type="button"
                onClick={openTransferForm}
                className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 p-4 text-left font-semibold text-black"
              >
                <ArrowRightLeft size={20}/> Transfer
              </button>

              <button
                type="button"
                onClick={openLentForm}
                className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-lime-500 to-emerald-400 p-4 text-left font-semibold text-black"
              >
                <HandCoins size={20}/> Lent
              </button>

              <button
                type="button"
                onClick={openBorrowedForm}
                className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 p-4 text-left font-semibold text-black"
              >
                <LockKeyhole size={20}/> Borrowed
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
        )}

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
      <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 gap-1 rounded-3xl border border-neutral-800 bg-neutral-950/95 p-2 shadow-2xl md:hidden">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                if (tab.id === "settings") navigateToSettingsPage("hub");
                if (tab.id !== "settings") state.closeSettings();
              }}
              className={`flex flex-col items-center gap-1 rounded-2xl p-2 text-[11px] font-semibold ${selected ? "bg-emerald-500 text-black" : "text-neutral-400"}`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </main>
  );
}

function SettingsRouter({ state }: DashboardLayoutProps) {
  if (state.settingsPage === "accounts") return <SettingsAccountsPage state={state} />;
  if (state.settingsPage === "buckets") return <SettingsBucketsPage state={state} />;
  if (state.settingsPage === "categories") return <SettingsCategoriesPage state={state} />;
  if (state.settingsPage === "income") return <SettingsIncomeSourcesPage state={state} />;
  if (state.settingsPage === "security") return <SettingsSecurityPage state={state} />;
  if (state.settingsPage === "notifications") return <SettingsNotificationsPage state={state} />;
  if (state.settingsPage === "recurring") return <SettingsRecurringExpensesPage state={state} />;
  if (state.settingsPage === "appearance") return <SettingsAppearancePage state={state} />;
  if (state.settingsPage === "bucket-history") return <SettingsBucketHistoryPage state={state} />;
  return <SettingsHub state={state} />;
}

function BucketsView({
  state,
  bucketHistory,
  setBucketHistory,
  selectedSavingsHistory,
  selectedTrackerHistory,
  savingsHistoryRows,
  trackerHistoryRows,
}: {
  state: FinanceDashboardState;
  bucketHistory: { type: "savings" | "tracker"; id: string } | null;
  setBucketHistory: (value: { type: "savings" | "tracker"; id: string } | null) => void;
  selectedSavingsHistory: any;
  selectedTrackerHistory: any;
  savingsHistoryRows: any[];
  trackerHistoryRows: any[];
}) {
  const { currencySymbol, savingsBucketBalances, trackerSummaries, sharedRolloverJar } = state;
  const trackerIcons = { Compass, Sparkles, Laptop, ShoppingBag, Shirt, WalletCards, Dumbbell } as const;

  return (
    <>
      <section className="rounded-3xl border border-purple-500/20 bg-neutral-900 p-5">
        <p className="text-sm text-purple-200">Featured Shared Rollover Jar</p>
        <h2 className="mt-2 text-3xl font-bold">
          {currencySymbol}{sharedRolloverJar.available.toLocaleString()}
        </h2>
        <p className="mt-2 text-sm text-neutral-400">
          One shared jar for all bucket-list trackers.
        </p>
      </section>

      <section className="space-y-3 rounded-3xl bg-neutral-900 p-5">
        <h2 className="text-xl font-bold">Savings Buckets</h2>
        {savingsBucketBalances.map((bucket) => (
          <div key={bucket.id} className="rounded-2xl bg-neutral-800 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{bucket.name}</p>
              <p className="text-sm text-blue-300">{bucket.progress.toFixed(0)}%</p>
            </div>
            <p className="mt-2 text-sm text-neutral-400">
              {currencySymbol}{bucket.currentBalance.toLocaleString()} / {currencySymbol}
              {bucket.targetAmount.toLocaleString()}
            </p>
            <button type="button" onClick={() => setBucketHistory({ type: "savings", id: bucket.id })} className="mt-3 text-sm font-semibold text-blue-300">History</button>
          </div>
        ))}
      </section>

      <section className="space-y-3 rounded-3xl bg-neutral-900 p-5">
        <h2 className="text-xl font-bold">Bucket List Trackers</h2>
        {trackerSummaries.map((tracker) => (
          <div key={tracker.id} className="rounded-2xl bg-neutral-800 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex gap-3">
                {(() => { const Icon = trackerIcons[(tracker.icon || "Compass") as keyof typeof trackerIcons] || Compass; return <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-300"><Icon size={20}/></span>; })()}
                <div>
                  <p className="font-semibold">{tracker.name}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {tracker.linkedCategoryIds.map((id) => id.replace("category_", "").replaceAll("_", " ")).join(", ") || "No linked categories"}
                  </p>
                </div>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs ${tracker.status === "Overspent" ? "bg-red-500/15 text-red-300" : tracker.status === "Near Limit" ? "bg-orange-500/15 text-orange-300" : "bg-green-500/15 text-green-300"}`}>{tracker.status}</span>
            </div>
            <p className="mt-2 text-sm text-neutral-400">
              {currencySymbol}{tracker.spentThisMonth.toLocaleString()} spent of {currencySymbol}
              {tracker.monthlyBudget.toLocaleString()}
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-700"><div className="h-full rounded-full bg-purple-500" style={{ width: `${Math.min(100, tracker.progress)}%` }}/></div>
            <div className="mt-3 flex items-center justify-between text-xs text-neutral-400"><span>Remaining</span><span className="font-semibold text-white">{currencySymbol}{tracker.remainingThisMonth.toLocaleString()}</span></div>
            <button type="button" onClick={() => setBucketHistory({ type: "tracker", id: tracker.id })} className="mt-3 w-full rounded-xl bg-neutral-700 p-3 text-sm font-semibold text-purple-200">History</button>
          </div>
        ))}
      </section>

      {bucketHistory && (
        <section className="rounded-3xl bg-neutral-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {selectedSavingsHistory?.name || selectedTrackerHistory?.name}
            </h2>
            <button type="button" onClick={() => setBucketHistory(null)} className="rounded-full bg-neutral-800 px-3 py-1 text-sm">Close</button>
          </div>
          {selectedTrackerHistory && (
            <div className="mb-4 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4 text-sm text-neutral-300">
              <p className="mb-2 font-semibold text-purple-200">View Budget Math</p>
              Monthly allocation: {currencySymbol}{selectedTrackerHistory.monthlyBudget.toLocaleString()} · Spending: {currencySymbol}{selectedTrackerHistory.spentThisMonth.toLocaleString()} · Shared jar balance: {currencySymbol}{sharedRolloverJar.available.toLocaleString()} · Monthly result: {currencySymbol}{sharedRolloverJar.monthlyResult.toLocaleString()}
            </div>
          )}
          <div className="space-y-2">
            {(selectedSavingsHistory ? savingsHistoryRows : trackerHistoryRows).map((row) => (
              <div key={String(row.id)} className="rounded-2xl bg-neutral-800 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{row.title || row.category}</p>
                    <p className="text-xs text-neutral-500">{row.date} · {row.account}</p>
                  </div>
                  <p className="font-semibold">{currencySymbol}{row.amount.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
