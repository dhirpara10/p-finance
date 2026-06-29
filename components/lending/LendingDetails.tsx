"use client";

import { useState, useEffect } from "react";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { SelectField } from "@/components/forms/SelectField";
import type { LendingTransaction, PersonProfile, RecentActivityItem } from "@/lib/types";
import {
  X,
  ChevronRight,
  ArrowLeft,
  Trash2,
  Pencil,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Users,
  CalendarClock,
  CalendarCheck,
} from "lucide-react";

// ─── sub-types ────────────────────────────────────────────────────────────────

type Props = { state: FinanceDashboardState };

// ─── helpers ──────────────────────────────────────────────────────────────────

function statusColor(netBalance: number) {
  if (netBalance > 0) return { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" };
  if (netBalance < 0) return { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20" };
  return { text: "text-neutral-500", bg: "bg-white/[0.04]", border: "border-white/[0.06]" };
}

function statusLabel(netBalance: number) {
  if (netBalance > 0) return "You will get";
  if (netBalance < 0) return "You owe";
  return "Settled";
}

function txColor(type: LendingTransaction["type"]) {
  if (type === "lent") return { text: "text-emerald-400", bg: "bg-emerald-500/10" };
  if (type === "borrowed") return { text: "text-rose-400", bg: "bg-rose-500/10" };
  return { text: "text-violet-400", bg: "bg-violet-500/10" };
}

function txLabel(type: LendingTransaction["type"]) {
  if (type === "lent") return "Lent";
  if (type === "borrowed") return "Borrowed";
  return "Settlement";
}

function TxIcon({ type }: { type: LendingTransaction["type"] }) {
  if (type === "lent") return <ArrowUpRight size={13} />;
  if (type === "borrowed") return <ArrowDownLeft size={13} />;
  return <RefreshCw size={12} />;
}

// ─── PersonCard ───────────────────────────────────────────────────────────────

function PersonCard({
  profile,
  sym,
  onClick,
}: {
  profile: PersonProfile;
  sym: string;
  onClick: () => void;
}) {
  const col = statusColor(profile.netBalance);
  const label = statusLabel(profile.netBalance);
  const netAbs = Math.abs(profile.netBalance);
  const txCount = profile.transactions.length;
  const latest = profile.transactions[0]?.date ?? "";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 rounded-3xl border border-white/[0.07] bg-[#111214] px-5 py-4 text-left transition hover:border-white/[0.12] hover:bg-[#15171a] active:scale-[0.99]"
    >
      {/* Avatar */}
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-base font-bold ${col.bg} ${col.text}`}>
        {profile.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{profile.name}</p>
        <p className="text-[11px] text-neutral-600 mt-0.5">
          {txCount} transaction{txCount !== 1 ? "s" : ""}
          {latest ? ` · ${latest}` : ""}
        </p>
      </div>

      {/* Right side */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <p className={`text-sm font-bold tabular-nums ${col.text}`}>
          {sym}{netAbs.toLocaleString()}
        </p>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${col.bg} ${col.text} ${col.border}`}>
          {label}
        </span>
      </div>

      <ChevronRight size={16} className="text-neutral-700 shrink-0 -mr-1" />
    </button>
  );
}

// ─── SummaryStatCard ──────────────────────────────────────────────────────────

function SummaryStatCard({ label, value, color, sym }: { label: string; value: number; color: string; sym: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.05] bg-white/[0.03] px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-600">{label}</p>
      <p className={`mt-1.5 text-base font-bold tabular-nums ${color}`}>
        {sym}{value.toLocaleString()}
      </p>
    </div>
  );
}

// ─── Commitment helpers ────────────────────────────────────────────────────────

function commitmentCountdown(dateStr: string): { days: number; label: string; color: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + "T00:00:00");
  const diff = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return { days: 0, label: "Due today", color: "text-rose-400 border-rose-500/30 bg-rose-500/10" };
  if (diff < 0) return { days: diff, label: `Overdue by ${Math.abs(diff)}d`, color: "text-rose-400 border-rose-500/30 bg-rose-500/10" };
  if (diff <= 3) return { days: diff, label: `${diff}d left`, color: "text-rose-400 border-rose-500/30 bg-rose-500/10" };
  if (diff <= 7) return { days: diff, label: `${diff}d left`, color: "text-amber-400 border-amber-500/30 bg-amber-500/10" };
  return { days: diff, label: `${diff}d left`, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" };
}

// ─── LedgerTimeline ───────────────────────────────────────────────────────────

function InlineEditPanel({
  tx,
  sym,
  onSave,
  onCancel,
}: {
  tx: LendingTransaction;
  sym: string;
  onSave: (payload: { amount: number; account: "Bank" | "Cash"; date: string; note: string }) => void;
  onCancel: () => void;
}) {
  const [amount, setAmount] = useState(String(tx.amount));
  const [account, setAccount] = useState<"Bank" | "Cash">((tx.account as "Bank" | "Cash") ?? "Bank");
  const [date, setDate] = useState(tx.date);
  const [note, setNote] = useState(tx.note ?? "");

  const parsedAmount = Number(amount);
  const valid = parsedAmount > 0;

  return (
    <div className="mt-2 rounded-2xl border border-white/[0.08] bg-[#0e0f11] p-4 space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">Edit {txLabel(tx.type)}</p>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] text-neutral-600">Amount ({sym})</label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-white/[0.18] transition"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-neutral-600">Account</label>
          <select
            value={account}
            onChange={(e) => setAccount(e.target.value as "Bank" | "Cash")}
            className="w-full rounded-xl border border-white/[0.07] bg-[#0e0f11] px-3 py-2.5 text-sm text-white outline-none focus:border-white/[0.18] transition"
          >
            <option value="Bank">Bank</option>
            <option value="Cash">Cash</option>
          </select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-neutral-600">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5 text-sm text-white outline-none focus:border-white/[0.18] transition"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] text-neutral-600">Note (optional)</label>
        <input
          type="text"
          placeholder="Add a note…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-neutral-700 outline-none focus:border-white/[0.18] transition"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-white/[0.07] py-2.5 text-xs font-semibold text-neutral-500 hover:text-neutral-300 transition"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!valid}
          onClick={() => onSave({ amount: parsedAmount, account, date, note })}
          className="rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white hover:bg-violet-500 transition disabled:opacity-40"
        >
          Save
        </button>
      </div>
    </div>
  );
}

function LedgerTimeline({
  transactions,
  sym,
  onDelete,
  onEditLent,
  onEditSettlement,
  onExtendCommitment,
}: {
  transactions: LendingTransaction[];
  sym: string;
  onDelete: (id: string | number) => void;
  onEditLent: (tx: LendingTransaction) => void;
  onEditSettlement: (id: string | number, payload: { amount: number; account: "Bank" | "Cash"; date: string; note: string }) => Promise<void>;
  onExtendCommitment: (id: string | number, newDate: string) => Promise<boolean>;
}) {
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [extendingId, setExtendingId] = useState<string | number | null>(null);
  const [extendDate, setExtendDate] = useState("");

  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.05] bg-white/[0.02] p-6 text-center">
        <p className="text-sm text-neutral-600">No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {transactions.map((tx) => {
        const col = txColor(tx.type);
        const label = txLabel(tx.type);
        const isEditing = editingId === tx.id;

        return (
          <div key={`${tx.type}-${tx.id}`} className="rounded-2xl border border-white/[0.05] bg-white/[0.02] overflow-hidden">
            <div className="group flex items-center gap-3 px-4 py-3 transition hover:bg-white/[0.03]">
              {/* Icon */}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${col.bg} ${col.text}`}>
                <TxIcon type={tx.type} />
              </div>

              {/* Left: details — grows, clips, never pushes right side */}
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                  <span className={`shrink-0 text-xs font-semibold ${col.text}`}>{label}</span>
                  {tx.account && (
                    <span className="shrink-0 rounded-full border border-white/[0.07] px-1.5 py-0.5 text-[9px] font-medium text-neutral-600 uppercase tracking-wide">
                      {tx.account}
                    </span>
                  )}
                  {tx.commitmentDate && (tx.type === "lent" || tx.type === "borrowed") && (() => {
                    const cd = commitmentCountdown(tx.commitmentDate);
                    return (
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${cd.color}`}>
                        <CalendarClock size={8} />
                        {cd.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="mt-0.5 truncate text-[11px] text-neutral-600">
                  {tx.date}{tx.note ? ` · ${tx.note}` : ""}
                </p>
              </div>

              {/* Right: amount + actions — always pinned to the right, never wraps */}
              <div className="flex shrink-0 items-center gap-1">
                <p className={`min-w-[60px] text-right text-sm font-bold tabular-nums ${col.text}`}>
                  {sym}{tx.amount.toLocaleString()}
                </p>

                {!tx.legacy && (tx.type === "lent" || tx.type === "borrowed") && (
                  <button
                    type="button"
                    onClick={() => {
                      if (extendingId === tx.id) {
                        setExtendingId(null);
                      } else {
                        setExtendingId(tx.id);
                        setExtendDate(tx.commitmentDate ?? "");
                      }
                    }}
                    title="Set / extend commitment date"
                    className={`flex h-7 w-7 items-center justify-center rounded-xl transition opacity-0 group-hover:opacity-100 ${
                      extendingId === tx.id ? "bg-amber-500/20 text-amber-300 opacity-100" : "text-neutral-600 hover:bg-amber-500/10 hover:text-amber-400"
                    }`}
                  >
                    <CalendarCheck size={12} />
                  </button>
                )}

                {!tx.legacy && (
                  <button
                    type="button"
                    onClick={() => {
                      if (tx.type === "lent" || tx.type === "borrowed") {
                        onEditLent(tx);
                      } else {
                        setEditingId(isEditing ? null : tx.id);
                      }
                    }}
                    className={`flex h-7 w-7 items-center justify-center rounded-xl transition opacity-0 group-hover:opacity-100 ${
                      isEditing ? "bg-white/[0.10] text-white opacity-100" : "text-neutral-600 hover:bg-white/[0.08] hover:text-neutral-300"
                    }`}
                  >
                    <Pencil size={12} />
                  </button>
                )}

                {!tx.legacy && (
                  <button
                    type="button"
                    onClick={() => onDelete(tx.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-xl text-neutral-700 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Inline edit for settlement */}
            {isEditing && tx.type === "settlement" && (
              <div className="px-4 pb-4">
                <InlineEditPanel
                  tx={tx}
                  sym={sym}
                  onSave={async (payload) => {
                    await onEditSettlement(tx.id, payload);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              </div>
            )}

            {/* Inline extend commitment */}
            {extendingId === tx.id && (tx.type === "lent" || tx.type === "borrowed") && (
              <div className="border-t border-white/[0.05] px-4 py-3 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70">
                  {tx.commitmentDate ? "Extend commitment date" : "Set commitment date"}
                </p>
                {/* Quick presets */}
                <div className="flex gap-2 flex-wrap">
                  {[7, 14, 30, 60, 90].map((d) => {
                    const preset = (() => { const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString().split("T")[0]; })();
                    return (
                      <button key={d} type="button" onClick={() => setExtendDate(preset)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-semibold border transition ${
                          extendDate === preset
                            ? "border-amber-400/40 bg-amber-500/15 text-amber-300"
                            : "border-white/[0.07] bg-white/[0.03] text-neutral-500 hover:text-neutral-200"
                        }`}>
                        +{d}d
                      </button>
                    );
                  })}
                  {extendDate && (
                    <button type="button" onClick={() => setExtendDate("")}
                      className="rounded-xl px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:text-rose-400">
                      Clear
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  value={extendDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setExtendDate(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setExtendingId(null)}
                    className="flex-1 rounded-xl border border-white/[0.07] py-2 text-xs font-semibold text-neutral-500 hover:text-white">
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!extendDate}
                    onClick={async () => {
                      const ok = await onExtendCommitment(tx.id, extendDate);
                      if (ok) setExtendingId(null);
                    }}
                    className="flex-1 rounded-xl bg-amber-500 py-2 text-xs font-bold text-black disabled:opacity-40 hover:bg-amber-400 transition"
                  >
                    {tx.commitmentDate ? "Extend" : "Set"}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── SettlementPanel ──────────────────────────────────────────────────────────

function SettlementPanel({
  netAbs,
  sym,
  settlementAmount,
  setSettlementAmount,
  settlementAccount,
  setSettlementAccount,
  settlementDate,
  setSettlementDate,
  settlementNotes,
  setSettlementNotes,
  onSave,
  onCancel,
}: {
  netAbs: number;
  sym: string;
  settlementAmount: string;
  setSettlementAmount: (v: string) => void;
  settlementAccount: "Bank" | "Cash";
  setSettlementAccount: (v: "Bank" | "Cash") => void;
  settlementDate: string;
  setSettlementDate: (v: string) => void;
  settlementNotes: string;
  setSettlementNotes: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [mode, setMode] = useState<"full" | "partial">("full");
  const isFull = mode === "full";

  useEffect(() => {
    if (mode === "full") setSettlementAmount(String(netAbs));
    else setSettlementAmount("");
  }, [mode, netAbs]);

  const parsedAmount = Number(settlementAmount);
  const isValidAmount = parsedAmount > 0 && parsedAmount <= netAbs;

  return (
    <div className="mt-4 rounded-3xl border border-white/[0.08] bg-[#0e0f11] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Settlement</p>
        <button
          type="button"
          onClick={onCancel}
          className="text-[11px] text-neutral-600 hover:text-neutral-400 transition"
        >
          Cancel
        </button>
      </div>

      {/* Full / Partial toggle */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1">
        {(["full", "partial"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-xl py-2.5 text-sm font-semibold capitalize transition ${
              mode === m
                ? "bg-white text-neutral-950 shadow"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {m === "full" ? `Full · ${sym}${netAbs.toLocaleString()}` : "Partial"}
          </button>
        ))}
      </div>

      {/* Amount input — only for partial */}
      {!isFull && (
        <div className="space-y-1">
          <label className="text-[11px] text-neutral-600 font-medium">Amount</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder={`Max ${sym}${netAbs.toLocaleString()}`}
            value={settlementAmount}
            onChange={(e) => setSettlementAmount(e.target.value.replace(/[^\d.]/g, ""))}
            className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-neutral-700 outline-none focus:border-white/[0.18] transition"
          />
          {settlementAmount && !isValidAmount && (
            <p className="text-[11px] text-rose-400 px-1">
              {parsedAmount <= 0 ? "Enter a valid amount" : `Cannot exceed ${sym}${netAbs.toLocaleString()}`}
            </p>
          )}
        </div>
      )}

      {/* Account */}
      <div className="space-y-1">
        <label className="text-[11px] text-neutral-600 font-medium">Account</label>
        <SelectField
          aria-label="Settlement account"
          value={settlementAccount}
          onChange={(e) => setSettlementAccount(e.target.value as "Bank" | "Cash")}
          options={[
            { value: "Bank", label: "Bank" },
            { value: "Cash", label: "Cash" },
          ]}
        />
      </div>

      {/* Date */}
      <div className="space-y-1">
        <label className="text-[11px] text-neutral-600 font-medium">Date</label>
        <input
          type="date"
          value={settlementDate}
          onChange={(e) => setSettlementDate(e.target.value)}
          className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none focus:border-white/[0.18] transition"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <label className="text-[11px] text-neutral-600 font-medium">Note (optional)</label>
        <textarea
          placeholder="Add a note…"
          value={settlementNotes}
          onChange={(e) => setSettlementNotes(e.target.value)}
          rows={2}
          className="w-full rounded-2xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-neutral-700 outline-none focus:border-white/[0.18] transition resize-none"
        />
      </div>

      {/* Confirm */}
      <button
        type="button"
        onClick={onSave}
        disabled={!isFull && !isValidAmount}
        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-violet-600 py-3.5 text-sm font-bold text-white transition hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <CheckCircle2 size={16} />
        Confirm Settlement
      </button>
    </div>
  );
}

// ─── PersonLedgerView ─────────────────────────────────────────────────────────

function PersonLedgerView({
  profile,
  sym,
  isSettlementOpen,
  settlementAmount,
  setSettlementAmount,
  settlementAccount,
  setSettlementAccount,
  settlementDate,
  setSettlementDate,
  settlementNotes,
  setSettlementNotes,
  onSettleClick,
  onSaveSettlement,
  onCancelSettlement,
  onDelete,
  onEditLent,
  onEditSettlement,
  onExtendCommitment,
  onBack,
}: {
  profile: PersonProfile;
  sym: string;
  isSettlementOpen: boolean;
  settlementAmount: string;
  setSettlementAmount: (v: string) => void;
  settlementAccount: "Bank" | "Cash";
  setSettlementAccount: (v: "Bank" | "Cash") => void;
  settlementDate: string;
  setSettlementDate: (v: string) => void;
  settlementNotes: string;
  setSettlementNotes: (v: string) => void;
  onSettleClick: () => void;
  onSaveSettlement: () => void;
  onCancelSettlement: () => void;
  onDelete: (id: string | number) => void;
  onEditLent: (tx: LendingTransaction) => void;
  onEditSettlement: (id: string | number, payload: { amount: number; account: "Bank" | "Cash"; date: string; note: string }) => Promise<void>;
  onExtendCommitment: (id: string | number, newDate: string) => Promise<boolean>;
  onBack: () => void;
}) {
  const netAbs = Math.abs(profile.netBalance);
  const col = statusColor(profile.netBalance);
  const label = statusLabel(profile.netBalance);

  return (
    <div className="space-y-5">
      {/* Back + name header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-neutral-400 transition hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${col.bg} ${col.text}`}>
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-white leading-tight truncate">{profile.name}</p>
            {profile.phone && <p className="text-[11px] text-neutral-600">{profile.phone}</p>}
          </div>
        </div>
        <span className={`inline-flex items-center shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold border ${col.bg} ${col.text} ${col.border}`}>
          {label}
        </span>
      </div>

      {/* Big net balance */}
      <div className="rounded-3xl border border-white/[0.07] bg-[#111214] px-6 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-600">Net balance</p>
        <p className={`mt-2 text-4xl font-bold tracking-tight tabular-nums ${col.text}`}>
          {sym}{netAbs.toLocaleString()}
        </p>

        {/* Stats row */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <SummaryStatCard label="Lent" value={profile.totalLent} color="text-emerald-400" sym={sym} />
          <SummaryStatCard label="Borrowed" value={profile.totalBorrowed} color="text-rose-400" sym={sym} />
          <SummaryStatCard label="Settled" value={profile.totalSettled} color="text-violet-400" sym={sym} />
        </div>
      </div>

      {/* Settle Up button */}
      {profile.netBalance !== 0 && !isSettlementOpen && (
        <button
          type="button"
          onClick={onSettleClick}
          className="w-full rounded-2xl bg-violet-600 py-3.5 text-sm font-bold text-white transition hover:bg-violet-500"
        >
          Settle Up
        </button>
      )}

      {/* Settlement panel */}
      {isSettlementOpen && (
        <SettlementPanel
          netAbs={netAbs}
          sym={sym}
          settlementAmount={settlementAmount}
          setSettlementAmount={setSettlementAmount}
          settlementAccount={settlementAccount}
          setSettlementAccount={setSettlementAccount}
          settlementDate={settlementDate}
          setSettlementDate={setSettlementDate}
          settlementNotes={settlementNotes}
          setSettlementNotes={setSettlementNotes}
          onSave={onSaveSettlement}
          onCancel={onCancelSettlement}
        />
      )}

      {/* Ledger */}
      <div>
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-neutral-600">Ledger</p>
        <LedgerTimeline
          transactions={profile.transactions}
          sym={sym}
          onDelete={onDelete}
          onEditLent={onEditLent}
          onEditSettlement={onEditSettlement}
          onExtendCommitment={onExtendCommitment}
        />
      </div>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export function LendingDetails({ state }: Props) {
  const {
    detailsView,
    setDetailsView,
    personProfiles,
    settlementAmount,
    setSettlementAmount,
    settlementAccount,
    setSettlementAccount,
    settlementDate,
    setSettlementDate,
    settlementNotes,
    setSettlementNotes,
    openSettlement,
    saveSettlement,
    deleteLendingTransaction,
    updateLendingTransaction,
    updateCommitmentDate,
    startEdit,
    currencySymbol,
  } = state;

  const sym = currencySymbol ?? "₹";

  // Local UI state
  const [selectedPersonId, setSelectedPersonId] = useState<string | number | null>(null);
  const [isSettlementOpen, setIsSettlementOpen] = useState(false);

  // All profiles — show everyone, status pill shows direction
  const allProfiles = personProfiles;
  const selectedProfile = allProfiles.find((p) => String(p.id) === String(selectedPersonId));

  function handleSelectPerson(id: string | number) {
    setSelectedPersonId(id);
    setIsSettlementOpen(false);
  }

  function handleBack() {
    setSelectedPersonId(null);
    setIsSettlementOpen(false);
  }

  function handleSettleClick() {
    if (!selectedProfile) return;
    openSettlement(selectedProfile.id, Math.abs(selectedProfile.netBalance));
    setIsSettlementOpen(true);
  }

  async function handleSaveSettlement() {
    await saveSettlement();
    setIsSettlementOpen(false);
  }

  function handleCancelSettlement() {
    setIsSettlementOpen(false);
  }

  function handleEditLent(tx: LendingTransaction) {
    const fakeItem: RecentActivityItem = {
      id: tx.id,
      type: tx.type as "lent" | "borrowed",
      title: "",
      subtitle: "",
      amount: tx.amount,
      date: tx.date,
      source: "lendingTransaction",
    };
    startEdit(fakeItem);
  }

  async function handleEditSettlement(
    id: string | number,
    payload: { amount: number; account: "Bank" | "Cash"; date: string; note: string }
  ) {
    await updateLendingTransaction(id, payload);
  }

  const isLent = detailsView === "lent";
  const title = isLent ? "Money I Lent" : "Money I Borrowed";

  return (
    <div className="no-scrollbar fixed inset-0 z-50 overflow-y-auto" style={{ background: "#08090a" }}>
      <div className="relative mx-auto max-w-lg px-4 pb-16 pt-8">

        {/* Header */}
        <div className="mb-7 flex items-center justify-between">
          <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isLent ? "text-emerald-500" : "text-rose-500"}`}>
              {isLent ? "Receivables" : "Payables"}
            </p>
            <h1 className="text-[24px] font-bold tracking-tight text-white leading-none">
              {selectedProfile ? selectedProfile.name : title}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setDetailsView(null)}
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-neutral-400 transition hover:bg-white/[0.09] hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        {/* Person detail view */}
        {selectedProfile ? (
          <PersonLedgerView
            profile={selectedProfile}
            sym={sym}
            isSettlementOpen={isSettlementOpen}
            settlementAmount={settlementAmount}
            setSettlementAmount={setSettlementAmount}
            settlementAccount={settlementAccount}
            setSettlementAccount={setSettlementAccount}
            settlementDate={settlementDate}
            setSettlementDate={setSettlementDate}
            settlementNotes={settlementNotes}
            setSettlementNotes={setSettlementNotes}
            onSettleClick={handleSettleClick}
            onSaveSettlement={handleSaveSettlement}
            onCancelSettlement={handleCancelSettlement}
            onDelete={deleteLendingTransaction}
            onEditLent={handleEditLent}
            onEditSettlement={handleEditSettlement}
            onExtendCommitment={updateCommitmentDate}
            onBack={handleBack}
          />
        ) : (
          /* People list */
          <>
            {allProfiles.length === 0 ? (
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] py-16 text-center">
                <Users size={32} className="mx-auto mb-3 text-neutral-700" />
                <p className="text-sm font-medium text-neutral-600">No people yet.</p>
                <p className="mt-1 text-xs text-neutral-700">Add a lend or borrow to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allProfiles.map((profile) => (
                  <PersonCard
                    key={profile.id}
                    profile={profile}
                    sym={sym}
                    onClick={() => handleSelectPerson(profile.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
