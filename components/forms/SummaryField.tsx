"use client";

import { formTokens } from "@/lib/designTokens";

export function SummaryField({ label, value, helper }: { label: string; value: string; helper?: string }) {
  return (
    <div className={formTokens.summary}>
      <p className="text-sm text-neutral-400">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
      {helper && <p className={formTokens.helper}>{helper}</p>}
    </div>
  );
}
