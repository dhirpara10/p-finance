"use client";

import { formTokens } from "@/lib/designTokens";
import type { ReactNode } from "react";

export function FormField({ label, helper, children }: { label: string; helper?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={formTokens.label}>{label}</span>
      {children}
      {helper && <span className={formTokens.helper}>{helper}</span>}
    </label>
  );
}
