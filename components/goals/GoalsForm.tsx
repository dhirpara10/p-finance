"use client";

import { GOAL_CATEGORIES, GOAL_STATUSES, type GoalStatus } from "@/lib/dreamsGoals";
import type { DreamsGoalsState } from "@/hooks/useDreamsGoals";
import { formTokens } from "@/lib/designTokens";
import { X } from "lucide-react";

type Props = {
  goals: DreamsGoalsState;
};

export function GoalsForm({ goals }: Props) {
  if (!goals.showForm) return null;

  const isEdit = !!goals.editingGoal;
  const canSave = goals.formTitle.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={goals.closeForm}
      />
      <div className={`relative w-full ${formTokens.modal} max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/[0.08] px-6 py-5 dark:border-white/[0.06]">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {isEdit ? "Edit Goal" : "New Goal"}
          </h2>
          <button
            type="button"
            onClick={goals.closeForm}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-white/[0.06] dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5">
          {/* Title */}
          <div>
            <label className={formTokens.label}>
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={goals.formTitle}
              onChange={(e) => goals.setFormTitle(e.target.value)}
              placeholder="What's your goal?"
              className={formTokens.input}
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className={formTokens.label}>
              Category <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {GOAL_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => goals.setFormCategory(cat.id)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    goals.formCategory === cat.id
                      ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                      : "border-black/[0.08] bg-black/[0.03] text-neutral-600 hover:border-black/[0.12] hover:bg-black/[0.06] dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:bg-white/[0.06]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className={formTokens.label}>Status</label>
            <div className="flex flex-wrap gap-2">
              {GOAL_STATUSES.map((s: { id: GoalStatus; label: string }) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goals.setFormStatus(s.id)}
                  className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                    goals.formStatus === s.id
                      ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                      : "border-black/[0.08] bg-black/[0.03] text-neutral-600 hover:border-black/[0.12] hover:bg-black/[0.06] dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-neutral-300 dark:hover:bg-white/[0.06]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Target Date */}
          <div>
            <label className={formTokens.label}>Target Date</label>
            <input
              type="date"
              value={goals.formTargetDate}
              onChange={(e) => goals.setFormTargetDate(e.target.value)}
              className={formTokens.input}
            />
          </div>

          {/* Occasion */}
          <div>
            <label className={formTokens.label}>Occasion</label>
            <input
              type="text"
              value={goals.formOccasion}
              onChange={(e) => goals.setFormOccasion(e.target.value)}
              placeholder="e.g. Birthday, Anniversary, New Year"
              className={formTokens.input}
            />
          </div>

          {/* Details */}
          <div>
            <label className={formTokens.label}>Details</label>
            <textarea
              value={goals.formDetails}
              onChange={(e) => goals.setFormDetails(e.target.value)}
              placeholder="Any additional notes…"
              rows={3}
              className={`${formTokens.input} resize-none`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex gap-3 border-t border-black/[0.08] bg-white/95 px-6 py-4 backdrop-blur dark:border-white/[0.06] dark:bg-[#111419]/95">
          <button
            type="button"
            onClick={goals.closeForm}
            className="flex-1 rounded-2xl border border-black/[0.08] bg-black/[0.05] py-3 text-sm font-semibold text-neutral-600 transition hover:bg-black/[0.08] dark:border-white/[0.06] dark:bg-white/[0.05] dark:text-neutral-300 dark:hover:bg-white/[0.08]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={goals.saveGoal}
            disabled={!canSave}
            className="flex-1 rounded-2xl bg-neutral-900 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:pointer-events-none disabled:opacity-40 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100"
          >
            {isEdit ? "Save Changes" : "Add Goal"}
          </button>
        </div>
      </div>
    </div>
  );
}
