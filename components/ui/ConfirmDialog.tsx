"use client";

import { useEffect, useState } from "react";
import { subscribeConfirm } from "@/lib/confirm";

type ConfirmState = { message: string; resolve: (v: boolean) => void } | null;

export function ConfirmDialog() {
  const [state, setState] = useState<ConfirmState>(null);

  useEffect(() => subscribeConfirm(setState), []);

  if (!state) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-3xl border border-white/[0.08] bg-neutral-900 p-6 shadow-2xl">
        <p className="text-sm font-medium text-neutral-200">{state.message}</p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={() => state.resolve(true)}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => state.resolve(false)}
            className="flex-1 rounded-xl bg-white/[0.06] py-2.5 text-sm font-semibold text-neutral-300 hover:bg-white/[0.1]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
