"use client";

import { Actions, Field, SettingsPanel } from "@/components/settings/SettingsAccountsPage";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { useState } from "react";
import { Archive, Plus, Tags, Trash2 } from "lucide-react";
import { categoryIdFromName, findDuplicateTrackerCategory, normalizeCategoryId } from "@/lib/buckets";
import type { AllocationFrequency, BucketListTracker } from "@/lib/types";
import { SelectField } from "@/components/forms/SelectField";
import { toast } from "@/lib/toast";
import { showConfirm } from "@/lib/confirm";

type Props = { state: FinanceDashboardState };

function CategoryLinksEditor({
  tracker,
  state,
}: {
  tracker: BucketListTracker;
  state: FinanceDashboardState;
}) {
  const allCategories = state.expenseCategories;

  function isLinked(catName: string) {
    const catId = categoryIdFromName(catName);
    return tracker.linkedCategoryIds
      .map(normalizeCategoryId)
      .includes(normalizeCategoryId(catId));
  }

  function toggleCategory(catName: string) {
    const catId = categoryIdFromName(catName);
    const newIds = isLinked(catName)
      ? tracker.linkedCategoryIds.filter((id) => normalizeCategoryId(id) !== normalizeCategoryId(catId))
      : [...tracker.linkedCategoryIds, catId];

    const duplicate = findDuplicateTrackerCategory(state.bucketListTrackers, tracker.id, newIds);
    if (duplicate) {
      toast(`A category is already linked to "${duplicate.owner.name}". Each category can only belong to one tracker.`, "error");
      return;
    }

    state.updateBucketListTrackerCategoryLinks(tracker.id, newIds);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-neutral-500">
        Select which expense categories count toward <span className="font-semibold text-purple-200">{tracker.name}</span>. Each category can only belong to one tracker.
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {allCategories.map((catName) => {
          const linked = isLinked(catName);
          return (
            <label
              key={catName}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
                linked
                  ? "border-purple-400/30 bg-purple-500/15 text-purple-200"
                  : "border-white/[0.06] bg-white/[0.025] text-neutral-400 hover:border-white/[0.1] hover:text-neutral-200"
              }`}
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-purple-500"
                checked={linked}
                onChange={() => toggleCategory(catName)}
              />
              {catName}
            </label>
          );
        })}
      </div>
      {allCategories.length === 0 && (
        <p className="py-6 text-center text-sm text-neutral-500">No categories yet. Add some in Categories settings.</p>
      )}
    </div>
  );
}

export function SettingsBucketsPage({ state }: Props) {
  const [newSavingsName, setNewSavingsName] = useState("");
  const [newTrackerName, setNewTrackerName] = useState("");
  const [editingCategoryTrackerId, setEditingCategoryTrackerId] = useState<string | null>(null);

  const editingCategoryTracker = editingCategoryTrackerId
    ? state.bucketListTrackers.find((t) => t.id === editingCategoryTrackerId) ?? null
    : null;

  function updateSavingsBucket(id: string, field: "name" | "targetAmount" | "linkedStorageLabel" | "active", value: number | string | boolean) {
    state.setSavingsBuckets(state.savingsBuckets.map((bucket) => bucket.id === id ? { ...bucket, [field]: value, updatedAt: new Date().toISOString() } : bucket));
  }

  function updateTracker(id: string, field: "name" | "monthlyBudget" | "active", value: number | string | boolean) {
    state.setBucketListTrackers(state.bucketListTrackers.map((tracker) => tracker.id === id ? { ...tracker, [field]: value, updatedAt: new Date().toISOString() } : tracker));
  }

  function updateRecurringAllocation(
    id: string,
    patch: Partial<{
      sourceAccountId: "Bank" | "Cash";
      allocationAmount: number;
      frequency: AllocationFrequency;
      active: boolean;
    }>
  ) {
    state.setBucketListTrackers(
      state.bucketListTrackers.map((tracker) =>
        tracker.id === id
          ? {
              ...tracker,
              recurringAllocation: {
                sourceAccountId: tracker.recurringAllocation?.sourceAccountId || "Bank",
                allocationAmount: tracker.recurringAllocation?.allocationAmount || 0,
                frequency: tracker.recurringAllocation?.frequency || "monthly",
                active: tracker.recurringAllocation?.active || false,
                ...patch,
              },
              updatedAt: new Date().toISOString(),
            }
          : tracker
      )
    );
  }

  function addSavingsBucket() {
    const name = newSavingsName.trim();
    if (!name) return;
    const now = new Date().toISOString();
    state.setSavingsBuckets([
      ...state.savingsBuckets,
      {
        id: `savings_${crypto.randomUUID()}`,
        name,
        targetAmount: 0,
        currentBalance: 0,
        linkedStorageLabel: "Bank",
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    setNewSavingsName("");
  }

  function addTracker() {
    const name = newTrackerName.trim();
    if (!name) return;
    const now = new Date().toISOString();
    state.setBucketListTrackers([
      ...state.bucketListTrackers,
      {
        id: `tracker_${crypto.randomUUID()}`,
        name,
        icon: "Compass",
        monthlyBudget: 0,
        linkedCategoryIds: [],
        active: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
    setNewTrackerName("");
  }

  function toggleSavingsBucket(id: string, active: boolean) {
    const balance = state.savingsBucketBalances.find((bucket) => bucket.id === id)?.currentBalance || 0;
    if (!active && balance !== 0) {
      toast("Withdraw this bucket's money before archiving it.", "error");
      return;
    }
    updateSavingsBucket(id, "active", active);
  }

  async function deleteSavingsBucket(id: string) {
    const balance = state.savingsBucketBalances.find((b) => b.id === id)?.currentBalance || 0;
    if (balance !== 0) {
      toast("Withdraw this bucket's money before deleting it.", "error");
      return;
    }
    if (!await showConfirm("Delete this savings bucket permanently?")) return;
    state.setSavingsBuckets(state.savingsBuckets.filter((b) => b.id !== id));
  }

  function toggleTracker(id: string, active: boolean) {
    const tracker = state.bucketListTrackers.find((item) => item.id === id);
    if (active && tracker) {
      const duplicate = findDuplicateTrackerCategory(state.bucketListTrackers, id, tracker.linkedCategoryIds);
      if (duplicate) {
        toast(`Cannot restore this tracker because ${duplicate.owner.name} already uses one of its categories.`, "error");
        return;
      }
    }
    updateTracker(id, "active", active);
  }

  async function deleteTracker(id: string) {
    if (!await showConfirm("Delete this tracker permanently?")) return;
    state.setBucketListTrackers(state.bucketListTrackers.filter((t) => t.id !== id));
  }

  if (editingCategoryTracker) {
    return (
      <SettingsPanel title="Category Links" onBack={() => setEditingCategoryTrackerId(null)}>
        <CategoryLinksEditor
          tracker={editingCategoryTracker}
          state={state}
        />
        <Actions state={state} />
      </SettingsPanel>
    );
  }

  return (
    <SettingsPanel title="Buckets" onBack={state.goBackSettingsPage}>
      <div className="space-y-3">
        <h3 className="font-semibold text-blue-300">Savings Buckets</h3>
        <p className="text-sm text-neutral-500">
          Real money containers funded through transfers. Funding reduces usable balance while net worth stays unchanged.
        </p>
        <div className="flex gap-2">
          <input value={newSavingsName} onChange={(event) => setNewSavingsName(event.target.value)} placeholder="New savings bucket" className="min-w-0 flex-1 rounded-2xl bg-neutral-800 p-4 outline-none" />
          <button type="button" onClick={addSavingsBucket} className="flex items-center gap-2 rounded-2xl bg-blue-500 px-4 font-semibold text-black"><Plus size={18}/> Add</button>
        </div>
        {state.savingsBuckets.map((bucket) => (
          <div key={bucket.id} className={`rounded-2xl bg-neutral-950 p-4 ${bucket.active ? "" : "opacity-60"}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-blue-500/15 px-2 py-1 text-xs font-semibold text-blue-300">Real money</span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => toggleSavingsBucket(bucket.id, !bucket.active)} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200">
                  <Archive size={14}/>{bucket.active ? "Archive" : "Restore"}
                </button>
                <button type="button" onClick={() => deleteSavingsBucket(bucket.id)} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-red-300">
                  <Trash2 size={13}/> Delete
                </button>
              </div>
            </div>
            <Field label="Name">
              <input value={bucket.name} onChange={(event) => updateSavingsBucket(bucket.id, "name", event.target.value)} className="w-full rounded-2xl bg-neutral-800 p-4 outline-none" />
            </Field>
            <Field label="Target amount">
              <input type="number" value={String(bucket.targetAmount)} onChange={(event) => updateSavingsBucket(bucket.id, "targetAmount", Number(event.target.value))} className="w-full rounded-2xl bg-neutral-800 p-4 outline-none" />
            </Field>
            <Field label="Storage label">
              <input value={bucket.linkedStorageLabel} onChange={(event) => updateSavingsBucket(bucket.id, "linkedStorageLabel", event.target.value)} className="w-full rounded-2xl bg-neutral-800 p-4 outline-none" />
            </Field>
            <button type="button" onClick={() => { state.setSettingsBucketHistory({ type: "savings", id: bucket.id }); state.navigateToSettingsPage("bucket-history"); }} className="mt-3 w-full rounded-2xl bg-neutral-800 p-3 text-sm font-semibold text-blue-200">View History</button>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-purple-300">Bucket List Trackers</h3>
        <p className="text-sm text-neutral-500">
          Virtual spending planners linked to categories. They never hold money or appear as transfer destinations; all rollover belongs to one shared jar.
        </p>
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
          <p className="text-sm font-semibold text-purple-200">One Shared Rollover Jar</p>
          <p className="mt-1 text-xs text-neutral-400">Opening carry-forward balance used by every active tracker.</p>
          <input type="number" value={String(state.sharedRolloverJarBalance)} onChange={(event) => state.setSharedRolloverJarBalance(Number(event.target.value))} className="mt-3 w-full rounded-2xl bg-neutral-950 p-4 outline-none" />
        </div>
        <div className="flex gap-2">
          <input value={newTrackerName} onChange={(event) => setNewTrackerName(event.target.value)} placeholder="New virtual tracker" className="min-w-0 flex-1 rounded-2xl bg-neutral-800 p-4 outline-none" />
          <button type="button" onClick={addTracker} className="flex items-center gap-2 rounded-2xl bg-purple-500 px-4 font-semibold text-black"><Plus size={18}/> Add</button>
        </div>
        {state.bucketListTrackers.map((tracker) => (
          <div key={tracker.id} className={`rounded-2xl bg-neutral-950 p-4 ${tracker.active ? "" : "opacity-60"}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-purple-500/15 px-2 py-1 text-xs font-semibold text-purple-300">Virtual tracker</span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => toggleTracker(tracker.id, !tracker.active)} className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-200">
                  <Archive size={14}/>{tracker.active ? "Archive" : "Restore"}
                </button>
                <button type="button" onClick={() => deleteTracker(tracker.id)} className="flex items-center gap-1 text-xs text-neutral-500 hover:text-red-300">
                  <Trash2 size={13}/> Delete
                </button>
              </div>
            </div>
            <Field label="Name">
              <input value={tracker.name} onChange={(event) => updateTracker(tracker.id, "name", event.target.value)} className="w-full rounded-2xl bg-neutral-800 p-4 outline-none" />
            </Field>
            <Field label="Monthly cap">
              <input type="number" value={String(tracker.monthlyBudget)} onChange={(event) => updateTracker(tracker.id, "monthlyBudget", Number(event.target.value))} className="w-full rounded-2xl bg-neutral-800 p-4 outline-none" />
            </Field>
            <div className="mt-4 rounded-2xl border border-purple-500/15 bg-purple-500/[0.06] p-4">
              <label className="flex items-center justify-between gap-3">
                <span>
                  <span className="block text-sm font-semibold">Recurring Allocation</span>
                  <span className="mt-1 block text-xs text-neutral-500">Plan automatic contributions into the one shared jar.</span>
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(tracker.recurringAllocation?.active)}
                  onChange={(event) => updateRecurringAllocation(tracker.id, { active: event.target.checked })}
                  className="h-5 w-5 accent-purple-500"
                />
              </label>
              {tracker.recurringAllocation?.active && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <SelectField
                    label="Source"
                    value={tracker.recurringAllocation.sourceAccountId}
                    onChange={(event) => updateRecurringAllocation(tracker.id, { sourceAccountId: event.target.value === "Cash" ? "Cash" : "Bank" })}
                    options={[{ value: "Bank", label: "Bank" }, { value: "Cash", label: "Cash" }]}
                  />
                  <Field label="Amount">
                    <input
                      type="number"
                      value={String(tracker.recurringAllocation.allocationAmount)}
                      onChange={(event) => updateRecurringAllocation(tracker.id, { allocationAmount: Number(event.target.value) })}
                      className="w-full rounded-xl bg-neutral-800 p-3 outline-none"
                    />
                  </Field>
                  <SelectField
                    label="Frequency"
                    value={tracker.recurringAllocation.frequency}
                    onChange={(event) => updateRecurringAllocation(tracker.id, { frequency: event.target.value as AllocationFrequency })}
                    options={[
                      { value: "weekly", label: "Weekly" },
                      { value: "biweekly", label: "Biweekly" },
                      { value: "monthly", label: "Monthly" },
                      { value: "yearly", label: "Yearly" },
                    ]}
                  />
                </div>
              )}
              {tracker.recurringAllocation?.active && (
                <p className="mt-3 text-xs text-purple-200">
                  Allocated automatically {tracker.recurringAllocation.frequency} from {tracker.recurringAllocation.sourceAccountId}.
                </p>
              )}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-neutral-500">{tracker.linkedCategoryIds.length} linked categor{tracker.linkedCategoryIds.length === 1 ? "y" : "ies"}</p>
              <button
                type="button"
                onClick={() => setEditingCategoryTrackerId(tracker.id)}
                className="flex items-center gap-1.5 rounded-xl bg-purple-500/15 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/25"
              >
                <Tags size={13}/> Manage Category Links
              </button>
            </div>
            <button type="button" onClick={() => { state.setSettingsBucketHistory({ type: "tracker", id: tracker.id }); state.navigateToSettingsPage("bucket-history"); }} className="mt-3 w-full rounded-2xl bg-neutral-800 p-3 text-sm font-semibold text-purple-200">View History & Budget Math</button>
          </div>
        ))}
      </div>
      <Actions state={state} />
    </SettingsPanel>
  );
}
