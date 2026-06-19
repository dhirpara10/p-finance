"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { SettingsPanel } from "@/components/settings/SettingsAccountsPage";
import { SelectField } from "@/components/forms/SelectField";
import { formTokens } from "@/lib/designTokens";
import type { LiabilityChannel, LiabilitySettings } from "@/lib/types";
import { defaultLiabilityChannels } from "@/lib/liabilities";
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

  const channels: LiabilityChannel[] = (state.liabilitySettings.liabilityChannels?.length
    ? state.liabilitySettings.liabilityChannels
    : defaultLiabilityChannels);

  function updateChannel(id: string, patch: Partial<LiabilityChannel>) {
    state.setLiabilitySettings((current: LiabilitySettings) => ({
      ...current,
      liabilityChannels: (current.liabilityChannels || defaultLiabilityChannels).map((ch) =>
        ch.id === id ? { ...ch, ...patch } : ch
      ),
    }));
  }

  return (
    <SettingsPanel title="Liabilities" onBack={state.goBackSettingsPage}>
      <p className="text-sm text-neutral-500">
        Manage the provider and calculation defaults used by all liability forms.
      </p>

      {/* Liability Channel Defaults */}
      <section className="rounded-2xl border border-black/[0.07] bg-black/[0.04] p-4 space-y-4 dark:border-white/[0.055] dark:bg-white/[0.025]">
        <h3 className="font-semibold text-neutral-900 dark:text-white">Liability Channel Defaults</h3>
        {channels.filter((ch) => ch.id === "afterpay" || ch.id === "steppay").map((ch) => (
          <div key={ch.id} className="space-y-3 border-t border-black/[0.05] pt-4 first:border-t-0 first:pt-0 dark:border-white/[0.04]">
            <div className="flex items-center justify-between">
              <span className="font-medium text-neutral-900 dark:text-white">{ch.name}</span>
              <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                Enabled
                <input type="checkbox" checked={ch.enabled} onChange={(e) => updateChannel(ch.id, { enabled: e.target.checked })} />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-xs text-neutral-500">Installments</p>
                <input type="text" inputMode="numeric" value={String(ch.installmentCount ?? 4)} onChange={(e) => updateChannel(ch.id, { installmentCount: Number(e.target.value.replace(/\D/g, "")) || 1 })} className={formTokens.input} />
              </div>
              <div>
                <p className="mb-1 text-xs text-neutral-500">Frequency</p>
                <select value={ch.installmentFrequency ?? "fortnightly"} onChange={(e) => updateChannel(ch.id, { installmentFrequency: e.target.value as LiabilityChannel["installmentFrequency"] })} className={formTokens.input}>
                  <option value="weekly">Weekly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            <label className="flex items-start justify-between gap-3 rounded-xl border border-black/[0.07] bg-black/[0.03] p-3 dark:border-white/[0.05] dark:bg-white/[0.02]">
              <span>
                <span className="block text-sm font-medium text-neutral-900 dark:text-white">No payment upfront</span>
                <span className="block text-xs text-neutral-500 mt-0.5">
                  {ch.noPaymentUpfrontEnabled ?? false
                    ? "First repayment is delayed."
                    : "First repayment is paid on purchase date."}
                </span>
              </span>
              <input type="checkbox" checked={ch.noPaymentUpfrontEnabled ?? false} onChange={(e) => updateChannel(ch.id, { noPaymentUpfrontEnabled: e.target.checked })} className="mt-0.5 shrink-0" />
            </label>
            {(ch.noPaymentUpfrontEnabled ?? false) && (
              <div>
                <p className="mb-1 text-xs text-neutral-500">First payment delay (days)</p>
                <input type="text" inputMode="numeric" value={String(ch.noPaymentUpfrontFirstDelayDays ?? 14)} onChange={(e) => updateChannel(ch.id, { noPaymentUpfrontFirstDelayDays: Number(e.target.value.replace(/\D/g, "")) || 1 })} className={formTokens.input} />
              </div>
            )}
            <div>
              <p className="mb-1 text-xs text-neutral-500">Linked repayment account</p>
              <select value={ch.linkedRepaymentAccount ?? "Bank"} onChange={(e) => updateChannel(ch.id, { linkedRepaymentAccount: e.target.value as "Bank" | "Cash" })} className={formTokens.input}>
                <option value="Bank">Bank</option>
                <option value="Cash">Cash</option>
              </select>
            </div>
            {ch.id === "steppay" && (
              <>
                <div>
                  <p className="mb-1 text-xs text-neutral-500">Minimum split amount ($)</p>
                  <input type="text" inputMode="decimal" value={String(ch.minimumSplitAmount ?? 100)} onChange={(e) => updateChannel(ch.id, { minimumSplitAmount: Number(e.target.value.replace(/[^\d.]/g, "")) })} className={formTokens.input} />
                </div>
                <div>
                  <p className="mb-1 text-xs text-neutral-500">Under-minimum behaviour</p>
                  <select value={ch.underMinimumBehaviour ?? "single_deduction"} onChange={(e) => updateChannel(ch.id, { underMinimumBehaviour: e.target.value as "single_deduction" | "block" })} className={formTokens.input}>
                    <option value="single_deduction">Single deduction</option>
                    <option value="block">Block purchase</option>
                  </select>
                </div>
                {(ch.underMinimumBehaviour ?? "single_deduction") === "single_deduction" && (
                  <div>
                    <p className="mb-1 text-xs text-neutral-500">Single deduction delay (days)</p>
                    <input type="text" inputMode="numeric" value={String(ch.underMinimumDeductionDelayDays ?? 2)} onChange={(e) => updateChannel(ch.id, { underMinimumDeductionDelayDays: Number(e.target.value.replace(/\D/g, "")) })} className={formTokens.input} />
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </section>
      {([
        ["bnplProviders", "BNPL providers"],
        ["creditCardProviders", "Credit card providers"],
        ["loanTypes", "Loan types"],
      ] as const).map(([key, label]) => (
        <section key={key} className="rounded-2xl border border-black/[0.07] bg-black/[0.04] p-4 dark:border-white/[0.055] dark:bg-white/[0.025]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-neutral-900 dark:text-white">{label}</h3>
            <button type="button" onClick={() => addListItem(key)} className="flex items-center gap-1 rounded-xl bg-black/[0.06] px-3 py-2 text-xs text-neutral-700 dark:bg-white/[0.05] dark:text-neutral-300"><Plus size={14} /> Add</button>
          </div>
          <div className="space-y-2">
            {state.liabilitySettings[key].map((item: string, index: number) => (
              <div key={`${key}-${index}`} className="flex gap-2">
                <input value={item} onChange={(event) => updateList(key, index, event.target.value)} className={formTokens.input} />
                <button type="button" onClick={() => removeListItem(key, index)} aria-label={`Delete ${item}`} className="rounded-xl border border-black/[0.09] px-3 text-neutral-500 hover:text-red-500 dark:border-white/[0.06] dark:hover:text-red-300"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        </section>
      ))}
      <SelectField label="Default interest type" value={state.liabilitySettings.defaultInterestType} onChange={(event) => state.setLiabilitySettings((current: LiabilitySettings) => ({ ...current, defaultInterestType: event.target.value as LiabilitySettings["defaultInterestType"] }))} options={[{ value: "simple", label: "Simple" }, { value: "compound", label: "Compound" }]} />
      <SelectField label="Default compounding frequency" value={state.liabilitySettings.defaultCompoundingFrequency} onChange={(event) => state.setLiabilitySettings((current: LiabilitySettings) => ({ ...current, defaultCompoundingFrequency: event.target.value as LiabilitySettings["defaultCompoundingFrequency"] }))} options={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" }]} />
      <section className="rounded-2xl border border-black/[0.07] bg-black/[0.04] p-4 dark:border-white/[0.055] dark:bg-white/[0.025]">
        <h3 className="mb-3 font-semibold text-neutral-900 dark:text-white">Available repayment frequencies</h3>
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
                      ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-950"
                      : "bg-black/[0.05] text-neutral-500 dark:bg-white/[0.04]"
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
      <div className="sticky bottom-3 grid grid-cols-2 gap-3 rounded-2xl border border-black/[0.08] bg-white/95 p-3 shadow-2xl backdrop-blur dark:border-white/[0.06] dark:bg-[#111419]/95">
        <button type="button" onClick={state.goBackSettingsPage} className="rounded-xl bg-black/[0.06] p-3 text-sm font-semibold text-neutral-700 dark:bg-white/[0.05] dark:text-neutral-300">Cancel</button>
        <button type="button" onClick={async () => { const saved = await state.saveLiabilitySettings(); if (saved) state.goBackSettingsPage(); }} className="rounded-xl bg-neutral-900 p-3 text-sm font-semibold text-white dark:bg-white dark:text-neutral-950">Save changes</button>
      </div>
    </SettingsPanel>
  );
}
