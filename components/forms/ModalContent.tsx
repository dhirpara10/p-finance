"use client";

import type { ReactNode } from "react";

export function ModalContent({ children }: { children: ReactNode }) {
  return <div className="max-h-[68vh] space-y-4 overflow-y-auto p-5 sm:p-6">{children}</div>;
}
