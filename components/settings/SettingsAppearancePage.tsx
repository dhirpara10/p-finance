"use client";

import { SettingsPanel } from "@/components/settings/SettingsAccountsPage";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type Props = { state: FinanceDashboardState };

export function SettingsAppearancePage({ state }: Props) {
  return (
    <SettingsPanel title="Appearance" onBack={state.goBackSettingsPage}>
      <div className="rounded-2xl bg-neutral-950 p-4 text-sm text-neutral-400">
        Dark finance theme is active. More appearance controls can live here later.
      </div>
    </SettingsPanel>
  );
}
