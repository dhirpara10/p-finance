"use client";

import { Actions, Field, SettingsPanel } from "@/components/settings/SettingsAccountsPage";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type Props = { state: FinanceDashboardState };

export function SettingsSecurityPage({ state }: Props) {
  return (
    <SettingsPanel title="Security" onBack={state.goBackSettingsPage}>
      <Field label="Change passcode">
        <input type="password" inputMode="numeric" maxLength={6} value={state.newPasscode} onChange={(event) => state.setNewPasscode(event.target.value)} placeholder="Enter new passcode" className="w-full rounded-2xl bg-neutral-800 p-4 outline-none" />
      </Field>
      <Actions state={state} />
    </SettingsPanel>
  );
}
