"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ColorPicker } from "./ColorPicker";
import { IconPicker } from "./IconPicker";
import { getLinkedCategoryIds } from "@/lib/definitionSelectors";
import type { CategoryDefinition, CategoryTrackerLink, TrackerDefinition } from "@/lib/types";
import type { FinanceDefinitions } from "@/hooks/useFinanceDefinitions";

type Props = {
  tracker?: TrackerDefinition;
  nextSortOrder: number;
  finDefs: FinanceDefinitions;
  categoryDefs: CategoryDefinition[];
  ctLinks: CategoryTrackerLink[];
  onClose: () => void;
};

export function TrackerEditModal({ tracker, nextSortOrder, finDefs, categoryDefs, ctLinks, onClose }: Props) {
  const isNew = !tracker;
  const [name, setName] = useState(tracker?.name ?? "");
  const [capStr, setCapStr] = useState(tracker?.monthlyCap != null ? String(tracker.monthlyCap) : "");
  const [icon, setIcon] = useState(tracker?.icon ?? "Compass");
  const [color, setColor] = useState(tracker?.color ?? "purple");
  const [isActive, setIsActive] = useState(tracker?.isActive ?? true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    tracker ? getLinkedCategoryIds(tracker.id, ctLinks) : []
  );
  const [saving, setSaving] = useState(false);

  const activeCategories = categoryDefs.filter((c) => c.isActive && c.kind === "expense").sort((a, b) => a.sortOrder - b.sortOrder);

  function toggleCategory(catId: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  }

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setSaving(true);
    try {
      const cap = capStr.trim() ? parseFloat(capStr) : null;
      if (isNew) {
        await finDefs.addTrackerDef(
          { name: trimmedName, monthlyCap: cap, isActive: true, sortOrder: nextSortOrder, icon, color },
          selectedCategoryIds
        );
      } else {
        await finDefs.updateTrackerDef(tracker.id, { name: trimmedName, monthlyCap: cap, isActive, icon, color }, selectedCategoryIds);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md overflow-y-auto rounded-t-3xl bg-neutral-900 p-6 sm:max-h-[90vh] sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold">{isNew ? "New tracker" : "Edit tracker"}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-neutral-400 hover:text-white"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-400">Name</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none focus:border-purple-400/40 focus:ring-1 focus:ring-purple-400/20"
              placeholder="Adventure"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-400">Monthly cap (leave blank for no budget)</label>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <span className="text-sm text-neutral-500">$</span>
              <input
                type="number"
                min="0"
                value={capStr}
                onChange={(e) => setCapStr(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                placeholder="No cap"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-neutral-400">Icon</label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-neutral-400">Color</label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-neutral-400">Linked categories</label>
            <p className="mb-2 text-xs text-neutral-500">Spending in these categories counts toward this tracker.</p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {activeCategories.map((cat) => {
                const linked = selectedCategoryIds.includes(cat.id);
                return (
                  <label
                    key={cat.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                      linked
                        ? "border-purple-400/30 bg-purple-500/15 text-purple-200"
                        : "border-white/[0.06] bg-white/[0.025] text-neutral-400 hover:border-white/10 hover:text-neutral-200"
                    }`}
                  >
                    <input type="checkbox" className="sr-only" checked={linked} onChange={() => toggleCategory(cat.id)} />
                    <span className={`h-3.5 w-3.5 shrink-0 rounded border transition ${linked ? "border-purple-400 bg-purple-500" : "border-white/20"}`} />
                    {cat.name}
                  </label>
                );
              })}
            </div>
          </div>

          {!isNew && (
            <label className="flex cursor-pointer items-center gap-3">
              <div
                onClick={() => setIsActive(!isActive)}
                className={`relative h-5 w-9 rounded-full transition ${isActive ? "bg-purple-500" : "bg-neutral-700"}`}
              >
                <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <span className="text-sm text-neutral-300">Active</span>
            </label>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-neutral-400 hover:text-white">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex-1 rounded-xl bg-purple-600 py-2.5 text-sm font-medium text-white disabled:opacity-50 hover:bg-purple-500"
          >
            {saving ? "Saving…" : isNew ? "Create" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
