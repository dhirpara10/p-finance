"use client";

import { findPersonByName, normalizePersonName } from "@/lib/lending";
import { DateField } from "@/components/forms/DateField";
import { FormField } from "@/components/forms/FormField";
import { ModalContent } from "@/components/forms/ModalContent";
import { ModalFooter } from "@/components/forms/ModalFooter";
import { ModalHeader } from "@/components/forms/ModalHeader";
import { ModalSection } from "@/components/forms/ModalSection";
import { ModalWrapper } from "@/components/forms/ModalWrapper";
import { SelectField } from "@/components/forms/SelectField";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { formTokens } from "@/lib/designTokens";

type LendingFormProps = { state: FinanceDashboardState };

export function LendingForm({ state }: LendingFormProps) {
  const { showLentForm, editingItem, people, lendingPersonMode, setLendingPersonMode, selectedPersonId, setSelectedPersonId, personSearch, setPersonSearch, moneyName, setMoneyName, moneyAmount, setMoneyAmount, moneyDate, setMoneyDate, moneyPhone, setMoneyPhone, moneyNotes, setMoneyNotes, moneyAccount, setMoneyAccount, borrowedAffectsAccountBalance, setBorrowedAffectsAccountBalance, lentAffectsAccountBalance, setLentAffectsAccountBalance, closeAllForms, addLent, addBorrowed, currencySymbol } = state;
  const searchQuery = normalizePersonName(personSearch);
  const filteredPeople = people.filter((person) => searchQuery && (normalizePersonName(person.name).includes(searchQuery) || normalizePersonName(person.phone || "").includes(searchQuery)));
  const selectedPerson = people.find((person) => String(person.id) === String(selectedPersonId));
  const existingName = findPersonByName(people, moneyName);
  const title = showLentForm ? editingItem?.type === "lent" ? "Edit Lent Money" : "Add Lent Money" : editingItem?.type === "borrowed" ? "Edit Borrowed Money" : "Add Borrowed Money";

  function selectExistingPerson(personId: string | number) {
    setSelectedPersonId(personId);
    const person = people.find((item) => String(item.id) === String(personId));
    if (person) setPersonSearch(person.name);
  }

  function switchToNewPerson() {
    setLendingPersonMode("new");
    setSelectedPersonId(null);
    setMoneyName(personSearch);
  }

  function switchToExistingPerson() {
    setLendingPersonMode("existing");
    setMoneyName("");
    setMoneyPhone("");
  }

  return (
    <ModalWrapper onClose={closeAllForms}>
      <ModalHeader title={title} subtitle="Attach every lending record to one person profile." />
      <ModalContent>
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-950">
          <button type="button" onClick={switchToExistingPerson} className={`rounded-xl p-3 text-sm font-semibold ${lendingPersonMode === "existing" ? "bg-emerald-500 text-black" : "text-neutral-600 dark:text-neutral-400"}`}>Existing</button>
          <button type="button" onClick={switchToNewPerson} className={`rounded-xl p-3 text-sm font-semibold ${lendingPersonMode === "new" ? "bg-emerald-500 text-black" : "text-neutral-600 dark:text-neutral-400"}`}>New Person</button>
        </div>

        <ModalSection>
          {lendingPersonMode === "existing" ? (
            <>
              <FormField label="Person">
                <input type="text" placeholder="Search person" value={personSearch} onChange={(event) => { setPersonSearch(event.target.value); setSelectedPersonId(null); }} className={formTokens.input} />
              </FormField>
              {searchQuery && (
                <div className="no-scrollbar max-h-52 space-y-2 overflow-y-auto rounded-2xl bg-neutral-50 p-2 dark:bg-neutral-900">
                  {filteredPeople.length > 0 ? filteredPeople.map((person) => (
                    <button key={String(person.id)} type="button" onClick={() => selectExistingPerson(person.id)} className={`w-full rounded-2xl p-3 text-left ${String(selectedPersonId) === String(person.id) ? "bg-emerald-500 text-black" : "bg-neutral-200 text-neutral-900 dark:bg-neutral-800 dark:text-white"}`}>
                      <span className="block font-semibold">{person.name}</span>
                      {person.phone && <span className="block text-xs opacity-75">{person.phone}</span>}
                    </button>
                  )) : (
                    <button type="button" onClick={switchToNewPerson} className="w-full rounded-2xl border border-emerald-500/40 p-3 text-left text-sm font-semibold text-emerald-600 dark:text-emerald-300">Add new person</button>
                  )}
                </div>
              )}
              {selectedPerson && <p className="rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-600 dark:text-emerald-300">Selected {selectedPerson.name}{selectedPerson.phone ? ` - ${selectedPerson.phone}` : ""}</p>}
            </>
          ) : (
            <>
              <FormField label={showLentForm ? "Borrower name" : "Lender name"}>
                <input value={moneyName} onChange={(event) => setMoneyName(event.target.value)} className={formTokens.input} />
              </FormField>
              {moneyName.trim() && existingName && <p className="rounded-2xl bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-300">This person already exists. Select existing profile instead.</p>}
              <FormField label="Phone optional">
                <input type="tel" value={moneyPhone} onChange={(event) => setMoneyPhone(event.target.value)} className={formTokens.input} />
              </FormField>
            </>
          )}

          <FormField label="Amount">
            <CurrencyInput value={moneyAmount} onChange={setMoneyAmount} symbol={currencySymbol} placeholder="0.00" />
          </FormField>
          <SelectField label="Account" value={moneyAccount} onChange={(event) => setMoneyAccount(event.target.value === "Cash" ? "Cash" : "Bank")} options={[{ value: "Bank", label: "Bank" }, { value: "Cash", label: "Cash" }]} />
          {showLentForm ? (
            <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
              <input type="checkbox" checked={lentAffectsAccountBalance} onChange={(event) => setLentAffectsAccountBalance(event.target.checked)} className="mt-1 h-4 w-4" />
              <span>
                <span className="block font-semibold text-neutral-900 dark:text-white">Deduct from my balance</span>
                <span className="mt-1 block text-xs text-neutral-500">Leave unchecked for money already lent before using this app.</span>
              </span>
            </label>
          ) : (
            <label className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
              <input type="checkbox" checked={borrowedAffectsAccountBalance} onChange={(event) => setBorrowedAffectsAccountBalance(event.target.checked)} className="mt-1 h-4 w-4" />
              <span>
                <span className="block font-semibold text-neutral-900 dark:text-white">Add this money to my balance</span>
                <span className="mt-1 block text-xs text-neutral-500">Leave unchecked for money already received before this app.</span>
              </span>
            </label>
          )}
          <DateField label="Date" value={moneyDate} max={new Date().toISOString().split("T")[0]} onChange={(event) => setMoneyDate(event.target.value)} />
          <FormField label="Notes">
            <textarea value={moneyNotes} onChange={(event) => setMoneyNotes(event.target.value)} className={formTokens.input} />
          </FormField>
        </ModalSection>
      </ModalContent>
      <ModalFooter onCancel={closeAllForms} onSave={showLentForm ? addLent : addBorrowed} saveLabel="Save" tone={showLentForm ? "emerald" : "red"} />
    </ModalWrapper>
  );
}
