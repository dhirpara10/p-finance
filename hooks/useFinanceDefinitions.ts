"use client";

import { useState } from "react";
import { categoryIdFromName, defaultBucketListTrackers, defaultSavingsBuckets, normalizeCategoryId } from "@/lib/buckets";
import { parseRows, BucketDefinitionSchema, TrackerDefinitionSchema, CategoryDefinitionSchema, CategoryTrackerLinkSchema } from "@/lib/schemas";
import { createSheetRecord, updateSheetRecord, deleteSheetRecord } from "@/lib/sheetsApi";
import type { BucketDefinition, BucketListTracker, CategoryDefinition, CategoryTrackerLink, SavingsBucket, TrackerDefinition } from "@/lib/types";

const DEFAULT_EXPENSE_CATEGORIES = [
  "Food", "Transport", "Rent", "Laundry", "Phone", "Visa", "Fees", "Tech",
  "College", "Gym", "Subscriptions", "Business", "Shopify", "Ads", "Emergency", "Other",
];

function parseSettings(rawSettings: unknown[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const row of rawSettings) {
    if (row && typeof row === "object") {
      const r = row as Record<string, unknown>;
      const id = String(r.id || "");
      const val = (r.data as Record<string, unknown>)?.value;
      if (id && val !== undefined) map[id] = String(val);
    }
  }
  return map;
}

function parseJsonSafe<T>(str: string, fallback: T): T {
  try {
    const parsed = JSON.parse(str);
    return parsed as T;
  } catch {
    return fallback;
  }
}

async function migrateBuckets(settingsMap: Record<string, string>): Promise<BucketDefinition[]> {
  const rawStr = settingsMap["savings_buckets"] || "";
  const oldBuckets: SavingsBucket[] = rawStr ? parseJsonSafe<SavingsBucket[]>(rawStr, []) : [];
  const source = oldBuckets.length > 0 ? oldBuckets : defaultSavingsBuckets;
  const now = new Date().toISOString();
  const defs: BucketDefinition[] = source.map((b, i) => ({
    id: b.id,
    name: b.name,
    type: "protected" as const,
    targetAmount: b.targetAmount > 0 ? b.targetAmount : null,
    isActive: b.active !== false,
    sortOrder: i,
    createdAt: b.createdAt || now,
    updatedAt: now,
  }));
  await Promise.all(defs.map((d) => createSheetRecord("bucket_definitions", d)));
  return defs;
}

async function migrateTrackers(settingsMap: Record<string, string>): Promise<{ trackers: TrackerDefinition[]; links: CategoryTrackerLink[] }> {
  const rawStr = settingsMap["bucket_list_trackers"] || "";
  const oldTrackers: BucketListTracker[] = rawStr ? parseJsonSafe<BucketListTracker[]>(rawStr, []) : [];
  const source = oldTrackers.length > 0 ? oldTrackers : defaultBucketListTrackers;
  const now = new Date().toISOString();
  const trackers: TrackerDefinition[] = source.map((t, i) => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    monthlyCap: t.monthlyBudget > 0 ? t.monthlyBudget : null,
    isActive: t.active !== false,
    sortOrder: i,
    recurringAllocation: t.recurringAllocation,
    createdAt: t.createdAt || now,
    updatedAt: now,
  }));
  const links: CategoryTrackerLink[] = source.flatMap((t) =>
    (t.linkedCategoryIds || []).map((catId) => ({
      id: `link_${t.id}_${normalizeCategoryId(catId)}`,
      categoryId: normalizeCategoryId(catId),
      trackerId: t.id,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }))
  );
  await Promise.all(trackers.map((t) => createSheetRecord("tracker_definitions", t)));
  await Promise.all(links.map((l) => createSheetRecord("category_tracker_links", l)));
  return { trackers, links };
}

async function migrateCategories(settingsMap: Record<string, string>): Promise<CategoryDefinition[]> {
  const rawStr = settingsMap["expense_categories"] || "";
  const parsed: unknown = rawStr ? parseJsonSafe(rawStr, null) : null;
  const names: string[] = Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : DEFAULT_EXPENSE_CATEGORIES;
  const source = names.length > 0 ? names : DEFAULT_EXPENSE_CATEGORIES;
  const now = new Date().toISOString();
  const defs: CategoryDefinition[] = source.map((name, i) => ({
    id: categoryIdFromName(name),
    name,
    kind: "expense" as const,
    isActive: true,
    sortOrder: i,
    createdAt: now,
    updatedAt: now,
  }));
  await Promise.all(defs.map((d) => createSheetRecord("category_definitions", d)));
  return defs;
}

export function useFinanceDefinitions() {
  const [bucketDefs, setBucketDefs] = useState<BucketDefinition[]>([]);
  const [trackerDefs, setTrackerDefs] = useState<TrackerDefinition[]>([]);
  const [categoryDefs, setCategoryDefs] = useState<CategoryDefinition[]>([]);
  const [ctLinks, setCtLinks] = useState<CategoryTrackerLink[]>([]);
  const [loaded, setLoaded] = useState(false);

  async function load(allData: Record<string, unknown[]>, rawSettings: unknown[]) {
    const settingsMap = parseSettings(rawSettings);

    const parsedBuckets = parseRows(BucketDefinitionSchema, allData["bucket_definitions"] || [], "bucket_definitions")
      .filter((b) => b.id) as BucketDefinition[];
    const parsedTrackers = parseRows(TrackerDefinitionSchema, allData["tracker_definitions"] || [], "tracker_definitions")
      .filter((t) => t.id) as TrackerDefinition[];
    const parsedCategories = parseRows(CategoryDefinitionSchema, allData["category_definitions"] || [], "category_definitions")
      .filter((c) => c.id) as CategoryDefinition[];
    const parsedLinks = parseRows(CategoryTrackerLinkSchema, allData["category_tracker_links"] || [], "category_tracker_links")
      .filter((l) => l.id) as CategoryTrackerLink[];

    const buckets = parsedBuckets.length > 0
      ? parsedBuckets.sort((a, b) => a.sortOrder - b.sortOrder)
      : await migrateBuckets(settingsMap);

    let trackers: TrackerDefinition[];
    let links: CategoryTrackerLink[];
    if (parsedTrackers.length > 0) {
      trackers = parsedTrackers.sort((a, b) => a.sortOrder - b.sortOrder);
      links = parsedLinks;
    } else {
      const migrated = await migrateTrackers(settingsMap);
      trackers = migrated.trackers;
      links = parsedLinks.length > 0 ? parsedLinks : migrated.links;
    }

    const categories = parsedCategories.length > 0
      ? parsedCategories.sort((a, b) => a.sortOrder - b.sortOrder)
      : await migrateCategories(settingsMap);

    setBucketDefs(buckets);
    setTrackerDefs(trackers);
    setCategoryDefs(categories);
    setCtLinks(links);
    setLoaded(true);
  }

  // ── Bucket CRUD ──────────────────────────────────────────────────────────────

  async function addBucketDef(input: Omit<BucketDefinition, "id" | "createdAt" | "updatedAt">): Promise<BucketDefinition> {
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const id = `savings_${slug || Date.now()}`;
    const now = new Date().toISOString();
    const def: BucketDefinition = { ...input, id, createdAt: now, updatedAt: now };
    await createSheetRecord("bucket_definitions", def);
    setBucketDefs((prev) => [...prev, def].sort((a, b) => a.sortOrder - b.sortOrder));
    return def;
  }

  async function updateBucketDef(id: string, updates: Partial<Omit<BucketDefinition, "id" | "createdAt">>) {
    const now = new Date().toISOString();
    const patch = { ...updates, updatedAt: now };
    await updateSheetRecord("bucket_definitions", id, patch);
    setBucketDefs((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  }

  async function archiveBucketDef(id: string) {
    await updateBucketDef(id, { isActive: false });
  }

  // ── Tracker CRUD ─────────────────────────────────────────────────────────────

  async function addTrackerDef(input: Omit<TrackerDefinition, "id" | "createdAt" | "updatedAt">, linkedCategoryIds: string[] = []): Promise<TrackerDefinition> {
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    const id = `tracker_${slug || Date.now()}`;
    const now = new Date().toISOString();
    const def: TrackerDefinition = { ...input, id, createdAt: now, updatedAt: now };
    await createSheetRecord("tracker_definitions", def);
    setTrackerDefs((prev) => [...prev, def].sort((a, b) => a.sortOrder - b.sortOrder));
    if (linkedCategoryIds.length > 0) {
      await _writeLinks(id, linkedCategoryIds);
    }
    return def;
  }

  async function updateTrackerDef(id: string, updates: Partial<Omit<TrackerDefinition, "id" | "createdAt">>, linkedCategoryIds?: string[]) {
    const now = new Date().toISOString();
    const patch = { ...updates, updatedAt: now };
    await updateSheetRecord("tracker_definitions", id, patch);
    setTrackerDefs((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (linkedCategoryIds !== undefined) {
      await setTrackerLinks(id, linkedCategoryIds);
    }
  }

  async function archiveTrackerDef(id: string) {
    await updateTrackerDef(id, { isActive: false });
  }

  async function _writeLinks(trackerId: string, categoryIds: string[]) {
    const now = new Date().toISOString();
    const newLinks: CategoryTrackerLink[] = categoryIds.map((catId) => ({
      id: `link_${trackerId}_${normalizeCategoryId(catId)}_${Date.now()}`,
      categoryId: normalizeCategoryId(catId),
      trackerId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }));
    await Promise.all(newLinks.map((l) => createSheetRecord("category_tracker_links", l)));
    setCtLinks((prev) => [...prev, ...newLinks]);
  }

  async function setTrackerLinks(trackerId: string, categoryIds: string[]) {
    const existing = ctLinks.filter((l) => l.trackerId === trackerId);
    await Promise.all(existing.map((l) => deleteSheetRecord("category_tracker_links", l.id)));
    setCtLinks((prev) => prev.filter((l) => l.trackerId !== trackerId));
    if (categoryIds.length > 0) {
      await _writeLinks(trackerId, categoryIds);
    }
  }

  // ── Category CRUD ─────────────────────────────────────────────────────────────

  async function addCategoryDef(input: Omit<CategoryDefinition, "id" | "createdAt" | "updatedAt">, linkedTrackerId?: string): Promise<CategoryDefinition> {
    const id = categoryIdFromName(input.name);
    const now = new Date().toISOString();
    const def: CategoryDefinition = { ...input, id, createdAt: now, updatedAt: now };
    await createSheetRecord("category_definitions", def);
    setCategoryDefs((prev) => [...prev, def].sort((a, b) => a.sortOrder - b.sortOrder));
    if (linkedTrackerId) {
      await _writeLinks(linkedTrackerId, [id]);
    }
    return def;
  }

  async function updateCategoryDef(id: string, updates: Partial<Omit<CategoryDefinition, "id" | "createdAt">>, linkedTrackerId?: string | null) {
    const now = new Date().toISOString();
    const patch = { ...updates, updatedAt: now };
    await updateSheetRecord("category_definitions", id, patch);
    setCategoryDefs((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    if (linkedTrackerId !== undefined) {
      // Remove existing link for this category from any tracker
      const existingLink = ctLinks.find((l) => l.categoryId === normalizeCategoryId(id));
      if (existingLink) {
        await deleteSheetRecord("category_tracker_links", existingLink.id);
        setCtLinks((prev) => prev.filter((l) => l.id !== existingLink.id));
      }
      if (linkedTrackerId) {
        await _writeLinks(linkedTrackerId, [id]);
      }
    }
  }

  async function archiveCategoryDef(id: string) {
    await updateCategoryDef(id, { isActive: false });
  }

  return {
    bucketDefs,
    trackerDefs,
    categoryDefs,
    ctLinks,
    loaded,
    load,
    addBucketDef,
    updateBucketDef,
    archiveBucketDef,
    addTrackerDef,
    updateTrackerDef,
    archiveTrackerDef,
    setTrackerLinks,
    addCategoryDef,
    updateCategoryDef,
    archiveCategoryDef,
  };
}

export type FinanceDefinitions = ReturnType<typeof useFinanceDefinitions>;
