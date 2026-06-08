"use client";

import type { ReactNode } from "react";

export function ModalSection({ children }: { children: ReactNode }) {
  return <section className="space-y-3 rounded-2xl bg-neutral-950 p-4">{children}</section>;
}
