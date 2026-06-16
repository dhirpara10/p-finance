"use client";

import { useState } from "react";
import { AlertCircle, Archive, Plane, Trash2, Plus, X } from "lucide-react";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DateField } from "@/components/forms/DateField";
import { FormField } from "@/components/forms/FormField";
import { ModalContent } from "@/components/forms/ModalContent";
import { ModalFooter } from "@/components/forms/ModalFooter";
import { ModalHeader } from "@/components/forms/ModalHeader";
import { ModalSection } from "@/components/forms/ModalSection";
import { ModalWrapper } from "@/components/forms/ModalWrapper";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { formTokens } from "@/lib/designTokens";

type Props = { state: FinanceDashboardState };

export function RemittanceView({ state }: Props) {
  const {
    remittances,
    showRemittanceForm,
    setShowRemittanceForm,
    remittanceAudAmount,
    setRemittanceAudAmount,
    remittanceExchangeRate,
    setRemittanceExchangeRate,
    remittanceAccount,
    setRemittanceAccount,
    remittanceDate,
    setRemittanceDate,
    remittanceProvider,
    setRemittanceProvider,
    remittanceNotes,
    setRemittanceNotes,
    remittanceIsPreExisting,
    setRemittanceIsPreExisting,
    addRemittance,
    deleteRemittance,
    closeAllForms,
    currencySymbol,
    savingsBucketBalances,
  } = state;

  const remittanceBucket = savingsBucketBalances.find((b) => b.id === "savings_remittance");
  const fundBalance = remittanceBucket?.currentBalance ?? 0;

  const activeRemittances = remittances.filter((r) => !r.preExisting);
  const totalAud = activeRemittances.reduce((sum, r) => sum + r.audAmount, 0);
  const totalInr = activeRemittances.reduce((sum, r) => sum + r.inrAmount, 0);
  const preExistingCount = remittances.filter((r) => r.preExisting).length;
  const rates = activeRemittances.map((r) => r.exchangeRate).filter((r) => r > 0);
  const bestRate = rates.length > 0 ? Math.max(...rates) : null;
  const worstRate = rates.length > 0 ? Math.min(...rates) : null;
  const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : null;

  const inrPreview =
    remittanceAudAmount && remittanceExchangeRate
      ? (parseFloat(remittanceAudAmount) * parseFloat(remittanceExchangeRate)).toFixed(2)
      : "";

  const sorted = [...remittances].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const audNum = parseFloat(remittanceAudAmount) || 0;
  const fundInsufficient =
    !remittanceIsPreExisting &&
    remittanceAccount === "RemittanceFund" &&
    audNum > fundBalance;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Remittance"
          description="Money sent home. Track AUD sent and INR received."
        />
        <button
          type="button"
          onClick={() => setShowRemittanceForm(true)}
          className="flex shrink-0 items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/15"
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total sent (AUD)" value={`${currencySymbol}${totalAud.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        <SummaryCard label="Total sent (INR)" value={`₹${Math.round(totalInr).toLocaleString()}`} />
        <SummaryCard label="Transfers" value={String(activeRemittances.length)} />
        <SummaryCard
          label="Remittance Fund"
          value={`${currencySymbol}${fundBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
          highlight={fundBalance > 0}
          subtitle={remittanceBucket ? `of ${currencySymbol}${remittanceBucket.targetAmount.toLocaleString()}` : undefined}
        />
      </div>

      {rates.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="Best rate" value={`${bestRate?.toFixed(2)} ₹/A$`} highlight />
          <SummaryCard label="Avg rate" value={`${avgRate?.toFixed(2)} ₹/A$`} />
          <SummaryCard label="Worst rate" value={`${worstRate?.toFixed(2)} ₹/A$`} />
        </div>
      )}

      <section className="surface-card rounded-[28px] border border-white/[0.055] p-5">
        {sorted.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">No remittance records yet.</p>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {sorted.map((r) => (
              <div key={String(r.id)} className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-semibold ${r.preExisting ? "text-neutral-400" : ""}`}>
                      {currencySymbol}{r.audAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-neutral-500">→</span>
                    <span className={`font-semibold ${r.preExisting ? "text-neutral-500" : "text-orange-300"}`}>
                      ₹{Math.round(r.inrAmount).toLocaleString()}
                    </span>
                    {r.preExisting && (
                      <span className="rounded-full bg-neutral-700/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-neutral-400">
                        pre-existing
                      </span>
                    )}
                    {r.fromFund && !r.preExisting && (
                      <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-blue-300">
                        from fund
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {r.date} · {r.account === "RemittanceFund" ? "Remittance Fund" : r.account} · Rate {r.exchangeRate}
                    {r.provider ? ` · ${r.provider}` : ""}
                  </p>
                  {r.notes && <p className="mt-0.5 text-xs text-neutral-600">{r.notes}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => deleteRemittance(r.id)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-neutral-600 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {showRemittanceForm && (
        <ModalWrapper onClose={closeAllForms}>
          <ModalHeader
            title="Add Remittance"
            subtitle="Record money sent home to India."
          />
          <ModalContent>
            <ModalSection>
              {/* Pre-existing toggle */}
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                <input
                  type="checkbox"
                  checked={remittanceIsPreExisting}
                  onChange={(e) => setRemittanceIsPreExisting(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-amber-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-amber-200">Already remitted</span>
                  <span className="mt-0.5 block text-xs text-neutral-500">
                    This was sent before you started using the app — record it for history only, no balance will be affected.
                  </span>
                </span>
              </label>

              <FormField label="AUD amount">
                <CurrencyInput value={remittanceAudAmount} onChange={setRemittanceAudAmount} symbol="$" placeholder="0.00" />
              </FormField>
              <FormField label="AUD → INR exchange rate">
                <input
                  type="text"
                  inputMode="decimal"
                  value={remittanceExchangeRate}
                  onChange={(e) => setRemittanceExchangeRate(e.target.value.replace(/[^\d.]/g, ""))}
                  className={formTokens.input}
                  placeholder="e.g. 55.50"
                />
              </FormField>
              {inrPreview && (
                <div className="rounded-2xl bg-orange-500/8 border border-orange-500/15 px-4 py-3">
                  <p className="text-xs text-neutral-500">INR amount (calculated)</p>
                  <p className="mt-1 text-xl font-semibold text-orange-300">₹{parseFloat(inrPreview).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
              )}

              {/* Fund source selector */}
              {!remittanceIsPreExisting && (
                <FormField label="Fund source">
                  <div className="grid grid-cols-3 gap-2">
                    {(["Bank", "Cash", "RemittanceFund"] as const).map((acc) => (
                      <button
                        key={acc}
                        type="button"
                        onClick={() => setRemittanceAccount(acc)}
                        className={`rounded-2xl border py-3 text-sm font-semibold transition ${
                          remittanceAccount === acc
                            ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-200"
                            : "border-white/[0.07] bg-white/[0.025] text-neutral-400 hover:text-neutral-200"
                        }`}
                      >
                        {acc === "RemittanceFund" ? "Fund" : acc}
                        {acc === "RemittanceFund" && (
                          <span className="mt-0.5 block text-[10px] font-normal text-neutral-500">
                            {currencySymbol}{fundBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })} avail.
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {fundInsufficient && (
                    <div className="mt-2 flex items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">
                      <AlertCircle size={13} />
                      Fund balance ({currencySymbol}{fundBalance.toFixed(2)}) is less than the remittance amount.
                    </div>
                  )}
                </FormField>
              )}

              <DateField label="Date" value={remittanceDate} onChange={(e) => setRemittanceDate(e.target.value)} />
              <FormField label="Provider / method (optional)">
                <input
                  type="text"
                  value={remittanceProvider}
                  onChange={(e) => setRemittanceProvider(e.target.value)}
                  className={formTokens.input}
                  placeholder="e.g. Wise, Remitly, bank transfer"
                />
              </FormField>
              <FormField label="Notes (optional)">
                <textarea
                  value={remittanceNotes}
                  onChange={(e) => setRemittanceNotes(e.target.value)}
                  className={formTokens.input}
                />
              </FormField>
            </ModalSection>
          </ModalContent>
          <ModalFooter onCancel={closeAllForms} onSave={addRemittance} saveLabel="Save Remittance" tone="emerald" />
        </ModalWrapper>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlight = false,
  subtitle,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  subtitle?: string;
}) {
  return (
    <div className={`surface-card rounded-2xl border p-4 ${highlight ? "border-blue-400/20 bg-blue-500/[0.04]" : "border-white/[0.055]"}`}>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${highlight ? "text-blue-300" : ""}`}>{value}</p>
      {subtitle && <p className="mt-0.5 text-[10px] text-neutral-600">{subtitle}</p>}
    </div>
  );
}
