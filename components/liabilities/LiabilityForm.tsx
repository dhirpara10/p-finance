"use client";

import { useState } from "react";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { DateField } from "@/components/forms/DateField";
import { FormField } from "@/components/forms/FormField";
import { ModalContent } from "@/components/forms/ModalContent";
import { ModalFooter } from "@/components/forms/ModalFooter";
import { ModalHeader } from "@/components/forms/ModalHeader";
import { ModalSection } from "@/components/forms/ModalSection";
import { ModalWrapper } from "@/components/forms/ModalWrapper";
import { SelectField } from "@/components/forms/SelectField";
import type { LiabilityDraft } from "@/components/liabilities/useLiabilities";
import { formTokens } from "@/lib/designTokens";
import type {
  LiabilityCompoundingFrequency,
  LiabilityInterestType,
  LiabilityPaymentFrequency,
  LiabilityStatus,
} from "@/lib/types";

type Props = { state: FinanceDashboardState };

function numberValue(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export function LiabilityForm({ state }: Props) {
  const existing = state.editingLiability;
  const type = existing?.type || state.liabilityFormType;
  const today = new Date().toISOString().split("T")[0];
  const [name, setName] = useState(existing?.name || "");
  const [provider, setProvider] = useState(
    existing?.provider ||
      (type === "bnpl"
        ? state.liabilitySettings.bnplProviders[0]
        : type === "credit_card"
          ? state.liabilitySettings.creditCardProviders[0]
          : state.liabilitySettings.loanTypes[0])
  );
  const [amount, setAmount] = useState(
    String(existing?.originalAmount || existing?.purchaseAmount || existing?.principalAmount || "")
  );
  const [outstanding, setOutstanding] = useState(
    String(existing?.outstandingBalance || "")
  );
  const [category, setCategory] = useState(existing?.category || "Finance");
  const [notes, setNotes] = useState(existing?.notes || "");
  const [status, setStatus] = useState<LiabilityStatus>(
    existing?.status || "active"
  );
  const [purchaseDate, setPurchaseDate] = useState(existing?.purchaseDate || today);
  const [firstPaymentDate, setFirstPaymentDate] = useState(
    existing?.firstPaymentDate || today
  );
  const [numberOfPayments, setNumberOfPayments] = useState(
    String(existing?.numberOfPayments || 4)
  );
  const [frequency, setFrequency] = useState<LiabilityPaymentFrequency>(
    existing?.paymentFrequency || existing?.repaymentFrequency || "fortnightly"
  );
  const [creditLimit, setCreditLimit] = useState(
    String(existing?.creditLimit || "")
  );
  const [statementDate, setStatementDate] = useState(existing?.statementDate || today);
  const [dueDate, setDueDate] = useState(existing?.dueDate || today);
  const [minimumPayment, setMinimumPayment] = useState(
    String(existing?.minimumPayment || "")
  );
  const [interestRate, setInterestRate] = useState(
    String(existing?.interestRate || "")
  );
  const [annualFee, setAnnualFee] = useState(String(existing?.annualFee || ""));
  const [charges, setCharges] = useState(String(existing?.charges || ""));
  const [interestType, setInterestType] = useState<LiabilityInterestType>(
    existing?.interestType || state.liabilitySettings.defaultInterestType
  );
  const [compoundingFrequency, setCompoundingFrequency] =
    useState<LiabilityCompoundingFrequency>(
      existing?.compoundingFrequency ||
        state.liabilitySettings.defaultCompoundingFrequency
    );
  const [repaymentAmount, setRepaymentAmount] = useState(
    String(existing?.repaymentAmount || "")
  );
  const [startDate, setStartDate] = useState(existing?.startDate || today);
  const [endDate, setEndDate] = useState(existing?.endDate || "");
  const [termMonths, setTermMonths] = useState(
    String(existing?.termMonths || 12)
  );
  const [fees, setFees] = useState(String(existing?.fees || ""));
  const [discount, setDiscount] = useState(String(existing?.discount || ""));

  const input = (label: string, value: string, setter: (value: string) => void) => (
    <FormField label={label}>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) => setter(event.target.value)}
        className={formTokens.input}
      />
    </FormField>
  );

  function submit() {
    const originalAmount = numberValue(amount);
    const creditCardExtras =
      type === "credit_card"
        ? numberValue(annualFee) + numberValue(charges)
        : 0;
    const outstandingBalance =
      outstanding === ""
        ? originalAmount + creditCardExtras
        : numberValue(outstanding);
    const draft: LiabilityDraft = {
      type,
      name: name.trim(),
      provider: provider.trim(),
      originalAmount,
      outstandingBalance,
      category: category.trim(),
      notes: notes.trim(),
      status,
      purchaseAmount: type === "bnpl" ? originalAmount : undefined,
      purchaseDate: type === "bnpl" ? purchaseDate : undefined,
      firstPaymentDate: type === "bnpl" ? firstPaymentDate : undefined,
      numberOfPayments:
        type === "bnpl" ? Math.max(numberValue(numberOfPayments), 1) : undefined,
      paymentFrequency:
        type === "bnpl"
          ? (frequency as "weekly" | "fortnightly" | "monthly")
          : undefined,
      installmentAmount:
        type === "bnpl"
          ? originalAmount / Math.max(numberValue(numberOfPayments), 1)
          : undefined,
      creditLimit: type === "credit_card" ? numberValue(creditLimit) : undefined,
      currentBalance:
        type === "credit_card" ? outstandingBalance : undefined,
      statementDate: type === "credit_card" ? statementDate : undefined,
      dueDate: type === "credit_card" ? dueDate : undefined,
      minimumPayment:
        type === "credit_card" ? numberValue(minimumPayment) : undefined,
      annualFee: type === "credit_card" ? numberValue(annualFee) : undefined,
      principalAmount: type === "loan" ? originalAmount : undefined,
      outstandingPrincipal:
        type === "loan" ? outstandingBalance : undefined,
      interestType: type === "loan" ? interestType : undefined,
      compoundingFrequency:
        type === "loan" ? compoundingFrequency : undefined,
      repaymentAmount:
        type === "loan" ? numberValue(repaymentAmount) : undefined,
      repaymentFrequency: type === "loan" ? frequency : undefined,
      startDate: type === "loan" ? startDate : undefined,
      endDate: type === "loan" ? endDate : undefined,
      termMonths: type === "loan" ? numberValue(termMonths) : undefined,
      fees: type === "loan" ? numberValue(fees) : undefined,
      discount: type === "loan" ? numberValue(discount) : undefined,
      loanType: type === "loan" ? provider : undefined,
      interestRate:
        type === "credit_card" || type === "loan"
          ? numberValue(interestRate)
          : undefined,
      charges:
        type === "credit_card" || type === "loan"
          ? numberValue(charges)
          : undefined,
    };
    state.saveLiability(draft);
  }

  const providerOptions =
    type === "bnpl"
      ? state.liabilitySettings.bnplProviders
      : type === "credit_card"
        ? state.liabilitySettings.creditCardProviders
        : state.liabilitySettings.loanTypes;

  return (
    <ModalWrapper onClose={state.closeLiabilityForm}>
      <ModalHeader
        title={`${existing ? "Edit" : "Add"} ${
          type === "bnpl" ? "BNPL" : type === "credit_card" ? "Credit Card" : "Loan"
        }`}
        subtitle="Track the obligation without double-counting repayments as expenses."
      />
      <ModalContent>
        <ModalSection>
          <FormField label={type === "credit_card" ? "Card name" : type === "loan" ? "Loan name" : "Purchase name"}>
            <input value={name} onChange={(event) => setName(event.target.value)} className={formTokens.input} />
          </FormField>
          <SelectField
            label={type === "loan" ? "Loan type" : "Provider"}
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            options={providerOptions.map((option) => ({ value: option, label: option }))}
          />
          {input(type === "bnpl" ? "Purchase amount" : type === "loan" ? "Principal amount" : "Current balance", amount, setAmount)}
          {existing && input("Outstanding balance", outstanding, setOutstanding)}

          {type === "bnpl" && (
            <>
              <DateField label="Purchase date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} />
              <DateField label="First payment date" value={firstPaymentDate} onChange={(event) => setFirstPaymentDate(event.target.value)} />
              {input("Number of payments", numberOfPayments, setNumberOfPayments)}
              <SelectField label="Frequency" value={frequency} onChange={(event) => setFrequency(event.target.value as LiabilityPaymentFrequency)} options={["weekly", "fortnightly", "monthly"].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))} />
            </>
          )}

          {type === "credit_card" && (
            <>
              {input("Credit limit", creditLimit, setCreditLimit)}
              <DateField label="Statement date" value={statementDate} onChange={(event) => setStatementDate(event.target.value)} />
              <DateField label="Due date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              {input("Minimum payment", minimumPayment, setMinimumPayment)}
              {input("Interest rate (%)", interestRate, setInterestRate)}
              {input("Annual fee", annualFee, setAnnualFee)}
              {input("Fees / charges", charges, setCharges)}
            </>
          )}

          {type === "loan" && (
            <>
              {input("Interest rate (%)", interestRate, setInterestRate)}
              <SelectField label="Interest type" value={interestType} onChange={(event) => setInterestType(event.target.value as LiabilityInterestType)} options={[{ value: "simple", label: "Simple" }, { value: "compound", label: "Compound" }]} />
              <SelectField label="Compounding frequency" value={compoundingFrequency} onChange={(event) => setCompoundingFrequency(event.target.value as LiabilityCompoundingFrequency)} options={[{ value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" }]} />
              {input("Repayment amount", repaymentAmount, setRepaymentAmount)}
              <SelectField label="Repayment frequency" value={frequency} onChange={(event) => setFrequency(event.target.value as LiabilityPaymentFrequency)} options={state.liabilitySettings.repaymentFrequencies.map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))} />
              <DateField label="Start date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              <DateField label="End date optional" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              {input("Term months", termMonths, setTermMonths)}
              {input("Fees / charges", fees, setFees)}
              {input("Other charges", charges, setCharges)}
              {input("Discount / rebate", discount, setDiscount)}
            </>
          )}

          <FormField label="Category">
            <input value={category} onChange={(event) => setCategory(event.target.value)} className={formTokens.input} />
          </FormField>
          {existing && (
            <SelectField
              label="Status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as LiabilityStatus)
              }
              options={[
                { value: "active", label: "Active" },
                { value: "paid", label: "Paid" },
                { value: "closed", label: "Closed" },
              ]}
            />
          )}
          <FormField label="Notes">
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className={`${formTokens.input} min-h-24`} />
          </FormField>
          {state.liabilityError && (
            <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
              {state.liabilityError}
            </p>
          )}
        </ModalSection>
      </ModalContent>
      <ModalFooter
        onCancel={state.closeLiabilityForm}
        onSave={submit}
        saveLabel={state.liabilitySaving ? "Saving..." : "Save liability"}
        tone="blue"
      />
    </ModalWrapper>
  );
}
