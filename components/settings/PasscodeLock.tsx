"use client";

import type { FormEvent } from "react";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type PasscodeLockProps = {
  state: FinanceDashboardState;
};

export function PasscodeLock({ state }: PasscodeLockProps) {
  const {
    passcodeInput,
    setPasscodeInput,
    passcodeError,
    setPasscodeError,
    unlockApp,
  } = state;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    unlockApp();
  }

  return (
    <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#f0f2f5] px-4 py-10 text-neutral-900 dark:bg-neutral-950 dark:text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0f766e33,transparent_34%),radial-gradient(circle_at_bottom,#22c55e1f,transparent_30%)]" />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-[2rem] border border-black/[0.1] bg-white/80 p-6 text-center shadow-2xl shadow-emerald-950/10 backdrop-blur dark:border-white/10 dark:bg-neutral-900/80 dark:shadow-emerald-950/40"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-400/10 text-3xl text-emerald-500 shadow-inner shadow-emerald-500/10 dark:text-emerald-300">
          $
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-500 dark:text-emerald-300">
          Money Control
        </p>
        <h1 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">Unlock your finances</h1>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Enter your passcode to view your dashboard.
        </p>

        <div className="mt-7">
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={passcodeInput}
            onChange={(event) => {
              setPasscodeInput(event.target.value);
              if (passcodeError) setPasscodeError("");
            }}
            placeholder="••••"
            className="mx-auto block w-40 rounded-2xl border border-black/[0.1] bg-neutral-100/80 px-5 py-4 text-center text-3xl font-semibold tracking-[0.35em] text-neutral-900 outline-none ring-emerald-400/40 transition focus:border-emerald-400 focus:ring-4 dark:border-white/10 dark:bg-neutral-950/80 dark:text-white"
          />

          <div className="mt-3 h-5">
            {passcodeError && (
              <p className="text-sm font-medium text-red-400">
                {passcodeError}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="mt-5 w-full rounded-2xl bg-emerald-400 p-4 font-semibold text-black shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-300"
        >
          Unlock
        </button>

        <p className="mt-5 text-xs text-neutral-500">
          Session locks automatically after 5 minutes.
        </p>
      </form>
    </main>
  );
}
