"use client";

import { useState } from "react";
import { Actions, Field, SettingsPanel } from "@/components/settings/SettingsAccountsPage";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type Props = { state: FinanceDashboardState };

export function SettingsSecurityPage({ state }: Props) {
  const [resetPassword, setResetPassword] = useState("");

  async function handleHardReset() {
    if (resetPassword !== "RESET-FINANCE-DATA") return;

    if (!window.confirm("Are you entirely sure you want to permanently delete all finance data? This action cannot be undone.")) {
      return;
    }

    await state.hardResetFinanceData();
    setResetPassword("");
  }

  return (
    <SettingsPanel title="Security" onBack={state.goBackSettingsPage}>
      <Field label="Change passcode">
        <input type="password" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={state.newPasscode} onChange={(event) => state.setNewPasscode(event.target.value)} placeholder="Enter new passcode" className="w-full rounded-2xl bg-neutral-800 p-4 outline-none" />
      </Field>

      <div className="mt-10 border-t border-red-500/20 pt-10">
        <h3 className="text-lg font-semibold text-red-400">Hard Reset Finance Data</h3>
        <p className="mt-2 text-sm text-neutral-400">
          This will permanently delete all incomes, expenses, transfers, lending, liabilities, and repayment schedules. Bucket targets and monthly caps will be reset to 0. Recent activity will be cleared.
        </p>
        <p className="mt-2 text-sm text-neutral-400">
          Type <strong className="text-white">RESET-FINANCE-DATA</strong> to confirm.
        </p>
        <div className="mt-4 flex gap-3">
          <input
            type="text"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            placeholder="RESET-FINANCE-DATA"
            className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
          />
          <button
            type="button"
            onClick={handleHardReset}
            disabled={resetPassword !== "RESET-FINANCE-DATA"}
            className="rounded-2xl bg-red-500/20 px-6 font-semibold text-red-400 transition hover:bg-red-500/30 disabled:opacity-50"
          >
            Reset Data
          </button>
        </div>
      </div>

      <Actions state={state} />
    </SettingsPanel>
  );
}
