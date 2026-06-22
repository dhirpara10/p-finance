"use client";

import { Actions, SettingsPanel } from "@/components/settings/SettingsAccountsPage";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type Props = { state: FinanceDashboardState };

export function SettingsBucketsPage({ state }: Props) {
  return (
    <SettingsPanel title="Buckets & Jar" onBack={state.goBackSettingsPage}>
      <div>
        <p className="mb-1.5 text-xs font-medium text-neutral-400">Shared Rollover Jar — opening balance</p>
        <p className="mb-2 text-xs text-neutral-500">One-time starting balance for your shared jar. Transfers in/out are tracked automatically.</p>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
          <span className="text-sm text-neutral-500">{state.currencySymbol}</span>
          <input
            type="number"
            min="0"
            value={state.sharedRolloverJarBalance || ""}
            onChange={(e) => state.setSharedRolloverJarBalance(Number(e.target.value) || 0)}
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder="0"
          />
        </div>
      </div>

      <p className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3 text-sm text-neutral-400">
        Buckets, trackers, and categories are now managed from the <strong className="font-medium text-purple-300">Buckets</strong> tab in the main app.
      </p>

      <Actions state={state} />
    </SettingsPanel>
  );
}
