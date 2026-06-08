"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
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
      <Field label="Currency">
        <select value={state.currency} onChange={(event) => state.setCurrency(event.target.value)} className="w-full rounded-2xl bg-neutral-800 p-4 outline-none">
          <option value="AUD">AUD</option>
          <option value="USD">USD</option>
          <option value="GBP">GBP</option>
          <option value="EUR">EUR</option>
        </select>
      </Field>
      <Actions state={state} />
    </SettingsPanel>
  );
}

export function SettingsPanel({ title, onBack, children }: { title: string; onBack: () => void; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-neutral-900 p-5">
      <button type="button" onClick={onBack} className="mb-4 text-sm text-emerald-300">Back</button>
      <h2 className="mb-5 text-2xl font-bold">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-neutral-400">{label}</span>
      {children}
    </label>
  );
}

export function Actions({ state }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 pt-2">
      <button type="button" onClick={state.goBackSettingsPage} className="rounded-2xl bg-neutral-800 p-4 font-semibold">Back</button>
      <button type="button" onClick={state.saveSettings} className="rounded-2xl bg-emerald-500 p-4 font-semibold text-black">Save</button>
    </div>
  );
}
