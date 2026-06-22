import type { BucketDefinition, CategoryDefinition, CategoryTrackerLink, TrackerDefinition } from "@/lib/types";

export function getLinkedCategoryIds(trackerId: string, links: CategoryTrackerLink[]): string[] {
  return links.filter((l) => l.isActive && l.trackerId === trackerId).map((l) => l.categoryId);
}

export function getTrackerForCategory(
  categoryId: string,
  links: CategoryTrackerLink[],
  trackers: TrackerDefinition[]
): TrackerDefinition | null {
  const link = links.find((l) => l.isActive && l.categoryId === categoryId);
  if (!link) return null;
  return trackers.find((t) => t.id === link.trackerId && t.isActive) ?? null;
}

export function getActiveBuckets(defs: BucketDefinition[]): BucketDefinition[] {
  return defs.filter((b) => b.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getActiveTrackers(defs: TrackerDefinition[]): TrackerDefinition[] {
  return defs.filter((t) => t.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getActiveCategories(defs: CategoryDefinition[]): CategoryDefinition[] {
  return defs.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
}
