"use client";

import { Actions, Field, SettingsPanel } from "@/components/settings/SettingsAccountsPage";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type Props = { state: FinanceDashboardState };

export function SettingsAssetsPage({ state }: Props) {
  return (
    <SettingsPanel title="Assets" onBack={state.goBackSettingsPage}>
      <div className="space-y-2">
        <h3 className="font-semibold text-neutral-200">Asset Tracking</h3>
        <p className="text-sm text-neutral-500">Track gold, silver, and physical assets in net worth.</p>
      </div>

      <Field label="Enable asset tracking">
        <label className="flex cursor-pointer items-center gap-3">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={state.assetsEnabled}
              onChange={(e) => state.saveAssetsEnabled(e.target.checked)}
            />
            <div className={`h-6 w-11 rounded-full transition ${state.assetsEnabled ? "bg-emerald-500" : "bg-neutral-700"}`} />
            <div className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${state.assetsEnabled ? "translate-x-5" : "translate-x-0"}`} />
          </div>
          <span className="text-sm text-neutral-300">{state.assetsEnabled ? "Enabled" : "Disabled"}</span>
        </label>
      </Field>

      <div className="space-y-2 pt-2">
        <h3 className="font-semibold text-neutral-200">Metal Prices</h3>
        <div className="rounded-2xl border border-white/[0.05] bg-white/[0.025] p-4 space-y-2 text-sm text-neutral-400">
          <p>Prices are fetched from <span className="text-neutral-200">Metals.dev</span> and cached for 3 days to stay within the free plan (100 requests/month).</p>
          <p>Set your API key as <code className="rounded bg-neutral-800 px-1 py-0.5 text-xs text-amber-300">METALS_DEV_API_KEY</code> in your <code className="rounded bg-neutral-800 px-1 py-0.5 text-xs">.env.local</code> file.</p>
          {state.assetPrices.updatedAt ? (
            <p className="text-xs text-neutral-500">
              Last refreshed: {new Date(state.assetPrices.updatedAt).toLocaleString("en-AU")}
            </p>
          ) : (
            <p className="text-xs text-amber-400/80">Prices not yet loaded. Visit Assets tab and click Refresh.</p>
          )}
        </div>
      </div>

      <div className="space-y-2 pt-2">
        <h3 className="font-semibold text-neutral-200">Current Holdings</h3>
        <div className="grid grid-cols-2 gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.025] p-4 text-sm">
          <div>
            <p className="text-neutral-500">Gold</p>
            <p className="mt-0.5 font-semibold">{state.goldGrams.toLocaleString()}g</p>
          </div>
          <div>
            <p className="text-neutral-500">Silver</p>
            <p className="mt-0.5 font-semibold">{state.silverGrams.toLocaleString()}g</p>
          </div>
          <div>
            <p className="text-neutral-500">Other assets</p>
            <p className="mt-0.5 font-semibold">{state.otherAssets.length} item{state.otherAssets.length !== 1 ? "s" : ""}</p>
          </div>
          <div>
            <p className="text-neutral-500">Total value (AUD)</p>
            <p className="mt-0.5 font-semibold">${state.totalAssetsAud.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>
    </SettingsPanel>
  );
}
