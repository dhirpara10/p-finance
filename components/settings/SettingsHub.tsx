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
  ["appearance", "Appearance", "Theme preferences"],
] as const;

export function SettingsHub({ state }: SettingsHubProps) {
  return (
    <section className="rounded-3xl bg-neutral-900 p-5">
      <div className="mb-5">
        <p className="text-sm text-emerald-300">Settings</p>
        <h2 className="text-2xl font-bold">Finance App Settings</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {pages.map(([page, title, description]) => (
          <button
            key={page}
            type="button"
            onClick={() => state.navigateToSettingsPage(page)}
            className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-left hover:border-emerald-500/50"
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
