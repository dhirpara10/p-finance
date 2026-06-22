import type { AppUser } from "@/lib/types";

export type NavTabId = "home" | "buckets" | "liabilities" | "activity" | "remittance" | "stats" | "vault" | "logs" | "goals";

export type TabPrefs = {
  order: NavTabId[];
  hidden: NavTabId[];
};

const DEFAULT_ORDER: NavTabId[] = [
  "home", "buckets", "liabilities", "activity", "remittance", "stats", "vault", "logs", "goals",
];

function key(user: AppUser) {
  return `tab_layout_${user}`;
}

export function loadTabPrefs(user: AppUser): TabPrefs {
  try {
    const raw = localStorage.getItem(key(user));
    if (!raw) return { order: DEFAULT_ORDER, hidden: [] };
    const parsed = JSON.parse(raw) as Partial<TabPrefs>;
    // Merge: add any new tabs not in saved order
    const savedOrder = (parsed.order ?? []).filter((id) => DEFAULT_ORDER.includes(id));
    const missing = DEFAULT_ORDER.filter((id) => !savedOrder.includes(id));
    return {
      order: [...savedOrder, ...missing],
      hidden: (parsed.hidden ?? []).filter((id) => DEFAULT_ORDER.includes(id) && id !== "home"),
    };
  } catch {
    return { order: DEFAULT_ORDER, hidden: [] };
  }
}

export function saveTabPrefs(user: AppUser, prefs: TabPrefs) {
  try {
    localStorage.setItem(key(user), JSON.stringify(prefs));
  } catch {}
}
