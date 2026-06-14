"use client";

import { useState } from "react";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { PageHeader } from "@/components/dashboard/PageHeader";

type SettingsHubProps = { state: FinanceDashboardState };

const pages = [
  ["accounts", "Accounts", "Bank, cash, currency, reset day"],
  ["buckets", "Buckets", "Savings buckets and bucket-list trackers"],
  ["categories", "Categories", "Expense categories and tracker links"],
  ["income", "Income", "Income sources and hourly rates"],
  ["security", "Security", "Passcode settings"],
  ["notifications", "Notifications", "Daily reminders"],
  ["recurring", "Recurring Expenses", "Upcoming rules, pause, edit, or cancel"],
  ["liabilities", "Liabilities", "BNPL, cards, loans, and repayment defaults"],
  ["appearance", "Appearance", "Theme preferences"],
] as const;

export function SettingsHub({ state }: SettingsHubProps) {
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [resetting, setResetting] = useState(false);

  async function confirmReset() {
    setResetting(true);
    try {
      await state.handleResetAllData();
      setResetStep(0);
    } catch {
      // error already alerted inside handleResetAllData
    } finally {
      setResetting(false);
    }
  }

  return (
    <section className="surface-card rounded-3xl border border-white/[0.055] p-5 sm:p-7">
      <div className="mb-5">
        <PageHeader
          title="Settings"
          description="Accounts, planning, reminders, and security in one place."
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {pages.map(([page, title, description]) => (
          <button
            key={page}
            type="button"
            onClick={() => state.navigateToSettingsPage(page)}
            className="rounded-2xl border border-white/[0.055] bg-white/[0.025] p-4 text-left transition hover:border-white/[0.12] hover:bg-white/[0.04]"
          >
            <span className="block font-semibold">{title}</span>
            <span className="mt-1 block text-sm text-neutral-500">
              {description}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-8 border-t border-white/[0.055] pt-6">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-neutral-600">Danger zone</p>
        {resetStep === 0 && (
          <button
            type="button"
            onClick={() => setResetStep(1)}
            className="rounded-2xl border border-red-500/25 bg-red-500/5 px-5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
          >
            Reset All Data
          </button>
        )}
        {resetStep === 1 && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
            <p className="font-semibold text-red-300">Are you sure?</p>
            <p className="text-sm text-neutral-400">This will permanently delete all financial records — income, expenses, transfers, loans, BNPL, lending history, and more. Your settings, categories, goals, and passcode will be kept.</p>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setResetStep(2)}
                className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/30"
              >
                Yes, continue
              </button>
              <button
                type="button"
                onClick={() => setResetStep(0)}
                className="rounded-xl bg-white/[0.05] px-4 py-2 text-sm font-semibold text-neutral-400 hover:bg-white/[0.08]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {resetStep === 2 && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/8 p-4 space-y-3">
            <p className="font-semibold text-red-200">Final confirmation</p>
            <p className="text-sm text-neutral-400">Click the button below to permanently erase all transaction data. This cannot be undone.</p>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={confirmReset}
                disabled={resetting}
                className="rounded-xl bg-red-600 px-5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {resetting ? "Resetting…" : "DELETE ALL DATA"}
              </button>
              <button
                type="button"
                onClick={() => setResetStep(0)}
                className="rounded-xl bg-white/[0.05] px-4 py-2 text-sm font-semibold text-neutral-400 hover:bg-white/[0.08]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
