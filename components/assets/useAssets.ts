"use client";

import { useState } from "react";
import { createSheetRecord, deleteFromSheet, updateSheetRecord } from "@/lib/sheetsApi";
import type { AppUser, AssetPrices, OtherAsset } from "@/lib/types";

const DEFAULT_PRICES: AssetPrices = {
  goldAud: 0,
  goldInr: 0,
  silverAud: 0,
  silverInr: 0,
  updatedAt: null,
};

export function useAssets() {
  const [otherAssets, setOtherAssets] = useState<OtherAsset[]>([]);
  const [goldGrams, setGoldGrams] = useState(0);
  const [silverGrams, setSilverGrams] = useState(0);
  const [assetPrices, setAssetPrices] = useState<AssetPrices>(DEFAULT_PRICES);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [assetsEnabled, setAssetsEnabled] = useState(true);

  // Form state
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [assetName, setAssetName] = useState("");
  const [assetCategory, setAssetCategory] = useState("Vehicle");
  const [assetValueAud, setAssetValueAud] = useState("");
  const [assetNotes, setAssetNotes] = useState("");

  // Metal editing state
  const [editingGold, setEditingGold] = useState(false);
  const [editingSilver, setEditingSilver] = useState(false);
  const [goldGramsInput, setGoldGramsInput] = useState("");
  const [silverGramsInput, setSilverGramsInput] = useState("");

  async function loadAssetPrices() {
    setLoadingPrices(true);
    try {
      const res = await fetch("/api/asset-prices");
      const json = await res.json();
      if (json.success && json.data) {
        setAssetPrices(json.data as AssetPrices);
      }
    } catch {
      // silently fail — prices just stay at 0
    } finally {
      setLoadingPrices(false);
    }
  }

  function parseOtherAsset(raw: unknown): OtherAsset | null {
    try {
      const d = raw as Record<string, unknown>;
      if (!d.id || !d.name) return null;
      return {
        id: String(d.id),
        name: String(d.name),
        category: String(d.category || "Other"),
        valueAud: Number(d.valueAud) || 0,
        notes: d.notes ? String(d.notes) : undefined,
        createdAt: String(d.createdAt || new Date().toISOString()),
        updatedAt: d.updatedAt ? String(d.updatedAt) : undefined,
        addedBy: (d.addedBy as AppUser) || undefined,
      };
    } catch {
      return null;
    }
  }

  function loadAssetsFromData(rows: unknown[]) {
    const parsed = rows
      .map((row) => {
        const r = row as { data?: unknown };
        return parseOtherAsset(r.data ?? row);
      })
      .filter(Boolean) as OtherAsset[];
    setOtherAssets(parsed.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  function resetAssetForm() {
    setAssetName("");
    setAssetCategory("Vehicle");
    setAssetValueAud("");
    setAssetNotes("");
    setEditingAssetId(null);
    setShowAssetForm(false);
  }

  function openEditAsset(asset: OtherAsset) {
    setEditingAssetId(asset.id);
    setAssetName(asset.name);
    setAssetCategory(asset.category);
    setAssetValueAud(String(asset.valueAud));
    setAssetNotes(asset.notes || "");
    setShowAssetForm(true);
  }

  async function saveOtherAsset(currentUser: AppUser): Promise<OtherAsset | null> {
    const cleanName = assetName.trim();
    if (!cleanName) { alert("Enter an asset name."); return null; }
    const value = Number(assetValueAud);
    if (!Number.isFinite(value) || value < 0) { alert("Enter a valid value."); return null; }

    const now = new Date().toISOString();
    const isEdit = !!editingAssetId;

    const asset: OtherAsset = {
      id: editingAssetId || `asset_${Date.now()}`,
      name: cleanName,
      category: assetCategory,
      valueAud: value,
      notes: assetNotes.trim() || undefined,
      createdAt: isEdit
        ? (otherAssets.find((a) => a.id === editingAssetId)?.createdAt ?? now)
        : now,
      updatedAt: isEdit ? now : undefined,
      addedBy: currentUser,
    };

    const saved = isEdit
      ? await updateSheetRecord("assets", asset.id, asset)
      : await createSheetRecord("assets", asset as unknown as Record<string, unknown>);

    if (!saved) { alert("Asset was not saved."); return null; }

    setOtherAssets((prev) =>
      isEdit
        ? prev.map((a) => (a.id === asset.id ? asset : a))
        : [asset, ...prev]
    );

    resetAssetForm();
    return asset;
  }

  async function deleteOtherAsset(id: string): Promise<boolean> {
    if (!window.confirm("Delete this asset?")) return false;
    const ok = await deleteFromSheet("assets", id);
    if (!ok) return false;
    setOtherAssets((prev) => prev.filter((a) => a.id !== id));
    return true;
  }

  // Computed values
  const goldValueAud = goldGrams * assetPrices.goldAud;
  const goldValueInr = goldGrams * assetPrices.goldInr;
  const silverValueAud = silverGrams * assetPrices.silverAud;
  const silverValueInr = silverGrams * assetPrices.silverInr;
  const otherAssetsTotal = otherAssets.reduce((sum, a) => sum + a.valueAud, 0);
  const totalAssetsAud = goldValueAud + silverValueAud + otherAssetsTotal;

  function resetAssetData() {
    setOtherAssets([]);
  }

  return {
    // State
    otherAssets,
    setOtherAssets,
    goldGrams,
    setGoldGrams,
    silverGrams,
    setSilverGrams,
    assetPrices,
    setAssetPrices,
    loadingPrices,
    assetsEnabled,
    setAssetsEnabled,
    // Form state
    showAssetForm,
    setShowAssetForm,
    editingAssetId,
    assetName,
    setAssetName,
    assetCategory,
    setAssetCategory,
    assetValueAud,
    setAssetValueAud,
    assetNotes,
    setAssetNotes,
    // Metal editing
    editingGold,
    setEditingGold,
    editingSilver,
    setEditingSilver,
    goldGramsInput,
    setGoldGramsInput,
    silverGramsInput,
    setSilverGramsInput,
    // Computed
    goldValueAud,
    goldValueInr,
    silverValueAud,
    silverValueInr,
    otherAssetsTotal,
    totalAssetsAud,
    // Functions
    loadAssetPrices,
    loadAssetsFromData,
    saveOtherAsset,
    deleteOtherAsset,
    openEditAsset,
    resetAssetForm,
    resetAssetData,
  };
}

export type AssetsModule = ReturnType<typeof useAssets>;
