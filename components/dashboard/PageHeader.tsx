import type { ReactNode } from "react";

type PageHeaderProps = {
  label?: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHeader({
  label = "MONEY CONTROL",
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="section-kicker text-emerald-300/75">{label}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
          {description}
        </p>
      </div>
      {actions && <div className="shrink-0">{actions}</div>}
    </header>
  );
}
