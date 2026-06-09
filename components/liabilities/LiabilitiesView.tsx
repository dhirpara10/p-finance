"use client";

import { useMemo, useState } from "react";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import type { Liability, LiabilityType } from "@/lib/types";
import {
  CalendarClock,
  Check,
  CreditCard,
  Landmark,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  WalletCards,
} from "lucide-react";

type Props = { state: FinanceDashboardState };
type LiabilityTab = LiabilityType | "schedule";

const tabItems: { id: LiabilityTab; label: string }[] = [
  { id: "bnpl", label: "BNPL" },
  { id: "credit_card", label: "Credit Cards" },
  { id: "loan", label: "Loans" },
  { id: "schedule", label: "Schedule" },
];

function money(symbol: string, amount: number) {
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function LiabilitiesView({ state }: Props) {
  const [tab, setTab] = useState<LiabilityTab>("bnpl");
  const filtered = state.liabilities.filter((item) => item.type === tab);
  const schedules = useMemo(
    () =>
      [...state.repaymentSchedules].sort(
        (a, b) =>
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      ),
    [state.repaymentSchedules]
  );

  const summaries = [
    ["Total liabilities", state.totalLiabilities, ReceiptText, "text-red-300"],
    ["Upcoming repayments", state.upcomingRepayments, CalendarClock, "text-orange-300"],
    ["BNPL owed", state.bnplOwed, WalletCards, "text-purple-300"],
    ["Credit card owed", state.creditCardOwed, CreditCard, "text-cyan-300"],
    ["Loan owed", state.loanOwed, Landmark, "text-blue-300"],
    ["Safe to spend", state.safeToSpend, Check, "text-emerald-300"],
  ] as const;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-kicker text-red-300/70">LIABILITIES</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Money you owe</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Repayments reduce Bank and debt, without counting the purchase twice.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["bnpl", "credit_card", "loan"] as LiabilityType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => state.openNewLiability(type)}
              className="flex h-11 items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 text-sm font-semibold text-neutral-200 transition hover:bg-white/[0.08]"
            >
              <Plus size={16} />
              {type === "bnpl" ? "BNPL" : type === "credit_card" ? "Card" : "Loan"}
            </button>
          ))}
        </div>
      </div>

      <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-6">
        {summaries.map(([label, value, Icon, color]) => (
          <article key={label} className="surface-card w-[78vw] shrink-0 snap-start rounded-2xl border border-white/[0.055] p-4 sm:w-auto">
            <Icon size={18} className={color} />
            <p className="mt-4 text-xs text-neutral-500">{label}</p>
            <p className={`mt-1 text-xl font-semibold ${color}`}>
              {money(state.currencySymbol, value)}
            </p>
          </article>
        ))}
      </div>

      <div className="no-scrollbar flex gap-2 overflow-x-auto rounded-2xl border border-white/[0.055] bg-white/[0.025] p-1.5">
        {tabItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`min-w-max flex-1 rounded-xl px-4 py-3 text-sm font-medium transition ${
              tab === item.id
                ? "bg-white text-neutral-950"
                : "text-neutral-500 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {state.liabilityError && (
        <p className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
          {state.liabilityError}
        </p>
      )}

      {tab === "schedule" ? (
        <ScheduleList state={state} schedules={schedules} />
      ) : filtered.length ? (
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-3">
          {filtered.map((liability) => (
            <LiabilityCard key={liability.id} state={state} liability={liability} />
          ))}
        </div>
      ) : (
        <div className="surface-card rounded-3xl border border-dashed border-white/[0.08] px-6 py-14 text-center">
          <p className="font-medium text-neutral-300">No {tab === "credit_card" ? "credit cards" : `${tab} liabilities`} yet</p>
          <p className="mt-2 text-sm text-neutral-500">Add one to generate and track its repayment schedule.</p>
        </div>
      )}
    </section>
  );
}

function LiabilityCard({
  state,
  liability,
}: {
  state: FinanceDashboardState;
  liability: Liability;
}) {
  const schedules = state.repaymentSchedules
    .filter((item) => item.liabilityId === liability.id && item.status !== "paid")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const next = schedules[0];
  const progress =
    liability.originalAmount > 0
      ? Math.min(
          Math.max(
            ((liability.originalAmount - liability.outstandingBalance) /
              liability.originalAmount) *
              100,
            0
          ),
          100
        )
      : 0;

  return (
    <article className="surface-card w-[84vw] shrink-0 snap-start rounded-3xl border border-white/[0.055] p-5 md:w-auto">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{liability.name}</p>
          <p className="mt-1 truncate text-sm text-neutral-500">{liability.provider}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${liability.status === "active" ? "bg-orange-400/12 text-orange-300" : "bg-emerald-400/12 text-emerald-300"}`}>
          {liability.status}
        </span>
      </div>
      <p className="mt-6 text-xs text-neutral-500">Outstanding</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-red-300">
        {money(state.currencySymbol, liability.outstandingBalance)}
      </p>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
        <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-emerald-300" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-neutral-500">
        <span>{Math.round(progress)}% paid</span>
        <span>{liability.category || "Uncategorized"}</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-black/20 p-3 text-sm">
        <div>
          <p className="text-xs text-neutral-500">Next payment</p>
          <p className="mt-1 font-semibold">{next ? money(state.currencySymbol, next.amount) : "None"}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-500">Due</p>
          <p className="mt-1 font-semibold">{next?.dueDate || "Settled"}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => state.openEditLiability(liability.id)} className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.05] p-3 text-sm font-medium text-neutral-300"><Pencil size={15} /> Edit</button>
        <button type="button" onClick={() => state.deleteLiability(liability.id)} className="flex items-center justify-center gap-2 rounded-xl bg-white/[0.035] p-3 text-sm font-medium text-neutral-500 hover:text-red-300"><Trash2 size={15} /> Delete</button>
      </div>
    </article>
  );
}

function ScheduleList({
  state,
  schedules,
}: {
  state: FinanceDashboardState;
  schedules: FinanceDashboardState["repaymentSchedules"];
}) {
  return (
    <div className="surface-card rounded-3xl border border-white/[0.055] p-3 sm:p-5">
      <div className="space-y-2">
        {schedules.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-500">No repayments scheduled</p>
        ) : (
          schedules.map((schedule) => {
            const liability = state.liabilities.find((item) => item.id === schedule.liabilityId);
            return (
              <div key={schedule.id} className="flex flex-col gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{liability?.name || "Liability"}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${schedule.status === "paid" ? "bg-emerald-400/12 text-emerald-300" : schedule.status === "missed" ? "bg-red-400/12 text-red-300" : "bg-orange-400/12 text-orange-300"}`}>{schedule.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    Due {schedule.dueDate} · principal {money(state.currencySymbol, schedule.principalAmount)} · interest {money(state.currencySymbol, schedule.interestAmount)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <p className="mr-2 font-semibold">{money(state.currencySymbol, schedule.amount)}</p>
                  {schedule.status !== "paid" && (
                    <button type="button" onClick={() => state.markRepaymentPaid(schedule.id)} className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-semibold text-neutral-950">Mark paid</button>
                  )}
                  <button type="button" onClick={() => state.setEditingScheduleId(schedule.id)} aria-label="Edit repayment" className="rounded-xl bg-white/[0.05] p-2.5 text-neutral-400"><Pencil size={15} /></button>
                  <button type="button" onClick={() => state.deleteRepaymentSchedule(schedule.id)} aria-label="Delete repayment" className="rounded-xl bg-white/[0.035] p-2.5 text-neutral-500 hover:text-red-300"><Trash2 size={15} /></button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
