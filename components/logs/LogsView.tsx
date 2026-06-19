"use client";

import { useState } from "react";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { RecentActivity, formatActivityAmount } from "@/components/dashboard/RecentActivity";
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  HandCoins,
  Plane,
  RefreshCw,
} from "lucide-react";

type Props = { state: FinanceDashboardState };

const TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "income", label: "Income" },
  { value: "expense", label: "Expenses" },
  { value: "transfer", label: "Transfers" },
  { value: "remittance", label: "Remittance" },
  { value: "lent", label: "Lent" },
  { value: "borrowed", label: "Borrowed" },
  { value: "settlement", label: "Settlements" },
  { value: "liability_repayment", label: "Repayments" },
];

export function LogsView({ state }: Props) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description="Every real money movement — income, expenses, transfers, remittances, repayments, and more."
      />

      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search activity…"
          className="w-full rounded-2xl border border-black/[0.09] bg-black/[0.04] px-4 py-3 text-sm outline-none transition placeholder:text-neutral-400 focus:border-emerald-600/50 dark:border-white/[0.08] dark:bg-white/[0.045] dark:placeholder:text-neutral-600 dark:focus:border-emerald-300/50"
        />

        <div className="flex gap-2 overflow-x-auto pb-1">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setTypeFilter(f.value)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                typeFilter === f.value
                  ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30"
                  : "bg-black/[0.05] text-neutral-500 hover:text-neutral-800 dark:bg-white/[0.05] dark:text-neutral-400 dark:hover:text-neutral-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <RecentActivity
        state={state}
        showAll={true}
        onToggleShowAll={() => {}}
        search={search}
        typeFilter={typeFilter}
      />
    </div>
  );
}
