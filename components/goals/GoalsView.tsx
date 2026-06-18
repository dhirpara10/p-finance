"use client";

import { useState } from "react";
import {
  GOAL_CATEGORIES,
  GOAL_CATEGORY_STYLES,
  STATUS_LABELS,
  STATUS_STYLES,
  getCategoryInfo,
  getDaysLeft,
  type GoalCategory,
  type GoalRecord,
} from "@/lib/dreamsGoals";
import { useDreamsGoals } from "@/hooks/useDreamsGoals";
import { GoalsForm } from "@/components/goals/GoalsForm";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

// ── Category Illustrations ────────────────────────────────────────────────────

function WishlistIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <ellipse cx="60" cy="80" rx="36" ry="8" fill="rgba(244,114,182,0.12)" />
      <path d="M60 28 L64.7 41.8 L79.5 41.8 L68 50.4 L72.7 64.2 L60 55.6 L47.3 64.2 L52 50.4 L40.5 41.8 L55.3 41.8 Z" fill="url(#wsg)" />
      <circle cx="36" cy="24" r="5" fill="rgba(244,114,182,0.35)" />
      <circle cx="84" cy="38" r="3.5" fill="rgba(244,114,182,0.25)" />
      <circle cx="90" cy="22" r="6" fill="rgba(251,207,232,0.3)" />
      <path d="M28 48 L30 42 L32 48 L38 50 L32 52 L30 58 L28 52 L22 50 Z" fill="rgba(244,114,182,0.5)" />
      <path d="M86 60 L87.5 55.5 L89 60 L93.5 61.5 L89 63 L87.5 67.5 L86 63 L81.5 61.5 Z" fill="rgba(244,114,182,0.4)" />
      <defs>
        <linearGradient id="wsg" x1="40" y1="28" x2="79" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f472b6" /><stop offset="1" stopColor="#be185d" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BucketListIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <ellipse cx="60" cy="72" rx="40" ry="10" fill="rgba(251,146,60,0.15)" />
      <circle cx="60" cy="46" r="30" fill="url(#blb)" opacity="0.9" />
      <ellipse cx="60" cy="46" rx="30" ry="30" fill="none" stroke="rgba(251,146,60,0.3)" strokeWidth="1" />
      <ellipse cx="60" cy="46" rx="30" ry="12" fill="none" stroke="rgba(251,146,60,0.2)" strokeWidth="0.8" />
      <path d="M30 46 Q40 30 60 28 Q80 30 90 46" stroke="rgba(251,146,60,0.3)" strokeWidth="0.8" fill="none" />
      <circle cx="72" cy="32" r="3" fill="rgba(253,186,116,0.8)" />
      <path d="M72 32 L72 26 M70 28 L72 26 L74 28" stroke="rgba(253,186,116,0.6)" strokeWidth="1" />
      <circle cx="46" cy="52" r="2.5" fill="rgba(253,186,116,0.6)" />
      <circle cx="68" cy="56" r="2" fill="rgba(253,186,116,0.5)" />
      <defs>
        <radialGradient id="blb" cx="45%" cy="40%">
          <stop offset="0%" stopColor="#1e3a5f" /><stop offset="100%" stopColor="#0c1a2e" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function ExperiencesIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <ellipse cx="60" cy="82" rx="44" ry="8" fill="rgba(34,211,238,0.1)" />
      <path d="M10 78 L35 44 L52 60 L65 34 L80 55 L92 42 L110 78 Z" fill="url(#exg)" />
      <path d="M10 78 L35 44 L52 60 Z" fill="url(#exg2)" opacity="0.6" />
      <circle cx="82" cy="26" r="10" fill="url(#exs)" />
      <path d="M78 18 L82 10 L86 18" stroke="rgba(253,224,71,0.4)" strokeWidth="1.2" fill="none" />
      <defs>
        <linearGradient id="exg" x1="10" y1="78" x2="110" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#155e75" /><stop offset="1" stopColor="#0e7490" />
        </linearGradient>
        <linearGradient id="exg2" x1="10" y1="44" x2="52" y2="78" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0c4a6e" /><stop offset="1" stopColor="#0369a1" />
        </linearGradient>
        <radialGradient id="exs" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#fef08a" /><stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function FamilyIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <ellipse cx="60" cy="84" rx="40" ry="7" fill="rgba(167,139,250,0.12)" />
      <rect x="28" y="50" width="64" height="34" rx="3" fill="url(#fab)" />
      <path d="M24 52 L60 22 L96 52 Z" fill="url(#far)" />
      <rect x="36" y="60" width="10" height="10" rx="1" fill="rgba(221,214,254,0.3)" />
      <rect x="55" y="60" width="10" height="10" rx="1" fill="rgba(221,214,254,0.3)" />
      <rect x="74" y="60" width="10" height="10" rx="1" fill="rgba(221,214,254,0.3)" />
      <rect x="48" y="68" width="24" height="16" rx="2" fill="rgba(139,92,246,0.4)" />
      <rect x="54" y="73" width="5" height="5" rx="0.5" fill="rgba(221,214,254,0.4)" />
      <path d="M60 38 C57 34 52 35 52 40 C52 44 56 47 60 50 C64 47 68 44 68 40 C68 35 63 34 60 38 Z" fill="rgba(244,114,182,0.7)" />
      <defs>
        <linearGradient id="far" x1="24" y1="52" x2="96" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6d28d9" /><stop offset="1" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id="fab" x1="28" y1="50" x2="92" y2="84" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2e1065" /><stop offset="1" stopColor="#1e1b4b" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function AchievementsIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <ellipse cx="60" cy="85" rx="36" ry="7" fill="rgba(251,191,36,0.12)" />
      <rect x="48" y="76" width="24" height="6" rx="1" fill="url(#acb)" />
      <rect x="44" y="72" width="32" height="6" rx="1" fill="url(#acb2)" />
      <path d="M38 26 L38 66 Q38 70 42 70 L78 70 Q82 70 82 66 L82 26 Z" fill="url(#acg)" />
      <path d="M28 26 L38 26 L38 46 Q28 44 28 34 Z" fill="url(#acl)" />
      <path d="M92 26 L82 26 L82 46 Q92 44 92 34 Z" fill="url(#acl)" />
      <path d="M45 26 L60 14 L75 26 L71 42 L60 50 L49 42 Z" fill="url(#acs)" />
      <defs>
        <linearGradient id="acg" x1="38" y1="26" x2="82" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d97706" /><stop offset="1" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id="acl" x1="28" y1="26" x2="38" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f59e0b" /><stop offset="1" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="acs" x1="45" y1="14" x2="75" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef08a" /><stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="acb" x1="48" y1="76" x2="72" y2="82" gradientUnits="userSpaceOnUse">
          <stop stopColor="#92400e" /><stop offset="1" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id="acb2" x1="44" y1="72" x2="76" y2="78" gradientUnits="userSpaceOnUse">
          <stop stopColor="#d97706" /><stop offset="1" stopColor="#92400e" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function PurchasesIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <ellipse cx="60" cy="82" rx="36" ry="8" fill="rgba(59,130,246,0.1)" />
      <path d="M36 34 L84 34 L88 70 Q88 74 84 74 L36 74 Q32 74 32 70 Z" fill="url(#psg)" />
      <path d="M48 34 Q48 24 60 24 Q72 24 72 34" stroke="rgba(147,197,253,0.6)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="44" y="46" width="12" height="12" rx="2" fill="rgba(147,197,253,0.3)" />
      <rect x="64" y="46" width="12" height="12" rx="2" fill="rgba(147,197,253,0.3)" />
      <rect x="44" y="62" width="32" height="5" rx="1" fill="rgba(147,197,253,0.2)" />
      <circle cx="60" cy="30" r="3" fill="rgba(147,197,253,0.5)" />
      <defs>
        <linearGradient id="psg" x1="32" y1="34" x2="88" y2="74" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e3a8a" /><stop offset="1" stopColor="#0f172a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function OtherGoalIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <ellipse cx="60" cy="82" rx="34" ry="8" fill="rgba(148,163,184,0.1)" />
      <path d="M60 20 L68 40 L90 40 L73 52 L80 72 L60 60 L40 72 L47 52 L30 40 L52 40 Z" fill="url(#otg)" opacity="0.9" />
      <circle cx="60" cy="47" r="8" fill="rgba(255,255,255,0.08)" />
      <defs>
        <linearGradient id="otg" x1="30" y1="20" x2="90" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#475569" /><stop offset="1" stopColor="#1e293b" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const CATEGORY_ILLUSTRATIONS: Record<GoalCategory, React.FC> = {
  wishlist: WishlistIllustration,
  bucket_list: BucketListIllustration,
  experiences: ExperiencesIllustration,
  family: FamilyIllustration,
  achievements: AchievementsIllustration,
  purchases: PurchasesIllustration,
  other: OtherGoalIllustration,
};

// ── Days left badge ───────────────────────────────────────────────────────────

function DaysLeftBadge({ targetDate }: { targetDate: string }) {
  if (!targetDate) {
    return (
      <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
        No target date
      </span>
    );
  }
  const days = getDaysLeft(targetDate);
  if (days === null) return null;
  if (days === 0) {
    return (
      <span className="rounded-full bg-red-400/15 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-300">
        0 days left
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 rounded-full bg-blue-400/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-300">
      <Calendar size={9} />
      {days} day{days !== 1 ? "s" : ""} left
    </span>
  );
}

// ── Category Grid ─────────────────────────────────────────────────────────────

function CategoryGrid({
  goals,
  onSelect,
}: {
  goals: ReturnType<typeof useDreamsGoals>;
  onSelect: (cat: GoalCategory) => void;
}) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
          Dreams &amp; Goals
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          {goals.goals.length} goal{goals.goals.length !== 1 ? "s" : ""} across{" "}
          {
            new Set(goals.goals.map((g) => g.category)).size
          }{" "}
          categories
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {GOAL_CATEGORIES.map((cat) => {
          const styles = GOAL_CATEGORY_STYLES[cat.id];
          const Illustration = CATEGORY_ILLUSTRATIONS[cat.id];
          const total = goals.goals.filter((g) => g.category === cat.id).length;
          const completed = goals.goals.filter(
            (g) => g.category === cat.id && g.status === "completed"
          ).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat.id)}
              className={`group relative flex min-h-[130px] overflow-hidden rounded-3xl border bg-white transition hover:scale-[1.02] active:scale-[0.98] dark:bg-[#0d1013] ${styles.border} ${styles.glow}`}
            >
              <div
                className={`absolute inset-0 ${styles.gradient} opacity-100 dark:opacity-100`}
              />
              <div className="relative flex w-full">
                {/* Left: text */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <p className={`text-sm font-semibold ${styles.textAccent}`}>
                      {cat.label}
                    </p>
                    <p className="mt-0.5 text-2xl font-bold text-neutral-900 dark:text-white">
                      {total}
                    </p>
                    {completed > 0 && (
                      <p className="mt-0.5 text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                        {completed} done
                      </p>
                    )}
                  </div>
                  <span
                    className={`mt-2 inline-block self-start rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${styles.badge}`}
                  >
                    {cat.label}
                  </span>
                </div>
                {/* Right: illustration */}
                <div className="flex w-[90px] shrink-0 items-center justify-center p-2 opacity-90">
                  <Illustration />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Goal Card (compact) ───────────────────────────────────────────────────────

function GoalCard({
  goal,
  onView,
  onComplete,
}: {
  goal: GoalRecord;
  onView: (g: GoalRecord) => void;
  onComplete: (id: string) => void;
}) {
  const styles = GOAL_CATEGORY_STYLES[goal.category];
  const isActive =
    goal.status === "planned" || goal.status === "in_progress";

  return (
    <div
      className={`group relative flex overflow-hidden rounded-2xl border bg-white transition hover:scale-[1.01] dark:bg-[#0d1013] ${styles.border}`}
    >
      <div className={`absolute inset-0 ${styles.gradient} opacity-60`} />
      <div className="relative flex w-full flex-col p-4">
        <button
          type="button"
          onClick={() => onView(goal)}
          className="flex-1 text-left"
        >
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${STATUS_STYLES[goal.status]}`}
            >
              {STATUS_LABELS[goal.status]}
            </span>
            <DaysLeftBadge targetDate={goal.targetDate} />
          </div>
          <p className="font-semibold text-neutral-900 dark:text-white line-clamp-2">
            {goal.title}
          </p>
          {goal.details && (
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
              {goal.details}
            </p>
          )}
          {goal.occasion && (
            <p className="mt-1.5 text-[10px] text-neutral-400 dark:text-neutral-500">
              {goal.occasion}
            </p>
          )}
        </button>

        {isActive && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onComplete(goal.id);
            }}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500/20 dark:text-emerald-300"
          >
            <CheckCircle2 size={13} />
            Mark Complete
          </button>
        )}
      </div>
    </div>
  );
}

// ── Status filter chips ───────────────────────────────────────────────────────

type StatusFilter = "all" | "active" | "completed" | "archived" | "cancelled";

const STATUS_FILTER_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "archived", label: "Archived" },
  { id: "cancelled", label: "Cancelled" },
];

// ── Category Detail View ──────────────────────────────────────────────────────

function CategoryDetailView({
  category,
  goals,
  onBack,
}: {
  category: GoalCategory;
  goals: ReturnType<typeof useDreamsGoals>;
  onBack: () => void;
}) {
  const catInfo = getCategoryInfo(category);
  const styles = GOAL_CATEGORY_STYLES[category];

  const displayGoals = goals.goals.filter((g) => {
    if (g.category !== category) return false;
    if (goals.statusFilter === "active") {
      if (g.status !== "planned" && g.status !== "in_progress") return false;
    } else if (goals.statusFilter !== "all") {
      if (g.status !== goals.statusFilter) return false;
    }
    if (goals.searchQuery.trim()) {
      const q = goals.searchQuery.toLowerCase();
      if (
        !g.title.toLowerCase().includes(q) &&
        !g.details.toLowerCase().includes(q) &&
        !g.occasion.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-black/[0.08] bg-black/[0.04] text-neutral-600 transition hover:bg-black/[0.07] dark:border-white/[0.06] dark:bg-white/[0.035] dark:text-neutral-300"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className={`text-lg font-semibold ${styles.textAccent}`}>
              {catInfo.label}
            </h2>
            <p className="text-xs text-neutral-500">
              {displayGoals.length} goal{displayGoals.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => goals.openAddForCategory(category)}
          className="flex items-center gap-2 rounded-2xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-100"
        >
          <Plus size={16} />
          Add Goal
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
        />
        <input
          type="text"
          value={goals.searchQuery}
          onChange={(e) => goals.setSearchQuery(e.target.value)}
          placeholder={`Search ${catInfo.label}…`}
          className="w-full rounded-2xl border border-black/[0.08] bg-black/[0.04] py-3 pl-10 pr-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 dark:border-white/[0.06] dark:bg-white/[0.035] dark:text-white dark:placeholder:text-neutral-500"
        />
        {goals.searchQuery && (
          <button
            type="button"
            onClick={() => goals.setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Status filter chips */}
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => goals.setStatusFilter(opt.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              goals.statusFilter === opt.id
                ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
                : "border-black/[0.08] bg-black/[0.03] text-neutral-500 hover:bg-black/[0.06] dark:border-white/[0.06] dark:bg-white/[0.025] dark:text-neutral-400 dark:hover:bg-white/[0.05]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Goals grid */}
      {displayGoals.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-neutral-400">No goals found</p>
          <button
            type="button"
            onClick={() => goals.openAddForCategory(category)}
            className="mt-4 rounded-2xl border border-black/[0.08] px-5 py-2.5 text-sm font-medium text-neutral-500 transition hover:bg-black/[0.04] dark:border-white/[0.06] dark:text-neutral-400 dark:hover:bg-white/[0.04]"
          >
            Add your first {catInfo.label.toLowerCase()} goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {displayGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onView={goals.setViewingGoal}
              onComplete={goals.completeGoal}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Goal Detail Modal ─────────────────────────────────────────────────────────

function GoalDetailModal({
  goal,
  goals,
}: {
  goal: GoalRecord;
  goals: ReturnType<typeof useDreamsGoals>;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const styles = GOAL_CATEGORY_STYLES[goal.category];
  const catInfo = getCategoryInfo(goal.category);
  const isActive = goal.status === "planned" || goal.status === "in_progress";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={() => {
          goals.setViewingGoal(null);
          setConfirmDelete(false);
        }}
      />

      <div className="relative mx-auto w-full max-w-lg overflow-hidden rounded-[28px] border border-black/[0.10] bg-white shadow-[0_32px_100px_rgba(0,0,0,.12)] dark:border-white/[0.08] dark:bg-[#111419] dark:shadow-[0_32px_100px_rgba(0,0,0,.55)] max-h-[90vh] flex flex-col">
        {/* gradient strip */}
        <div className={`h-1.5 w-full ${styles.gradient}`} />

        <div className="overflow-y-auto flex-1 px-6 py-5">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${styles.badge}`}
                >
                  {catInfo.label}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${STATUS_STYLES[goal.status]}`}
                >
                  {STATUS_LABELS[goal.status]}
                </span>
              </div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                {goal.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                goals.setViewingGoal(null);
                setConfirmDelete(false);
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.06]"
            >
              <X size={18} />
            </button>
          </div>

          {/* Target date */}
          <div className="mb-4">
            <DaysLeftBadge targetDate={goal.targetDate} />
            {goal.targetDate && (
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Target: {new Date(goal.targetDate + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>

          {/* Occasion */}
          {goal.occasion && (
            <div className="mb-3 rounded-xl border border-black/[0.06] bg-black/[0.03] px-4 py-3 dark:border-white/[0.06] dark:bg-black/20">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                Occasion
              </p>
              <p className="mt-1 text-sm text-neutral-700 dark:text-neutral-200">
                {goal.occasion}
              </p>
            </div>
          )}

          {/* Details */}
          {goal.details && (
            <div className="mb-3 rounded-xl border border-black/[0.06] bg-black/[0.03] px-4 py-3 dark:border-white/[0.06] dark:bg-black/20">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                Details
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-200">
                {goal.details}
              </p>
            </div>
          )}

          {/* Timestamps */}
          <div className="mt-3 space-y-1 text-[10px] text-neutral-400 dark:text-neutral-500">
            <p>
              Created{" "}
              {new Date(goal.createdAt).toLocaleDateString("en-AU", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            {goal.completedAt && (
              <p>
                Completed{" "}
                {new Date(goal.completedAt).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
            {goal.archivedAt && (
              <p>
                Archived{" "}
                {new Date(goal.archivedAt).toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-black/[0.08] bg-white/95 px-6 py-4 backdrop-blur dark:border-white/[0.06] dark:bg-[#111419]/95">
          {isActive && (
            <button
              type="button"
              onClick={() => goals.completeGoal(goal.id)}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-500/20 dark:text-emerald-300"
            >
              <CheckCircle2 size={16} />
              Mark as Completed
            </button>
          )}

          {confirmDelete ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-2xl border border-black/[0.08] bg-black/[0.05] py-3 text-sm font-semibold text-neutral-600 dark:border-white/[0.06] dark:bg-white/[0.05] dark:text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => goals.deleteGoal(goal.id)}
                className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => goals.openEditForm(goal)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-black/[0.08] bg-black/[0.05] py-3 text-sm font-semibold text-neutral-600 transition hover:bg-black/[0.08] dark:border-white/[0.06] dark:bg-white/[0.05] dark:text-neutral-300"
              >
                <Pencil size={14} /> Edit
              </button>
              {!isActive && goal.status !== "archived" && (
                <button
                  type="button"
                  onClick={() => goals.archiveGoal(goal.id)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border border-black/[0.08] bg-black/[0.05] py-3 text-sm font-semibold text-neutral-500 transition hover:bg-black/[0.08] dark:border-white/[0.06] dark:bg-white/[0.05] dark:text-neutral-400"
                >
                  Archive
                </button>
              )}
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-black/[0.08] bg-black/[0.05] text-neutral-400 transition hover:bg-red-50 hover:text-red-500 dark:border-white/[0.06] dark:bg-white/[0.05] dark:hover:bg-red-500/10 dark:hover:text-red-400"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Root View ─────────────────────────────────────────────────────────────────

export function GoalsView() {
  const goals = useDreamsGoals();
  const [selectedCategory, setSelectedCategory] = useState<GoalCategory | null>(null);

  function handleSelectCategory(cat: GoalCategory) {
    setSelectedCategory(cat);
    goals.setSearchQuery("");
    goals.setStatusFilter("all");
  }

  function handleBack() {
    setSelectedCategory(null);
    goals.setSearchQuery("");
    goals.setStatusFilter("all");
  }

  if (goals.loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-emerald-500 dark:border-neutral-700 dark:border-t-emerald-400" />
      </div>
    );
  }

  if (goals.error) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-400">{goals.error}</p>
        <button
          type="button"
          onClick={goals.reload}
          className="mt-4 rounded-2xl border border-black/[0.08] px-5 py-2.5 text-sm text-neutral-500 hover:bg-black/[0.04] dark:border-white/[0.06] dark:text-neutral-400"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      {selectedCategory === null ? (
        <CategoryGrid goals={goals} onSelect={handleSelectCategory} />
      ) : (
        <CategoryDetailView
          category={selectedCategory}
          goals={goals}
          onBack={handleBack}
        />
      )}

      {goals.showForm && <GoalsForm goals={goals} />}

      {goals.viewingGoal && (
        <GoalDetailModal goal={goals.viewingGoal} goals={goals} />
      )}
    </>
  );
}
