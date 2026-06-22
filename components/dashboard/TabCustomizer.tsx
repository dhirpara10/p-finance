"use client";

import { useRef, useState } from "react";
import { GripVertical, Eye, EyeOff, X } from "lucide-react";
import type { NavTabId, TabPrefs } from "@/lib/tabPrefs";

type TabMeta = { id: NavTabId; label: string };

type Props = {
  tabs: TabMeta[];
  prefs: TabPrefs;
  onSave: (prefs: TabPrefs) => void;
  onClose: () => void;
};

export function TabCustomizer({ tabs, prefs, onSave, onClose }: Props) {
  const [order, setOrder] = useState<NavTabId[]>(prefs.order);
  const [hidden, setHidden] = useState<Set<NavTabId>>(new Set(prefs.hidden));

  const dragIdx = useRef<number | null>(null);

  function onDragStart(i: number) {
    dragIdx.current = i;
  }

  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    const from = dragIdx.current;
    if (from === null || from === i) return;
    // Don't allow moving home away from position 0
    if (order[from] === "home" || order[i] === "home") return;
    setOrder((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(i, 0, item);
      dragIdx.current = i;
      return next;
    });
  }

  function onDragEnd() {
    dragIdx.current = null;
  }

  function toggleHidden(id: NavTabId) {
    if (id === "home") return;
    setHidden((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleSave() {
    onSave({ order, hidden: Array.from(hidden) });
    onClose();
  }

  function handleReset() {
    setOrder(tabs.map((t) => t.id));
    setHidden(new Set());
  }

  const labelFor = (id: NavTabId) => tabs.find((t) => t.id === id)?.label ?? id;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-sm rounded-3xl border border-white/[0.09] bg-neutral-900 p-5 shadow-2xl mx-4 mb-4 sm:mb-0">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Customize Tabs</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Drag to reorder · tap eye to hide · saved just for you</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-neutral-500 hover:bg-white/[0.06] hover:text-white transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab list */}
        <ul className="space-y-1.5">
          {order.map((id, i) => {
            const isHome = id === "home";
            const isHidden = hidden.has(id);
            return (
              <li
                key={id}
                draggable={!isHome}
                onDragStart={() => onDragStart(i)}
                onDragOver={(e) => onDragOver(e, i)}
                onDragEnd={onDragEnd}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition select-none ${
                  isHidden
                    ? "border-white/[0.04] bg-white/[0.02] opacity-50"
                    : "border-white/[0.07] bg-white/[0.04]"
                } ${!isHome ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
              >
                {/* Drag handle */}
                <span className={`shrink-0 ${isHome ? "opacity-20" : "text-neutral-600"}`}>
                  <GripVertical size={15} />
                </span>

                {/* Position badge */}
                <span className="shrink-0 w-5 text-center text-[11px] font-mono text-neutral-600">
                  {i + 1}
                </span>

                {/* Label */}
                <span className={`flex-1 text-sm font-medium ${isHidden ? "text-neutral-600" : "text-neutral-200"}`}>
                  {labelFor(id)}
                  {isHome && <span className="ml-2 text-[10px] text-neutral-600 font-normal">always first</span>}
                </span>

                {/* Visibility toggle */}
                <button
                  type="button"
                  onClick={() => toggleHidden(id)}
                  disabled={isHome}
                  className={`shrink-0 rounded-lg p-1.5 transition disabled:opacity-20 disabled:pointer-events-none ${
                    isHidden
                      ? "text-neutral-600 hover:text-neutral-400"
                      : "text-emerald-400 hover:bg-white/[0.06]"
                  }`}
                >
                  {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Footer */}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 rounded-2xl border border-white/[0.07] py-2.5 text-sm text-neutral-400 hover:text-white hover:border-white/[0.12] transition"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-2xl bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 transition"
          >
            Save Layout
          </button>
        </div>
      </div>
    </div>
  );
}
