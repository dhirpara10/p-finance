"use client";

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
    <article className="savings-card rounded-3xl border border-sky-400/15 p-5">
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-200 ring-1 ring-sky-300/10">
          <Icon size={20} />
        </span>
        <span className="rounded-full bg-sky-400/10 px-2.5 py-1 text-[11px] font-medium text-sky-200">
          Protected savings
        </span>
      </div>
      <h3 className="mt-5 text-lg font-semibold">{bucket.name}</h3>
      <p className="mt-1 text-xs text-neutral-500">
        Stored as {bucket.linkedStorageLabel}
      </p>
      <div className="mt-5 flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold tracking-tight">
          {currencySymbol}{bucket.currentBalance.toLocaleString()}
        </p>
        <p className="text-xs text-neutral-500">
          of {currencySymbol}{bucket.targetAmount.toLocaleString()}
        </p>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
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
      ? "bg-red-400/10 text-red-200"
      : tracker.status === "Near Limit"
        ? "bg-orange-400/10 text-orange-200"
        : "bg-emerald-400/10 text-emerald-200";
  const frequency = tracker.recurringAllocation?.active
    ? `${currencySymbol}${tracker.recurringAllocation.allocationAmount.toLocaleString()} ${tracker.recurringAllocation.frequency}`
    : `${currencySymbol}${tracker.monthlyAllocation.toLocaleString(undefined, { maximumFractionDigits: 0 })} planned`;

  return (
    <article className="tracker-card rounded-3xl border border-purple-400/15 p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-400/25 to-pink-400/10 text-purple-100 ring-1 ring-purple-300/15">
          <Icon size={22} />
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${statusClass}`}>
          {tracker.status}
        </span>
      </div>
      <h3 className="mt-5 text-lg font-semibold">{tracker.name}</h3>
      <p className="mt-1 truncate text-xs text-purple-200/60">
        {tracker.linkedCategoryIds
          .map((id) => id.replace("category_", "").replaceAll("_", " "))
          .join(", ") || "No categories linked"}
      </p>
      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-neutral-500">Spent this month</p>
          <p className="mt-1 text-xl font-semibold">
            {currencySymbol}{tracker.spentThisMonth.toLocaleString()}
          </p>
        </div>
        <p className="text-right text-xs text-neutral-400">
          {frequency}
          <br />
          <span className="text-neutral-600">allocation</span>
        </p>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-pink-400"
          style={{ width: `${Math.min(100, tracker.progress)}%` }}
        />
      </div>
      <div className="mt-4 flex items-center justify-between text-xs">
        <span className="text-neutral-500">Remaining this month</span>
        <span className={tracker.remainingThisMonth < 0 ? "font-semibold text-red-300" : "font-semibold text-white"}>
          {currencySymbol}{tracker.remainingThisMonth.toLocaleString()}
        </span>
      </div>
      <button
        type="button"
        onClick={onHistory}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-purple-300/10 bg-purple-400/[0.07] px-3 py-2.5 text-sm font-medium text-purple-100 transition hover:bg-purple-400/10"
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
      className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl bg-white/[0.04] px-2 py-2.5 text-[11px] text-neutral-300 transition hover:bg-sky-400/10 hover:text-sky-100"
    >
      <Icon size={15} />
      {label}
    </button>
  );
}
