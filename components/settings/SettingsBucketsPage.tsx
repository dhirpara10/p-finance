"use client";

import { Actions, Field, SettingsPanel } from "@/components/settings/SettingsAccountsPage";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { useState } from "react";
import { Archive, Plus, RefreshCw, Save, Tags, Trash2 } from "lucide-react";
import { findDuplicateTrackerCategory } from "@/lib/buckets";
import type { AllocationFrequency, BucketListTracker } from "@/lib/types";
import { SelectField } from "@/components/forms/SelectField";

type Props = { state: FinanceDashboardState };

export function SettingsBucketsPage({ state }: Props) {
  const [newSavingsName, setNewSavingsName] = useState("");
  const [newTrackerName, setNewTrackerName] = useState("");

  function updateSavingsBucket(id: string, field: "name" | "targetAmount" | "linkedStorageLabel" | "active", value: number | string | boolean) {
    state.setSavingsBuckets(state.savingsBuckets.map((bucket) => bucket.id === id ? { ...bucket, [field]: value, updatedAt: new Date().toISOString() } : bucket));
  }

  function updateTracker(id: string, field: "name" | "monthlyBudget" | "active", value: number | string | boolean) {
    state.setBucketListTrackers(state.bucketListTrackers.map((tracker) => tracker.id === id ? { ...tracker, [field]: value, updatedAt: new Date().toISOString() } : tracker));
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
      alert("Withdraw this bucket's money before archiving it.");
      return;
    }
    updateSavingsBucket(id, "active", active);
  }

  function toggleTracker(id: string, active: boolean) {
    const tracker = state.bucketListTrackers.find((item) => item.id === id);
    if (active && tracker) {
      const duplicate = findDuplicateTrackerCategory(
        state.bucketListTrackers,
        id,
        tracker.linkedCategoryIds
      );
      if (duplicate) {
        alert(`Cannot restore this tracker because ${duplicate.owner.name} already uses one of its categories.`);
        return;
      }
    }
    updateTracker(id, "active", active);
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
              <button type="button" onClick={() => toggleSavingsBucket(bucket.id, !bucket.active)} className="flex items-center gap-1 text-xs text-neutral-400"><Archive size={14}/>{bucket.active ? "Archive" : "Restore"}</button>
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
              <button type="button" onClick={() => toggleTracker(tracker.id, !tracker.active)} className="flex items-center gap-1 text-xs text-neutral-400"><Archive size={14}/>{tracker.active ? "Archive" : "Restore"}</button>
            </div>
            <Field label="Name">
              <input value={tracker.name} onChange={(event) => updateTracker(tracker.id, "name", event.target.value)} className="w-full rounded-2xl bg-neutral-800 p-4 outline-none" />
            </Field>
            <Field label="Monthly cap">
              <input type="number" value={String(tracker.monthlyBudget)} onChange={(event) => updateTracker(tracker.id, "monthlyBudget", Number(event.target.value))} className="w-full rounded-2xl bg-neutral-800 p-4 outline-none" />
            </Field>
            <TrackerRecurringAllocation state={state} tracker={tracker} />
            <p className="mt-3 text-xs text-neutral-500">{tracker.linkedCategoryIds.length} linked categor{tracker.linkedCategoryIds.length === 1 ? "y" : "ies"}</p>
            <button type="button" onClick={() => { state.setSettingsBucketHistory({ type: "tracker", id: tracker.id }); state.navigateToSettingsPage("bucket-history"); }} className="mt-3 w-full rounded-2xl bg-neutral-800 p-3 text-sm font-semibold text-purple-200">View History & Budget Math</button>
          </div>
        ))}
        <button type="button" onClick={() => state.navigateToSettingsPage("categories")} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-neutral-800 p-4 font-semibold text-purple-200"><Tags size={18}/> Manage Category Links</button>
      </div>
      <Actions state={state} />
    </SettingsPanel>
  );
}

function TrackerRecurringAllocation({
  state,
  tracker,
}: {
  state: FinanceDashboardState;
  tracker: BucketListTracker;
}) {
  const rule = state.recurringJarAllocations.find(
    (item) => item.trackerId === tracker.id
  );
  const [source, setSource] = useState<"Bank" | "Cash">(
    rule?.sourceAccountId || "Bank"
  );
  const [amount, setAmount] = useState(
    String(rule?.allocationAmount || "")
  );
  const [frequency, setFrequency] = useState<AllocationFrequency>(
    rule?.frequency || "monthly"
  );
  const [startDate, setStartDate] = useState(
    rule?.startDate || new Date().toISOString().split("T")[0]
  );
  const [saving, setSaving] = useState(false);

  async function saveRule() {
    const allocationAmount = Number(amount);
    if (!allocationAmount || allocationAmount <= 0) {
      alert("Allocation amount must be greater than zero.");
      return;
    }
    setSaving(true);
    try {
      if (rule) {
        await state.updateRecurringJarAllocation(rule.id, {
          sourceAccountId: source,
          allocationAmount,
          frequency,
          startDate,
          active: true,
        });
      } else {
        await state.createRecurringJarAllocation({
          sourceAccountId: source,
          allocationAmount,
          frequency,
          trackerId: tracker.id,
          startDate,
          note: `${tracker.name} shared jar allocation`,
        });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-purple-500/15 bg-purple-500/[0.06] p-4">
      <div className="flex items-start justify-between gap-3">
        <span className="flex items-start gap-3">
          <RefreshCw size={17} className="mt-0.5 text-purple-300" />
          <span>
            <span className="block text-sm font-semibold">
              Recurring Allocation
            </span>
            <span className="mt-1 block text-xs text-neutral-500">
              Real transfers into the one shared jar.
            </span>
          </span>
        </span>
        {rule && (
          <button
            type="button"
            onClick={() =>
              state.updateRecurringJarAllocation(rule.id, {
                active: !rule.active,
              })
            }
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              rule.active
                ? "bg-emerald-400/10 text-emerald-200"
                : "bg-white/[0.05] text-neutral-400"
            }`}
          >
            {rule.active ? "Active" : "Paused"}
          </button>
        )}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Source"
          value={source}
          onChange={(event) =>
            setSource(event.target.value === "Cash" ? "Cash" : "Bank")
          }
          options={[
            { value: "Bank", label: "Bank" },
            { value: "Cash", label: "Cash" },
          ]}
        />
        <Field label="Amount">
          <input
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </Field>
        <SelectField
          label="Frequency"
          value={frequency}
          onChange={(event) =>
            setFrequency(event.target.value as AllocationFrequency)
          }
          options={[
            { value: "weekly", label: "Weekly" },
            { value: "biweekly", label: "Biweekly" },
            { value: "monthly", label: "Monthly" },
            { value: "yearly", label: "Yearly" },
          ]}
        />
        <Field label="Start date">
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </Field>
      </div>
      {rule && (
        <p className="mt-3 text-xs text-purple-200/75">
          Next execution {rule.nextExecutionDate}. Last execution{" "}
          {rule.lastExecutionDate || "not yet"}.
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={saveRule}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-400/15 p-3 text-sm font-semibold text-purple-100 disabled:opacity-50"
        >
          <Save size={15} /> {rule ? "Update rule" : "Create rule"}
        </button>
        {rule && (
          <button
            type="button"
            aria-label={`Delete ${tracker.name} recurring allocation`}
            onClick={() => state.deleteRecurringJarAllocation(rule.id)}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/15 text-red-200"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
