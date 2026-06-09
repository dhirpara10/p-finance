"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

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
  return (
    <section className="surface-card rounded-3xl border border-white/[0.055] p-5 sm:p-7">
      <div className="mb-5">
        <p className="section-kicker text-neutral-500">SETTINGS</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Finance preferences</h2>
        <p className="mt-2 text-sm text-neutral-500">Accounts, planning, reminders, and security in one place.</p>
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
    </section>
  );
}
