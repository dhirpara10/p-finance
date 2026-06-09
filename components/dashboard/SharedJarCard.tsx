"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { ArrowDown, ArrowUp, PiggyBank, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

function formatJarMoney(
  currencySymbol: string,
  amount: number,
  showPositive = false
) {
  const sign = amount < 0 ? "− " : showPositive && amount > 0 ? "+ " : "";
  return `${sign}${currencySymbol}${Math.abs(amount).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;
}

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
    <section className="jar-card relative min-w-[90vw] snap-start overflow-hidden rounded-[28px] border border-purple-400/20 p-5 sm:min-w-0 sm:p-6">
      <div className="jar-glow pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="relative grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
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

          <div className="mt-5">
            <p className="text-sm text-neutral-400">Available now</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {formatJarMoney(currencySymbol, sharedRolloverJar.available)}
            </p>
          </div>

          {!compact && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                value={formatJarMoney(
                  currencySymbol,
                  sharedRolloverJar.monthlyResult,
                  true
                )}
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

        <div className="flex items-center gap-4 md:flex-col">
          <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
            <svg viewBox="0 0 120 120" className="-rotate-90">
              <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="9" />
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
          {onAllocate && (
            <button
              type="button"
              onClick={onAllocate}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-purple-100"
            >
              Add allocation
            </button>
          )}
        </div>
      </div>
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
    <div className={`min-w-0 rounded-2xl border border-white/[0.06] bg-black/20 p-3 ${className}`}>
      <Icon size={14} className={tone} />
      <p className="mt-3 text-[11px] text-neutral-500">{label}</p>
      <p className={`mt-1 break-words text-sm font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
