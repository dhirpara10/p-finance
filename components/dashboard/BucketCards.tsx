"use client";

import React from "react";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Compass,
  Dumbbell,
  History,
  Laptop,
  LockKeyhole,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  Vault,
  WalletCards,
} from "lucide-react";

type SavingsSummary = FinanceDashboardState["savingsBucketBalances"][number];
type TrackerSummary = FinanceDashboardState["trackerSummaries"][number];

export function SavingsBucketCard({
  bucket,
  currencySymbol,
  onFund,
  onWithdraw,
  onHistory,
}: {
  bucket: SavingsSummary;
  currencySymbol: string;
  onFund: () => void;
  onWithdraw: () => void;
  onHistory: () => void;
}) {
  const progress = Math.min(100, Math.max(0, bucket.progress));

  const Icon = bucket.id.includes("emergency")
    ? ShieldCheck
    : bucket.id.includes("remittance")
      ? Vault
      : LockKeyhole;

  return (
    <article className="savings-card flex h-full min-h-[320px] min-w-[82vw] shrink-0 snap-start flex-col rounded-3xl border border-sky-400/15 p-5 sm:min-w-[360px] md:min-w-0">
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-200 ring-1 ring-sky-300/10">
          <Icon size={20} />
        </span>

        <span className="shrink-0 rounded-full bg-sky-400/10 px-2.5 py-1 text-[11px] font-medium text-sky-200">
          Protected savings
        </span>
      </div>

      <h3 className="mt-5 text-lg font-semibold">{bucket.name}</h3>

      <p className="mt-1 text-xs text-neutral-500">
        Stored as {bucket.linkedStorageLabel}
      </p>

      <div className="mt-5 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight">
          {currencySymbol}
          {bucket.currentBalance.toLocaleString()}
        </p>

        {bucket.targetAmount > 0 ? (
          <p className="shrink-0 text-xs text-neutral-500">
            of {currencySymbol}
            {bucket.targetAmount.toLocaleString()}
          </p>
        ) : (
          <p className="shrink-0 text-xs text-neutral-500">saved</p>
        )}
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/[0.06]">
        {bucket.targetAmount > 0 ? (
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300"
            style={{ width: `${progress}%` }}
          />
        ) : (
          <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300 opacity-30" style={{ width: `${Math.min(100, progress)}%` }} />
        )}
      </div>

      <div className="mt-auto grid grid-cols-3 gap-2 pt-5">
        <SmallAction icon={ArrowDownToLine} label="Fund" onClick={onFund} />
        <SmallAction icon={ArrowUpFromLine} label="Withdraw" onClick={onWithdraw} />
        <SmallAction icon={History} label="History" onClick={onHistory} />
      </div>
    </article>
  );
}

export function TrackerCard({
  tracker,
  currencySymbol,
  onHistory,
}: {
  tracker: TrackerSummary;
  currencySymbol: string;
  onHistory: () => void;
}) {
  const icons = {
    Compass,
    Sparkles,
    Laptop,
    ShoppingBag,
    Shirt,
    WalletCards,
    Dumbbell,
  } as const;

  const Icon = icons[(tracker.icon || "Compass") as keyof typeof icons] || Compass;

  const statusClass =
    tracker.status === "Overspent"
      ? "border-red-300/15 bg-red-400/10 text-red-200"
      : tracker.status === "Near Limit"
        ? "border-orange-300/15 bg-orange-400/10 text-orange-200"
        : "border-emerald-300/15 bg-emerald-400/10 text-emerald-200";

  const progress = Math.min(100, Math.max(0, tracker.progress));

  const frequency = tracker.recurringAllocation?.active
    ? `${currencySymbol}${tracker.recurringAllocation.allocationAmount.toLocaleString()} ${tracker.recurringAllocation.frequency}`
    : tracker.monthlyAllocation > 0
      ? `${currencySymbol}${tracker.monthlyAllocation.toLocaleString(undefined, { maximumFractionDigits: 0 })} planned`
      : "No budget set";

  return (
    <article className="tracker-card group flex h-full min-h-[320px] w-full flex-col overflow-hidden rounded-3xl border border-purple-400/15 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.24),rgba(24,14,34,0.96)_42%,rgba(12,12,15,0.98)_100%)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-300/25 to-fuchsia-400/10 text-purple-100 ring-1 ring-purple-200/15">
          <Icon size={22} />
        </span>

        <span
          className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-none ${statusClass}`}
        >
          {tracker.status}
        </span>
      </div>

      <div className="mt-5 min-w-0">
        <h3 className="truncate text-lg font-semibold tracking-tight text-white">
          {tracker.name}
        </h3>

        <p className="mt-1 truncate text-xs capitalize text-purple-100/55">
          {tracker.linkedCategoryIds
            .map((id) => id.replace("category_", "").replaceAll("_", " "))
            .join(", ") || "No categories linked"}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-[1fr_auto] items-end gap-4">
        <div className="min-w-0">
          <p className="text-xs text-neutral-500">Spent this month</p>

          <p className="mt-1 text-2xl font-semibold tracking-tight text-white">
            {currencySymbol}
            {tracker.spentThisMonth.toLocaleString()}
          </p>
        </div>

        <div className="max-w-[120px] text-right">
          <p className="text-xs font-medium text-neutral-300">{frequency}</p>
          <p className="mt-0.5 text-[11px] text-neutral-600">allocation</p>
        </div>
      </div>

      <div className="mt-5">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-pink-400"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 text-xs">
          <span className="text-neutral-500">Remaining this month</span>

          {tracker.monthlyCap === null || tracker.monthlyCap === undefined ? (
            <span className="shrink-0 font-semibold text-neutral-500">—</span>
          ) : (
            <span
              className={
                tracker.remainingThisMonth < 0
                  ? "shrink-0 font-semibold text-red-300"
                  : "shrink-0 font-semibold text-white"
              }
            >
              {currencySymbol}
              {tracker.remainingThisMonth.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onHistory}
        className="mt-auto flex min-h-[58px] w-full items-center justify-center gap-2 rounded-xl bg-white/[0.04] px-3 text-[11px] text-neutral-300 transition hover:bg-purple-400/10 hover:text-purple-100"
      >
        <History size={15} />
        View activity
      </button>
    </article>
  );
}

function SmallAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof History;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[58px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl bg-black/[0.05] px-2 py-2.5 text-[11px] text-neutral-600 transition hover:bg-sky-400/10 hover:text-sky-100 dark:bg-white/[0.04] dark:text-neutral-300"
    >
      <Icon size={15} />
      <span className="truncate">{label}</span>
    </button>
  );
}

export function FlipBucketCard({
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
