"use client";

import { Actions, Field, SettingsPanel } from "@/components/settings/SettingsAccountsPage";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type Props = { state: FinanceDashboardState };

export function SettingsBucketsPage({ state }: Props) {
  function updateSavingsBucket(id: string, field: "targetAmount" | "active", value: number | boolean) {
    state.setSavingsBuckets(state.savingsBuckets.map((bucket) => bucket.id === id ? { ...bucket, [field]: value, updatedAt: new Date().toISOString() } : bucket));
  }

  function updateTracker(id: string, field: "monthlyBudget" | "active", value: number | boolean) {
    state.setBucketListTrackers(state.bucketListTrackers.map((tracker) => tracker.id === id ? { ...tracker, [field]: value, updatedAt: new Date().toISOString() } : tracker));
  }

  return (
    <SettingsPanel title="Buckets" onBack={state.goBackSettingsPage}>
      <div className="space-y-3">
        <h3 className="font-semibold text-blue-300">Savings Buckets</h3>
        {state.savingsBuckets.map((bucket) => (
          <div key={bucket.id} className="rounded-2xl bg-neutral-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{bucket.name}</p>
              <input type="checkbox" checked={bucket.active} onChange={(event) => updateSavingsBucket(bucket.id, "active", event.target.checked)} />
            </div>
            <Field label="Target amount">
              <input type="number" value={String(bucket.targetAmount)} onChange={(event) => updateSavingsBucket(bucket.id, "targetAmount", Number(event.target.value))} className="w-full rounded-2xl bg-neutral-800 p-4 outline-none" />
            </Field>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <h3 className="font-semibold text-purple-300">Bucket List Trackers</h3>
        {state.bucketListTrackers.map((tracker) => (
          <div key={tracker.id} className="rounded-2xl bg-neutral-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{tracker.name}</p>
              <input type="checkbox" checked={tracker.active} onChange={(event) => updateTracker(tracker.id, "active", event.target.checked)} />
            </div>
            <Field label="Monthly cap">
              <input type="number" value={String(tracker.monthlyBudget)} onChange={(event) => updateTracker(tracker.id, "monthlyBudget", Number(event.target.value))} className="w-full rounded-2xl bg-neutral-800 p-4 outline-none" />
            </Field>
          </div>
        ))}
      </div>
      <Actions state={state} />
    </SettingsPanel>
  );
}
