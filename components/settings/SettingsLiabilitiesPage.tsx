"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { SettingsPanel } from "@/components/settings/SettingsAccountsPage";
import { SelectField } from "@/components/forms/SelectField";
import { formTokens } from "@/lib/designTokens";
import type { LiabilitySettings } from "@/lib/types";
import { Plus, Trash2 } from "lucide-react";

export function SettingsLiabilitiesPage({ state }: { state: FinanceDashboardState }) {
  function updateList(
    key: "bnplProviders" | "creditCardProviders" | "loanTypes",
    index: number,
    value: string
  ) {
    state.setLiabilitySettings((current: LiabilitySettings) => ({
      ...current,
      [key]: current[key].map((item, itemIndex) =>
        itemIndex === index ? value : item
      ),
    }));
  }

  function addListItem(key: "bnplProviders" | "creditCardProviders" | "loanTypes") {
    state.setLiabilitySettings((current: LiabilitySettings) => ({
      ...current,
      [key]: [...current[key], ""],
    }));
  }

  function removeListItem(
    key: "bnplProviders" | "creditCardProviders" | "loanTypes",
    index: number
  ) {
    state.setLiabilitySettings((current: LiabilitySettings) => ({
      ...current,
      [key]: current[key].filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  return (
    <SettingsPanel title="Liabilities" onBack={state.goBackSettingsPage}>
      <p className="text-sm text-neutral-500">
        Manage the provider and calculation defaults used by all liability forms.
      </p>
      {([
        ["bnplProviders", "BNPL providers"],
        ["creditCardProviders", "Credit card providers"],
        ["loanTypes", "Loan types"],
      ] as const).map(([key, label]) => (
        <section key={key} className="rounded-2xl border border-white/[0.055] bg-white/[0.025] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">{label}</h3>
            <button type="button" onClick={() => addListItem(key)} className="flex items-center gap-1 rounded-xl bg-white/[0.05] px-3 py-2 text-xs text-neutral-300"><Plus size={14} /> Add</button>
          </div>
          <div className="space-y-2">
            {state.liabilitySettings[key].map((item: string, index: number) => (
              <div key={`${key}-${index}`} className="flex gap-2">
                <input value={item} onChange={(event) => updateList(key, index, event.target.value)} className={formTokens.input} />
                <button type="button" onClick={() => removeListItem(key, index)} aria-label={`Delete ${item}`} className="rounded-xl border border-white/[0.06] px-3 text-neutral-500 hover:text-red-300"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </section>
      ))}
      <SelectField label="Default interest type" value={state.liabilitySettings.defaultInterestType} onChange={(event) => state.setLiabilitySettings((current: LiabilitySettings) => ({ ...current, defaultInterestType: event.target.value as LiabilitySettings["defaultInterestType"] }))} options={[{ value: "simple", label: "Simple" }, { value: "compound", label: "Compound" }]} />
      <SelectField label="Default compounding frequency" value={state.liabilitySettings.defaultCompoundingFrequency} onChange={(event) => state.setLiabilitySettings((current: LiabilitySettings) => ({ ...current, defaultCompoundingFrequency: event.target.value as LiabilitySettings["defaultCompoundingFrequency"] }))} options={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" }]} />
      <section className="rounded-2xl border border-white/[0.055] bg-white/[0.025] p-4">
        <h3 className="mb-3 font-semibold">Available repayment frequencies</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["weekly", "fortnightly", "monthly", "yearly"] as const).map(
            (frequency) => {
              const active =
                state.liabilitySettings.repaymentFrequencies.includes(frequency);
              return (
                <button
                  key={frequency}
                  type="button"
                  onClick={() =>
                    state.setLiabilitySettings((current: LiabilitySettings) => ({
                      ...current,
                      repaymentFrequencies: active
                        ? current.repaymentFrequencies.filter(
                            (item) => item !== frequency
                          )
                        : [...current.repaymentFrequencies, frequency],
                    }))
                  }
                  className={`rounded-xl px-3 py-3 text-sm font-medium capitalize transition ${
                    active
                      ? "bg-white text-neutral-950"
                      : "bg-white/[0.04] text-neutral-500"
                  }`}
                >
                  {frequency}
                </button>
              );
            }
          )}
        </div>
      </section>
      {state.liabilityError && (
        <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
          {state.liabilityError}
        </p>
      )}
      <div className="sticky bottom-3 grid grid-cols-2 gap-3 rounded-2xl border border-white/[0.06] bg-[#111419]/95 p-3 shadow-2xl backdrop-blur">
        <button type="button" onClick={state.goBackSettingsPage} className="rounded-xl bg-white/[0.05] p-3 text-sm font-semibold text-neutral-300">Cancel</button>
        <button type="button" onClick={async () => { const saved = await state.saveLiabilitySettings(); if (saved) state.goBackSettingsPage(); }} className="rounded-xl bg-white p-3 text-sm font-semibold text-neutral-950">Save changes</button>
      </div>
    </SettingsPanel>
  );
}
