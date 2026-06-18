"use client";

import { SettingsPanel } from "@/components/settings/SettingsAccountsPage";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import {
  bucketMatches,
  expenseCategoryId,
  getBucketLabel,
  normalizeCategoryId,
} from "@/lib/buckets";

type Props = { state: FinanceDashboardState };

export function SettingsBucketHistoryPage({ state }: Props) {
  const selection = state.settingsBucketHistory;
  const savingsBucket = selection?.type === "savings"
    ? state.savingsBucketBalances.find((bucket) => bucket.id === selection.id)
    : null;
  const tracker = selection?.type === "tracker"
    ? state.trackerSummaries.find((item) => item.id === selection.id)
    : null;

  const rows = savingsBucket
    ? state.transfers
        .filter((transfer) => bucketMatches(transfer.from_bucket, savingsBucket) || bucketMatches(transfer.to_bucket, savingsBucket))
        .map((transfer) => ({
          id: transfer.id,
          date: transfer.date,
          title: bucketMatches(transfer.to_bucket, savingsBucket) ? "Transfer in" : "Transfer out",
          detail: getBucketLabel(bucketMatches(transfer.from_bucket, savingsBucket) ? transfer.to_bucket : transfer.from_bucket, state.savingsBucketBalances),
          note: transfer.notes,
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
            detail: `${expense.account} / Expense`,
            note: expense.notes,
            amount: expense.amount,
          }))
      : [];

  rows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <SettingsPanel title={savingsBucket?.name || tracker?.name || "Bucket History"} onBack={state.goBackSettingsPage}>
      {tracker && (
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
          <p className="font-semibold text-purple-200">Budget Math</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <MathItem label="Tracker cap" value={`${state.currencySymbol}${tracker.monthlyBudget.toLocaleString()}`} />
            <MathItem label="Tracker spending" value={`${state.currencySymbol}${tracker.spentThisMonth.toLocaleString()}`} />
            <MathItem label="Shared jar available" value={`${state.currencySymbol}${state.sharedRolloverJar.available.toLocaleString()}`} />
            <MathItem label="All tracker monthly result" value={`${state.currencySymbol}${state.sharedRolloverJar.monthlyResult.toLocaleString()}`} />
          </div>
          <p className="mt-3 text-xs text-neutral-600 dark:text-neutral-400">This tracker has no separate balance. The available rollover belongs to the one shared jar.</p>
        </div>
      )}
      {savingsBucket && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm">
          <p className="font-semibold text-blue-200">Real money balance</p>
          <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">{state.currencySymbol}{savingsBucket.currentBalance.toLocaleString()}</p>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">Stored as {savingsBucket.linkedStorageLabel}</p>
        </div>
      )}
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={String(row.id)} className="flex items-center justify-between gap-3 rounded-2xl bg-neutral-100 p-4 dark:bg-neutral-950">
            <div>
              <p className="font-semibold text-neutral-900 dark:text-white">{row.title}</p>
              <p className="text-xs text-neutral-500">{row.date} · {row.detail}</p>
              {row.note && <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{row.note}</p>}
            </div>
            <p className="font-semibold text-neutral-900 dark:text-white">{state.currencySymbol}{row.amount.toLocaleString()}</p>
          </div>
        ))}
        {!rows.length && <p className="rounded-2xl bg-neutral-100 p-4 text-sm text-neutral-600 dark:bg-neutral-950 dark:text-neutral-400">No history yet.</p>}
      </div>
    </SettingsPanel>
  );
}

function MathItem({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-neutral-100 p-3 dark:bg-neutral-950"><p className="text-xs text-neutral-500">{label}</p><p className="mt-1 font-semibold text-neutral-900 dark:text-white">{value}</p></div>;
}
