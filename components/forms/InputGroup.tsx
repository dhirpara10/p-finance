"use client";

import type { ReactNode } from "react";

export function InputGroup({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}
