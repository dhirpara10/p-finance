"use client";

import { categoryIdFromName, normalizeCategoryId } from "@/lib/buckets";
import { Actions, SettingsPanel } from "@/components/settings/SettingsAccountsPage";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type Props = { state: FinanceDashboardState };

export function SettingsCategoriesPage({ state }: Props) {
  return (
    <SettingsPanel title="Categories" onBack={state.goBackSettingsPage}>
      <div className="flex gap-2">
        <input value={state.newExpenseCategory} onChange={(event) => state.setNewExpenseCategory(event.target.value)} placeholder="New category" className="min-w-0 flex-1 rounded-2xl bg-neutral-200 p-4 outline-none dark:bg-neutral-800" />
        <button type="button" onClick={state.addExpenseCategory} className="rounded-2xl bg-neutral-200 px-4 font-semibold text-emerald-600 dark:bg-neutral-800 dark:text-emerald-300">Add</button>
      </div>
      <div className="space-y-3">
        {state.bucketListTrackers.map((tracker) => (
          <div key={tracker.id} className="rounded-2xl bg-neutral-100 p-4 dark:bg-neutral-950">
            <p className="mb-3 font-semibold text-neutral-900 dark:text-white">{tracker.name}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {state.expenseCategories.map((category) => {
                const categoryId = categoryIdFromName(category);
                const checked = tracker.linkedCategoryIds
                  .map(normalizeCategoryId)
                  .includes(normalizeCategoryId(categoryId));
                return (
                  <label key={category} className="flex items-center gap-2 rounded-xl bg-neutral-200 p-3 text-sm dark:bg-neutral-800">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => {
                        const next = event.target.checked
                          ? [...tracker.linkedCategoryIds, categoryId]
                          : tracker.linkedCategoryIds.filter(
                              (id) =>
                                normalizeCategoryId(id) !==
                                normalizeCategoryId(categoryId)
                            );
                        state.updateBucketListTrackerCategoryLinks(tracker.id, next);
                      }}
                    />
                    {category}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <Actions state={state} />
    </SettingsPanel>
  );
}
