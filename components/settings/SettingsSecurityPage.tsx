"use client";

import { Actions, Field, SettingsPanel } from "@/components/settings/SettingsAccountsPage";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type Props = { state: FinanceDashboardState };

export function SettingsSecurityPage({ state }: Props) {
  return (
    <SettingsPanel title="Security & Users" onBack={state.goBackSettingsPage}>
      <div className="space-y-2">
        <h3 className="font-semibold text-neutral-800 dark:text-neutral-200">User Names</h3>
        <p className="text-sm text-neutral-500">These appear in activity logs to show who added each transaction.</p>
      </div>
      <Field label="Your name">
        <input value={state.userNameMe} onChange={(e) => state.setUserNameMe(e.target.value)} className="w-full rounded-2xl bg-neutral-200 p-4 outline-none dark:bg-neutral-800" placeholder="e.g. Dhruv" />
      </Field>
      <Field label="Partner name">
        <input value={state.userNameSpouse} onChange={(e) => state.setUserNameSpouse(e.target.value)} className="w-full rounded-2xl bg-neutral-200 p-4 outline-none dark:bg-neutral-800" placeholder="e.g. Wife" />
      </Field>
      <div className="space-y-2 pt-2">
        <h3 className="font-semibold text-neutral-800 dark:text-neutral-200">Passcodes</h3>
        <p className="text-sm text-neutral-500">Each person logs in with their own passcode. Both see all data.</p>
      </div>
      <Field label="Your passcode">
        <input type="password" inputMode="numeric" maxLength={6} value={state.newPasscode} onChange={(e) => state.setNewPasscode(e.target.value)} placeholder="New passcode (leave blank to keep current)" className="w-full rounded-2xl bg-neutral-200 p-4 outline-none dark:bg-neutral-800" />
      </Field>
      <Field label="Partner passcode">
        <input type="password" inputMode="numeric" maxLength={6} value={state.newSpousePasscode} onChange={(e) => state.setNewSpousePasscode(e.target.value)} placeholder="New partner passcode (leave blank to keep current)" className="w-full rounded-2xl bg-neutral-200 p-4 outline-none dark:bg-neutral-800" />
      </Field>
      <Actions state={state} />
    </SettingsPanel>
  );
}
