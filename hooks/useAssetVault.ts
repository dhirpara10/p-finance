"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { AssetRecord, AssetType, LocationTag } from "@/lib/assetVault";
import { DEFAULT_LOCATION_TAGS } from "@/lib/assetVault";
import {
  createSheetRecord,
  deleteFromSheet,
  getAllData,
  updateSheetRecord,
} from "@/lib/sheetsApi";

const VAULT_SHEET = "asset_vault";
const TAGS_SHEET = "asset_location_tags";

function today() {
  return new Date().toISOString().split("T")[0];
}

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function useAssetVault() {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [locationTags, setLocationTags] = useState<LocationTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const seedingRef = useRef(false);

  // Filter / search state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeAssetType, setActiveAssetType] = useState<AssetType | null>(null);
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetRecord | null>(null);
  const [viewingAsset, setViewingAsset] = useState<AssetRecord | null>(null);
  const [showTagManager, setShowTagManager] = useState(false);

  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formAssetType, setFormAssetType] = useState<AssetType>("other");
  const [formDetails, setFormDetails] = useState("");
  const [formDate, setFormDate] = useState(today());
  const [formTagIds, setFormTagIds] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllData();

      // Parse assets
      const rawAssets = (data[VAULT_SHEET] || []) as Record<string, unknown>[];
      const parsedAssets: AssetRecord[] = rawAssets
        .filter((item) => item && item.id)
        .map((item) => ({
          id: String(item.id),
          title: String(item.title || ""),
          assetType: (item.assetType as AssetType) || "other",
          details: String(item.details || ""),
          date: String(item.date || ""),
          locationTagIds: Array.isArray(item.locationTagIds)
            ? (item.locationTagIds as unknown[]).map(String)
            : [],
          createdAt: String(item.createdAt || new Date().toISOString()),
          updatedAt: String(item.updatedAt || new Date().toISOString()),
        }))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      setAssets(parsedAssets);

      // Parse location tags
      const rawTags = (data[TAGS_SHEET] || []) as Record<string, unknown>[];
      let parsedTags: LocationTag[] = rawTags
        .filter((item) => item && item.id)
        .map((item) => ({
          id: String(item.id),
          name: String(item.name || ""),
          createdAt: String(item.createdAt || new Date().toISOString()),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      // Seed defaults on first use
      if (parsedTags.length === 0 && !seedingRef.current) {
        seedingRef.current = true;
        const now = new Date().toISOString();
        const seeded = await Promise.all(
          DEFAULT_LOCATION_TAGS.map(async (name) => {
            const tag: LocationTag = {
              id: `tag_${uid()}`,
              name,
              createdAt: now,
            };
            await createSheetRecord(TAGS_SHEET, tag as unknown as Record<string, unknown>);
            return tag;
          })
        );
        parsedTags = seeded.sort((a, b) => a.name.localeCompare(b.name));
      }

      setLocationTags(parsedTags);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load vault";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Form helpers ────────────────────────────────────────────────────────────

  function resetForm() {
    setFormTitle("");
    setFormAssetType("other");
    setFormDetails("");
    setFormDate(today());
    setFormTagIds([]);
    setEditingAsset(null);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(asset: AssetRecord) {
    setFormTitle(asset.title);
    setFormAssetType(asset.assetType);
    setFormDetails(asset.details);
    setFormDate(asset.date);
    setFormTagIds([...asset.locationTagIds]);
    setEditingAsset(asset);
    setViewingAsset(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  // ── CRUD — Assets ───────────────────────────────────────────────────────────

  async function saveAsset() {
    if (!formTitle.trim()) return;
    const now = new Date().toISOString();

    if (editingAsset) {
      const updated: AssetRecord = {
        ...editingAsset,
        title: formTitle.trim(),
        assetType: formAssetType,
        details: formDetails.trim(),
        date: formDate,
        locationTagIds: formTagIds,
        updatedAt: now,
      };
      await updateSheetRecord(VAULT_SHEET, editingAsset.id, updated as unknown as Record<string, unknown>);
      setAssets((prev) =>
        prev.map((a) => (a.id === editingAsset.id ? updated : a))
      );
    } else {
      const newAsset: AssetRecord = {
        id: `asset_${uid()}`,
        title: formTitle.trim(),
        assetType: formAssetType,
        details: formDetails.trim(),
        date: formDate,
        locationTagIds: formTagIds,
        createdAt: now,
        updatedAt: now,
      };
      await createSheetRecord(VAULT_SHEET, newAsset as unknown as Record<string, unknown>);
      setAssets((prev) => [newAsset, ...prev]);
    }

    closeForm();
  }

  async function deleteAsset(id: string) {
    await deleteFromSheet(VAULT_SHEET, id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
    setViewingAsset(null);
  }

  // ── CRUD — Location Tags ────────────────────────────────────────────────────

  async function createTag(name: string) {
    const trimmed = name.trim();
    if (
      !trimmed ||
      locationTags.some(
        (t) => t.name.toLowerCase() === trimmed.toLowerCase()
      )
    )
      return;
    const tag: LocationTag = {
      id: `tag_${uid()}`,
      name: trimmed,
      createdAt: new Date().toISOString(),
    };
    await createSheetRecord(TAGS_SHEET, tag as unknown as Record<string, unknown>);
    setLocationTags((prev) =>
      [...prev, tag].sort((a, b) => a.name.localeCompare(b.name))
    );
  }

  async function renameTag(id: string, newName: string) {
    const trimmed = newName.trim();
    if (!trimmed) return;
    await updateSheetRecord(TAGS_SHEET, id, { name: trimmed });
    setLocationTags((prev) =>
      prev
        .map((t) => (t.id === id ? { ...t, name: trimmed } : t))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  }

  async function deleteTag(id: string) {
    await deleteFromSheet(TAGS_SHEET, id);
    setLocationTags((prev) => prev.filter((t) => t.id !== id));
    // Remove tag from all assets that referenced it
    const affected = assets.filter((a) => a.locationTagIds.includes(id));
    await Promise.all(
      affected.map((asset) => {
        const updated = {
          ...asset,
          locationTagIds: asset.locationTagIds.filter((tid) => tid !== id),
          updatedAt: new Date().toISOString(),
        };
        setAssets((prev) =>
          prev.map((a) => (a.id === asset.id ? updated : a))
        );
        return updateSheetRecord(VAULT_SHEET, asset.id, updated as unknown as Record<string, unknown>);
      })
    );
    // Clear from active filters
    setActiveTagIds((prev) => prev.filter((tid) => tid !== id));
  }

  function toggleTagFilter(tagId: string) {
    setActiveTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  function toggleFormTag(tagId: string) {
    setFormTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  // ── Filtering ───────────────────────────────────────────────────────────────

  const filteredAssets = assets.filter((asset) => {
    if (activeAssetType && asset.assetType !== activeAssetType) return false;
    if (
      activeTagIds.length > 0 &&
      !activeTagIds.every((tid) => asset.locationTagIds.includes(tid))
    )
      return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const tagNames = asset.locationTagIds
        .map((tid) => locationTags.find((t) => t.id === tid)?.name ?? "")
        .join(" ");
      if (
        !asset.title.toLowerCase().includes(q) &&
        !asset.details.toLowerCase().includes(q) &&
        !asset.assetType.includes(q) &&
        !tagNames.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  return {
    // Data
    assets,
    filteredAssets,
    locationTags,
    loading,
    error,
    reload: loadData,

    // Filter state
    searchQuery,
    setSearchQuery,
    activeAssetType,
    setActiveAssetType,
    activeTagIds,
    toggleTagFilter,
    setActiveTagIds,

    // Modal state
    showForm,
    editingAsset,
    viewingAsset,
    setViewingAsset,
    showTagManager,
    setShowTagManager,

    // Form state
    formTitle,
    setFormTitle,
    formAssetType,
    setFormAssetType,
    formDetails,
    setFormDetails,
    formDate,
    setFormDate,
    formTagIds,
    toggleFormTag,
    setFormTagIds,

    // Actions
    openAddForm,
    openEditForm,
    closeForm,
    saveAsset,
    deleteAsset,
    createTag,
    renameTag,
    deleteTag,
  };
}

export type AssetVaultState = ReturnType<typeof useAssetVault>;
