"use client";

import { Actions, SettingsPanel } from "@/components/settings/SettingsAccountsPage";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type Props = { state: FinanceDashboardState };

export function SettingsCategoriesPage({ state }: Props) {
  return (
    <SettingsPanel title="Categories" onBack={state.goBackSettingsPage}>
      <p className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-sm text-neutral-400">
        Categories are now managed from the{" "}
        <strong className="font-medium text-purple-300">Buckets</strong> tab — tap the bottom nav icon to open it, then scroll to the Category Manager section.
      </p>
      <Actions state={state} />
    </SettingsPanel>
  );
}
