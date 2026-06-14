"use client";

import { useState } from "react";
import { Plane, Trash2, Plus, X } from "lucide-react";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DateField } from "@/components/forms/DateField";
import { FormField } from "@/components/forms/FormField";
import { ModalContent } from "@/components/forms/ModalContent";
import { ModalFooter } from "@/components/forms/ModalFooter";
import { ModalHeader } from "@/components/forms/ModalHeader";
import { ModalSection } from "@/components/forms/ModalSection";
import { ModalWrapper } from "@/components/forms/ModalWrapper";
import { SelectField } from "@/components/forms/SelectField";
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
    addRemittance,
    deleteRemittance,
    closeAllForms,
    currencySymbol,
  } = state;

  const totalAud = remittances.reduce((sum, r) => sum + r.audAmount, 0);
  const totalInr = remittances.reduce((sum, r) => sum + r.inrAmount, 0);

  const inrPreview =
    remittanceAudAmount && remittanceExchangeRate
      ? (parseFloat(remittanceAudAmount) * parseFloat(remittanceExchangeRate)).toFixed(2)
      : "";

  const sorted = [...remittances].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SummaryCard label="Total sent (AUD)" value={`${currencySymbol}${totalAud.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
        <SummaryCard label="Total sent (INR)" value={`₹${Math.round(totalInr).toLocaleString()}`} />
        <SummaryCard label="Transfers" value={String(remittances.length)} />
      </div>

      <section className="surface-card rounded-[28px] border border-white/[0.055] p-5">
        {sorted.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">No remittance records yet.</p>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {sorted.map((r) => (
              <div key={String(r.id)} className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{currencySymbol}{r.audAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                    <span className="text-xs text-neutral-500">→</span>
                    <span className="font-semibold text-orange-300">₹{Math.round(r.inrAmount).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {r.date} · {r.account} · Rate {r.exchangeRate}
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
            subtitle="Record money sent home. AUD reduces your balance."
          />
          <ModalContent>
            <ModalSection>
              <FormField label="AUD amount">
                <input
                  type="number"
                  value={remittanceAudAmount}
                  onChange={(e) => setRemittanceAudAmount(e.target.value)}
                  className={formTokens.input}
                  placeholder="0.00"
                />
              </FormField>
              <FormField label="AUD → INR exchange rate">
                <input
                  type="number"
                  value={remittanceExchangeRate}
                  onChange={(e) => setRemittanceExchangeRate(e.target.value)}
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
              <SelectField
                label="From account"
                value={remittanceAccount}
                onChange={(e) => setRemittanceAccount(e.target.value as "Bank" | "Cash")}
                options={[{ value: "Bank", label: "Bank" }, { value: "Cash", label: "Cash" }]}
              />
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card rounded-2xl border border-white/[0.055] p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
