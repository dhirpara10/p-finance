import type { Bucket, BucketListTracker, SavingsBucket } from "@/lib/types";

const now = "2026-01-01T00:00:00.000Z";

export const defaultSavingsBuckets: SavingsBucket[] = [
  {
    id: "savings_emergency_fund",
    name: "Emergency Fund",
    targetAmount: 0,
    currentBalance: 0,
    linkedStorageLabel: "Bank",
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "savings_remittance",
    name: "Remittance",
    targetAmount: 0,
    currentBalance: 0,
    linkedStorageLabel: "Bank",
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "savings_debt_collection",
    name: "Debt Collection",
    targetAmount: 0,
    currentBalance: 0,
    linkedStorageLabel: "Bank",
    active: true,
    createdAt: now,
    updatedAt: now,
  },
];

export function categoryIdFromName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `category_${slug || "uncategorized"}`;
}

export function normalizeCategoryId(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return categoryIdFromName("Uncategorized");
  const withoutPrefix = text.replace(/^category_/i, "");
  return categoryIdFromName(withoutPrefix);
}

export function expenseCategoryId({
  categoryId,
  category,
}: {
  categoryId?: string;
  category: string;
}) {
  const normalizedId = normalizeCategoryId(categoryId);
  const normalizedName = categoryIdFromName(category);

  return normalizedId === categoryIdFromName("Uncategorized")
    ? normalizedName
    : normalizedId;
}

export const defaultBucketListTrackers: BucketListTracker[] = [
  {
    id: "tracker_adventure",
    name: "Adventure",
    icon: "Compass",
    monthlyBudget: 0,
    linkedCategoryIds: [categoryIdFromName("Adventure")],
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "tracker_wonders",
    name: "Wonders",
    icon: "Sparkles",
    monthlyBudget: 0,
    linkedCategoryIds: [categoryIdFromName("Wonders")],
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "tracker_tech_gadgets",
    name: "Tech Gadgets",
    icon: "Laptop",
    monthlyBudget: 0,
    linkedCategoryIds: [
      categoryIdFromName("Electronics"),
      categoryIdFromName("Accessories"),
      categoryIdFromName("Online Shopping"),
    ],
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "tracker_online_shopping",
    name: "Online Shopping",
    icon: "ShoppingBag",
    monthlyBudget: 0,
    linkedCategoryIds: [],
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "tracker_dressing",
    name: "Dressing",
    icon: "Shirt",
    monthlyBudget: 0,
    linkedCategoryIds: [categoryIdFromName("Clothing")],
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "tracker_personal_spends",
    name: "Personal Spends",
    icon: "WalletCards",
    monthlyBudget: 0,
    linkedCategoryIds: [
      categoryIdFromName("Gym"),
      categoryIdFromName("Shoes"),
    ],
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "tracker_gym_shoes",
    name: "Gym / Shoes",
    icon: "Dumbbell",
    monthlyBudget: 0,
    linkedCategoryIds: [],
    active: true,
    createdAt: now,
    updatedAt: now,
  },
];

export function isAccountBucket(value: unknown) {
  return value === "Bank" || value === "Cash";
}

export function normalizeBucketId(value: unknown): Bucket {
  const text = String(value || "").trim();
  if (text === "Cash") return "Cash";
  if (text === "Bank" || text === "Usable Balance") return "Bank";

  const legacyMatch = defaultSavingsBuckets.find(
    (bucket) => bucket.name.toLowerCase() === text.toLowerCase()
  );

  return legacyMatch?.id || text || "Bank";
}

export function getBucketLabel(value: unknown, savingsBuckets = defaultSavingsBuckets) {
  const id = normalizeBucketId(value);
  if (id === "Bank" || id === "Cash") return id;
  if (id === "shared_rollover_jar") return "Shared Rollover Jar";
  return savingsBuckets.find((bucket) => bucket.id === id)?.name || String(value);
}

export function bucketMatches(value: unknown, bucket: SavingsBucket | Bucket) {
  const normalized = normalizeBucketId(value);
  const bucketId = typeof bucket === "string" ? normalizeBucketId(bucket) : bucket.id;
  return normalized === bucketId;
}

export function parseJsonArray<T>(value: string, fallback: T[]) {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed as T[];
  } catch {}

  return fallback;
}

export function normalizeSavingsBuckets(buckets: SavingsBucket[]) {
  return buckets.map((bucket) => {
    const legacy = bucket as SavingsBucket & {
      linkedAccount?: string;
      storageLabel?: string;
    };

    return {
      ...bucket,
      linkedStorageLabel:
        legacy.linkedStorageLabel ||
        legacy.storageLabel ||
        legacy.linkedAccount ||
        "Bank",
    };
  });
}

export function findDuplicateTrackerCategory(
  trackers: BucketListTracker[],
  trackerId: string,
  linkedCategoryIds: string[]
) {
  const activeTrackers = trackers.filter((tracker) => tracker.active);

  for (const categoryId of linkedCategoryIds.map(normalizeCategoryId)) {
    const owner = activeTrackers.find(
      (tracker) =>
        tracker.id !== trackerId &&
        tracker.linkedCategoryIds.some(
          (linkedId) => normalizeCategoryId(linkedId) === categoryId
        )
    );

    if (owner) {
      return { categoryId, owner };
    }
  }

  return null;
}

export function normalizeTrackerLinks(trackers: BucketListTracker[]) {
  const assigned = new Set<string>();

  return trackers.map((tracker) => {
    if (!tracker.active) return tracker;

    const linkedCategoryIds = tracker.linkedCategoryIds
      .map(normalizeCategoryId)
      .filter((categoryId) => {
      if (assigned.has(categoryId)) return false;
      assigned.add(categoryId);
      return true;
      });

    return {
      ...tracker,
      linkedCategoryIds,
      recurringAllocation: undefined,
    };
  });
}
