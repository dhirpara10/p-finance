"use client";

export function ModalFooter({ onCancel, onSave, saveLabel, tone = "emerald" }: { onCancel: () => void; onSave: () => void; saveLabel: string; tone?: "emerald" | "red" | "blue" }) {
  const color = tone === "red" ? "bg-red-400" : tone === "blue" ? "bg-sky-400" : "bg-emerald-400";
  return (
    <div className="sticky bottom-0 grid grid-cols-2 gap-3 border-t border-black/[0.07] bg-white/95 p-4 backdrop-blur dark:border-white/[0.06] dark:bg-[#111419]/95 sm:px-6">
      <button type="button" onClick={onCancel} className="rounded-xl bg-black/[0.05] p-3.5 text-sm font-semibold text-neutral-600 dark:bg-white/[0.05] dark:text-neutral-300">Cancel</button>
      <button type="button" onClick={onSave} className={`rounded-xl p-3.5 text-sm font-semibold text-black ${color}`}>{saveLabel}</button>
    </div>
  );
}
