"use client";

import { DateField } from "@/components/forms/DateField";
import { FormField } from "@/components/forms/FormField";
import { ModalContent } from "@/components/forms/ModalContent";
import { ModalFooter } from "@/components/forms/ModalFooter";
import { ModalHeader } from "@/components/forms/ModalHeader";
import { ModalSection } from "@/components/forms/ModalSection";
import { ModalWrapper } from "@/components/forms/ModalWrapper";
import { SelectField } from "@/components/forms/SelectField";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import type { Bucket } from "@/lib/types";
import { formTokens } from "@/lib/designTokens";

type TransferFormProps = { state: FinanceDashboardState };

export function TransferForm({ state }: TransferFormProps) {
  const { editingItem, fromBucket, setFromBucket, toBucket, setToBucket, transferAmount, setTransferAmount, transferDate, setTransferDate, transferNotes, setTransferNotes, transferTrackerId, setTransferTrackerId, closeAllForms, addTransfer, savingsBucketBalances, bucketListTrackers, currencySymbol } = state;
  const cashCarry = state.sharedRolloverJar?.cashCarry ?? 0;
  const allSourceOptions = [
    { value: "Bank", label: "Bank" },
    { value: "Cash", label: "Cash" },
    ...(cashCarry > 0 ? [{ value: "jar_cash_leftover", label: `Jar Cash Carry (${state.currencySymbol}${cashCarry.toLocaleString(undefined, { maximumFractionDigits: 2 })})` }] : []),
    ...savingsBucketBalances.map((bucket) => ({ value: bucket.id, label: bucket.name })),
  ];
  const allDestinationOptions = [
    ...allSourceOptions,
    { value: "shared_rollover_jar", label: "Shared Rollover Jar" },
  ];
  // Exclude the currently selected "To" from "From" options and vice versa
  const fromOptions = allSourceOptions.filter((opt) => opt.value !== toBucket);
  const toOptions = allDestinationOptions.filter((opt) => opt.value !== fromBucket);

  return (
    <ModalWrapper onClose={closeAllForms}>
      <ModalHeader title={editingItem?.type === "transfer" ? "Edit Transfer" : "Transfer Funds"} subtitle="Move money between accounts and savings buckets." />
      <ModalContent>
        <ModalSection>
          <SelectField label="From" value={fromBucket} onChange={(event) => setFromBucket(event.target.value as Bucket)} options={fromOptions} />
          <SelectField label="To" value={toBucket} onChange={(event) => setToBucket(event.target.value as Bucket)} options={toOptions} />
          {toBucket === "shared_rollover_jar" && (
            <SelectField
              label="Tracker context optional"
              helper="This tags the allocation only. It does not create a separate tracker balance."
              value={transferTrackerId}
              onChange={(event) => setTransferTrackerId(event.target.value)}
              options={[
                { value: "", label: "General shared jar allocation" },
                ...bucketListTrackers
                  .filter((tracker) => tracker.active)
                  .map((tracker) => ({ value: tracker.id, label: tracker.name })),
              ]}
            />
          )}
          <FormField label="Amount">
            <CurrencyInput value={transferAmount} onChange={setTransferAmount} symbol={currencySymbol} placeholder="0.00" />
          </FormField>
          <DateField label="Date" value={transferDate} max={new Date().toISOString().split("T")[0]} onChange={(event) => setTransferDate(event.target.value)} />
          <FormField label="Notes">
            <textarea value={transferNotes} onChange={(event) => setTransferNotes(event.target.value)} className={formTokens.input} />
          </FormField>
        </ModalSection>
      </ModalContent>
      <ModalFooter onCancel={closeAllForms} onSave={addTransfer} saveLabel="Save Transfer" tone="blue" />
    </ModalWrapper>
  );
}
