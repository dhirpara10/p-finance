"use client";

import { DateField } from "@/components/forms/DateField";
import { FormField } from "@/components/forms/FormField";
import { ModalContent } from "@/components/forms/ModalContent";
import { ModalFooter } from "@/components/forms/ModalFooter";
import { ModalHeader } from "@/components/forms/ModalHeader";
import { ModalSection } from "@/components/forms/ModalSection";
import { ModalWrapper } from "@/components/forms/ModalWrapper";
import { SelectField } from "@/components/forms/SelectField";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import type { Bucket } from "@/lib/types";
import { formTokens } from "@/lib/designTokens";

type TransferFormProps = { state: FinanceDashboardState };

export function TransferForm({ state }: TransferFormProps) {
  const { editingItem, fromBucket, setFromBucket, toBucket, setToBucket, transferAmount, setTransferAmount, transferDate, setTransferDate, transferNotes, setTransferNotes, closeAllForms, addTransfer, savingsBuckets } = state;
  const transferOptions = [
    { value: "Bank", label: "Bank" },
    { value: "Cash", label: "Cash" },
    ...savingsBuckets.filter((bucket) => bucket.active).map((bucket) => ({ value: bucket.id, label: bucket.name })),
  ];

  return (
    <ModalWrapper>
      <ModalHeader title={editingItem?.type === "transfer" ? "Edit Transfer" : "Transfer Funds"} subtitle="Move money between accounts and savings buckets." />
      <ModalContent>
        <ModalSection>
          <SelectField label="From" value={fromBucket} onChange={(event) => setFromBucket(event.target.value as Bucket)} options={transferOptions} />
          <SelectField label="To" value={toBucket} onChange={(event) => setToBucket(event.target.value as Bucket)} options={transferOptions} />
          <FormField label="Amount">
            <input type="number" value={transferAmount} onChange={(event) => setTransferAmount(event.target.value)} className={formTokens.input} />
          </FormField>
          <DateField label="Date" value={transferDate} onChange={(event) => setTransferDate(event.target.value)} />
          <FormField label="Notes">
            <textarea value={transferNotes} onChange={(event) => setTransferNotes(event.target.value)} className={formTokens.input} />
          </FormField>
        </ModalSection>
      </ModalContent>
      <ModalFooter onCancel={closeAllForms} onSave={addTransfer} saveLabel="Save Transfer" tone="blue" />
    </ModalWrapper>
  );
}
