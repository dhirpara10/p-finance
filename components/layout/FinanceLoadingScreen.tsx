"use client";

type FinanceLoadingScreenProps = {
  error?: string;
  onRetry?: () => void;
};

function MiniChartIcon() {
  return (
    <div className="flex h-12 w-12 items-end justify-center gap-1 rounded-2xl bg-emerald-400/10 p-3 shadow-inner shadow-emerald-400/10">
      <span className="h-4 w-1.5 animate-pulse rounded-full bg-emerald-300" />
      <span className="h-7 w-1.5 animate-pulse rounded-full bg-teal-300 [animation-delay:120ms]" />
      <span className="h-5 w-1.5 animate-pulse rounded-full bg-green-400 [animation-delay:240ms]" />
      <span className="h-9 w-1.5 animate-pulse rounded-full bg-emerald-200 [animation-delay:360ms]" />
    </div>
  );
}

function SkeletonCard({ wide = false }: { wide?: boolean }) {
  return (
    <div
      className={`overflow-hidden rounded-3xl border border-black/10 bg-white/75 p-4 shadow-xl shadow-black/10 dark:border-white/10 dark:bg-neutral-900/75 dark:shadow-black/20 ${
        wide ? "col-span-2" : ""
      }`}
    >
      <div className="relative">
        <div className="mb-5 h-3 w-24 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-8 w-32 rounded-full bg-neutral-200 dark:bg-neutral-800" />
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="h-14 rounded-2xl bg-neutral-200/80 dark:bg-neutral-800/80" />
          <div className="h-14 rounded-2xl bg-neutral-200/80 dark:bg-neutral-800/80" />
        </div>
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  );
}

export function FinanceLoadingScreen({
  error,
  onRetry,
}: FinanceLoadingScreenProps) {
  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 text-[var(--foreground)]">
        <div className="w-full max-w-md rounded-3xl border border-red-500/20 bg-white p-6 text-center shadow-2xl shadow-red-950/10 dark:bg-neutral-900 dark:shadow-red-950/20">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-2xl text-red-300">
            !
          </div>
          <h1 className="text-xl font-bold">Could not load your dashboard</h1>
          <p className="mt-2 text-sm text-neutral-400">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-5 w-full rounded-2xl bg-emerald-400 p-4 font-semibold text-black"
            >
              Try Again
            </button>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--background)] px-4 py-8 text-[var(--foreground)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#0f766e2e,transparent_32%),radial-gradient(circle_at_bottom_right,#22c55e24,transparent_34%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col justify-center gap-6">
        <section className="rounded-[2rem] border border-black/10 bg-white/80 p-5 shadow-2xl shadow-emerald-950/10 backdrop-blur dark:border-white/10 dark:bg-neutral-900/80 dark:shadow-emerald-950/20 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="animate-pulse">
              <MiniChartIcon />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Money Control
              </p>
              <h1 className="mt-1 text-xl font-bold sm:text-2xl">
                Preparing your money dashboard...
              </h1>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                Syncing balances, goals, and recent activity.
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
            <div className="h-2 w-2/3 animate-[shimmer_1.4s_infinite] rounded-full bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-500" />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SkeletonCard wide />
          <SkeletonCard />
          <SkeletonCard />
        </section>
      </div>
    </main>
  );
}
