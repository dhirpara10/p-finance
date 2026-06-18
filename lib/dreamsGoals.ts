export type GoalCategory =
  | "wishlist"
  | "bucket_list"
  | "experiences"
  | "family"
  | "achievements"
  | "purchases"
  | "other";

export type GoalStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "archived"
  | "cancelled";

export type GoalRecord = {
  id: string;
  title: string;
  category: GoalCategory;
  details: string;
  occasion: string;
  targetDate: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string;
  archivedAt: string;
};

export const GOAL_CATEGORIES: {
  id: GoalCategory;
  label: string;
}[] = [
  { id: "wishlist", label: "Wishlist" },
  { id: "bucket_list", label: "Bucket List" },
  { id: "experiences", label: "Experiences" },
  { id: "family", label: "Family Goals" },
  { id: "achievements", label: "Achievements" },
  { id: "purchases", label: "Future Purchases" },
  { id: "other", label: "Other" },
];

export const GOAL_CATEGORY_STYLES: Record<
  GoalCategory,
  {
    gradient: string;
    border: string;
    textAccent: string;
    badge: string;
    glow: string;
  }
> = {
  wishlist: {
    gradient:
      "bg-[radial-gradient(ellipse_at_top_right,rgba(244,114,182,0.18),rgba(236,72,153,0.06)_55%,transparent_80%)]",
    border: "border-pink-500/30",
    textAccent: "text-pink-400 dark:text-pink-300",
    badge: "bg-pink-400/15 text-pink-600 border-pink-400/25 dark:text-pink-300",
    glow: "shadow-[0_0_40px_rgba(244,114,182,0.08)]",
  },
  bucket_list: {
    gradient:
      "bg-[radial-gradient(ellipse_at_top_right,rgba(251,146,60,0.18),rgba(245,158,11,0.06)_55%,transparent_80%)]",
    border: "border-orange-500/30",
    textAccent: "text-orange-500 dark:text-orange-300",
    badge:
      "bg-orange-400/15 text-orange-600 border-orange-400/25 dark:text-orange-300",
    glow: "shadow-[0_0_40px_rgba(251,146,60,0.08)]",
  },
  experiences: {
    gradient:
      "bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,0.18),rgba(6,182,212,0.06)_55%,transparent_80%)]",
    border: "border-cyan-500/30",
    textAccent: "text-cyan-500 dark:text-cyan-300",
    badge: "bg-cyan-400/15 text-cyan-600 border-cyan-400/25 dark:text-cyan-300",
    glow: "shadow-[0_0_40px_rgba(34,211,238,0.08)]",
  },
  family: {
    gradient:
      "bg-[radial-gradient(ellipse_at_top_right,rgba(167,139,250,0.18),rgba(139,92,246,0.06)_55%,transparent_80%)]",
    border: "border-violet-500/30",
    textAccent: "text-violet-500 dark:text-violet-300",
    badge:
      "bg-violet-400/15 text-violet-600 border-violet-400/25 dark:text-violet-300",
    glow: "shadow-[0_0_40px_rgba(167,139,250,0.08)]",
  },
  achievements: {
    gradient:
      "bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.18),rgba(245,158,11,0.06)_55%,transparent_80%)]",
    border: "border-amber-500/30",
    textAccent: "text-amber-500 dark:text-amber-300",
    badge:
      "bg-amber-400/15 text-amber-600 border-amber-400/25 dark:text-amber-300",
    glow: "shadow-[0_0_40px_rgba(251,191,36,0.08)]",
  },
  purchases: {
    gradient:
      "bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.18),rgba(37,99,235,0.06)_55%,transparent_80%)]",
    border: "border-blue-500/30",
    textAccent: "text-blue-500 dark:text-blue-300",
    badge: "bg-blue-400/15 text-blue-600 border-blue-400/25 dark:text-blue-300",
    glow: "shadow-[0_0_40px_rgba(59,130,246,0.08)]",
  },
  other: {
    gradient:
      "bg-[radial-gradient(ellipse_at_top_right,rgba(148,163,184,0.15),rgba(100,116,139,0.05)_55%,transparent_80%)]",
    border: "border-slate-500/30",
    textAccent: "text-slate-500 dark:text-slate-300",
    badge:
      "bg-slate-400/15 text-slate-600 border-slate-400/25 dark:text-slate-300",
    glow: "shadow-[0_0_40px_rgba(148,163,184,0.06)]",
  },
};

export const GOAL_STATUSES: { id: GoalStatus; label: string }[] = [
  { id: "planned", label: "Planned" },
  { id: "in_progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "archived", label: "Archived" },
  { id: "cancelled", label: "Cancelled" },
];

export const STATUS_LABELS: Record<GoalStatus, string> = {
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  archived: "Archived",
  cancelled: "Cancelled",
};

export const STATUS_STYLES: Record<GoalStatus, string> = {
  planned: "bg-blue-400/15 text-blue-600 border-blue-400/25 dark:text-blue-300",
  in_progress:
    "bg-emerald-400/15 text-emerald-600 border-emerald-400/25 dark:text-emerald-300",
  completed:
    "bg-teal-400/15 text-teal-600 border-teal-400/25 dark:text-teal-300",
  archived:
    "bg-neutral-400/15 text-neutral-500 border-neutral-400/25 dark:text-neutral-400",
  cancelled:
    "bg-red-400/15 text-red-600 border-red-400/25 dark:text-red-300",
};

export function getCategoryInfo(category: GoalCategory) {
  return GOAL_CATEGORIES.find((c) => c.id === category) ?? GOAL_CATEGORIES[6];
}

export function getDaysLeft(targetDate: string): number | null {
  if (!targetDate) return null;
  const parts = targetDate.split("-").map(Number);
  if (parts.length !== 3) return null;
  const [year, month, day] = parts;
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const target = new Date(year, month - 1, day);
  const diffMs = target.getTime() - todayStart.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
