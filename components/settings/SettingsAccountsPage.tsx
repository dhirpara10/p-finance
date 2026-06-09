"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { SelectField } from "@/components/forms/SelectField";
import type { ReactNode } from "react";

type Props = { state: FinanceDashboardState };

export function SettingsAccountsPage({ state }: Props) {
  return (
    <SettingsPanel title="Accounts" onBack={state.goBackSettingsPage}>
      <Field label="Initial Bank balance">
        <input type="number" value={String(state.initialBankBalance)} onChange={(event) => state.setInitialBankBalance(Number(event.target.value))} className="w-full rounded-2xl bg-neutral-800 p-4 outline-none" />
      </Field>
      <Field label="Initial Cash balance">
        <input type="number" value={String(state.initialCashBalance)} onChange={(event) => state.setInitialCashBalance(Number(event.target.value))} className="w-full rounded-2xl bg-neutral-800 p-4 outline-none" />
      </Field>
      <Field label="Monthly reset day">
        <input type="number" min={1} max={28} value={String(state.monthlyResetDay)} onChange={(event) => state.setMonthlyResetDay(Math.min(Math.max(Number(event.target.value), 1), 28))} className="w-full rounded-2xl bg-neutral-800 p-4 outline-none" />
      </Field>
      <SelectField
        label="Currency"
        value={state.currency}
        onChange={(event) => state.setCurrency(event.target.value)}
        options={[
          { value: "AUD", label: "AUD" },
          { value: "USD", label: "USD" },
          { value: "GBP", label: "GBP" },
          { value: "EUR", label: "EUR" },
        ]}
      />
      <Actions state={state} />
    </SettingsPanel>
  );
}

export function SettingsPanel({
  title,
  description = "Manage this part of your finance workspace.",
  onBack,
  children,
}: {
  title: string;
  description?: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <section className="settings-panel surface-card rounded-3xl border border-white/[0.055] p-5 sm:p-7">
      <div className="mb-7 flex items-center gap-4">
        <button type="button" onClick={onBack} className="rounded-xl bg-white/[0.04] px-3 py-2 text-sm text-neutral-400 transition hover:text-white lg:hidden">Back</button>
        <div>
          <p className="section-kicker text-neutral-500">SETTINGS</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-neutral-300">{label}</span>
      {children}
    </label>
  );
}

export function Actions({ state }: Props) {
  return (
    <div className="sticky bottom-3 grid grid-cols-2 gap-3 rounded-2xl border border-white/[0.06] bg-[#111419]/95 p-3 pt-3 shadow-2xl backdrop-blur">
      <button type="button" onClick={state.goBackSettingsPage} className="rounded-xl bg-white/[0.05] p-3 text-sm font-semibold text-neutral-300">Cancel</button>
      <button type="button" onClick={state.saveSettings} className="rounded-xl bg-white p-3 text-sm font-semibold text-neutral-950">Save changes</button>
    </div>
  );
}
