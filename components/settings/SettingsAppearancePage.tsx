"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { SettingsPanel } from "@/components/settings/SettingsAccountsPage";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { Moon, Sun } from "lucide-react";

type Props = { state: FinanceDashboardState };

export function SettingsAppearancePage({ state }: Props) {
  const { theme, setTheme } = useTheme();

  return (
    <SettingsPanel title="Appearance" onBack={state.goBackSettingsPage}>
      <div className="space-y-4">
        <p className="text-sm text-neutral-500">Choose how the app looks on this device.</p>

        <div className="grid grid-cols-2 gap-3">
          {/* Light */}
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`flex flex-col items-center gap-3 rounded-2xl border p-5 transition ${
              theme === "light"
                ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10"
                : "border-black/[0.08] bg-black/[0.03] hover:bg-black/[0.06] dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
            }`}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${theme === "light" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-black/[0.06] text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-400"}`}>
              <Sun size={22} />
            </div>
            <div className="text-center">
              <p className={`text-sm font-semibold ${theme === "light" ? "text-emerald-700 dark:text-emerald-300" : "text-neutral-600 dark:text-neutral-400"}`}>Light</p>
              <p className="mt-0.5 text-xs text-neutral-500">Clean &amp; bright</p>
            </div>
            {theme === "light" && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">
                Active
              </span>
            )}
          </button>

          {/* Dark */}
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`flex flex-col items-center gap-3 rounded-2xl border p-5 transition ${
              theme === "dark"
                ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10"
                : "border-black/[0.08] bg-black/[0.03] hover:bg-black/[0.06] dark:border-white/[0.07] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
            }`}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${theme === "dark" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" : "bg-black/[0.06] text-neutral-600 dark:bg-white/[0.07] dark:text-neutral-400"}`}>
              <Moon size={22} />
            </div>
            <div className="text-center">
              <p className={`text-sm font-semibold ${theme === "dark" ? "text-emerald-700 dark:text-emerald-300" : "text-neutral-600 dark:text-neutral-400"}`}>Dark</p>
              <p className="mt-0.5 text-xs text-neutral-500">Easy on eyes</p>
            </div>
            {theme === "dark" && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">
                Active
              </span>
            )}
          </button>
        </div>

        {/* Quick toggle row */}
        <div className="flex items-center justify-between rounded-2xl border border-black/[0.07] bg-black/[0.03] px-4 py-3.5 dark:border-white/[0.07] dark:bg-white/[0.03]">
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon size={16} className="text-neutral-500" /> : <Sun size={16} className="text-neutral-500" />}
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {theme === "dark" ? "Dark mode" : "Light mode"} is active
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-xl bg-black/[0.06] px-3 py-1.5 text-xs font-semibold text-neutral-600 transition hover:bg-black/[0.10] dark:bg-white/[0.07] dark:text-neutral-300 dark:hover:bg-white/[0.12]"
          >
            Switch
          </button>
        </div>
      </div>
    </SettingsPanel>
  );
}
