"use client";

import { SettingsPanel } from "@/components/settings/SettingsAccountsPage";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type Props = { state: FinanceDashboardState };

export function SettingsBucketHistoryPage({ state }: Props) {
  return (
    <SettingsPanel title="Bucket History" onBack={state.goBackSettingsPage}>
      <div className="rounded-2xl bg-neutral-950 p-4 text-sm text-neutral-400">
        Open a bucket history from the Buckets dashboard section to inspect transfers and tracker expenses.
      </div>
    </SettingsPanel>
  );
}
