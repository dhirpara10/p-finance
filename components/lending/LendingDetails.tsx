"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { SelectField } from "@/components/forms/SelectField";
import type { LendingTransaction, PersonProfile } from "@/lib/types";
import { Pencil, Trash2 } from "lucide-react";

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
    deleteLent,
    deleteBorrowed,
    startEdit,
  } = state;

  const profiles = filterProfiles(personProfiles, detailsView);
  const settlementProfile = personProfiles.find(
    (profile) => profile.id === settlementProfileId
  );

  return (
    <div className="no-scrollbar fixed inset-0 z-50 overflow-y-auto bg-neutral-950 px-4 py-6 text-white">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {detailsView === "lent" ? "Money I Lent" : "Money I Borrowed"}
            </h2>
            <p className="text-sm text-neutral-400">
              {detailsView === "lent"
                ? "People who owe you money"
                : "People you owe money to"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setDetailsView(null)}
            className="rounded-full bg-neutral-900 px-4 py-2 text-sm"
          >
            Close
          </button>
        </div>

        <div className="space-y-3">
          {profiles.length === 0 ? (
            <p className="rounded-2xl bg-neutral-900 p-4 text-sm text-neutral-500">
              No profiles yet.
            </p>
          ) : (
            profiles.map((profile) => (
              <div key={profile.id} className="rounded-3xl bg-neutral-900 p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold">{profile.name}</p>
                    {profile.phone && (
                      <p className="text-sm text-neutral-400">
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
                  <div className="rounded-2xl bg-neutral-800 p-3">
                    <p className="text-neutral-400">Total Lent</p>
                    <p className="mt-1 font-semibold text-green-400">
                      ${profile.totalLent.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-neutral-800 p-3">
                    <p className="text-neutral-400">Total Borrowed</p>
                    <p className="mt-1 font-semibold text-red-400">
                      ${profile.totalBorrowed.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-neutral-800 p-3">
                    <p className="text-neutral-400">Total Settled</p>
                    <p className="mt-1 font-semibold text-blue-400">
                      ${profile.totalSettled.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-neutral-800 p-3">
                    <p className="text-neutral-400">Net Balance</p>
                    <p className="mt-1 font-semibold">
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
                  className="mt-4 w-full rounded-2xl bg-blue-500 p-3 font-semibold text-black disabled:bg-neutral-800 disabled:text-neutral-500"
                >
                  Settle Up
                </button>

                {settlementProfile?.id === profile.id && (
                  <div className="mt-4 space-y-3 rounded-2xl bg-neutral-800 p-4">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSettlementAmount(String(Math.abs(profile.netBalance)))
                        }
                        className="rounded-xl bg-neutral-700 p-3 text-sm font-semibold"
                      >
                        Full
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettlementAmount("")}
                        className="rounded-xl bg-neutral-700 p-3 text-sm font-semibold"
                      >
                        Partial
                      </button>
                    </div>

                    <input
                      type="number"
                      placeholder="Settlement amount"
                      value={settlementAmount}
                      onChange={(e) => setSettlementAmount(e.target.value)}
                      className="w-full rounded-2xl bg-neutral-900 p-4 outline-none"
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
                      className="w-full rounded-2xl bg-neutral-900 p-4 outline-none"
                    />

                    <textarea
                      placeholder="Note optional"
                      value={settlementNotes}
                      onChange={(e) => setSettlementNotes(e.target.value)}
                      className="w-full rounded-2xl bg-neutral-900 p-4 outline-none"
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
                      className="rounded-2xl bg-neutral-800 p-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            {getTransactionLabel(transaction)}
                          </p>
                          <p className="text-xs text-neutral-400">
                            {transaction.date}
                          </p>
                        </div>
                        <p className={getTransactionClass(transaction)}>
                          ${transaction.amount.toLocaleString()}
                        </p>
                      </div>

                      {transaction.note && (
                        <p className="mt-2 text-neutral-300">
                          {transaction.note}
                        </p>
                      )}

                      <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              startEdit({
                                id: transaction.id,
                                type: transaction.type,
                                title: `${getTransactionLabel(transaction)} ${profile.name}`,
                                subtitle: transaction.note || "Lending profile",
                                amount: transaction.amount,
                                date: transaction.date,
                                source: transaction.legacy
                                  ? undefined
                                  : "lendingTransaction",
                              })
                            }
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-700 px-4 py-2 text-sm font-semibold text-blue-200"
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!transaction.legacy) {
                                deleteLendingTransaction(transaction.id);
                              } else if (transaction.type === "lent") {
                                deleteLent(transaction.id);
                              } else {
                                deleteBorrowed(transaction.id);
                              }
                            }}
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-400/15 bg-red-400/[0.06] px-4 py-2 text-sm font-semibold text-red-200"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
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
