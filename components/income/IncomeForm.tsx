"use client";

import { DateField } from "@/components/forms/DateField";
import { FormField } from "@/components/forms/FormField";
import { InputGroup } from "@/components/forms/InputGroup";
import { ModalContent } from "@/components/forms/ModalContent";
import { ModalFooter } from "@/components/forms/ModalFooter";
import { ModalHeader } from "@/components/forms/ModalHeader";
import { ModalSection } from "@/components/forms/ModalSection";
import { ModalWrapper } from "@/components/forms/ModalWrapper";
import { SelectField } from "@/components/forms/SelectField";
import { SummaryField } from "@/components/forms/SummaryField";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import type { IncomeType } from "@/lib/types";
import { formTokens } from "@/lib/designTokens";

type IncomeFormProps = { state: FinanceDashboardState };

export function IncomeForm({ state }: IncomeFormProps) {
  const { editingItem, incomeSources, incomeType, handleIncomeTypeChange, incomeSource, handleIncomeSourceChange, incomeRate, setIncomeRate, incomeHours, setIncomeHours, incomeCashReceived, setIncomeCashReceived, toNumber, incomeAmount, setIncomeAmount, incomeDate, setIncomeDate, incomeNotes, setIncomeNotes, closeAllForms, addIncome, currencySymbol } = state;
  const calculatedAmount = incomeType === "Hourly" ? toNumber(incomeRate) * toNumber(incomeHours) : toNumber(incomeAmount);
  const bankPortion = Math.max(0, calculatedAmount - toNumber(incomeCashReceived));

  return (
    <ModalWrapper onClose={closeAllForms}>
      <ModalHeader title={editingItem?.type === "income" ? "Edit Income" : "Add Income"} subtitle="Record pay, cash received, and bank portion." />
      <ModalContent>
        <ModalSection>
          <SelectField label="Income type" value={incomeType} onChange={(event) => handleIncomeTypeChange(event.target.value as IncomeType)} options={[{ value: "Hourly", label: "Hourly" }, { value: "Fixed Amount", label: "Fixed Amount" }]} />
          <SelectField label="Source" value={incomeSource} onChange={(event) => handleIncomeSourceChange(event.target.value)} options={[...incomeSources.map((source) => ({ value: source.name, label: source.name })), { value: "Business", label: "Business" }, { value: "Refund", label: "Refund" }, { value: "Gift", label: "Gift" }, { value: "Other", label: "Other" }]} />
          {incomeType === "Hourly" ? (
            <InputGroup>
              <FormField label="Rate">
                <CurrencyInput value={incomeRate} onChange={setIncomeRate} symbol={currencySymbol} placeholder="0.00" />
              </FormField>
              <FormField label="Hours">
                <input type="text" inputMode="decimal" value={incomeHours} onChange={(event) => setIncomeHours(event.target.value.replace(/[^\d.]/g, ""))} className={formTokens.input} placeholder="0" />
              </FormField>
            </InputGroup>
          ) : (
            <FormField label="Amount">
              <CurrencyInput value={incomeAmount} onChange={setIncomeAmount} symbol={currencySymbol} placeholder="0.00" />
            </FormField>
          )}
          <FormField label="Cash received">
            <CurrencyInput value={incomeCashReceived} onChange={setIncomeCashReceived} symbol={currencySymbol} placeholder="0.00" />
          </FormField>
          <InputGroup>
            <SummaryField label="Calculated Amount" value={`$${calculatedAmount.toLocaleString()}`} />
            <SummaryField label="Bank Portion" value={`$${bankPortion.toLocaleString()}`} />
          </InputGroup>
          <DateField label="Date" value={incomeDate} max={new Date().toISOString().split("T")[0]} onChange={(event) => setIncomeDate(event.target.value)} />
          <FormField label="Notes">
            <textarea value={incomeNotes} onChange={(event) => setIncomeNotes(event.target.value)} className={formTokens.input} />
          </FormField>
        </ModalSection>
      </ModalContent>
      <ModalFooter onCancel={closeAllForms} onSave={addIncome} saveLabel="Save Income" />
    </ModalWrapper>
  );
}
