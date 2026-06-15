"use client";

import { useState } from "react";
import {
  Coins,
  Gem,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import type { OtherAsset } from "@/lib/types";

type Props = { state: FinanceDashboardState };

const OTHER_ASSET_CATEGORIES = [
  "Vehicle",
  "Electronics",
  "Jewellery",
  "Watch",
  "Furniture",
  "Property",
  "Investment",
  "Other",
];

function fmt(value: number, symbol = "$") {
  return `${symbol}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function fmt4(value: number, symbol = "$") {
  return `${symbol}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
}

export function AssetsView({ state }: Props) {
  const {
    goldGrams,
    silverGrams,
    assetPrices,
    loadingPrices,
    goldValueAud,
    goldValueInr,
    silverValueAud,
    silverValueInr,
    otherAssetsTotal,
    totalAssetsAud,
    otherAssets,
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
    editingGold,
    setEditingGold,
    editingSilver,
    setEditingSilver,
    goldGramsInput,
    setGoldGramsInput,
    silverGramsInput,
    setSilverGramsInput,
    openEditAsset,
    resetAssetForm,
    saveMetalHoldings,
    addOrUpdateOtherAsset,
    deleteOtherAssetWithLog,
    currencySymbol,
    loadAssetPrices,
  } = state;

  const [otherExpanded, setOtherExpanded] = useState(true);

  function startEditGold() {
    setGoldGramsInput(String(goldGrams));
    setEditingGold(true);
  }

  function startEditSilver() {
    setSilverGramsInput(String(silverGrams));
    setEditingSilver(true);
  }

  async function confirmSaveGold() {
    const g = parseFloat(goldGramsInput);
    if (!Number.isFinite(g) || g < 0) { alert("Enter a valid quantity."); return; }
    await saveMetalHoldings(g, silverGrams);
  }

  async function confirmSaveSilver() {
    const g = parseFloat(silverGramsInput);
    if (!Number.isFinite(g) || g < 0) { alert("Enter a valid quantity."); return; }
    await saveMetalHoldings(goldGrams, g);
  }

  const pricesAvailable = assetPrices.goldAud > 0;
  const priceAge = assetPrices.updatedAt
    ? Math.floor((Date.now() - new Date(assetPrices.updatedAt).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Assets" description="Track physical assets and their contribution to net worth." />

      {/* Summary card */}
      <section className="surface-card rounded-3xl border border-white/[0.055] p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/10 text-amber-300">
              <Gem size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Total Assets</p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight">{currencySymbol}{totalAssetsAud.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
          {pricesAvailable && priceAge !== null && (
            <span className="text-xs text-neutral-600">Prices updated {priceAge === 0 ? "today" : `${priceAge}d ago`}</span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <SummaryTile label="Gold" value={goldValueAud} symbol={currencySymbol} tone="amber" />
          <SummaryTile label="Silver" value={silverValueAud} symbol={currencySymbol} tone="slate" />
          <SummaryTile label="Other" value={otherAssetsTotal} symbol={currencySymbol} tone="violet" />
        </div>
      </section>

      {/* Precious metals card */}
      <section className="surface-card rounded-3xl border border-white/[0.055] p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins size={18} className="text-amber-300" />
            <h2 className="font-semibold">Precious Metals</h2>
          </div>
          <button
            type="button"
            onClick={() => loadAssetPrices()}
            disabled={loadingPrices}
            className="flex items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-neutral-400 transition hover:bg-white/[0.07] disabled:opacity-50"
          >
            <RefreshCw size={12} className={loadingPrices ? "animate-spin" : ""} />
            {loadingPrices ? "Fetching…" : "Refresh prices"}
          </button>
        </div>

        {!pricesAvailable && !loadingPrices && (
          <p className="mb-4 rounded-xl bg-amber-500/10 px-4 py-2.5 text-xs text-amber-300">
            Metal prices not yet loaded. Click "Refresh prices" or add your METALS_DEV_API_KEY to .env.local.
          </p>
        )}

        <div className="divide-y divide-white/[0.05]">
          {/* Gold row */}
          <MetalRow
            metal="Gold"
            grams={goldGrams}
            priceAud={assetPrices.goldAud}
            priceInr={assetPrices.goldInr}
            valueAud={goldValueAud}
            valueInr={goldValueInr}
            isEditing={editingGold}
            gramsInput={goldGramsInput}
            onGramsInputChange={setGoldGramsInput}
            onEdit={startEditGold}
            onCancel={() => setEditingGold(false)}
            onSave={confirmSaveGold}
            tone="amber"
          />
          {/* Silver row */}
          <MetalRow
            metal="Silver"
            grams={silverGrams}
            priceAud={assetPrices.silverAud}
            priceInr={assetPrices.silverInr}
            valueAud={silverValueAud}
            valueInr={silverValueInr}
            isEditing={editingSilver}
            gramsInput={silverGramsInput}
            onGramsInputChange={setSilverGramsInput}
            onEdit={startEditSilver}
            onCancel={() => setEditingSilver(false)}
            onSave={confirmSaveSilver}
            tone="slate"
          />
        </div>
      </section>

      {/* Other assets */}
      <section className="surface-card rounded-3xl border border-white/[0.055] p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setOtherExpanded((v) => !v)}
            className="flex items-center gap-2"
          >
            <Package size={18} className="text-violet-300" />
            <h2 className="font-semibold">Other Assets</h2>
            <span className="rounded-full bg-white/[0.07] px-2 py-0.5 text-xs text-neutral-400">{otherAssets.length}</span>
            {otherExpanded ? <ChevronUp size={14} className="text-neutral-500" /> : <ChevronDown size={14} className="text-neutral-500" />}
          </button>
          <button
            type="button"
            onClick={() => { resetAssetForm(); setShowAssetForm(true); }}
            className="flex items-center gap-1.5 rounded-xl bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/25"
          >
            <Plus size={13} /> Add Asset
          </button>
        </div>

        {showAssetForm && (
          <AssetForm
            editingAssetId={editingAssetId}
            assetName={assetName}
            setAssetName={setAssetName}
            assetCategory={assetCategory}
            setAssetCategory={setAssetCategory}
            assetValueAud={assetValueAud}
            setAssetValueAud={setAssetValueAud}
            assetNotes={assetNotes}
            setAssetNotes={setAssetNotes}
            onSave={addOrUpdateOtherAsset}
            onCancel={resetAssetForm}
          />
        )}

        {otherExpanded && (
          <div className="space-y-2 mt-2">
            {otherAssets.length === 0 && !showAssetForm && (
              <p className="py-4 text-center text-sm text-neutral-600">No assets added yet.</p>
            )}
            {otherAssets.map((asset) => (
              <OtherAssetCard
                key={asset.id}
                asset={asset}
                currencySymbol={currencySymbol}
                onEdit={() => openEditAsset(asset)}
                onDelete={() => deleteOtherAssetWithLog(asset.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryTile({ label, value, symbol, tone }: { label: string; value: number; symbol: string; tone: "amber" | "slate" | "violet" }) {
  const tones = {
    amber: "bg-amber-400/10 text-amber-300",
    slate: "bg-slate-400/10 text-slate-300",
    violet: "bg-violet-400/10 text-violet-300",
  };
  return (
    <div className={`rounded-2xl p-3 ${tones[tone]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="mt-1 text-sm font-bold">{symbol}{value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
    </div>
  );
}

function MetalRow({
  metal, grams, priceAud, priceInr, valueAud, valueInr,
  isEditing, gramsInput, onGramsInputChange, onEdit, onCancel, onSave, tone,
}: {
  metal: string;
  grams: number;
  priceAud: number;
  priceInr: number;
  valueAud: number;
  valueInr: number;
  isEditing: boolean;
  gramsInput: string;
  onGramsInputChange: (v: string) => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  tone: "amber" | "slate";
}) {
  const toneClasses = tone === "amber"
    ? "text-amber-300 bg-amber-400/10"
    : "text-slate-300 bg-slate-400/10";

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${toneClasses}`}>{metal}</span>
          </div>
          {isEditing ? (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={gramsInput}
                onChange={(e) => onGramsInputChange(e.target.value)}
                placeholder="Quantity (g)"
                className="w-36 rounded-xl bg-neutral-800 px-3 py-2 text-sm outline-none"
              />
              <span className="text-xs text-neutral-500">grams</span>
              <button type="button" onClick={onSave} className="rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30">Save</button>
              <button type="button" onClick={onCancel} className="rounded-xl bg-white/[0.05] px-3 py-2 text-xs text-neutral-400 hover:bg-white/[0.08]">Cancel</button>
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <span className="text-neutral-500">Quantity</span>
              <span className="font-medium">{grams.toLocaleString()}g</span>
              <span className="text-neutral-500">Price / g (AUD)</span>
              <span className="font-medium">{priceAud > 0 ? fmt4(priceAud) : "—"}</span>
              <span className="text-neutral-500">Price / g (INR)</span>
              <span className="font-medium">{priceInr > 0 ? fmt4(priceInr, "₹") : "—"}</span>
              <span className="text-neutral-500">Value AUD</span>
              <span className="font-semibold text-white">{fmt(valueAud)}</span>
              <span className="text-neutral-500">Value INR</span>
              <span className="font-medium">{fmt(valueInr, "₹")}</span>
            </div>
          )}
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={onEdit}
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-neutral-400 transition hover:bg-white/[0.07]"
          >
            <Pencil size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

function AssetForm({
  editingAssetId,
  assetName, setAssetName,
  assetCategory, setAssetCategory,
  assetValueAud, setAssetValueAud,
  assetNotes, setAssetNotes,
  onSave, onCancel,
}: {
  editingAssetId: string | null;
  assetName: string; setAssetName: (v: string) => void;
  assetCategory: string; setAssetCategory: (v: string) => void;
  assetValueAud: string; setAssetValueAud: (v: string) => void;
  assetNotes: string; setAssetNotes: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mb-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{editingAssetId ? "Edit Asset" : "Add Asset"}</p>
        <button type="button" onClick={onCancel} className="text-neutral-500 hover:text-neutral-300"><X size={16} /></button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs text-neutral-500">Name</label>
          <input
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            placeholder="e.g. Toyota Corolla"
            className="w-full rounded-xl bg-neutral-800 px-3 py-2.5 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-neutral-500">Category</label>
          <select
            value={assetCategory}
            onChange={(e) => setAssetCategory(e.target.value)}
            className="w-full rounded-xl bg-neutral-800 px-3 py-2.5 text-sm outline-none"
          >
            {OTHER_ASSET_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-neutral-500">Value (AUD)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={assetValueAud}
            onChange={(e) => setAssetValueAud(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-xl bg-neutral-800 px-3 py-2.5 text-sm outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-neutral-500">Notes (optional)</label>
          <input
            value={assetNotes}
            onChange={(e) => setAssetNotes(e.target.value)}
            placeholder="e.g. 2019 model"
            className="w-full rounded-xl bg-neutral-800 px-3 py-2.5 text-sm outline-none"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onSave}
          className="rounded-xl bg-violet-500/20 px-4 py-2 text-sm font-semibold text-violet-300 transition hover:bg-violet-500/30"
        >
          {editingAssetId ? "Save changes" : "Add asset"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl bg-white/[0.05] px-4 py-2 text-sm text-neutral-400 transition hover:bg-white/[0.08]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function OtherAssetCard({
  asset, currencySymbol, onEdit, onDelete,
}: {
  asset: OtherAsset;
  currencySymbol: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.025] px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium">{asset.name}</p>
          <span className="shrink-0 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] text-violet-300">{asset.category}</span>
        </div>
        {asset.notes && <p className="mt-0.5 truncate text-xs text-neutral-500">{asset.notes}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-semibold text-sm">{currencySymbol}{asset.valueAud.toLocaleString()}</span>
        <button
          type="button"
          onClick={onEdit}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-neutral-400 hover:bg-white/[0.07]"
        >
          <Pencil size={12} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/15"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
