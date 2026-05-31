"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type SettingsFormProps = { state: FinanceDashboardState };

export function SettingsForm({ state }: SettingsFormProps) {
  const {
    initialCashBalance,
    setInitialCashBalance,
    initialCommbankBalance,
    setInitialCommbankBalance,
    initialUpBalance,
    setInitialUpBalance,
    emergencyGoal,
    setEmergencyGoal,
    debtRepaymentGoal,
    setDebtRepaymentGoal,
    remittanceGoal,
    setRemittanceGoal,
    monthlyResetDay,
    setMonthlyResetDay,
    currency,
    setCurrency,
    incomeSources,
    updateIncomeSource,
    addIncomeSourceSetting,
    removeIncomeSourceSetting,
    newPasscode,
    setNewPasscode,
    setShowSettingsForm,
    saveSettings,
  } = state;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6">
      <div className="mx-auto mt-10 w-full max-w-md rounded-3xl bg-neutral-900 p-5">
        <h2 className="mb-4 text-xl font-bold">Settings</h2>

        <div className="space-y-5">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-emerald-300">
              Initial Balances
            </h3>

            <div>
              <label className="mb-2 block text-sm text-neutral-400">Cash</label>
              <input
                type="number"
                value={String(initialCashBalance)}
                onChange={(event) => setInitialCashBalance(Number(event.target.value))}
                placeholder="Cash"
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-400">Commbank</label>
              <input
                type="number"
                value={String(initialCommbankBalance)}
                onChange={(event) =>
                  setInitialCommbankBalance(Number(event.target.value))
                }
                placeholder="Commbank"
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-400">UP</label>
              <input
                type="number"
                value={String(initialUpBalance)}
                onChange={(event) => setInitialUpBalance(Number(event.target.value))}
                placeholder="UP"
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-emerald-300">
              Bucket Targets
            </h3>

            <div>
              <label className="mb-2 block text-sm text-neutral-400">Emergency Fund Goal</label>
              <input
                type="number"
                value={String(emergencyGoal)}
                onChange={(event) => setEmergencyGoal(Number(event.target.value))}
                placeholder="Emergency Fund Goal"
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-400">Debt Repayment Goal</label>
              <input
                type="number"
                value={String(debtRepaymentGoal)}
                onChange={(event) =>
                  setDebtRepaymentGoal(Number(event.target.value))
                }
                placeholder="Debt Repayment Goal"
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-400">Remittance Goal</label>
              <input
                type="number"
                value={String(remittanceGoal)}
                onChange={(event) => setRemittanceGoal(Number(event.target.value))}
                placeholder="Remittance Goal"
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-emerald-300">
              App Preferences
            </h3>

            <div>
              <label className="mb-2 block text-sm text-neutral-400">Monthly reset day</label>
              <input
                type="number"
                min={1}
                max={28}
                value={String(monthlyResetDay)}
                onChange={(event) =>
                  setMonthlyResetDay(
                    Math.min(Math.max(Number(event.target.value), 1), 28)
                  )
                }
                placeholder="Monthly reset day"
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-neutral-400">Currency</label>
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              >
                <option value="AUD">AUD</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-emerald-300">
                Income Sources
              </h3>
              <button
                type="button"
                onClick={addIncomeSourceSetting}
                className="rounded-full bg-neutral-800 px-3 py-1 text-sm text-emerald-300"
              >
                Add
              </button>
            </div>

            {incomeSources.map((source, index) => (
              <div key={`${source.name}-${index}`} className="grid grid-cols-[1fr_5rem_2.5rem] gap-2">
                <div className="min-w-0">
                  <label className="mb-2 block text-sm text-neutral-400">Source</label>
                  <input
                    type="text"
                    value={source.name}
                    onChange={(event) =>
                      updateIncomeSource(index, "name", event.target.value)
                    }
                    placeholder="Source"
                    className="min-w-0 rounded-2xl bg-neutral-800 p-4 outline-none"
                  />
                </div>
                <div className="min-w-0">
                  <label className="mb-2 block text-sm text-neutral-400">Rate</label>
                  <input
                    type="number"
                    value={String(source.rate)}
                    onChange={(event) =>
                      updateIncomeSource(index, "rate", event.target.value)
                    }
                    placeholder="Rate"
                    className="min-w-0 rounded-2xl bg-neutral-800 p-4 outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeIncomeSourceSetting(index)}
                  className="rounded-2xl bg-neutral-800 font-semibold text-neutral-400"
                >
                  x
                </button>
              </div>
            ))}
          </section>

          <section>
            <label className="mb-2 block text-sm text-neutral-400">
              Change Passcode
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={newPasscode}
              onChange={(event) => setNewPasscode(event.target.value)}
              placeholder="Enter new passcode"
              className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
            />
          </section>
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
