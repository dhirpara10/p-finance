"use client";

import { Actions, Field, SettingsPanel } from "@/components/settings/SettingsAccountsPage";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type Props = { state: FinanceDashboardState };

export function SettingsIncomeSourcesPage({ state }: Props) {
  return (
    <SettingsPanel title="Income Sources" onBack={state.goBackSettingsPage}>
      <button type="button" onClick={state.addIncomeSourceSetting} className="rounded-2xl bg-neutral-800 px-4 py-3 text-sm font-semibold text-emerald-300">Add source</button>
      {state.incomeSources.map((source, index) => (
        <div key={`${source.name}-${index}`} className="grid gap-3 rounded-2xl bg-neutral-950 p-4 sm:grid-cols-[1fr_8rem_3rem]">
          <Field label="Source">
            <input value={source.name} onChange={(event) => state.updateIncomeSource(index, "name", event.target.value)} className="w-full rounded-2xl bg-neutral-800 p-4 outline-none" />
          </Field>
          <Field label="Rate">
            <input type="number" inputMode="decimal" value={String(source.rate)} onChange={(event) => state.updateIncomeSource(index, "rate", event.target.value)} className="w-full rounded-2xl bg-neutral-800 p-4 outline-none" />
          </Field>
          <button type="button" onClick={() => state.removeIncomeSourceSetting(index)} className="rounded-2xl bg-neutral-800 font-semibold text-neutral-400">x</button>
        </div>
      ))}
      <Actions state={state} />
    </SettingsPanel>
  );
}
