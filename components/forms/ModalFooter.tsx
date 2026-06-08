"use client";

export function ModalFooter({ onCancel, onSave, saveLabel, tone = "emerald" }: { onCancel: () => void; onSave: () => void; saveLabel: string; tone?: "emerald" | "red" | "blue" }) {
  const color = tone === "red" ? "bg-red-500" : tone === "blue" ? "bg-blue-500" : "bg-emerald-500";
  return (
    <div className="grid grid-cols-2 gap-3 border-t border-neutral-800 p-5">
      <button type="button" onClick={onCancel} className="rounded-2xl bg-neutral-800 p-4 font-semibold">Cancel</button>
      <button type="button" onClick={onSave} className={`rounded-2xl p-4 font-semibold text-black ${color}`}>{saveLabel}</button>
    </div>
  );
}
