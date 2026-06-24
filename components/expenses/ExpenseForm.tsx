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
import { categoryIdFromName, normalizeCategoryId } from "@/lib/buckets";
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
  const {
    editingItem,
    expenseAmount, setExpenseAmount,
    expenseCategory, setExpenseCategory,
    expenseAccount, setExpenseAccount,
    expensePaymentMethod, setExpensePaymentMethod,
    expenseDate, setExpenseDate,
    expenseNotes, setExpenseNotes,
    expenseIsRecurring, setExpenseIsRecurring,
    expenseRecurringFrequency, setExpenseRecurringFrequency,
    expenseRecurringEndDate, setExpenseRecurringEndDate,
    expenseCategories,
    newExpenseCategory, setNewExpenseCategory,
    closeAllForms, addExpense, addExpenseCategory, currencySymbol,
    bucketListTrackers,
  } = state;

  const isLiabilityPayment = expensePaymentMethod === "Afterpay" || expensePaymentMethod === "StepPay" || expensePaymentMethod === "CreditCard";
  const isBnpl = expensePaymentMethod === "Afterpay" || expensePaymentMethod === "StepPay";
  const isJarPayment = expensePaymentMethod === "SharedJar";

  const savedChannels = state.liabilitySettings?.liabilityChannels;
  const channels = (savedChannels && savedChannels.length > 0) ? savedChannels : defaultLiabilityChannels;
  const activeChannel = isBnpl
    ? channels.find((ch) => ch.id === expensePaymentMethod.toLowerCase() && ch.enabled) ?? null
    : null;

  // Detect if current category is linked to any active tracker
  const categoryId = categoryIdFromName(expenseCategory);
  const isTrackerLinked = bucketListTrackers.some(
    (t) => t.active && t.linkedCategoryIds.some((id) => normalizeCategoryId(id) === categoryId)
  );

  function handleCategoryChange(category: string) {
    setExpenseCategory(category);
    const newCategoryId = categoryIdFromName(category);
    const linked = bucketListTrackers.some(
      (t) => t.active && t.linkedCategoryIds.some((id) => normalizeCategoryId(id) === newCategoryId)
    );
    // Auto-switch to SharedJar for tracker categories, back to Bank for normal
    if (linked && !isLiabilityPayment) {
      setExpensePaymentMethod("SharedJar");
      setExpenseAccount("Bank");
    } else if (!linked && expensePaymentMethod === "SharedJar") {
      setExpensePaymentMethod("Bank");
      setExpenseAccount("Bank");
    }
  }

  function handlePaymentSourceChange(method: ExpensePaymentMethod) {
    setExpensePaymentMethod(method);
    if (method === "Bank" || method === "Cash") {
      setExpenseAccount(method as ExpenseAccount);
    } else {
      setExpenseAccount("Bank");
    }
  }

  const categoryOptions = (
    expenseCategories.includes(expenseCategory)
      ? expenseCategories
      : [expenseCategory, ...expenseCategories]
  ).map((category) => ({ value: category, label: category }));

  return (
    <ModalWrapper onClose={closeAllForms}>
      <ModalHeader title={editingItem?.type === "expense" ? "Edit Expense" : "Add Expense"} subtitle="Track spending from bank, cash, or Shared Jar." />
      <ModalContent>
        <ModalSection>
          <FormField label="Amount">
            <CurrencyInput value={expenseAmount} onChange={setExpenseAmount} symbol={currencySymbol} placeholder="0.00" autoFocus={!editingItem} />
          </FormField>
          <SelectField label="Category" value={expenseCategory} onChange={(event) => handleCategoryChange(event.target.value)} options={categoryOptions} />
          <div className="flex gap-2">
            <input type="text" placeholder="New category name" value={newExpenseCategory} onChange={(event) => setNewExpenseCategory(event.target.value)} className={`${formTokens.input} min-w-0 flex-1`} />
            <button type="button" onClick={addExpenseCategory} className="rounded-2xl bg-neutral-200 px-4 font-semibold text-emerald-600 dark:bg-neutral-800 dark:text-emerald-300">Add</button>
          </div>

          {isTrackerLinked && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-2.5 text-xs text-emerald-300">
              This category is linked to a tracker — Shared Jar is the default payment source.
            </div>
          )}

          <SelectField
            label="Payment source"
            value={expensePaymentMethod}
            onChange={(event) => handlePaymentSourceChange(event.target.value as ExpensePaymentMethod)}
            options={[
              { value: "SharedJar", label: "Shared Jar" },
              { value: "Bank", label: "Bank" },
              { value: "Cash", label: "Cash" },
              { value: "Afterpay", label: "Afterpay (4 × fortnightly)" },
              { value: "StepPay", label: "StepPay (4 × fortnightly, min $100)" },
              { value: "CreditCard", label: "Credit Card" },
            ]}
          />

          {isJarPayment && (
            <p className="rounded-2xl bg-emerald-500/8 border border-emerald-500/15 px-4 py-3 text-xs text-emerald-300">
              Shared Jar: Paid from your lifestyle spending jar. Your bank balance will not change.
            </p>
          )}
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

          <DateField label="Date" value={expenseDate} max={new Date().toISOString().split("T")[0]} onChange={(event) => setExpenseDate(event.target.value)} />
          <label className="flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <span className="flex items-center gap-3">
              <RefreshCw size={18} className="text-purple-300" />
              <span>
                <span className="block font-semibold text-neutral-900 dark:text-white">Make this recurring</span>
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
              <DateField label="End date (optional)" value={expenseRecurringEndDate} onChange={(event) => setExpenseRecurringEndDate(event.target.value)} />
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
