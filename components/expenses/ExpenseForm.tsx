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
import type { ExpenseAccount, ExpensePaymentMethod, LiabilityChannel } from "@/lib/types";
import { defaultLiabilityChannels } from "@/lib/liabilities";
import { formTokens } from "@/lib/designTokens";
import { RefreshCw } from "lucide-react";

function BnplRepaymentPreview({ channel, amount, purchaseDate }: { channel: LiabilityChannel; amount: number; purchaseDate: string }) {
  if (!amount || amount <= 0) return null;
  const noUpfront = channel.noPaymentUpfrontEnabled ?? false;
  const count = channel.installmentCount || 4;
  const minSplit = channel.minimumSplitAmount ?? 0;

  if (minSplit > 0 && amount < minSplit) {
    const behaviour = channel.underMinimumBehaviour ?? "block";
    if (behaviour === "block") {
      return (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-xs text-red-300">
          {channel.name} split repayment requires a minimum of ${minSplit}. This purchase will be blocked.
        </div>
      );
    }
    const delayDays = channel.underMinimumDeductionDelayDays ?? 2;
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 px-4 py-3 text-xs text-amber-300 space-y-1">
        <p className="font-semibold">{channel.name} — single deduction (under ${minSplit})</p>
        <p>Full ${amount.toFixed(2)} deducted in {delayDays} day{delayDays !== 1 ? "s" : ""}.</p>
        <p>No installment split — balance not reduced today.</p>
      </div>
    );
  }

  const baseInstallment = Math.floor((amount / count) * 100) / 100;
  const deductedToday = noUpfront ? 0 : baseInstallment;
  const remaining = amount - deductedToday;
  const linkedAccount = channel.linkedRepaymentAccount ?? "Bank";
  const freqLabel = channel.installmentFrequency === "fortnightly" ? "fortnight" : channel.installmentFrequency ?? "fortnight";
  const delayDays = channel.noPaymentUpfrontFirstDelayDays ?? 14;

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/8 px-4 py-3 text-xs text-purple-200 space-y-1">
      <p className="font-semibold text-purple-100">{channel.name} repayment preview</p>
      <p>Purchase: <span className="font-medium">${amount.toFixed(2)}</span></p>
      {noUpfront ? (
        <>
          <p>Today: <span className="font-medium text-green-300">$0 deducted</span></p>
          <p>Remaining liability: <span className="font-medium">${amount.toFixed(2)}</span></p>
          <p>First repayment: <span className="font-medium">${baseInstallment.toFixed(2)}</span> due in {delayDays} days</p>
        </>
      ) : (
        <>
          <p>Today: <span className="font-medium text-amber-300">${deductedToday.toFixed(2)}</span> deducted from {linkedAccount}</p>
          <p>Remaining liability: <span className="font-medium">${remaining.toFixed(2)}</span></p>
        </>
      )}
      <p>Then ${baseInstallment.toFixed(2)} every {freqLabel} × {count - 1} more</p>
    </div>
  );
}

type ExpenseFormProps = { state: FinanceDashboardState };

export function ExpenseForm({ state }: ExpenseFormProps) {
  const { editingItem, expenseAmount, setExpenseAmount, expenseCategory, setExpenseCategory, expenseAccount, setExpenseAccount, expensePaymentMethod, setExpensePaymentMethod, expenseDate, setExpenseDate, expenseNotes, setExpenseNotes, expenseIsRecurring, setExpenseIsRecurring, expenseRecurringFrequency, setExpenseRecurringFrequency, expenseRecurringEndDate, setExpenseRecurringEndDate, expenseCategories, newExpenseCategory, setNewExpenseCategory, closeAllForms, addExpense, addExpenseCategory, currencySymbol } = state;
  const isLiabilityPayment = expensePaymentMethod === "Afterpay" || expensePaymentMethod === "StepPay" || expensePaymentMethod === "CreditCard";
  const isBnpl = expensePaymentMethod === "Afterpay" || expensePaymentMethod === "StepPay";

  const savedChannels = state.liabilitySettings?.liabilityChannels;
  const channels = (savedChannels && savedChannels.length > 0) ? savedChannels : defaultLiabilityChannels;
  const activeChannel = isBnpl
    ? channels.find((ch) => ch.id === expensePaymentMethod.toLowerCase() && ch.enabled) ?? null
    : null;

  function handlePaymentMethodChange(method: ExpensePaymentMethod) {
    setExpensePaymentMethod(method);
    if (method === "Bank" || method === "Cash") {
      setExpenseAccount(method as ExpenseAccount);
    }
  }
  const categoryOptions = (
    expenseCategories.includes(expenseCategory)
      ? expenseCategories
      : [expenseCategory, ...expenseCategories]
  ).map((category) => ({ value: category, label: category }));

  return (
    <ModalWrapper onClose={closeAllForms}>
      <ModalHeader title={editingItem?.type === "expense" ? "Edit Expense" : "Add Expense"} subtitle="Track spending against Bank or Cash." />
      <ModalContent>
        <ModalSection>
          <FormField label="Amount">
            <CurrencyInput value={expenseAmount} onChange={setExpenseAmount} symbol={currencySymbol} placeholder="0.00" autoFocus={!editingItem} />
          </FormField>
          <SelectField label="Category" value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value)} options={categoryOptions} />
          <div className="flex gap-2">
            <input type="text" placeholder="New category name" value={newExpenseCategory} onChange={(event) => setNewExpenseCategory(event.target.value)} className={`${formTokens.input} min-w-0 flex-1`} />
            <button type="button" onClick={addExpenseCategory} className="rounded-2xl bg-neutral-800 px-4 font-semibold text-emerald-300">Add</button>
          </div>
          <SelectField
            label="Paid with"
            value={expensePaymentMethod}
            onChange={(event) => handlePaymentMethodChange(event.target.value as ExpensePaymentMethod)}
            options={[
              { value: "Bank", label: "Bank" },
              { value: "Cash", label: "Cash" },
              { value: "Afterpay", label: "Afterpay (4 × fortnightly)" },
              { value: "StepPay", label: "StepPay (4 × fortnightly, min $100)" },
              { value: "CreditCard", label: "Credit Card" },
            ]}
          />
          {activeChannel && (
            <BnplRepaymentPreview
              channel={activeChannel}
              amount={Number(expenseAmount) || 0}
              purchaseDate={expenseDate}
            />
          )}
          {expensePaymentMethod === "CreditCard" && (
            <p className="rounded-2xl bg-orange-500/8 border border-orange-500/15 px-4 py-3 text-xs text-orange-300">
              Credit Card: Your balance is not reduced now. Record repayment in Liabilities when you pay.
            </p>
          )}
          {!isLiabilityPayment && (
            <SelectField label="Account" value={expenseAccount} onChange={(event) => setExpenseAccount(event.target.value as ExpenseAccount)} options={[{ value: "Bank", label: "Bank" }, { value: "Cash", label: "Cash" }]} />
          )}
          <DateField label="Date" value={expenseDate} onChange={(event) => setExpenseDate(event.target.value)} />
          <label className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
            <span className="flex items-center gap-3">
              <RefreshCw size={18} className="text-purple-300" />
              <span>
                <span className="block font-semibold">Make this recurring</span>
                <span className="text-xs text-neutral-500">Track future occurrences automatically.</span>
              </span>
            </span>
            <input type="checkbox" checked={expenseIsRecurring} onChange={(event) => setExpenseIsRecurring(event.target.checked)} className="h-5 w-5" />
          </label>
          {expenseIsRecurring && (
            <>
              <SelectField
                label="Frequency"
                value={expenseRecurringFrequency}
                onChange={(event) => setExpenseRecurringFrequency(event.target.value as typeof expenseRecurringFrequency)}
                options={[
                  { value: "weekly", label: "Weekly" },
                  { value: "biweekly", label: "Biweekly" },
                  { value: "monthly", label: "Monthly" },
                  { value: "yearly", label: "Yearly" },
                ]}
              />
              <DateField label="End date optional" value={expenseRecurringEndDate} onChange={(event) => setExpenseRecurringEndDate(event.target.value)} />
            </>
          )}
          <FormField label="Notes">
            <textarea value={expenseNotes} onChange={(event) => setExpenseNotes(event.target.value)} className={formTokens.input} />
          </FormField>
        </ModalSection>
      </ModalContent>
      <ModalFooter onCancel={closeAllForms} onSave={addExpense} saveLabel="Save Expense" tone="red" />
    </ModalWrapper>
  );
}
