"use client";

import { formTokens } from "@/lib/designTokens";
import type { ReactNode } from "react";

export function ModalWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6">
      <div className={formTokens.modal}>{children}</div>
    </div>
  );
}
