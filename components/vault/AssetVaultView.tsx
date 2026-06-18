"use client";

import { useState } from "react";
import {
  ASSET_TYPES,
  ASSET_TYPE_STYLES,
  getAssetTypeInfo,
  type AssetRecord,
  type AssetType,
} from "@/lib/assetVault";
import { useAssetVault } from "@/hooks/useAssetVault";
import { AssetVaultForm } from "@/components/vault/AssetVaultForm";
import {
  Archive,
  Calendar,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  Tag,
  Trash2,
  X,
} from "lucide-react";

// ── AssetVaultCard ─────────────────────────────────────────────────────────────

function AssetVaultCard({
  asset,
  locationTagNames,
  onClick,
}: {
  asset: AssetRecord;
  locationTagNames: string[];
  onClick: () => void;
}) {
  const styles = ASSET_TYPE_STYLES[asset.assetType];
  const typeInfo = getAssetTypeInfo(asset.assetType);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-3xl border p-5 text-left transition-all duration-200 hover:scale-[1.015] hover:brightness-110 active:scale-[0.99] ${styles.border} ${styles.glow}`}
      style={{
        background: `linear-gradient(135deg, #111418 0%, #0e1115 100%)`,
      }}
    >
      {/* Gradient overlay */}
      <div className={`pointer-events-none absolute inset-0 rounded-3xl ${styles.gradient}`} />

      {/* Content */}
      <div className="relative">
        {/* Top row: emoji badge + date */}
        <div className="flex items-start justify-between gap-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles.badge}`}
          >
            <span>{typeInfo.emoji}</span>
            <span>{typeInfo.label}</span>
          </span>
          <span className="shrink-0 text-[11px] text-neutral-600">
            {asset.date
              ? new Date(asset.date + "T00:00:00").toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : ""}
          </span>
        </div>

        {/* Title */}
        <h3
          className={`mt-4 text-lg font-bold leading-snug tracking-tight ${styles.textAccent} line-clamp-2`}
        >
          {asset.title}
        </h3>

        {/* Details preview */}
        {asset.details && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-500">
            {asset.details}
          </p>
        )}

        {/* Location tags */}
        {locationTagNames.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {locationTagNames.map((name) => (
              <span
                key={name}
                className="flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-neutral-400"
              >
                <MapPin size={9} />
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────────────

function AssetDetailModal({
  asset,
  tagNames,
  onClose,
  onEdit,
  onDelete,
}: {
  asset: AssetRecord;
  tagNames: string[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const styles = ASSET_TYPE_STYLES[asset.assetType];
  const typeInfo = getAssetTypeInfo(asset.assetType);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/75 backdrop-blur-sm sm:items-center sm:justify-center sm:px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`no-scrollbar relative mt-auto w-full overflow-y-auto rounded-t-[28px] border sm:mx-auto sm:mt-0 sm:max-w-lg sm:rounded-[28px] ${styles.border}`}
        style={{
          maxHeight: "92dvh",
          background: `linear-gradient(160deg, #111418 0%, #0d1014 100%)`,
        }}
      >
        {/* Gradient accent */}
        <div className={`pointer-events-none absolute inset-0 rounded-[28px] ${styles.gradient}`} />

        <div className="relative p-6">
          {/* Drag handle */}
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 sm:hidden" />

          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${styles.badge}`}
            >
              <span className="text-base">{typeInfo.emoji}</span>
              {typeInfo.label}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-neutral-500 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          <h2 className={`mt-5 text-2xl font-bold leading-tight ${styles.textAccent}`}>
            {asset.title}
          </h2>

          {/* Date */}
          <div className="mt-4 flex items-center gap-2 text-sm text-neutral-500">
            <Calendar size={14} />
            <span>
              {asset.date
                ? new Date(asset.date + "T00:00:00").toLocaleDateString("en-AU", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "No date"}
            </span>
          </div>

          {/* Location tags */}
          {tagNames.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-600">
                <MapPin size={11} />
                Location
              </p>
              <div className="flex flex-wrap gap-2">
                {tagNames.map((name) => (
                  <span
                    key={name}
                    className="flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1.5 text-sm font-medium text-neutral-300"
                  >
                    <MapPin size={11} className="text-neutral-500" />
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Details */}
          {asset.details && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Details
              </p>
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.03] p-4 text-sm leading-relaxed text-neutral-300 whitespace-pre-wrap">
                {asset.details}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white/[0.06] py-3.5 text-sm font-semibold text-neutral-300 transition hover:bg-white/[0.09]"
            >
              <Pencil size={15} />
              Edit
            </button>
            {confirmDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center justify-center gap-2 rounded-2xl bg-red-500/20 py-3.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/30"
              >
                <Trash2 size={15} />
                Confirm Delete
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex items-center justify-center gap-2 rounded-2xl bg-white/[0.04] py-3.5 text-sm font-semibold text-neutral-500 transition hover:bg-red-500/10 hover:text-red-400"
              >
                <Trash2 size={15} />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tag Manager Modal ──────────────────────────────────────────────────────────

function TagManagerModal({
  vault,
}: {
  vault: ReturnType<typeof useAssetVault>;
}) {
  const [newTagName, setNewTagName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleCreate() {
    if (!newTagName.trim()) return;
    await vault.createTag(newTagName);
    setNewTagName("");
  }

  async function handleRename(id: string) {
    if (!renameValue.trim()) return;
    await vault.renameTag(id, renameValue);
    setRenamingId(null);
    setRenameValue("");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/75 backdrop-blur-sm sm:items-center sm:justify-center sm:px-4"
      onClick={(e) =>
        e.target === e.currentTarget && vault.setShowTagManager(false)
      }
    >
      <div
        className="no-scrollbar mt-auto w-full overflow-y-auto rounded-t-[28px] border border-white/[0.08] bg-[#111419] sm:mx-auto sm:mt-0 sm:max-w-md sm:rounded-[28px]"
        style={{ maxHeight: "85dvh" }}
      >
        <div className="p-5">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Location Tags</h3>
              <p className="text-sm text-neutral-500">
                Create and manage location tags
              </p>
            </div>
            <button
              type="button"
              onClick={() => vault.setShowTagManager(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-neutral-500 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Add new tag */}
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="New location tag…"
              className="min-h-11 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-white/20 focus:bg-white/[0.06]"
            />
            <button
              type="button"
              onClick={handleCreate}
              disabled={!newTagName.trim()}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-neutral-950 transition hover:bg-white/90 disabled:opacity-40"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Tag list */}
          <div className="space-y-1.5">
            {vault.locationTags.length === 0 && (
              <p className="py-6 text-center text-sm text-neutral-600">
                No tags yet.
              </p>
            )}
            {vault.locationTags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-2 rounded-2xl border border-white/[0.05] bg-white/[0.025] px-4 py-3"
              >
                {renamingId === tag.id ? (
                  <>
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(tag.id);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      autoFocus
                      className="min-w-0 flex-1 rounded-lg bg-white/[0.05] px-2 py-1 text-sm text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRename(tag.id)}
                      className="shrink-0 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenamingId(null)}
                      className="shrink-0 text-neutral-600 hover:text-neutral-300"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <Tag size={13} className="shrink-0 text-neutral-600" />
                    <span className="min-w-0 flex-1 truncate text-sm text-neutral-200">
                      {tag.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingId(tag.id);
                        setRenameValue(tag.name);
                      }}
                      className="shrink-0 text-neutral-600 hover:text-neutral-300"
                    >
                      <Pencil size={13} />
                    </button>
                    {confirmDeleteId === tag.id ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await vault.deleteTag(tag.id);
                          setConfirmDeleteId(null);
                        }}
                        className="shrink-0 rounded-lg bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-300"
                      >
                        Confirm
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(tag.id)}
                        className="shrink-0 text-neutral-700 hover:text-red-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main View ──────────────────────────────────────────────────────────────────

export function AssetVaultView() {
  const vault = useAssetVault();

  const {
    filteredAssets,
    locationTags,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    activeAssetType,
    setActiveAssetType,
    activeTagIds,
    toggleTagFilter,
    setActiveTagIds,
    viewingAsset,
    setViewingAsset,
    showForm,
    showTagManager,
    setShowTagManager,
    openAddForm,
    openEditForm,
    deleteAsset,
    reload,
  } = vault;

  function getTagNames(tagIds: string[]) {
    return tagIds
      .map((id) => locationTags.find((t) => t.id === id)?.name ?? "")
      .filter(Boolean);
  }

  const hasFilters =
    !!activeAssetType || activeTagIds.length > 0 || searchQuery.trim().length > 0;

  return (
    <section className="relative min-h-[50vh]">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker text-neutral-500">INFORMATION VAULT</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Asset Vault</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {vault.assets.length === 0
              ? "Store important asset records for future reference."
              : `${vault.assets.length} record${vault.assets.length !== 1 ? "s" : ""} stored`}
          </p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setShowTagManager(true)}
            className="flex h-10 items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 text-xs font-semibold text-neutral-400 transition hover:bg-white/[0.07] hover:text-neutral-200"
          >
            <Settings2 size={13} />
            Tags
          </button>
          {loading && (
            <button
              type="button"
              onClick={reload}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-neutral-500 transition hover:bg-white/[0.07]"
            >
              <RefreshCw size={14} className="animate-spin" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/8 p-4 text-sm text-red-300">
          {error} —{" "}
          <button type="button" onClick={reload} className="underline">
            retry
          </button>
        </p>
      )}

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <div className="relative mt-5">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search titles, details, types, locations…"
          className="min-h-12 w-full rounded-2xl border border-white/[0.07] bg-white/[0.035] pl-10 pr-4 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-white/[0.15] focus:bg-white/[0.05]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-300"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── Asset Type chips ────────────────────────────────────────────────── */}
      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-0.5">
        <button
          type="button"
          onClick={() => setActiveAssetType(null)}
          className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition ${
            !activeAssetType
              ? "border-white/20 bg-white/[0.1] text-white"
              : "border-white/[0.06] bg-white/[0.03] text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-300"
          }`}
        >
          All
        </button>
        {ASSET_TYPES.map((type) => {
          const selected = activeAssetType === type.id;
          const s = ASSET_TYPE_STYLES[type.id];
          return (
            <button
              key={type.id}
              type="button"
              onClick={() =>
                setActiveAssetType(selected ? null : (type.id as AssetType))
              }
              className={`shrink-0 flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[12px] font-semibold transition ${
                selected
                  ? `${s.badge} ${s.border}`
                  : "border-white/[0.06] bg-white/[0.03] text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-300"
              }`}
            >
              <span>{type.emoji}</span>
              {type.label}
            </button>
          );
        })}
      </div>

      {/* ── Location chips ──────────────────────────────────────────────────── */}
      {locationTags.length > 0 && (
        <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-0.5">
          {locationTags.map((tag) => {
            const selected = activeTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTagFilter(tag.id)}
                className={`shrink-0 flex items-center gap-1 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition ${
                  selected
                    ? "border-white/20 bg-white/[0.1] text-white"
                    : "border-white/[0.06] bg-white/[0.025] text-neutral-600 hover:bg-white/[0.06] hover:text-neutral-400"
                }`}
              >
                <MapPin size={10} />
                {tag.name}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Active Filters ──────────────────────────────────────────────────── */}
      {(activeAssetType || activeTagIds.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-neutral-600">Filters:</span>
          {activeAssetType && (
            <button
              type="button"
              onClick={() => setActiveAssetType(null)}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${ASSET_TYPE_STYLES[activeAssetType].badge} ${ASSET_TYPE_STYLES[activeAssetType].border}`}
            >
              {getAssetTypeInfo(activeAssetType).emoji}{" "}
              {getAssetTypeInfo(activeAssetType).label}
              <X size={10} className="ml-0.5" />
            </button>
          )}
          {activeTagIds.map((tid) => {
            const tag = locationTags.find((t) => t.id === tid);
            if (!tag) return null;
            return (
              <button
                key={tid}
                type="button"
                onClick={() => toggleTagFilter(tid)}
                className="flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 text-[11px] font-semibold text-neutral-200 transition hover:bg-white/[0.12]"
              >
                <MapPin size={9} />
                {tag.name}
                <X size={10} className="ml-0.5" />
              </button>
            );
          })}
          {(activeTagIds.length > 0 || activeAssetType) && (
            <button
              type="button"
              onClick={() => {
                setActiveAssetType(null);
                setActiveTagIds([]);
              }}
              className="text-[11px] text-neutral-600 underline hover:text-neutral-400"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* ── Card grid ──────────────────────────────────────────────────────── */}
      {loading && vault.assets.length === 0 ? (
        <div className="mt-10 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-3xl border border-white/[0.05] bg-white/[0.02]"
            />
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-white/[0.07] px-6 py-16 text-center">
          <Archive size={40} className="mx-auto text-neutral-700" />
          <p className="mt-4 font-semibold text-neutral-400">
            {hasFilters ? "No records match your filters" : "Vault is empty"}
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            {hasFilters
              ? "Try clearing some filters."
              : "Tap + to add your first asset record."}
          </p>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredAssets.map((asset) => (
            <AssetVaultCard
              key={asset.id}
              asset={asset}
              locationTagNames={getTagNames(asset.locationTagIds)}
              onClick={() => setViewingAsset(asset)}
            />
          ))}
        </div>
      )}

      {/* ── Floating Add Button ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={openAddForm}
        className="safe-bottom-fab fixed right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.12] bg-white text-neutral-950 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition hover:scale-105 active:scale-95 md:hidden"
        aria-label="Add asset record"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>
      {/* Desktop add button in header area */}
      <button
        type="button"
        onClick={openAddForm}
        className="fixed bottom-8 right-8 z-30 hidden h-14 items-center gap-2 rounded-full border border-white/[0.12] bg-white px-5 text-sm font-semibold text-neutral-950 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition hover:scale-105 active:scale-95 md:flex"
      >
        <Plus size={18} strokeWidth={2.5} />
        Add Record
      </button>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showForm && <AssetVaultForm vault={vault} />}

      {viewingAsset && (
        <AssetDetailModal
          asset={viewingAsset}
          tagNames={getTagNames(viewingAsset.locationTagIds)}
          onClose={() => setViewingAsset(null)}
          onEdit={() => openEditForm(viewingAsset)}
          onDelete={() => deleteAsset(viewingAsset.id)}
        />
      )}

      {showTagManager && <TagManagerModal vault={vault} />}
    </section>
  );
}
