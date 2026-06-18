"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { ArrowDown, ArrowUp, PiggyBank, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function SharedJarCard({
  state,
  compact = false,
  onAllocate,
}: {
  state: FinanceDashboardState;
  compact?: boolean;
  onAllocate?: () => void;
}) {
  const { currencySymbol, sharedRolloverJar } = state;
  const allocation = Math.max(sharedRolloverJar.monthlyAllocation, 1);
  const spendingRatio = Math.min(
    100,
    Math.max(0, (sharedRolloverJar.spentThisMonth / allocation) * 100)
  );

  return (
    <section className="jar-card relative min-w-[calc(100vw-32px)] snap-start overflow-hidden rounded-[28px] border border-purple-400/20 p-5 sm:min-w-0 sm:p-6">
      <div className="jar-glow pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-400/15 text-purple-200 ring-1 ring-purple-300/15">
              <PiggyBank size={21} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-200/70">
                Shared Rollover Jar
              </p>
              <p className="mt-1 text-sm text-neutral-400">
                One lifestyle pool for every tracker
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-neutral-400">Available now</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {currencySymbol}
              {sharedRolloverJar.available.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </p>
          </div>

          {!compact && (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <JarMetric
                icon={ArrowDown}
                label="Monthly inflow"
                value={`${currencySymbol}${sharedRolloverJar.monthlyAllocation.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                tone="text-purple-200"
              />
              <JarMetric
                icon={ArrowUp}
                label="Tracked spend"
                value={`${currencySymbol}${sharedRolloverJar.spentThisMonth.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                tone="text-pink-200"
              />
              <JarMetric
                icon={Sparkles}
                label="Month result"
                value={`${sharedRolloverJar.monthlyResult >= 0 ? "+" : ""}${currencySymbol}${sharedRolloverJar.monthlyResult.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                tone={
                  sharedRolloverJar.monthlyResult >= 0
                    ? "text-emerald-300"
                    : "text-orange-300"
                }
                className="col-span-2 sm:col-span-1"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-center">
          <div className="relative h-28 w-28 shrink-0">
            <svg viewBox="0 0 120 120" className="-rotate-90">
              <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(128,128,128,.15)" strokeWidth="9" />
              <motion.circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="url(#jarProgress)"
                strokeLinecap="round"
                strokeWidth="9"
                strokeDasharray={`${2 * Math.PI * 48}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                animate={{
                  strokeDashoffset:
                    2 * Math.PI * 48 * (1 - spendingRatio / 100),
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="jarProgress">
                  <stop stopColor="#c084fc" />
                  <stop offset="1" stopColor="#f472b6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-semibold">
                {Math.round(spendingRatio)}%
              </span>
              <span className="text-[10px] uppercase text-neutral-500">used</span>
            </div>
          </div>
        </div>
      </div>
      {onAllocate && (
        <button
          type="button"
          onClick={onAllocate}
          className="mt-5 w-full rounded-xl border border-purple-400/20 bg-purple-400/10 py-2.5 text-sm font-semibold text-purple-100 transition hover:bg-purple-400/20 hover:border-purple-400/30"
        >
          + Add allocation
        </button>
      )}
    </section>
  );
}

function JarMetric({
  icon: Icon,
  label,
  value,
  tone,
  className = "",
}: {
  icon: typeof ArrowDown;
  label: string;
  value: string;
  tone: string;
  className?: string;
}) {
  return (
    <div className={`min-w-0 rounded-2xl border border-black/[0.08] bg-black/[0.08] p-3 dark:border-white/[0.06] dark:bg-black/20 ${className}`}>
      <Icon size={14} className={tone} />
      <p className="mt-3 text-[11px] text-neutral-500">{label}</p>
      <p className={`mt-1 break-words text-sm font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
