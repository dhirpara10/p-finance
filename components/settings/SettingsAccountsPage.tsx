"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { SelectField } from "@/components/forms/SelectField";
import type { ReactNode } from "react";

type Props = { state: FinanceDashboardState };

export function SettingsAccountsPage({ state }: Props) {
  return (
    <SettingsPanel title="Accounts" onBack={state.goBackSettingsPage}>
      <Field label="Initial Bank balance">
        <input type="text" inputMode="decimal" value={String(state.initialBankBalance)} onChange={(event) => state.setInitialBankBalance(Number(event.target.value.replace(/[^\d.]/g, "")))} className="w-full rounded-2xl bg-neutral-200 p-4 outline-none dark:bg-neutral-800" />
      </Field>
      <Field label="Initial Cash balance">
        <input type="text" inputMode="decimal" value={String(state.initialCashBalance)} onChange={(event) => state.setInitialCashBalance(Number(event.target.value.replace(/[^\d.]/g, "")))} className="w-full rounded-2xl bg-neutral-200 p-4 outline-none dark:bg-neutral-800" />
      </Field>
      <Field label="Monthly reset day">
        <input type="text" inputMode="numeric" value={String(state.monthlyResetDay)} onChange={(event) => state.setMonthlyResetDay(Math.min(Math.max(Number(event.target.value.replace(/\D/g, "")), 1), 28))} className="w-full rounded-2xl bg-neutral-200 p-4 outline-none dark:bg-neutral-800" />
      </Field>
      <SelectField
        label="Currency"
        value={state.currency}
        onChange={(event) => state.setCurrency(event.target.value)}
        options={[
          { value: "AUD", label: "AUD — Australian Dollar ($)" },
          { value: "INR", label: "INR — Indian Rupee (₹)" },
          { value: "USD", label: "USD — US Dollar ($)" },
          { value: "GBP", label: "GBP — British Pound (£)" },
          { value: "EUR", label: "EUR — Euro (€)" },
          { value: "NZD", label: "NZD — New Zealand Dollar ($)" },
          { value: "SGD", label: "SGD — Singapore Dollar ($)" },
          { value: "CAD", label: "CAD — Canadian Dollar ($)" },
        ]}
      />
      <Actions state={state} />
    </SettingsPanel>
  );
}

export function SettingsPanel({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <section className="settings-panel surface-card rounded-3xl border border-white/[0.055] p-5 sm:p-7">
      <div className="mb-7 flex items-center gap-4">
        <button type="button" onClick={onBack} className="rounded-xl bg-black/[0.05] px-3 py-2 text-sm text-neutral-600 transition hover:text-neutral-900 dark:bg-white/[0.04] dark:text-neutral-400 dark:hover:text-white lg:hidden">Back</button>
        <div>
          <p className="section-kicker text-neutral-500">SETTINGS</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">{title}</h2>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
      {children}
    </label>
  );
}

export function Actions({ state }: Props) {
  return (
    <div className="sticky bottom-3 grid grid-cols-2 gap-3 rounded-2xl border border-black/[0.08] bg-white/95 p-3 pt-3 shadow-2xl backdrop-blur dark:border-white/[0.06] dark:bg-[#111419]/95">
      <button type="button" onClick={state.goBackSettingsPage} className="rounded-xl bg-black/[0.06] p-3 text-sm font-semibold text-neutral-700 dark:bg-white/[0.05] dark:text-neutral-300">Cancel</button>
      <button type="button" onClick={state.saveSettings} className="rounded-xl bg-neutral-900 p-3 text-sm font-semibold text-white dark:bg-white dark:text-neutral-950">Save changes</button>
    </div>
  );
}
