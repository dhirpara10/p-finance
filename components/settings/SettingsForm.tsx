"use client";

import { useState } from "react";
import { requestNotificationPermissionAndSubscribe, sendTestNotification } from "@/lib/pushNotifications";
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
    dailyReminderEnabled,
    setDailyReminderEnabled,
    dailyReminderTime,
    setDailyReminderTime,
    dailyReminderTone,
    setDailyReminderTone,
    incomeSources,
    updateIncomeSource,
    addIncomeSourceSetting,
    removeIncomeSourceSetting,
    newPasscode,
    setNewPasscode,
    setShowSettingsForm,
    saveSettings,
  } = state;

  const [testingNotification, setTestingNotification] = useState(false);
  const [enablingNotifications, setEnablingNotifications] = useState(false);

  async function handleSendTestNotification() {
    try {
      setTestingNotification(true);
      await sendTestNotification();
      alert("Test notification sent.");
    } catch (error: any) {
      alert(error?.message || "Could not send test notification.");
    } finally {
      setTestingNotification(false);
    }
  }

  async function handleEnableDailyReminder() {
    try {
      setEnablingNotifications(true);
      await requestNotificationPermissionAndSubscribe(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
      );
      alert("Daily reminder notifications enabled.");
    } catch (error: any) {
      alert(error?.message || "Could not enable notifications.");
    } finally {
      setEnablingNotifications(false);
    }
  }

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

            <div className="space-y-3 rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-300">
                    Daily reminder
                  </p>
                  <p className="text-xs text-neutral-500">
                    Save reminder preferences for daily notification scheduling.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={dailyReminderEnabled}
                  onChange={(event) => setDailyReminderEnabled(event.target.checked)}
                  className="h-5 w-5 rounded border-neutral-700 bg-neutral-800 text-emerald-300 outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-neutral-400">Reminder time</label>
                  <input
                    type="time"
                    value={dailyReminderTime}
                    onChange={(event) => setDailyReminderTime(event.target.value)}
                    disabled={!dailyReminderEnabled}
                    className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-neutral-400">Tone</label>
                  <select
                    value={dailyReminderTone}
                    onChange={(event) => setDailyReminderTone(event.target.value)}
                    disabled={!dailyReminderEnabled}
                    className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
                  >
                    <option value="mixed">Mixed</option>
                    <option value="encouraging">Encouraging</option>
                    <option value="focused">Focused</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl bg-neutral-900 p-4">
            <h3 className="mb-2 text-base font-semibold text-white">
              Notifications
            </h3>
            <p className="mb-4 text-sm text-neutral-400">
              Enable daily finance reminders and send a test notification.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleEnableDailyReminder}
                disabled={enablingNotifications}
                className="rounded-xl bg-green-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                {enablingNotifications ? "Enabling..." : "Enable Daily Reminder"}
              </button>

              <button
                type="button"
                onClick={handleSendTestNotification}
                disabled={testingNotification}
                className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {testingNotification ? "Sending..." : "Send Test Notification"}
              </button>
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
