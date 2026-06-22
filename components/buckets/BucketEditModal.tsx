"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { ColorPicker } from "./ColorPicker";
import { IconPicker } from "./IconPicker";
import type { BucketDefinition } from "@/lib/types";
import type { FinanceDefinitions } from "@/hooks/useFinanceDefinitions";

type Props = {
  bucket?: BucketDefinition;
  nextSortOrder: number;
  finDefs: FinanceDefinitions;
  onClose: () => void;
};

export function BucketEditModal({ bucket, nextSortOrder, finDefs, onClose }: Props) {
  const isNew = !bucket;
  const [name, setName] = useState(bucket?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(
    bucket?.targetAmount != null ? String(bucket.targetAmount) : ""
  );
  const [icon, setIcon] = useState(bucket?.icon ?? "LockKeyhole");
  const [color, setColor] = useState(bucket?.color ?? "cyan");
  const [isActive, setIsActive] = useState(bucket?.isActive ?? true);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setSaving(true);
    try {
      const target = targetAmount.trim() ? parseFloat(targetAmount) : null;
      if (isNew) {
        await finDefs.addBucketDef({
          name: trimmedName,
          type: "protected",
          targetAmount: target,
          isActive: true,
          sortOrder: nextSortOrder,
          icon,
          color,
        });
      } else {
        await finDefs.updateBucketDef(bucket.id, {
          name: trimmedName,
          targetAmount: target,
          isActive,
          icon,
          color,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-t-3xl bg-neutral-900 p-6 sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold">{isNew ? "New bucket" : "Edit bucket"}</h2>
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
              placeholder="Emergency Fund"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-400">Target amount (optional)</label>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
              <span className="text-sm text-neutral-500">$</span>
              <input
                type="number"
                min="0"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none"
                placeholder="No target"
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
