"use client";

import { Actions, Field, SettingsPanel } from "@/components/settings/SettingsAccountsPage";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { SelectField } from "@/components/forms/SelectField";

type Props = { state: FinanceDashboardState };

export function SettingsNotificationsPage({ state }: Props) {
  return (
    <SettingsPanel title="Notifications" onBack={state.goBackSettingsPage}>
      <label className="flex items-center justify-between rounded-2xl bg-neutral-950 p-4">
        <span>
          <span className="block font-semibold">Daily reminder</span>
          <span className="text-sm text-neutral-500">Use browser notification reminders.</span>
        </span>
        <input type="checkbox" checked={state.dailyReminderEnabled} onChange={(event) => state.setDailyReminderEnabled(event.target.checked)} />
      </label>
      <Field label="Reminder time">
        <input type="time" value={state.dailyReminderTime} disabled={!state.dailyReminderEnabled} onChange={(event) => state.setDailyReminderTime(event.target.value)} className="w-full rounded-2xl bg-neutral-800 p-4 outline-none disabled:opacity-50" />
      </Field>
      <SelectField
        label="Tone"
        value={state.dailyReminderTone}
        disabled={!state.dailyReminderEnabled}
        onChange={(event) => state.setDailyReminderTone(event.target.value)}
        className="disabled:opacity-50"
        options={[
          { value: "mixed", label: "Mixed" },
          { value: "encouraging", label: "Encouraging" },
          { value: "focused", label: "Focused" },
          { value: "urgent", label: "Urgent" },
        ]}
      />
      <Actions state={state} />
    </SettingsPanel>
  );
}
