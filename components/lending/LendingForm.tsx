"use client";

import { findPersonByName, normalizePersonName } from "@/lib/lending";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type LendingFormProps = { state: FinanceDashboardState };

export function LendingForm({ state }: LendingFormProps) {
  const {
    showLentForm,
    editingItem,
    people,
    lendingPersonMode,
    setLendingPersonMode,
    selectedPersonId,
    setSelectedPersonId,
    personSearch,
    setPersonSearch,
    moneyName,
    setMoneyName,
    moneyAmount,
    setMoneyAmount,
    moneyDate,
    setMoneyDate,
    moneyPhone,
    setMoneyPhone,
    moneyNotes,
    setMoneyNotes,
    moneyAccount,
    setMoneyAccount,
    borrowedAffectsAccountBalance,
    setBorrowedAffectsAccountBalance,
    closeAllForms,
    addLent,
    addBorrowed,
  } = state;

  const searchQuery = normalizePersonName(personSearch);
  const filteredPeople = people.filter((person) => {
    if (!searchQuery) return false;
    return (
      normalizePersonName(person.name).includes(searchQuery) ||
      normalizePersonName(person.phone || "").includes(searchQuery)
    );
  });
  const selectedPerson = people.find(
    (person) => String(person.id) === String(selectedPersonId)
  );
  const existingName = findPersonByName(people, moneyName);
  const title = showLentForm
    ? editingItem?.type === "lent"
      ? "Edit Lent Money"
      : "Add Lent Money"
    : editingItem?.type === "borrowed"
      ? "Edit Borrowed Money"
      : "Add Borrowed Money";

  function selectExistingPerson(personId: string | number) {
    setSelectedPersonId(personId);
    const person = people.find((item) => String(item.id) === String(personId));
    if (person) {
      setPersonSearch(person.name);
    }
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6">
      <div className="mx-auto mt-10 w-full max-w-md rounded-3xl bg-neutral-900 p-5">
        <h2 className="mb-4 text-xl font-bold">{title}</h2>

        <div className="mb-4 grid grid-cols-2 gap-2 rounded-2xl bg-neutral-950 p-1">
          <button
            type="button"
            onClick={switchToExistingPerson}
            className={`rounded-xl p-3 text-sm font-semibold ${
              lendingPersonMode === "existing"
                ? "bg-emerald-500 text-black"
                : "text-neutral-400"
            }`}
          >
            Existing
          </button>

          <button
            type="button"
            onClick={switchToNewPerson}
            className={`rounded-xl p-3 text-sm font-semibold ${
              lendingPersonMode === "new"
                ? "bg-emerald-500 text-black"
                : "text-neutral-400"
            }`}
          >
            New Person
          </button>
        </div>

        <div className="space-y-3">
          {lendingPersonMode === "existing" ? (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Search person"
                value={personSearch}
                onChange={(event) => {
                  setPersonSearch(event.target.value);
                  setSelectedPersonId(null);
                }}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              {searchQuery && (
                <div className="max-h-52 space-y-2 overflow-y-auto rounded-2xl bg-neutral-950 p-2">
                  {filteredPeople.length > 0 ? (
                  filteredPeople.map((person) => (
                    <button
                      key={String(person.id)}
                      type="button"
                      onClick={() => selectExistingPerson(person.id)}
                      className={`w-full rounded-2xl p-3 text-left ${
                        String(selectedPersonId) === String(person.id)
                          ? "bg-emerald-500 text-black"
                          : "bg-neutral-800 text-white"
                      }`}
                    >
                      <span className="block font-semibold">{person.name}</span>
                      {person.phone && (
                        <span className="block text-xs opacity-75">
                          {person.phone}
                        </span>
                      )}
                    </button>
                  ))
                  ) : (
                  <button
                    type="button"
                    onClick={switchToNewPerson}
                    className="w-full rounded-2xl border border-emerald-500/40 p-3 text-left text-sm font-semibold text-emerald-300"
                  >
                    Add new person
                  </button>
                  )}
                </div>
              )}

              {selectedPerson && (
                <p className="rounded-2xl bg-emerald-500/10 p-3 text-sm text-emerald-300">
                  Selected {selectedPerson.name}
                  {selectedPerson.phone ? ` - ${selectedPerson.phone}` : ""}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder={showLentForm ? "Borrower name" : "Lender name"}
                value={moneyName}
                onChange={(event) => setMoneyName(event.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              {moneyName.trim() && existingName && (
                <p className="rounded-2xl bg-yellow-500/10 p-3 text-sm text-yellow-300">
                  This person already exists. Select existing profile instead.
                </p>
              )}

              <input
                type="tel"
                placeholder="Phone number optional"
                value={moneyPhone}
                onChange={(event) => setMoneyPhone(event.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />
            </div>
          )}

          <input
            type="number"
            placeholder="Amount"
            value={moneyAmount}
            onChange={(event) => setMoneyAmount(event.target.value)}
            className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
          />

          <select
            value={moneyAccount}
            onChange={(event) =>
              setMoneyAccount(event.target.value === "Cash" ? "Cash" : "Bank")
            }
            className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
          >
            <option value="Bank">Bank</option>
            <option value="Cash">Cash</option>
          </select>

          {!showLentForm && (
            <label className="flex items-start gap-3 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-sm text-neutral-300">
              <input
                type="checkbox"
                checked={borrowedAffectsAccountBalance}
                onChange={(event) =>
                  setBorrowedAffectsAccountBalance(event.target.checked)
                }
                className="mt-1 h-4 w-4 rounded border-neutral-700 bg-neutral-800 text-emerald-400"
              />
              <span>
                <span className="block font-semibold text-white">
                  Add this money to my balance
                </span>
                <span className="mt-1 block text-xs text-neutral-500">
                  Leave unchecked for money you already spent before tracking it here.
                </span>
              </span>
            </label>
          )}

          <input
            type="date"
            value={moneyDate}
            onChange={(event) => setMoneyDate(event.target.value)}
            className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
          />

          <textarea
            placeholder="Notes"
            value={moneyNotes}
            onChange={(event) => setMoneyNotes(event.target.value)}
            className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
          />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={closeAllForms}
            className="rounded-2xl bg-neutral-800 p-4 font-semibold"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={showLentForm ? addLent : addBorrowed}
            className={`rounded-2xl p-4 font-semibold text-black ${
              showLentForm ? "bg-green-500" : "bg-red-500"
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
