"use client";

import { useState } from "react";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { DateField } from "@/components/forms/DateField";
import { FormField } from "@/components/forms/FormField";
import { ModalContent } from "@/components/forms/ModalContent";
import { ModalFooter } from "@/components/forms/ModalFooter";
import { ModalHeader } from "@/components/forms/ModalHeader";
import { ModalWrapper } from "@/components/forms/ModalWrapper";
import { formTokens } from "@/lib/designTokens";

export function RepaymentForm({ state }: { state: FinanceDashboardState }) {
  const schedule = state.editingSchedule;
  const [dueDate, setDueDate] = useState(schedule?.dueDate || "");
  const [amount, setAmount] = useState(String(schedule?.amount || ""));
  const [principal, setPrincipal] = useState(
    String(schedule?.principalAmount || "")
  );
  const [interest, setInterest] = useState(
    String(schedule?.interestAmount || "")
  );
  const [fee, setFee] = useState(String(schedule?.feeAmount || ""));
  const [notes, setNotes] = useState(schedule?.notes || "");
  if (!schedule) return null;

  const amountField = (
    label: string,
    value: string,
    setter: (value: string) => void
  ) => (
    <FormField label={label}>
      <input type="number" inputMode="decimal" min="0" step="0.01" value={value} onChange={(event) => setter(event.target.value)} className={formTokens.input} />
    </FormField>
  );

  return (
    <ModalWrapper onClose={() => state.setEditingScheduleId(null)}>
      <ModalHeader title="Edit repayment" subtitle="Adjust the scheduled split without creating an expense." />
      <ModalContent>
        <DateField label="Due date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
        {amountField("Payment amount", amount, setAmount)}
        {amountField("Principal portion", principal, setPrincipal)}
        {amountField("Interest portion", interest, setInterest)}
        {amountField("Fee portion", fee, setFee)}
        <FormField label="Notes">
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className={`${formTokens.input} min-h-24`} />
        </FormField>
        {state.liabilityError && (
          <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
            {state.liabilityError}
          </p>
        )}
      </ModalContent>
      <ModalFooter
        onCancel={() => state.setEditingScheduleId(null)}
        onSave={() =>
          state.saveRepaymentSchedule(schedule.id, {
            dueDate,
            amount: Number(amount),
            principalAmount: Number(principal),
            interestAmount: Number(interest),
            feeAmount: Number(fee),
            notes,
          })
        }
        saveLabel="Save repayment"
        tone="blue"
      />
    </ModalWrapper>
  );
}
