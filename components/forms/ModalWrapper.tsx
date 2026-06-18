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
      className="fixed inset-0 z-50 flex bg-black/75 backdrop-blur-sm sm:items-center sm:justify-center sm:px-4 sm:py-6"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {/* Mobile: bottom sheet; sm+: centered modal */}
      <div
        className="no-scrollbar mt-auto w-full overflow-y-auto rounded-t-[28px] border border-black/[0.10] bg-white shadow-[0_32px_100px_rgba(0,0,0,.12)] animate-in slide-in-from-bottom duration-300 dark:border-white/[0.08] dark:bg-[#111419] dark:shadow-[0_32px_100px_rgba(0,0,0,.55)] sm:mx-auto sm:mt-0 sm:max-w-lg sm:rounded-[28px]"
        style={{ maxHeight: "92dvh" }}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
