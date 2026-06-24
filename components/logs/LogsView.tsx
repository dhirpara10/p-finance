"use client";

import { useState, useMemo } from "react";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ChevronDown, ChevronUp } from "lucide-react";

type Props = { state: FinanceDashboardState };

const ACTION_COLORS = {
  created: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/20",
  updated: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-400/20",
  deleted: "bg-red-500/15 text-red-400 ring-1 ring-red-400/20",
};

const ENTITY_LABELS: Record<string, string> = {
  income: "Income",
  expense: "Expense",
  transfer: "Transfer",
  remittance: "Remittance",
  lent: "Lent",
  borrowed: "Borrowed",
  liability: "Liability",
};

const FIELD_LABELS: Record<string, string> = {
  amount: "Amount",
  source: "Source",
  date: "Date",
  notes: "Notes",
  note: "Note",
  income_type: "Type",
  incomeType: "Type",
  cash_received: "Cash Received",
  cashReceived: "Cash Received",
  incomeCashReceived: "Cash Received",
  category: "Category",
  account: "Account",
  paymentMethod: "Payment method",
  payment_method: "Payment method",
  is_recurring: "Recurring",
  isRecurring: "Recurring",
  added_by: "Added By",
  rate: "Rate",
  incomeRate: "Rate",
  hours: "Hours",
  incomeHours: "Hours",
  affectsAccountBalance: "Affects balance",
  affects_balance: "Affects balance",
};

function formatVal(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

function DiffRow({ field, before, after }: { field: string; before: unknown; after: unknown }) {
  const bStr = formatVal(before);
  const aStr = formatVal(after);
  if (bStr === aStr) return null;
  return (
    <tr className="border-t border-white/[0.04]">
      <td className="py-1.5 pr-4 text-xs text-neutral-500 whitespace-nowrap">
        {FIELD_LABELS[field] ?? field}
      </td>
      <td className="py-1.5 pr-4 text-xs text-red-400 line-through opacity-70">{bStr}</td>
      <td className="py-1.5 text-xs text-emerald-400">{aStr}</td>
    </tr>
  );
}

function LogRow({ log }: { log: FinanceDashboardState["activityLogs"][number] }) {
  const [open, setOpen] = useState(false);
  const hasDiff = log.action === "updated" && (log.beforeValue || log.afterValue);

  const diffFields = useMemo(() => {
    if (!hasDiff) return [];
    const before = (log.beforeValue ?? {}) as Record<string, unknown>;
    const after = (log.afterValue ?? {}) as Record<string, unknown>;
    const allKeys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).filter(
      (k) => !["id", "user_id", "created_at", "updated_at", "createdAt", "updatedAt", "type", "categoryId", "addedBy"].includes(k)
    );
    return allKeys.filter((k) => formatVal(before[k]) !== formatVal(after[k]));
  }, [log, hasDiff]);

  const date = new Date(log.timestamp);
  const dateStr = date.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Action badge */}
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${ACTION_COLORS[log.action] ?? ACTION_COLORS.created}`}>
          {log.action}
        </span>

        {/* Entity type */}
        <span className="shrink-0 rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] text-neutral-400">
          {ENTITY_LABELS[log.entityType] ?? log.entityType}
        </span>

        {/* Description */}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm text-neutral-200">{log.description}</span>
          {hasDiff && diffFields.length > 0 && (
            <span className="truncate text-[11px] text-neutral-500">
              {diffFields.map((f) => {
                const before = (log.beforeValue as Record<string, unknown>)?.[f];
                const after = (log.afterValue as Record<string, unknown>)?.[f];
                const label = FIELD_LABELS[f] ?? f;
                return `${label}: ${formatVal(before)} → ${formatVal(after)}`;
              }).join(" · ")}
            </span>
          )}
        </div>

        {/* Who + when */}
        <div className="shrink-0 text-right">
          <div className="text-xs text-neutral-400">{log.userName || "You"}</div>
          <div className="text-[11px] text-neutral-600">{dateStr} {timeStr}</div>
        </div>

        {/* Expand toggle for updated rows */}
        {hasDiff && diffFields.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 ml-1 rounded-lg p-1 text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-300 transition"
          >
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Before / after diff */}
      {open && hasDiff && diffFields.length > 0 && (
        <div className="border-t border-white/[0.05] px-4 pb-3 pt-2">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-neutral-600">Changes</p>
          <table className="w-full">
            <thead>
              <tr>
                <th className="pb-1 text-left text-[11px] text-neutral-600 font-normal w-28">Field</th>
                <th className="pb-1 text-left text-[11px] text-neutral-600 font-normal">Before</th>
                <th className="pb-1 text-left text-[11px] text-neutral-600 font-normal">After</th>
              </tr>
            </thead>
            <tbody>
              {diffFields.map((field) => (
                <DiffRow
                  key={field}
                  field={field}
                  before={(log.beforeValue as Record<string, unknown>)?.[field]}
                  after={(log.afterValue as Record<string, unknown>)?.[field]}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function LogsView({ state }: Props) {
  const { activityLogs } = state;
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return (activityLogs ?? [])
      .filter((log) => actionFilter === "all" || log.action === actionFilter)
      .filter((log) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          log.description.toLowerCase().includes(q) ||
          log.entityType.toLowerCase().includes(q) ||
          (log.userName ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activityLogs, actionFilter, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="Read-only record of every create, edit, and delete — with before/after values for edits."
      />

      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by description, type, or user…"
          className="w-full rounded-2xl border border-black/[0.09] bg-black/[0.04] px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-purple-600/50 dark:border-white/[0.08] dark:bg-white/[0.045] dark:placeholder:text-neutral-600 dark:focus:border-purple-300/50"
        />

        <div className="flex gap-2">
          {(["all", "created", "updated", "deleted"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActionFilter(f)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                actionFilter === f
                  ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30"
                  : "bg-white/[0.05] text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {f === "all" ? `All (${activityLogs?.length ?? 0})` : f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] py-12 text-center text-sm text-neutral-600">
          No log entries yet. Every create, edit, or delete will appear here.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((log) => (
            <LogRow key={log.id} log={log as any} />
          ))}
        </div>
      )}
    </div>
  );
}
