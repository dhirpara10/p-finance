"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { SelectField } from "@/components/forms/SelectField";
import type { LendingTransaction, PersonProfile } from "@/lib/types";

type LendingDetailsProps = { state: FinanceDashboardState; };

function getTransactionLabel(transaction: LendingTransaction) {
  if (transaction.type === "lent") return "Lent";
  if (transaction.type === "borrowed") return "Borrowed";
  return "Settlement";
}

function getTransactionClass(transaction: LendingTransaction) {
  if (transaction.type === "lent") return "text-green-400";
  if (transaction.type === "borrowed") return "text-red-400";
  return "text-blue-400";
}

function filterProfiles(
  profiles: PersonProfile[],
  detailsView: "lent" | "borrowed" | null
) {
  if (detailsView === "lent") {
    return profiles.filter((profile) => profile.netBalance > 0);
  }

  if (detailsView === "borrowed") {
    return profiles.filter((profile) => profile.netBalance < 0);
  }

  return profiles;
}

export function LendingDetails({ state }: LendingDetailsProps) {
  const {
    detailsView,
    setDetailsView,
    personProfiles,
    settlementProfileId,
    settlementAmount,
    setSettlementAmount,
    settlementAccount,
    setSettlementAccount,
    settlementDate,
    setSettlementDate,
    settlementNotes,
    setSettlementNotes,
    openSettlement,
    saveSettlement,
    deleteLendingTransaction,
  } = state;

  const profiles = filterProfiles(personProfiles, detailsView);
  const settlementProfile = personProfiles.find(
    (profile) => profile.id === settlementProfileId
  );

  return (
    <div className="no-scrollbar fixed inset-0 z-50 overflow-y-auto bg-[#f0f2f5] px-4 py-6 text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {detailsView === "lent" ? "Money I Lent" : "Money I Borrowed"}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {detailsView === "lent"
                ? "People who owe you money"
                : "People you owe money to"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setDetailsView(null)}
            className="rounded-full bg-neutral-200 px-4 py-2 text-sm text-neutral-700 dark:bg-neutral-900 dark:text-white"
          >
            Close
          </button>
        </div>

        <div className="space-y-3">
          {profiles.length === 0 ? (
            <p className="rounded-2xl bg-neutral-200 p-4 text-sm text-neutral-500 dark:bg-neutral-900">
              No profiles yet.
            </p>
          ) : (
            profiles.map((profile) => (
              <div key={profile.id} className="rounded-3xl bg-neutral-200 p-5 dark:bg-neutral-900">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-neutral-900 dark:text-white">{profile.name}</p>
                    {profile.phone && (
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        Phone: {profile.phone}
                      </p>
                    )}
                    <p className="text-xs text-neutral-500">
                      Profile since {profile.createdAt || "Unknown"}
                    </p>
                  </div>

                  <p
                    className={
                      profile.netBalance > 0
                        ? "text-right text-sm font-semibold text-green-400"
                        : profile.netBalance < 0
                          ? "text-right text-sm font-semibold text-red-400"
                          : "text-right text-sm font-semibold text-neutral-400"
                    }
                  >
                    {profile.status}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-2xl bg-neutral-300 p-3 dark:bg-neutral-800">
                    <p className="text-neutral-600 dark:text-neutral-400">Total Lent</p>
                    <p className="mt-1 font-semibold text-green-400">
                      ${profile.totalLent.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-neutral-300 p-3 dark:bg-neutral-800">
                    <p className="text-neutral-600 dark:text-neutral-400">Total Borrowed</p>
                    <p className="mt-1 font-semibold text-red-400">
                      ${profile.totalBorrowed.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-neutral-300 p-3 dark:bg-neutral-800">
                    <p className="text-neutral-600 dark:text-neutral-400">Total Settled</p>
                    <p className="mt-1 font-semibold text-blue-400">
                      ${profile.totalSettled.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-neutral-300 p-3 dark:bg-neutral-800">
                    <p className="text-neutral-600 dark:text-neutral-400">Net Balance</p>
                    <p className="mt-1 font-semibold text-neutral-900 dark:text-white">
                      ${Math.abs(profile.netBalance).toLocaleString()}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    openSettlement(profile.id, Math.abs(profile.netBalance))
                  }
                  disabled={profile.netBalance === 0}
                  className="mt-4 w-full rounded-2xl bg-blue-500 p-3 font-semibold text-black disabled:bg-neutral-300 disabled:text-neutral-500 dark:disabled:bg-neutral-800"
                >
                  Settle Up
                </button>

                {settlementProfile?.id === profile.id && (
                  <div className="mt-4 space-y-3 rounded-2xl bg-neutral-300 p-4 dark:bg-neutral-800">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSettlementAmount(String(Math.abs(profile.netBalance)))
                        }
                        className="rounded-xl bg-neutral-200 p-3 text-sm font-semibold text-neutral-800 dark:bg-neutral-700 dark:text-white"
                      >
                        Full
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettlementAmount("")}
                        className="rounded-xl bg-neutral-200 p-3 text-sm font-semibold text-neutral-800 dark:bg-neutral-700 dark:text-white"
                      >
                        Partial
                      </button>
                    </div>

                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Settlement amount"
                      value={settlementAmount}
                      onChange={(e) => setSettlementAmount(e.target.value.replace(/[^\d.]/g, ""))}
                      className="w-full rounded-2xl bg-neutral-100 p-4 outline-none text-neutral-900 dark:bg-neutral-900 dark:text-white"
                    />

                    <SelectField
                      aria-label="Settlement account"
                      value={settlementAccount}
                      onChange={(event) =>
                        setSettlementAccount(event.target.value as "Bank" | "Cash")
                      }
                      options={[
                        { value: "Bank", label: "Bank" },
                        { value: "Cash", label: "Cash" },
                      ]}
                    />

                    <input
                      type="date"
                      value={settlementDate}
                      onChange={(e) => setSettlementDate(e.target.value)}
                      className="w-full rounded-2xl bg-neutral-100 p-4 outline-none text-neutral-900 dark:bg-neutral-900 dark:text-white"
                    />

                    <textarea
                      placeholder="Note optional"
                      value={settlementNotes}
                      onChange={(e) => setSettlementNotes(e.target.value)}
                      className="w-full rounded-2xl bg-neutral-100 p-4 outline-none text-neutral-900 dark:bg-neutral-900 dark:text-white"
                    />

                    <button
                      type="button"
                      onClick={saveSettlement}
                      className="w-full rounded-2xl bg-green-500 p-4 font-semibold text-black"
                    >
                      Save Settlement
                    </button>
                  </div>
                )}

                <div className="mt-5 space-y-2">
                  {profile.transactions.map((transaction) => (
                    <div
                      key={`${transaction.type}-${transaction.id}`}
                      className="rounded-2xl bg-neutral-300 p-3 text-sm dark:bg-neutral-800"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-neutral-900 dark:text-white">
                            {getTransactionLabel(transaction)}
                          </p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">
                            {transaction.date}
                          </p>
                        </div>
                        <p className={getTransactionClass(transaction)}>
                          ${transaction.amount.toLocaleString()}
                        </p>
                      </div>

                      {transaction.note && (
                        <p className="mt-2 text-neutral-700 dark:text-neutral-300">
                          {transaction.note}
                        </p>
                      )}

                      {!transaction.legacy && (
                        <button
                          type="button"
                          onClick={() => deleteLendingTransaction(transaction.id)}
                          className="mt-3 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-black"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
