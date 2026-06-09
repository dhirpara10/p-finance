"use client";

import type { ReactNode } from "react";

export function ModalSection({ children }: { children: ReactNode }) {
  return <section className="space-y-4">{children}</section>;
}
