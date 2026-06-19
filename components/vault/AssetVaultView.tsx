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
  ArrowLeft,
  Calendar,
  MapPin,
  Pencil,
  Plus,
  Search,
  Settings2,
  Tag,
  Trash2,
  X,
} from "lucide-react";

// ── Category illustrations (inline SVG per asset type) ────────────────────────

function GoldIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <ellipse cx="60" cy="68" rx="38" ry="10" fill="rgba(251,191,36,0.18)" />
      <rect x="26" y="32" width="68" height="38" rx="6" fill="url(#gb)" />
      <rect x="30" y="36" width="60" height="30" rx="4" fill="url(#gs)" opacity="0.6" />
      <text x="60" y="56" textAnchor="middle" fontSize="11" fontWeight="700" fill="rgba(251,191,36,0.9)" fontFamily="sans-serif">AU GOLD</text>
      <rect x="34" y="42" width="8" height="14" rx="1" fill="rgba(251,191,36,0.3)" />
      <rect x="78" y="42" width="8" height="14" rx="1" fill="rgba(251,191,36,0.3)" />
      <ellipse cx="60" cy="30" rx="18" ry="7" fill="url(#gc)" />
      <defs>
        <linearGradient id="gb" x1="26" y1="32" x2="94" y2="70" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fbbf24" /><stop offset="1" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id="gs" x1="30" y1="36" x2="90" y2="66" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef08a" stopOpacity="0.4" /><stop offset="1" stopColor="#92400e" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="gc" x1="42" y1="30" x2="78" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fef08a" /><stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function LandIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <rect x="10" y="58" width="100" height="32" rx="4" fill="url(#ld)" />
      <path d="M10 58 Q30 44 50 50 Q65 38 85 46 Q100 38 110 46 L110 58 Z" fill="url(#lg)" />
      <path d="M55 50 L55 34 L63 42 Z" fill="rgba(134,239,172,0.6)" />
      <path d="M55 34 Q57 22 62 28 Q59 30 55 34Z" fill="rgba(134,239,172,0.8)" />
      <rect x="30" y="44" width="16" height="14" rx="2" fill="rgba(34,197,94,0.3)" />
      <rect x="34" y="48" width="4" height="4" rx="1" fill="rgba(134,239,172,0.5)" />
      <path d="M14 72 L20 62 L26 72Z" fill="rgba(134,239,172,0.15)" />
      <path d="M88 66 L96 56 L104 66Z" fill="rgba(134,239,172,0.15)" />
      <defs>
        <linearGradient id="lg" x1="10" y1="38" x2="110" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#166534" /><stop offset="1" stopColor="#14532d" />
        </linearGradient>
        <linearGradient id="ld" x1="10" y1="58" x2="110" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#854d0e" /><stop offset="1" stopColor="#713f12" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function PropertyIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <rect x="22" y="42" width="76" height="48" rx="3" fill="url(#pb)" />
      <path d="M18 44 L60 16 L102 44Z" fill="url(#pr)" />
      <rect x="30" y="52" width="12" height="12" rx="1" fill="rgba(216,180,254,0.35)" />
      <rect x="54" y="52" width="12" height="12" rx="1" fill="rgba(216,180,254,0.35)" />
      <rect x="78" y="52" width="12" height="12" rx="1" fill="rgba(216,180,254,0.35)" />
      <rect x="30" y="70" width="12" height="12" rx="1" fill="rgba(216,180,254,0.35)" />
      <rect x="78" y="70" width="12" height="12" rx="1" fill="rgba(216,180,254,0.35)" />
      <rect x="50" y="68" width="20" height="22" rx="2" fill="rgba(139,92,246,0.35)" />
      <rect x="56" y="72" width="4" height="4" rx="0.5" fill="rgba(216,180,254,0.4)" />
      <ellipse cx="60" cy="85" rx="30" ry="6" fill="rgba(139,92,246,0.12)" />
      <defs>
        <linearGradient id="pr" x1="18" y1="44" x2="102" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7c3aed" /><stop offset="1" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id="pb" x1="22" y1="42" x2="98" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b0764" /><stop offset="1" stopColor="#1e1b4b" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function VehicleIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <ellipse cx="60" cy="75" rx="50" ry="8" fill="rgba(59,130,246,0.12)" />
      <rect x="14" y="56" width="92" height="18" rx="6" fill="url(#vb)" />
      <path d="M28 56 L40 36 L80 36 L92 56Z" fill="url(#vt)" />
      <rect x="38" y="38" width="18" height="14" rx="2" fill="rgba(147,210,255,0.3)" />
      <rect x="64" y="38" width="18" height="14" rx="2" fill="rgba(147,210,255,0.3)" />
      <circle cx="35" cy="72" r="9" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="2" />
      <circle cx="35" cy="72" r="4" fill="#1d4ed8" />
      <circle cx="85" cy="72" r="9" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="2" />
      <circle cx="85" cy="72" r="4" fill="#1d4ed8" />
      <rect x="14" y="60" width="8" height="4" rx="1" fill="rgba(253,224,71,0.6)" />
      <rect x="98" y="60" width="8" height="4" rx="1" fill="rgba(252,165,165,0.5)" />
      <defs>
        <linearGradient id="vt" x1="28" y1="36" x2="92" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1e40af" /><stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="vb" x1="14" y1="56" x2="106" y2="74" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1d4ed8" /><stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function InvestmentIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <rect x="14" y="72" width="12" height="18" rx="2" fill="url(#ib1)" />
      <rect x="32" y="60" width="12" height="30" rx="2" fill="url(#ib2)" />
      <rect x="50" y="48" width="12" height="42" rx="2" fill="url(#ib3)" />
      <rect x="68" y="36" width="12" height="54" rx="2" fill="url(#ib4)" />
      <rect x="86" y="22" width="12" height="68" rx="2" fill="url(#ib5)" />
      <path d="M20 68 L38 56 L56 44 L74 32 L92 18" stroke="rgba(94,234,212,0.7)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="92" cy="18" r="3.5" fill="#2dd4bf" />
      <path d="M88 14 L96 14 L92 20Z" fill="#2dd4bf" />
      <defs>
        <linearGradient id="ib1" x1="14" y1="72" x2="26" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0d9488" stopOpacity="0.4" /><stop offset="1" stopColor="#134e4a" />
        </linearGradient>
        <linearGradient id="ib2" x1="32" y1="60" x2="44" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0d9488" stopOpacity="0.5" /><stop offset="1" stopColor="#134e4a" />
        </linearGradient>
        <linearGradient id="ib3" x1="50" y1="48" x2="62" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0d9488" stopOpacity="0.6" /><stop offset="1" stopColor="#134e4a" />
        </linearGradient>
        <linearGradient id="ib4" x1="68" y1="36" x2="80" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14b8a6" stopOpacity="0.7" /><stop offset="1" stopColor="#134e4a" />
        </linearGradient>
        <linearGradient id="ib5" x1="86" y1="22" x2="98" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2dd4bf" /><stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function DocumentIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <rect x="30" y="14" width="60" height="76" rx="5" fill="url(#db)" />
      <rect x="34" y="18" width="52" height="68" rx="3" fill="rgba(148,163,184,0.08)" />
      <rect x="40" y="30" width="40" height="3" rx="1.5" fill="rgba(203,213,225,0.5)" />
      <rect x="40" y="38" width="35" height="2" rx="1" fill="rgba(148,163,184,0.35)" />
      <rect x="40" y="44" width="38" height="2" rx="1" fill="rgba(148,163,184,0.35)" />
      <rect x="40" y="50" width="30" height="2" rx="1" fill="rgba(148,163,184,0.35)" />
      <rect x="40" y="58" width="40" height="2" rx="1" fill="rgba(148,163,184,0.35)" />
      <rect x="40" y="64" width="28" height="2" rx="1" fill="rgba(148,163,184,0.35)" />
      <rect x="40" y="72" width="36" height="2" rx="1" fill="rgba(148,163,184,0.35)" />
      <path d="M72 14 L90 14 L90 28 Z" fill="rgba(100,116,139,0.4)" />
      <path d="M72 14 L72 28 L90 28" stroke="rgba(148,163,184,0.2)" strokeWidth="1" fill="none" />
      <defs>
        <linearGradient id="db" x1="30" y1="14" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#334155" /><stop offset="1" stopColor="#1e293b" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function OtherIllustration() {
  return (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
      <rect x="24" y="52" width="72" height="38" rx="5" fill="url(#ob)" />
      <rect x="28" y="56" width="64" height="30" rx="3" fill="rgba(251,113,133,0.06)" />
      <path d="M20 52 L44 30 L76 30 L100 52Z" fill="url(#ol)" />
      <rect x="44" y="30" width="32" height="6" rx="2" fill="url(#oh)" />
      <rect x="50" y="58" width="20" height="20" rx="2" fill="rgba(251,113,133,0.2)" />
      <rect x="32" y="60" width="12" height="10" rx="1" fill="rgba(251,113,133,0.15)" />
      <rect x="76" y="60" width="12" height="10" rx="1" fill="rgba(251,113,133,0.15)" />
      <defs>
        <linearGradient id="ob" x1="24" y1="52" x2="96" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9f1239" /><stop offset="1" stopColor="#7f1d1d" />
        </linearGradient>
        <linearGradient id="ol" x1="20" y1="30" x2="100" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#be123c" /><stop offset="1" stopColor="#9f1239" />
        </linearGradient>
        <linearGradient id="oh" x1="44" y1="30" x2="76" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fb7185" /><stop offset="1" stopColor="#e11d48" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const CATEGORY_ILLUSTRATIONS: Record<AssetType, React.FC> = {
  gold: GoldIllustration,
  land: LandIllustration,
  property: PropertyIllustration,
  vehicle: VehicleIllustration,
  investment: InvestmentIllustration,
  document: DocumentIllustration,
  other: OtherIllustration,
};

// ── Category Home Grid ────────────────────────────────────────────────────────

function CategoryGrid({
  assetCounts,
  onSelect,
  onOpenTagManager,
  totalCount,
}: {
  assetCounts: Record<AssetType, number>;
  onSelect: (type: AssetType) => void;
  onOpenTagManager: () => void;
  totalCount: number;
}) {
  return (
    <section>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker text-neutral-500">INFORMATION VAULT</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Asset Vault</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {totalCount === 0
              ? "Tap a category to get started."
              : `${totalCount} record${totalCount !== 1 ? "s" : ""} stored across ${ASSET_TYPES.filter((t) => assetCounts[t.id] > 0).length} categories`}
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenTagManager}
          className="mt-1 flex h-10 items-center gap-1.5 rounded-xl border border-black/[0.09] bg-black/[0.04] px-3 text-xs font-semibold text-neutral-600 transition hover:bg-black/[0.08] hover:text-neutral-900 dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-neutral-400 dark:hover:bg-white/[0.07] dark:hover:text-neutral-200"
        >
          <Settings2 size={13} />
          Tags
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ASSET_TYPES.map((type) => {
          const styles = ASSET_TYPE_STYLES[type.id];
          const count = assetCounts[type.id] ?? 0;
          const Illustration = CATEGORY_ILLUSTRATIONS[type.id];

          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              className={`group relative overflow-hidden rounded-3xl border bg-white text-left transition-all duration-200 hover:scale-[1.02] hover:brightness-110 active:scale-[0.98] dark:bg-[#0d1013] ${styles.border} ${styles.glow}`}
            >
              {/* Type gradient */}
              <div className={`pointer-events-none absolute inset-0 rounded-3xl ${styles.gradient}`} />

              <div className="relative flex h-[130px] items-stretch overflow-hidden sm:h-[150px]">
                {/* Left: text */}
                <div className="flex flex-1 flex-col justify-between p-4">
                  <span className={`text-base font-bold leading-tight ${styles.textAccent}`}>
                    {type.label}
                  </span>
                  <span className="text-[11px] font-medium text-neutral-600">
                    {count === 0 ? "No records" : `${count} record${count !== 1 ? "s" : ""}`}
                  </span>
                </div>
                {/* Right: illustration */}
                <div className="relative flex w-[90px] shrink-0 items-center justify-center overflow-hidden opacity-80 group-hover:opacity-100 sm:w-[100px]">
                  <Illustration />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ── Record Card (compact) ──────────────────────────────────────────────────────

function RecordCard({
  asset,
  locationTagNames,
  onClick,
}: {
  asset: AssetRecord;
  locationTagNames: string[];
  onClick: () => void;
}) {
  const styles = ASSET_TYPE_STYLES[asset.assetType];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full overflow-hidden rounded-2xl border bg-white p-4 text-left transition-all duration-150 hover:brightness-110 active:scale-[0.99] dark:bg-[#0e1115] ${styles.border}`}
    >
      <div className={`pointer-events-none absolute inset-0 rounded-2xl ${styles.gradient} opacity-60`} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <h3 className={`flex-1 truncate text-sm font-bold ${styles.textAccent}`}>
            {asset.title}
          </h3>
          <span className="flex shrink-0 items-center gap-1 text-[10px] text-neutral-600">
            <Calendar size={9} />
            {asset.date
              ? new Date(asset.date + "T00:00:00").toLocaleDateString("en-AU", {
                  day: "numeric",
                  month: "short",
                  year: "2-digit",
                })
              : ""}
          </span>
        </div>
        {asset.details && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-neutral-500">
            {asset.details}
          </p>
        )}
        {locationTagNames.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {locationTagNames.map((name) => (
              <span
                key={name}
                className="flex items-center gap-0.5 rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-neutral-500"
              >
                <MapPin size={8} />
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

// ── Category Detail View ───────────────────────────────────────────────────────

type SortMode = "date" | "title" | "location";

function CategoryDetailView({
  categoryType,
  vault,
  onBack,
}: {
  categoryType: AssetType;
  vault: ReturnType<typeof useAssetVault>;
  onBack: () => void;
}) {
  const {
    assets,
    locationTags,
    activeTagIds,
    toggleTagFilter,
    setActiveTagIds,
    viewingAsset,
    setViewingAsset,
    openAddForm,
    openEditForm,
    deleteAsset,
    showForm,
  } = vault;

  const [localSearch, setLocalSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("date");

  const styles = ASSET_TYPE_STYLES[categoryType];
  const typeInfo = getAssetTypeInfo(categoryType);

  function getTagNames(tagIds: string[]) {
    return tagIds
      .map((id) => locationTags.find((t) => t.id === id)?.name ?? "")
      .filter(Boolean);
  }

  // Filter: this category + active location tags + local search
  const filtered = assets
    .filter((a) => a.assetType === categoryType)
    .filter((a) => {
      if (activeTagIds.length > 0 && !activeTagIds.every((tid) => a.locationTagIds.includes(tid)))
        return false;
      if (localSearch.trim()) {
        const q = localSearch.toLowerCase();
        const tagNames = getTagNames(a.locationTagIds).join(" ");
        if (
          !a.title.toLowerCase().includes(q) &&
          !a.details.toLowerCase().includes(q) &&
          !tagNames.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });

  // Sort
  const categoryAssets = [...filtered].sort((a, b) => {
    if (sortMode === "title") return a.title.localeCompare(b.title);
    if (sortMode === "location") {
      const tagA = getTagNames(a.locationTagIds)[0] ?? "￿";
      const tagB = getTagNames(b.locationTagIds)[0] ?? "￿";
      return tagA.localeCompare(tagB);
    }
    // date: newest first
    return (b.date ?? "").localeCompare(a.date ?? "");
  });

  // Group by location when sorted by location
  const locationGroups: { label: string; items: typeof categoryAssets }[] = [];
  if (sortMode === "location") {
    for (const asset of categoryAssets) {
      const label = getTagNames(asset.locationTagIds)[0] ?? "No location";
      const existing = locationGroups.find((g) => g.label === label);
      if (existing) existing.items.push(asset);
      else locationGroups.push({ label, items: [asset] });
    }
  }

  // Tags that actually appear in this category
  const usedTagIds = [...new Set(assets.filter((a) => a.assetType === categoryType).flatMap((a) => a.locationTagIds))];
  const relevantTags = locationTags.filter((t) => usedTagIds.includes(t.id));

  return (
    <section>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            onBack();
            setActiveTagIds([]);
            setLocalSearch("");
          }}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-black/[0.08] bg-black/[0.04] text-neutral-600 transition hover:bg-black/[0.08] hover:text-neutral-900 dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-neutral-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${styles.textAccent}`}>{typeInfo.label}</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles.badge}`}>
              {assets.filter((a) => a.assetType === categoryType).length}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openAddForm()}
          className={`flex h-10 items-center gap-1.5 rounded-xl border px-4 text-sm font-semibold transition ${styles.badge} ${styles.border}`}
        >
          <Plus size={15} />
          Add
        </button>
      </div>

      {/* Search */}
      <div className="relative mt-4">
        <Search
          size={15}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
        />
        <input
          type="text"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={`Search ${typeInfo.label} records…`}
          className="min-h-11 w-full rounded-xl border border-black/[0.09] bg-black/[0.04] pl-9 pr-4 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black/[0.15] focus:bg-black/[0.06] dark:border-white/[0.07] dark:bg-white/[0.035] dark:text-white dark:placeholder:text-neutral-600 dark:focus:border-white/[0.15] dark:focus:bg-white/[0.05]"
        />
        {localSearch && (
          <button
            type="button"
            onClick={() => setLocalSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-300"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Sort controls */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">Sort</span>
        {(["date", "title", "location"] as SortMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setSortMode(mode)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
              sortMode === mode
                ? "bg-white/[0.1] text-white"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {mode === "date" ? "Date" : mode === "title" ? "A–Z" : "Location"}
          </button>
        ))}
      </div>

      {/* Location tag chips (only tags used in this category) */}
      {relevantTags.length > 0 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-0.5">
          {relevantTags.map((tag) => {
            const selected = activeTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTagFilter(tag.id)}
                className={`shrink-0 flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                  selected
                    ? "border-black/20 bg-black/[0.09] text-neutral-900 dark:border-white/20 dark:bg-white/[0.1] dark:text-white"
                    : "border-black/[0.08] bg-black/[0.03] text-neutral-500 hover:bg-black/[0.06] hover:text-neutral-700 dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-neutral-600 dark:hover:bg-white/[0.06] dark:hover:text-neutral-400"
                }`}
              >
                <MapPin size={9} />
                {tag.name}
                {selected && <X size={9} className="ml-0.5" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Active tag chips */}
      {activeTagIds.length > 0 && (
        <button
          type="button"
          onClick={() => setActiveTagIds([])}
          className="mt-2 text-[11px] text-neutral-600 underline hover:text-neutral-400"
        >
          Clear location filters
        </button>
      )}

      {/* Records */}
      {categoryAssets.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-black/[0.09] px-6 py-14 text-center dark:border-white/[0.07]">
          <p className={`font-semibold ${styles.textAccent}`}>
            {assets.filter((a) => a.assetType === categoryType).length === 0
              ? `No ${typeInfo.label} records yet`
              : "No records match your filters"}
          </p>
          <p className="mt-2 text-sm text-neutral-600">
            {assets.filter((a) => a.assetType === categoryType).length === 0
              ? "Tap Add to create the first one."
              : "Try clearing the search or location filters."}
          </p>
        </div>
      ) : sortMode === "location" ? (
        <div className="mt-4 space-y-6">
          {locationGroups.map((group) => (
            <div key={group.label}>
              <div className="mb-2.5 flex items-center gap-2">
                <MapPin size={11} className="text-neutral-600" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  {group.label}
                </span>
                <span className="text-[10px] text-neutral-700">{group.items.length}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {group.items.map((asset) => (
                  <RecordCard
                    key={asset.id}
                    asset={asset}
                    locationTagNames={getTagNames(asset.locationTagIds)}
                    onClick={() => setViewingAsset(asset)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {categoryAssets.map((asset) => (
            <RecordCard
              key={asset.id}
              asset={asset}
              locationTagNames={getTagNames(asset.locationTagIds)}
              onClick={() => setViewingAsset(asset)}
            />
          ))}
        </div>
      )}

      {/* Detail modal */}
      {viewingAsset && viewingAsset.assetType === categoryType && (
        <AssetDetailModal
          asset={viewingAsset}
          tagNames={getTagNames(viewingAsset.locationTagIds)}
          onClose={() => setViewingAsset(null)}
          onEdit={() => openEditForm(viewingAsset)}
          onDelete={() => deleteAsset(viewingAsset.id)}
        />
      )}

      {/* Floating + (mobile) */}
      <button
        type="button"
        onClick={() => openAddForm()}
        className={`safe-bottom-fab fixed right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full border shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition hover:scale-105 active:scale-95 md:hidden ${styles.badge} ${styles.border}`}
        aria-label="Add record"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>
    </section>
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
        className={`no-scrollbar relative mt-auto w-full overflow-y-auto rounded-t-[28px] border bg-white dark:bg-[#0d1014] sm:mx-auto sm:mt-0 sm:max-w-lg sm:rounded-[28px] ${styles.border}`}
        style={{ maxHeight: "92dvh" }}
      >
        <div className={`pointer-events-none absolute inset-0 rounded-[28px] ${styles.gradient}`} />
        <div className="relative p-6">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
          <div className="flex items-start justify-between gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${styles.badge}`}>
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
          {tagNames.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neutral-600">
                <MapPin size={11} />
                Location
              </p>
              <div className="flex flex-wrap gap-2">
                {tagNames.map((name) => (
                  <span key={name} className="flex items-center gap-1.5 rounded-full bg-white/[0.07] px-3 py-1.5 text-sm font-medium text-neutral-300">
                    <MapPin size={11} className="text-neutral-500" />
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {asset.details && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-600">Details</p>
              <div className="rounded-2xl border border-black/[0.07] bg-black/[0.03] p-4 text-sm leading-relaxed text-neutral-700 whitespace-pre-wrap dark:border-white/[0.05] dark:bg-white/[0.03] dark:text-neutral-300">
                {asset.details}
              </div>
            </div>
          )}
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

// ── Tag Manager Modal ─────────────────────────────────────────────────────────

function TagManagerModal({ vault }: { vault: ReturnType<typeof useAssetVault> }) {
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
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/75 backdrop-blur-sm sm:items-center sm:justify-center sm:px-4"
      onClick={(e) => e.target === e.currentTarget && vault.setShowTagManager(false)}
    >
      <div
        className="no-scrollbar mt-auto w-full overflow-y-auto rounded-t-[28px] border border-black/[0.10] bg-white dark:border-white/[0.08] dark:bg-[#111419] sm:mx-auto sm:mt-0 sm:max-w-md sm:rounded-[28px]"
        style={{ maxHeight: "85dvh" }}
      >
        <div className="p-5">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20 sm:hidden" />
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Location Tags</h3>
              <p className="text-sm text-neutral-500">Create and manage location tags</p>
            </div>
            <button
              type="button"
              onClick={() => vault.setShowTagManager(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-neutral-500 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <div className="mb-4 flex gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="New location tag…"
              className="min-h-11 flex-1 rounded-xl border border-black/[0.09] bg-black/[0.04] px-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-black/20 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-neutral-600 dark:focus:border-white/20"
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
          <div className="space-y-1.5">
            {vault.locationTags.length === 0 && (
              <p className="py-6 text-center text-sm text-neutral-600">No tags yet.</p>
            )}
            {vault.locationTags.map((tag) => (
              <div key={tag.id} className="flex items-center gap-2 rounded-2xl border border-black/[0.07] bg-black/[0.03] px-4 py-3 dark:border-white/[0.05] dark:bg-white/[0.025]">
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
                    <button type="button" onClick={() => handleRename(tag.id)} className="shrink-0 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300">Save</button>
                    <button type="button" onClick={() => setRenamingId(null)} className="shrink-0 text-neutral-600 hover:text-neutral-300"><X size={14} /></button>
                  </>
                ) : (
                  <>
                    <Tag size={13} className="shrink-0 text-neutral-600" />
                    <span className="min-w-0 flex-1 truncate text-sm text-neutral-200">{tag.name}</span>
                    <button type="button" onClick={() => { setRenamingId(tag.id); setRenameValue(tag.name); }} className="shrink-0 text-neutral-600 hover:text-neutral-300"><Pencil size={13} /></button>
                    {confirmDeleteId === tag.id ? (
                      <button type="button" onClick={async () => { await vault.deleteTag(tag.id); setConfirmDeleteId(null); }} className="shrink-0 rounded-lg bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-300">Confirm</button>
                    ) : (
                      <button type="button" onClick={() => setConfirmDeleteId(tag.id)} className="shrink-0 text-neutral-700 hover:text-red-400"><Trash2 size={13} /></button>
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

// ── Root View ─────────────────────────────────────────────────────────────────

export function AssetVaultView() {
  const vault = useAssetVault();
  const [selectedCategory, setSelectedCategory] = useState<AssetType | null>(null);

  const { assets, showForm, showTagManager, setShowTagManager, openAddForm } = vault;

  // Count per category
  const assetCounts = ASSET_TYPES.reduce(
    (acc, t) => {
      acc[t.id] = assets.filter((a) => a.assetType === t.id).length;
      return acc;
    },
    {} as Record<AssetType, number>
  );

  // When vault form opens from category view, preselect the category type
  function openAddForCategory(type: AssetType) {
    vault.setFormAssetType(type);
    openAddForm();
  }

  return (
    <div>
      {selectedCategory === null ? (
        <CategoryGrid
          assetCounts={assetCounts}
          onSelect={(type) => setSelectedCategory(type)}
          onOpenTagManager={() => setShowTagManager(true)}
          totalCount={assets.length}
        />
      ) : (
        <CategoryDetailView
          key={selectedCategory}
          categoryType={selectedCategory}
          vault={{ ...vault, openAddForm: () => openAddForCategory(selectedCategory) }}
          onBack={() => setSelectedCategory(null)}
        />
      )}

      {showForm && <AssetVaultForm vault={vault} />}
      {showTagManager && <TagManagerModal vault={vault} />}

      {/* Floating + on home grid (mobile) */}
      {selectedCategory === null && (
        <button
          type="button"
          onClick={() => openAddForm()}
          className="safe-bottom-fab fixed right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-black/[0.14] bg-neutral-900 text-white shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition hover:scale-105 active:scale-95 dark:border-white/[0.12] dark:bg-white dark:text-neutral-950 dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] md:hidden"
          aria-label="Add asset record"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}
      {/* Desktop floating add on home grid */}
      {selectedCategory === null && (
        <button
          type="button"
          onClick={() => openAddForm()}
          className="fixed bottom-8 right-8 z-30 hidden h-14 items-center gap-2 rounded-full border border-black/[0.14] bg-neutral-900 px-5 text-sm font-semibold text-white shadow-[0_8px_32px_rgba(0,0,0,0.18)] transition hover:scale-105 active:scale-95 dark:border-white/[0.12] dark:bg-white dark:text-neutral-950 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] md:flex"
        >
          <Plus size={18} strokeWidth={2.5} />
          Add Record
        </button>
      )}
    </div>
  );
}
