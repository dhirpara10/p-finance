"use client";

export function ModalHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-white/[0.06] px-5 pb-5 pt-3 sm:px-6 sm:pt-5">
      <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
    </div>
  );
}
