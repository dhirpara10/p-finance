"use client";

import React, { useEffect, useState } from "react";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { FloatingActionMenu } from "@/components/dashboard/FloatingActionMenu";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { NotificationBell, NotificationPanel } from "@/components/notifications/NotificationPanel";
import Statistics from "@/components/dashboard/Statistics";
import { SavingsBucketCard, TrackerCard } from "@/components/dashboard/BucketCards";
import { SharedJarCard } from "@/components/dashboard/SharedJarCard";
import {
  bucketMatches,
  expenseCategoryId,
  getBucketLabel,
  normalizeCategoryId,
} from "@/lib/buckets";
import {
  Archive,
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  BarChart3,
  ChevronRight,
  CircleDollarSign,
  HandCoins,
  Home,
  Landmark,
  Layers3,
  List,
  Lock,
  Menu,
  PiggyBank,
  Plane,
  ReceiptText,
  ScrollText,
  Search,
  Settings,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { AssetVaultView } from "@/components/vault/AssetVaultView";
import { SettingsAccountsPage } from "@/components/settings/SettingsAccountsPage";
import { SettingsAppearancePage } from "@/components/settings/SettingsAppearancePage";
import { SettingsBucketHistoryPage } from "@/components/settings/SettingsBucketHistoryPage";
import { SettingsBucketsPage } from "@/components/settings/SettingsBucketsPage";
import { SettingsCategoriesPage } from "@/components/settings/SettingsCategoriesPage";
import { SettingsHub } from "@/components/settings/SettingsHub";
import { SettingsIncomeSourcesPage } from "@/components/settings/SettingsIncomeSourcesPage";
import { SettingsNotificationsPage } from "@/components/settings/SettingsNotificationsPage";
import { SettingsRecurringExpensesPage } from "@/components/settings/SettingsRecurringExpensesPage";
import { SettingsSecurityPage } from "@/components/settings/SettingsSecurityPage";
import { SettingsLiabilitiesPage } from "@/components/settings/SettingsLiabilitiesPage";
import { SelectField } from "@/components/forms/SelectField";
import { LiabilitiesView } from "@/components/liabilities/LiabilitiesView";
import { RemittanceView } from "@/components/remittance/RemittanceView";
import { LogsView } from "@/components/logs/LogsView";

type Props = { state: FinanceDashboardState };
type Tab = "home" | "buckets" | "liabilities" | "activity" | "remittance" | "stats" | "settings" | "logs" | "vault";
type NavTab = Exclude<Tab, "settings">;
type BucketHistory = { type: "savings" | "tracker"; id: string } | null;

const tabs: { id: NavTab; label: string; mobileLabel: string; icon: React.ElementType }[] = [
  { id: "home", label: "Home", mobileLabel: "Home", icon: Home },
  { id: "buckets", label: "Buckets", mobileLabel: "Buckets", icon: Layers3 },
  { id: "liabilities", label: "Liabilities", mobileLabel: "Debt", icon: ReceiptText },
  { id: "activity", label: "Activity", mobileLabel: "Activity", icon: List },
  { id: "remittance", label: "Remittance", mobileLabel: "Remit", icon: Plane },
  { id: "stats", label: "Stats", mobileLabel: "Stats", icon: BarChart3 },
  { id: "vault", label: "Asset Vault", mobileLabel: "Vault", icon: Archive },
  { id: "logs", label: "Logs", mobileLabel: "Logs", icon: ScrollText },
];

export function DashboardLayout({ state }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [activitySearch, setActivitySearch] = useState("");
  const [activityType, setActivityType] = useState("all");
  const [bucketHistory, setBucketHistory] = useState<BucketHistory>(null);
  // const [mobileSections, setMobileSections] = useState({
  //   savings: true,
  //   trackers: false,
  //   accounts: false,
  // });

  const openIncome = () => state.setShowIncomeForm(true);
  const openExpense = () => state.setShowExpenseForm(true);
  const openTransfer = () => state.setShowTransferForm(true);
  const openLent = () => state.setShowLentForm(true);
  const openBorrowed = () => state.setShowBorrowedForm(true);

  function selectTab(tab: Tab) {
    setActiveTab(tab);
    setBucketHistory(null);
    state.clearBucketHistory();
    if (tab === "settings") {
      state.closeSettings();
      state.navigateToSettingsPage("hub");
    } else {
      state.closeSettings();
    }
  }

  function openJarAllocation() {
    state.setFromBucket("Bank");
    state.setToBucket("shared_rollover_jar");
    state.setShowTransferForm(true);
  }

  return (
    <main className="page-bottom-clearance min-h-screen overflow-x-clip bg-[var(--background)] text-[var(--foreground)] md:pb-8">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
        <AppHeader state={state} onOpenSettings={() => selectTab("settings")} />
        <DesktopNavigation activeTab={activeTab} onSelect={selectTab} />

        <div className="mt-6">
          {activeTab === "home" && (
            <HomeView
              state={state}
              onIncome={openIncome}
              onExpense={openExpense}
              onTransfer={openTransfer}
              onLent={openLent}
              onBorrowed={openBorrowed}
              onAllocate={openJarAllocation}
              onBuckets={() => selectTab("buckets")}
              onActivity={() => selectTab("activity")}
              showAllActivity={showAllActivity}
              onToggleActivity={() => setShowAllActivity(!showAllActivity)}
              // mobileSections={mobileSections}
              // setMobileSections={setMobileSections}
              bucketHistory={bucketHistory}
              setBucketHistory={setBucketHistory}
            />
          )}
          {activeTab === "buckets" && (
            <BucketsView
              state={state}
              bucketHistory={bucketHistory}
              setBucketHistory={setBucketHistory}
              onAllocate={openJarAllocation}
            />
          )}
          {activeTab === "liabilities" && <LiabilitiesView state={state} />}
          {activeTab === "activity" && (
            <ActivityView
              state={state}
              search={activitySearch}
              setSearch={setActivitySearch}
              type={activityType}
              setType={setActivityType}
              showAll={showAllActivity}
              onToggle={() => setShowAllActivity(!showAllActivity)}
            />
          )}
          {activeTab === "remittance" && <RemittanceView state={state} />}
          {activeTab === "stats" && <Statistics state={state} />}
          {activeTab === "vault" && <AssetVaultView />}
          {activeTab === "logs" && <LogsView state={state} />}
          {activeTab === "settings" && <SettingsWorkspace state={state} />}
        </div>
      </div>

      {activeTab === "home" && (
        <FloatingActionMenu
          onAddIncome={openIncome}
          onAddExpense={openExpense}
          onTransfer={openTransfer}
          onLent={openLent}
          onBorrowed={openBorrowed}
        />
      )}
      <MobileNavigation activeTab={activeTab} onSelect={selectTab} />
    </main>
  );
}

function AppHeader({
  state,
  onOpenSettings,
}: {
  state: FinanceDashboardState;
  onOpenSettings: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">
          Personal Finance
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Money Control
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {new Date().toLocaleString("en-AU", {
            month: "long",
            year: "numeric",
          })}
        </p>
        {state.isUnlocked && (
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            state.currentUser === "spouse" ? "bg-pink-500/15 text-pink-300" : "bg-blue-500/15 text-blue-300"
          }`}>
            {state.currentUser === "spouse" ? state.userNameSpouse : state.userNameMe}
          </span>
        )}
      </div>
      <div className="relative flex items-center gap-2">
        <NotificationBell
          count={state.appNotifications.filter((n) => !n.isRead).length}
          onClick={() => state.setShowNotificationPanel((v: boolean) => !v)}
        />
        {state.showNotificationPanel && (
          <NotificationPanel
            notifications={state.appNotifications}
            onMarkRead={state.markNotificationRead}
            onMarkAllRead={state.markAllNotificationsRead}
            onDelete={state.deleteNotification}
            onClearAll={state.clearAllNotifications}
            onClose={() => state.setShowNotificationPanel(false)}
          />
        )}
        <button
          type="button"
          aria-label="Settings"
          onClick={onOpenSettings}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/[0.08] bg-black/[0.04] text-neutral-600 transition hover:bg-black/[0.07] dark:border-white/[0.06] dark:bg-white/[0.035] dark:text-neutral-300 dark:hover:bg-white/[0.07]"
        >
          <Settings size={18} />
        </button>
        <button
          type="button"
          aria-label="Lock app"
          onClick={state.lockApp}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-black/[0.08] bg-black/[0.04] text-neutral-600 transition hover:bg-black/[0.07] dark:border-white/[0.06] dark:bg-white/[0.035] dark:text-neutral-300 dark:hover:bg-white/[0.07]"
        >
          <Lock size={18} />
        </button>
      </div>
    </header>
  );
}

function DesktopNavigation({
  activeTab,
  onSelect,
}: {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
}) {
  return (
    <nav className="mt-7 hidden grid-cols-8 rounded-2xl border border-black/[0.07] bg-black/[0.03] p-1.5 dark:border-white/[0.05] dark:bg-white/[0.025] md:grid">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const selected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            title={tab.label}
            className={`flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-sm font-medium transition lg:px-3 ${
              selected
                ? "bg-neutral-900 text-white shadow-sm dark:bg-white dark:text-neutral-950"
                : "text-neutral-500 hover:bg-black/[0.04] hover:text-neutral-700 dark:hover:bg-white/[0.04] dark:hover:text-neutral-200"
            }`}
          >
            <Icon size={17} />
            <span className="hidden lg:inline">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function HomeView({
  state,
  onIncome,
  onExpense,
  onTransfer,
  onLent,
  onBorrowed,
  onAllocate,
  onBuckets,
  onActivity,
  showAllActivity,
  onToggleActivity,
  bucketHistory,
  setBucketHistory,
}: {
  state: FinanceDashboardState;
  onIncome: () => void;
  onExpense: () => void;
  onTransfer: () => void;
  onLent: () => void;
  onBorrowed: () => void;
  onAllocate: () => void;
  onBuckets: () => void;
  onActivity: () => void;
  showAllActivity: boolean;
  onToggleActivity: () => void;
  bucketHistory: BucketHistory;
  setBucketHistory: (value: BucketHistory) => void;
}) {
  const activeSavings = state.savingsBucketBalances.filter((bucket) => bucket.active);

  function toggleSavingsHistory(id: string) {
    setBucketHistory(
      bucketHistory?.type === "savings" && bucketHistory.id === id
        ? null
        : { type: "savings", id }
    );
  }

  function toggleTrackerHistory(id: string) {
    setBucketHistory(
      bucketHistory?.type === "tracker" && bucketHistory.id === id
        ? null
        : { type: "tracker", id }
    );
  }

  return (
    <div className="space-y-8">
      <section className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 scroll-smooth sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-4">
        <BalanceCard
          icon={Wallet}
          label="Usable balance"
          value={state.usableBalance}
          helper="After BNPL and card commitments"
          currency={state.currencySymbol}
          tone="emerald"
        />

        <BalanceCard
          icon={Landmark}
          label="Net worth"
          value={state.netWorth}
          helper="Assets minus outstanding debt"
          currency={state.currencySymbol}
          tone="blue"
        />

        <BalanceCard
          icon={state.remaining >= 0 ? TrendingUp : TrendingDown}
          label="Month remaining"
          value={state.remaining}
          helper={`${state.currencySymbol}${state.monthlyIncome.toLocaleString()} in / ${state.currencySymbol}${state.monthlyExpenses.toLocaleString()} out`}
          currency={state.currencySymbol}
          tone={state.remaining >= 0 ? "neutral" : "warning"}
        />

        <BalanceCard
          icon={PiggyBank}
          label="Jar available"
          value={state.sharedRolloverJar.available}
          helper="Shared lifestyle rollover"
          currency={state.currencySymbol}
          tone="purple"
        />
      </section>

      <QuickActions
        onIncome={onIncome}
        onExpense={onExpense}
        onTransfer={onTransfer}
        onLent={onLent}
        onBorrowed={onBorrowed}
      />

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth sm:mx-0 sm:block sm:overflow-visible sm:px-0">
          <SharedJarCard state={state} onAllocate={onAllocate} />
        </div>

        <div className="surface-card rounded-[28px] border border-black/[0.07] p-5 dark:border-white/[0.055]">
          <SectionTitle title="Accounts" subtitle="Your usable money" />

          <div className="mt-5 space-y-3">
            <AccountRow
              icon={Landmark}
              label="Bank"
              value={state.bankBalance}
              currency={state.currencySymbol}
              tone="blue"
            />

            <AccountRow
              icon={CircleDollarSign}
              label="Cash"
              value={state.cashBalance}
              currency={state.currencySymbol}
              tone="orange"
            />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-black/[0.07] pt-5 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => state.setDetailsView("lent")}
              className="text-left"
            >
              <p className="text-xs text-neutral-500">Receivables</p>
              <p className="mt-1 font-semibold text-emerald-300">
                {state.currencySymbol}
                {state.activeLent.toLocaleString()}
              </p>
            </button>

            <button
              type="button"
              onClick={() => state.setDetailsView("borrowed")}
              className="border-l border-black/[0.07] pl-4 text-left dark:border-white/[0.06]"
            >
              <p className="text-xs text-neutral-500">Personal borrowing</p>
              <p className="mt-1 font-semibold text-red-300">
                {state.currencySymbol}
                {state.activeBorrowed.toLocaleString()}
              </p>
            </button>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <SectionTitle
            title="Protected savings"
            subtitle={`${activeSavings.length} real-money goals`}
          />

          <button
            type="button"
            onClick={onBuckets}
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            View all <ChevronRight size={15} />
          </button>
        </div>

        <div className="no-scrollbar  flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 scroll-smooth md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-3">
          {activeSavings.slice(0, 3).map((bucket) => (
            <FlipBucketCard
              key={bucket.id}
              flipped={bucketHistory?.type === "savings" && bucketHistory.id === bucket.id}
              front={
                <SavingsBucketCard
                  bucket={bucket}
                  currencySymbol={state.currencySymbol}
                  onFund={() => {
                    state.setFromBucket("Bank");
                    state.setToBucket(bucket.id);
                    state.setShowTransferForm(true);
                  }}
                  onWithdraw={() => {
                    state.setFromBucket(bucket.id);
                    state.setToBucket("Bank");
                    state.setShowTransferForm(true);
                  }}
                  onHistory={() => toggleSavingsHistory(bucket.id)}
                />
              }
              back={
                <BucketHistoryBack
                  state={state}
                  savings={bucket}
                  onClose={() => setBucketHistory(null)}
                />
              }
            />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <SectionTitle
            title="Lifestyle trackers"
            subtitle={`${state.trackerSummaries.length} virtual spending plans`}
          />

          <button
            type="button"
            onClick={onBuckets}
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            View all <ChevronRight size={15} />
          </button>
        </div>

        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 scroll-smooth md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-3">
          {state.trackerSummaries.slice(0, 3).map((tracker) => (
            <FlipBucketCard
              key={tracker.id}
              flipped={bucketHistory?.type === "tracker" && bucketHistory.id === tracker.id}
              front={
                <TrackerCard
                  tracker={tracker}
                  currencySymbol={state.currencySymbol}
                  onHistory={() => toggleTrackerHistory(tracker.id)}
                />
              }
              back={
                <BucketHistoryBack
                  state={state}
                  tracker={tracker}
                  onClose={() => setBucketHistory(null)}
                />
              }
            />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <SectionTitle title="Recent activity" subtitle="Latest money movement" />

          <button
            type="button"
            onClick={onActivity}
            className="text-sm font-medium text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            View all
          </button>
        </div>

        <RecentActivity
          state={state}
          showAll={showAllActivity}
          onToggleShowAll={onToggleActivity}
        />
      </section>
    </div>
  );
}

function BalanceCard({
  icon: Icon,
  label,
  value,
  helper,
  currency,
  tone,
}: {
  icon: typeof Wallet;
  label: string;
  value: number;
  helper: string;
  currency: string;
  tone: "emerald" | "blue" | "purple" | "neutral" | "warning";
}) {
  const tones = {
    emerald: "from-emerald-400/[0.16] border-emerald-300/15 text-emerald-600 dark:text-emerald-200",
    blue: "from-sky-400/[0.16] border-sky-300/15 text-sky-600 dark:text-sky-200",
    purple: "from-purple-400/[0.16] border-purple-300/15 text-purple-600 dark:text-purple-200",
    neutral: "from-black/[0.04] border-black/[0.06] text-neutral-700 dark:from-white/[0.07] dark:border-white/[0.06] dark:text-neutral-200",
    warning: "from-orange-400/[0.14] border-orange-300/15 text-orange-600 dark:text-orange-200",
  };
  return (
    <article className={`flex min-h-[168px] w-[84vw] shrink-0 snap-start flex-col rounded-[26px] border bg-gradient-to-br to-white dark:to-[#111419] p-5 sm:w-auto sm:min-w-0 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/[0.06] dark:bg-white/[0.07]">
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-5 truncate text-[clamp(1.55rem,3vw,2.15rem)] font-semibold tracking-tight text-neutral-900 dark:text-white">
        {value < 0 ? "-" : ""}{currency}{Math.abs(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </p>
      <p className="mt-auto pt-3 text-xs leading-5 text-neutral-500">{helper}</p>
    </article>
  );
}

function QuickActions({
  onIncome,
  onExpense,
  onTransfer,
  onLent,
  onBorrowed,
}: {
  onIncome: () => void;
  onExpense: () => void;
  onTransfer: () => void;
  onLent: () => void;
  onBorrowed: () => void;
}) {
  const actions = [
    { label: "Income", icon: ArrowDown, onClick: onIncome, tone: "text-emerald-300 bg-emerald-400/10" },
    { label: "Expense", icon: ArrowUp, onClick: onExpense, tone: "text-red-300 bg-red-400/10" },
    { label: "Transfer", icon: ArrowRightLeft, onClick: onTransfer, tone: "text-cyan-300 bg-cyan-400/10" },
    { label: "Lent", icon: HandCoins, onClick: onLent, tone: "text-emerald-200 bg-emerald-400/10" },
    { label: "Borrowed", icon: CircleDollarSign, onClick: onBorrowed, tone: "text-orange-200 bg-orange-400/10" },
  ];
  return (
    <section className="hidden grid-cols-5 gap-3 md:grid">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button key={action.label} type="button" onClick={action.onClick} className="surface-card flex items-center gap-3 rounded-2xl border border-black/[0.07] p-3.5 text-left text-sm font-medium text-neutral-700 transition hover:-translate-y-0.5 hover:border-black/[0.12] dark:border-white/[0.05] dark:text-neutral-200 dark:hover:border-white/[0.1]">
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${action.tone}`}><Icon size={17} /></span>
            {action.label}
          </button>
        );
      })}
    </section>
  );
}

function BucketsView({
  state,
  bucketHistory,
  setBucketHistory,
  onAllocate,
}: {
  state: FinanceDashboardState;
  bucketHistory: BucketHistory;
  setBucketHistory: (value: BucketHistory) => void;
  onAllocate: () => void;
}) {
  const activeSavings = state.savingsBucketBalances.filter((bucket) => bucket.active);

  function toggleSavingsHistory(id: string) {
    setBucketHistory(
      bucketHistory?.type === "savings" && bucketHistory.id === id
        ? null
        : { type: "savings", id }
    );
  }

  function toggleTrackerHistory(id: string) {
    setBucketHistory(
      bucketHistory?.type === "tracker" && bucketHistory.id === id
        ? null
        : { type: "tracker", id }
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader
        title="Buckets"
        description="Protected savings hold real money. Lifestyle trackers organize spending through one shared rollover jar."
      />

      <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth sm:mx-0 sm:block sm:overflow-visible sm:px-0">
        <SharedJarCard state={state} onAllocate={onAllocate} />
      </div>

      <section>
        <SectionTitle
          title="Protected savings"
          subtitle="Real money held away from your usable balance"
        />

        <div className="no-scrollbar mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 scroll-smooth md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-3">
          {activeSavings.map((bucket) => (
            <FlipBucketCard
              key={bucket.id}
              flipped={bucketHistory?.type === "savings" && bucketHistory.id === bucket.id}
              front={
                <SavingsBucketCard
                  bucket={bucket}
                  currencySymbol={state.currencySymbol}
                  onFund={() => {
                    state.setFromBucket("Bank");
                    state.setToBucket(bucket.id);
                    state.setShowTransferForm(true);
                  }}
                  onWithdraw={() => {
                    state.setFromBucket(bucket.id);
                    state.setToBucket("Bank");
                    state.setShowTransferForm(true);
                  }}
                  onHistory={() => toggleSavingsHistory(bucket.id)}
                />
              }
              back={
                <BucketHistoryBack
                  state={state}
                  savings={bucket}
                  onClose={() => setBucketHistory(null)}
                />
              }
            />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle
          title="Lifestyle trackers"
          subtitle="Virtual monthly plans powered by the shared jar"
        />

        <div className="no-scrollbar mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-1 scroll-smooth md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-3">
          {state.trackerSummaries.map((tracker) => (
            <FlipBucketCard
              key={tracker.id}
              flipped={bucketHistory?.type === "tracker" && bucketHistory.id === tracker.id}
              front={
                <TrackerCard
                  tracker={tracker}
                  currencySymbol={state.currencySymbol}
                  onHistory={() => toggleTrackerHistory(tracker.id)}
                />
              }
              back={
                <BucketHistoryBack
                  state={state}
                  tracker={tracker}
                  onClose={() => setBucketHistory(null)}
                />
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function FlipBucketCard({
  flipped,
  front,
  back,
}: {
  flipped: boolean;
  front: React.ReactNode;
  back: React.ReactNode;
}) {
  return (
    <div className={`bucket-flip ${flipped ? "is-flipped" : ""}`}>
      <div className="bucket-flip-inner">
        <div
          aria-hidden={flipped}
          inert={flipped ? true : undefined}
          className="bucket-flip-face bucket-flip-front"
        >
          {front}
        </div>

        <div
          aria-hidden={!flipped}
          inert={!flipped ? true : undefined}
          className="bucket-flip-face bucket-flip-back"
        >
          {back}
        </div>
      </div>
    </div>
  );
}

function BucketHistoryBack({
  state,
  savings,
  tracker,
  onClose,
}: {
  state: FinanceDashboardState;
  savings?: FinanceDashboardState["savingsBucketBalances"][number] | null;
  tracker?: FinanceDashboardState["trackerSummaries"][number] | null;
  onClose: () => void;
}) {
  return (
    <BucketHistoryPanel
      state={state}
      savings={savings}
      tracker={tracker}
      onClose={onClose}
      compact
    />
  );
}

function BucketHistoryPanel({
  state,
  savings,
  tracker,
  onClose,
  compact = false,
}: {
  state: FinanceDashboardState;
  savings: FinanceDashboardState["savingsBucketBalances"][number] | null | undefined;
  tracker: FinanceDashboardState["trackerSummaries"][number] | null | undefined;
  onClose: () => void;
  compact?: boolean;
}) {
  const rows = savings
    ? state.transfers
        .filter(
          (transfer) =>
            bucketMatches(transfer.from_bucket, savings) ||
            bucketMatches(transfer.to_bucket, savings)
        )
        .map((transfer) => ({
          id: transfer.id,
          date: transfer.date,
          title: bucketMatches(transfer.to_bucket, savings)
            ? "Transfer in"
            : "Transfer out",
          detail: getBucketLabel(
            bucketMatches(transfer.from_bucket, savings)
              ? transfer.to_bucket
              : transfer.from_bucket,
            state.savingsBucketBalances
          ),
          amount: transfer.amount,
        }))
    : tracker
      ? state.effectiveExpenses
          .filter((expense) =>
            tracker.linkedCategoryIds
              .map(normalizeCategoryId)
              .includes(expenseCategoryId(expense))
          )
          .map((expense) => ({
            id: expense.id,
            date: expense.date,
            title: expense.category,
            detail: expense.account,
            amount: expense.amount,
          }))
      : [];

  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <section
      className={`surface-card flex ${
        compact ? "h-full" : ""
      } flex-col rounded-[28px] border border-black/[0.07] p-5 dark:border-white/[0.06] sm:p-6`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            History
          </p>

          <h3 className="mt-2 truncate text-xl font-semibold">
            {savings?.name || tracker?.name}
          </h3>
        </div>

        <button
          type="button"
          aria-label="Close history"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-black/[0.05] text-neutral-500 transition hover:bg-black/[0.08] hover:text-neutral-900 dark:bg-white/[0.05] dark:text-neutral-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      {tracker && (
        <div
          className={`mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-purple-400/10 bg-purple-400/[0.05] ${
            compact ? "p-3" : "p-4 sm:grid-cols-4"
          }`}
        >
          <HistoryMetric
            label="Monthly cap"
            value={`${state.currencySymbol}${tracker.monthlyBudget.toLocaleString()}`}
          />
          <HistoryMetric
            label="Tracker spend"
            value={`${state.currencySymbol}${tracker.spentThisMonth.toLocaleString()}`}
          />
          <HistoryMetric
            label="Shared available"
            value={`${state.currencySymbol}${state.sharedRolloverJar.available.toLocaleString()}`}
          />
          <HistoryMetric
            label="Monthly result"
            value={`${state.currencySymbol}${state.sharedRolloverJar.monthlyResult.toLocaleString()}`}
          />
        </div>
      )}

      <div
        className={`no-scrollbar mt-0 min-h-0 ${
          compact ? "flex-1 overflow-y-auto" : ""
        }`}
      >
        {rows.length ? (
          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.05]">
            {rows.map((row) => (
              <div
                key={String(row.id)}
                className="flex items-center justify-between gap-4 py-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.title}</p>
                  <p className="mt-1 truncate text-xs text-neutral-500">
                    {row.date} · {row.detail}
                  </p>
                </div>

                <p className="shrink-0 text-sm font-semibold">
                  {state.currencySymbol}
                  {row.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="flex min-h-[120px] flex-1 items-center justify-center text-center text-sm text-neutral-500">
            No activity yet
          </p>
        )}
      </div>
    </section>
  );
}
function ActivityView({
  state,
  search,
  setSearch,
  type,
  setType,
  showAll,
  onToggle,
}: {
  state: FinanceDashboardState;
  search: string;
  setSearch: (value: string) => void;
  type: string;
  setType: (value: string) => void;
  showAll: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Activity"
        description="Every transaction, newest first."
      />
      <div className="grid gap-3 sm:grid-cols-[1fr_190px]">
        <label className="flex h-12 items-center gap-3 rounded-2xl border border-black/[0.08] bg-black/[0.04] px-4 dark:border-white/[0.06] dark:bg-white/[0.035]">
          <Search size={17} className="text-neutral-500" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search activity" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600" />
        </label>
        <SelectField
          aria-label="Activity type"
          value={type}
          onChange={(event) => setType(event.target.value)}
          options={[
            { value: "all", label: "All activity" },
            { value: "income", label: "Income" },
            { value: "expense", label: "Expenses" },
            { value: "transfer", label: "Transfers" },
            { value: "lent", label: "Lending" },
            { value: "borrowed", label: "Borrowing" },
            { value: "settlement", label: "Settlements" },
            { value: "liability_repayment", label: "Liability repayments" },
          ]}
        />
      </div>
      <RecentActivity state={state} showAll={showAll} onToggleShowAll={onToggle} search={search} typeFilter={type} />
    </div>
  );
}

const settingsItems = [
  ["accounts", "Accounts"],
  ["buckets", "Buckets"],
  ["categories", "Categories"],
  ["income", "Income sources"],
  ["recurring", "Recurring expenses"],
  ["liabilities", "Liabilities"],
  ["notifications", "Notifications"],
  ["security", "Security"],
  ["appearance", "Appearance"],
] as const;

function SettingsWorkspace({ state }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="surface-card hidden h-fit rounded-3xl border border-black/[0.07] p-3 dark:border-white/[0.055] lg:block">
        <div className="px-3 pb-3 pt-2">
          <p className="section-kicker text-neutral-500">PREFERENCES</p>
          <h2 className="mt-2 text-xl font-semibold">Settings</h2>
        </div>
        <nav className="grid grid-cols-1 gap-1">
          {settingsItems.map(([page, label]) => {
            const selected = state.settingsPage === page;
            return (
              <button
                key={page}
                type="button"
                onClick={() => {
                  state.closeSettings();
                  state.navigateToSettingsPage(page);
                }}
                className={`rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  selected ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950" : "text-neutral-500 hover:bg-black/[0.04] hover:text-neutral-700 dark:hover:bg-white/[0.04] dark:hover:text-neutral-200"
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>
      </aside>
      <div className="no-scrollbar min-w-0">
        {(!state.settingsPage || state.settingsPage === "hub") ? (
          <SettingsHub state={state} />
        ) : (
          <SettingsRouter state={state} />
        )}
      </div>
    </div>
  );
}

function SettingsRouter({ state }: Props) {
  if (state.settingsPage === "accounts") return <SettingsAccountsPage state={state} />;
  if (state.settingsPage === "buckets") return <SettingsBucketsPage state={state} />;
  if (state.settingsPage === "categories") return <SettingsCategoriesPage state={state} />;
  if (state.settingsPage === "income") return <SettingsIncomeSourcesPage state={state} />;
  if (state.settingsPage === "security") return <SettingsSecurityPage state={state} />;
  if (state.settingsPage === "notifications") return <SettingsNotificationsPage state={state} />;
  if (state.settingsPage === "recurring") return <SettingsRecurringExpensesPage state={state} />;
  if (state.settingsPage === "liabilities") return <SettingsLiabilitiesPage state={state} />;
  if (state.settingsPage === "appearance") return <SettingsAppearancePage state={state} />;
  if (state.settingsPage === "bucket-history") return <SettingsBucketHistoryPage state={state} />;
  return <SettingsHub state={state} />;
}

const primaryTabs: NavTab[] = ["home", "vault", "liabilities", "activity", "stats"];
const overflowTabs: NavTab[] = ["buckets", "remittance", "logs"];

function MobileNavigation({ activeTab, onSelect }: { activeTab: Tab; onSelect: (tab: Tab) => void }) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const overflowActive = overflowTabs.includes(activeTab as NavTab);

  function handleSelect(tab: Tab) {
    onSelect(tab);
    setDrawerOpen(false);
  }

  return (
    <>
      {/* More drawer backdrop */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setDrawerOpen(false)} />
      )}

      {/* More drawer */}
      {drawerOpen && (
        <div className="safe-bottom-drawer fixed right-4 z-50 w-48 origin-bottom-right rounded-2xl border border-black/[0.10] bg-white/98 p-2 shadow-2xl backdrop-blur-xl dark:border-white/[0.09] dark:bg-[#101318]/98 md:hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          {overflowTabs.map((id) => {
            const tab = tabs.find((t) => t.id === id)!;
            const Icon = tab.icon;
            const selected = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleSelect(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${selected ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950" : "text-neutral-600 hover:bg-black/[0.06] dark:text-neutral-300 dark:hover:bg-white/[0.06]"}`}
              >
                <Icon size={17} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Pill nav bar */}
      <nav className="safe-bottom-nav fixed left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full border border-black/[0.10] bg-white/95 px-2 py-2 shadow-[0_8px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#101318]/95 dark:shadow-[0_8px_40px_rgba(0,0,0,0.55)] md:hidden">
        {primaryTabs.map((id) => {
          const tab = tabs.find((t) => t.id === id)!;
          const Icon = tab.icon;
          const selected = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelect(id)}
              title={tab.label}
              className={`flex h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-300
                ${selected
                  ? "bg-neutral-900 px-4 text-white dark:bg-white dark:text-neutral-950"
                  : "w-10 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
            >
              <Icon size={18} strokeWidth={selected ? 2.2 : 1.8} />
              {selected && (
                <span className="animate-in fade-in slide-in-from-left-1 whitespace-nowrap text-[13px] duration-200">
                  {tab.mobileLabel}
                </span>
              )}
            </button>
          );
        })}

        {/* More / hamburger */}
        <button
          type="button"
          onClick={() => setDrawerOpen((v) => !v)}
          title="More"
          className={`flex h-10 items-center justify-center rounded-full transition-all duration-300
            ${overflowActive
              ? "bg-neutral-900 px-4 text-white dark:bg-white dark:text-neutral-950"
              : drawerOpen
                ? "w-10 bg-black/[0.10] text-neutral-900 dark:bg-white/[0.12] dark:text-white"
                : "w-10 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            }`}
        >
          {overflowActive ? (
            <span className="flex items-center gap-2 text-[13px] font-semibold">
              <Menu size={18} strokeWidth={2.2} />
              More
            </span>
          ) : (
            <div className="relative flex h-[16px] w-[16px] items-center justify-center">
              <span className={`absolute block h-[1.5px] w-[14px] rounded-full bg-current transition-all duration-250 ${drawerOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-[3px]"}`} />
              <span className={`absolute block h-[1.5px] w-[14px] rounded-full bg-current transition-all duration-250 ${drawerOpen ? "opacity-0 scale-x-0" : "top-1/2 -translate-y-1/2"}`} />
              <span className={`absolute block h-[1.5px] w-[14px] rounded-full bg-current transition-all duration-250 ${drawerOpen ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-[3px]"}`} />
            </div>
          )}
        </button>
      </nav>
    </>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return <div><h2 className="text-xl font-semibold tracking-tight">{title}</h2><p className="mt-1 text-sm text-neutral-500">{subtitle}</p></div>;
}

// function CollapsibleSection({
//   title,
//   subtitle,
//   open,
//   onToggle,
//   onViewAll,
//   children,
// }: {
//   title: string;
//   subtitle: string;
//   open: boolean;
//   onToggle: () => void;
//   onViewAll: () => void;
//   children: React.ReactNode;
// }) {
//   return (
//     <section>
//       <div className="mb-4 flex items-center justify-between gap-4">
//         <button type="button" onClick={onToggle} className="flex min-w-0 items-center gap-3 text-left md:pointer-events-none">
//           <span className="md:hidden"><Menu size={17} className="text-neutral-500" /></span>
//           <SectionTitle title={title} subtitle={subtitle} />
//         </button>
//         <button type="button" onClick={onViewAll} className="flex shrink-0 items-center gap-1 text-sm font-medium text-neutral-400 hover:text-white">View all <ChevronRight size={15} /></button>
//       </div>
//       <div className={`${open ? "block" : "hidden"} md:block`}>{children}</div>
//     </section>
//   );
// }

function AccountRow({ icon: Icon, label, value, currency, tone }: { icon: typeof Landmark; label: string; value: number; currency: string; tone: "blue" | "orange" }) {
  return <div className="flex items-center justify-between gap-4 rounded-2xl bg-white/[0.035] p-4"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone === "blue" ? "bg-sky-400/10 text-sky-200" : "bg-orange-400/10 text-orange-200"}`}><Icon size={18} /></span><span className="font-medium">{label}</span></div><span className="font-semibold">{currency}{value.toLocaleString()}</span></div>;
}

function HistoryMetric({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-neutral-500">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;
}
