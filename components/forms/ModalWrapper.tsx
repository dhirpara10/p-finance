"use client";

import { formTokens } from "@/lib/designTokens";
import { useEffect, type ReactNode } from "react";

export function ModalWrapper({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      className="no-scrollbar fixed inset-0 z-50 flex overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-sm"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={formTokens.modal}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
