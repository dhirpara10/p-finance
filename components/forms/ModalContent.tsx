"use client";

import type { ReactNode } from "react";

export function ModalContent({ children }: { children: ReactNode }) {
  return <div className="space-y-4 p-5">{children}</div>;
}
