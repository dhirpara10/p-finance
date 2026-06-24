"use client";

import { useEffect, useState } from "react";

export function StatusPill({ message }: { message: string | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setVisible(true);
    } else {
      // Keep visible briefly so the user sees the message before it fades
      const t = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(t);
    }
  }, [message]);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 transition-all duration-300 ${
        message ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-neutral-900/95 px-4 py-2.5 shadow-2xl backdrop-blur-md">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="text-sm font-medium text-white/90">{message}</span>
      </div>
    </div>
  );
}
