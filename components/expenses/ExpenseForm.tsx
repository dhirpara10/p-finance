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
import type { ExpenseAccount } from "@/lib/types";
import { formTokens } from "@/lib/designTokens";
import { RefreshCw } from "lucide-react";

type ExpenseFormProps = { state: FinanceDashboardState };

export function ExpenseForm({ state }: ExpenseFormProps) {
  const { editingItem, expenseAmount, setExpenseAmount, expenseCategory, setExpenseCategory, expenseAccount, setExpenseAccount, expenseDate, setExpenseDate, expenseNotes, setExpenseNotes, expenseIsRecurring, setExpenseIsRecurring, expenseRecurringFrequency, setExpenseRecurringFrequency, expenseRecurringEndDate, setExpenseRecurringEndDate, expenseCategories, newExpenseCategory, setNewExpenseCategory, closeAllForms, addExpense, addExpenseCategory } = state;
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
            <input type="number" value={expenseAmount} onChange={(event) => setExpenseAmount(event.target.value)} className={formTokens.input} />
          </FormField>
          <SelectField label="Category" value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value)} options={categoryOptions} />
          <div className="flex gap-2">
            <input type="text" placeholder="New category name" value={newExpenseCategory} onChange={(event) => setNewExpenseCategory(event.target.value)} className={`${formTokens.input} min-w-0 flex-1`} />
            <button type="button" onClick={addExpenseCategory} className="rounded-2xl bg-neutral-800 px-4 font-semibold text-emerald-300">Add</button>
          </div>
          <SelectField label="Account" value={expenseAccount} onChange={(event) => setExpenseAccount(event.target.value as ExpenseAccount)} options={[{ value: "Bank", label: "Bank" }, { value: "Cash", label: "Cash" }]} />
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
