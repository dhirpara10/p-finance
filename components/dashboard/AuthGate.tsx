"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";

type AuthGateProps = { state: FinanceDashboardState; };

export function AuthGate({ state }: AuthGateProps) {
  const { passcodeInput, setPasscodeInput, unlockApp } = state;

  return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-white">
        <div className="w-full max-w-sm rounded-3xl bg-neutral-900 p-6">
          <h1 className="mb-2 text-2xl font-bold">Money Control</h1>
          <p className="mb-5 text-sm text-neutral-400">Enter your passcode to unlock</p>

          <input
            type="password"
            inputMode="numeric"
            value={passcodeInput}
            onChange={(e) => setPasscodeInput(e.target.value)}
            placeholder="4-digit passcode"
            className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
          />

          <button
            type="button"
            onClick={unlockApp}
            className="mt-4 w-full rounded-2xl bg-green-500 p-4 font-semibold text-black"
          >
            Unlock
          </button>
        </div>
      </main>
  );
}
