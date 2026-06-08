import type { Bucket, BucketListTracker, SavingsBucket } from "@/lib/types";

const now = "2026-01-01T00:00:00.000Z";

export const defaultSavingsBuckets: SavingsBucket[] = [
  {
    id: "savings_emergency_fund",
    name: "Emergency Fund",
    targetAmount: 5000,
    currentBalance: 0,
    linkedAccount: "Bank",
    storageLabel: "Bank",
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "savings_remittance",
    name: "Remittance",
    targetAmount: 10000,
    currentBalance: 0,
    linkedAccount: "Bank",
    storageLabel: "Bank",
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "savings_debt_collection",
    name: "Debt Collection",
    targetAmount: 3000,
    currentBalance: 0,
    linkedAccount: "Bank",
    storageLabel: "Bank",
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

export const defaultBucketListTrackers: BucketListTracker[] = [
  {
    id: "tracker_adventure",
    name: "Adventure",
    monthlyBudget: 300,
    linkedCategoryIds: [categoryIdFromName("Adventure")],
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "tracker_wonders",
    name: "Wonders",
    monthlyBudget: 300,
    linkedCategoryIds: [categoryIdFromName("Wonders")],
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "tracker_tech_gadgets",
    name: "Tech Gadgets",
    monthlyBudget: 250,
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
    monthlyBudget: 150,
    linkedCategoryIds: [],
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "tracker_dressing",
    name: "Dressing",
    monthlyBudget: 150,
    linkedCategoryIds: [categoryIdFromName("Clothing")],
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "tracker_personal_spends",
    name: "Personal Spends",
    monthlyBudget: 200,
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
    monthlyBudget: 120,
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
