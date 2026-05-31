"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type SettingsFormProps = { state: FinanceDashboardState; };

export function SettingsForm({ state }: SettingsFormProps) {
  const { emergencyGoal, setEmergencyGoal, remittanceGoal, setRemittanceGoal, newPasscode, setNewPasscode, setShowSettingsForm, saveSettings } = state;

  return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6">
          <div className="mx-auto mt-10 w-full max-w-md rounded-3xl bg-neutral-900 p-5">
            <h2 className="mb-4 text-xl font-bold">Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-neutral-400">
                  Emergency Fund Goal
                </label>
                <input
                  type="number"
                  value={String(emergencyGoal)}
                  onChange={(e) => setEmergencyGoal(Number(e.target.value))}
                  className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-neutral-400">
                  Remittance Goal
                </label>
                <input
                  type="number"
                  value={String(remittanceGoal)}
                  onChange={(e) => setRemittanceGoal(Number(e.target.value))}
                  className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-neutral-400">
                  Change Passcode
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPasscode}
                  onChange={(e) => setNewPasscode(e.target.value)}
                  placeholder="Enter new passcode"
                  className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowSettingsForm(false)}
                className="rounded-2xl bg-neutral-800 p-4 font-semibold"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveSettings}
                className="rounded-2xl bg-green-500 p-4 font-semibold text-black"
              >
                Save
              </button>
            </div>
          </div>
        </div>
  );
}
