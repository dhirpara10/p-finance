"use client";

import { useEffect, useState } from "react";
import { subscribeToasts } from "@/lib/toast";

type ToastItem = { id: number; message: string; type: "error" | "success" | "info" };

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 z-[9999] flex flex-col gap-2 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-2xl px-4 py-3 text-sm font-medium shadow-xl backdrop-blur-sm animate-in fade-in slide-in-from-top-2 ${
            t.type === "error"
              ? "bg-red-950/95 text-red-200 border border-red-500/30"
              : t.type === "success"
                ? "bg-emerald-950/95 text-emerald-200 border border-emerald-500/30"
                : "bg-neutral-900/95 text-neutral-200 border border-white/10"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
