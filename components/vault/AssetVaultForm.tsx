"use client";

import { ASSET_TYPE_STYLES, ASSET_TYPES, getAssetTypeInfo } from "@/lib/assetVault";
import { ModalContent } from "@/components/forms/ModalContent";
import { ModalFooter } from "@/components/forms/ModalFooter";
import { ModalHeader } from "@/components/forms/ModalHeader";
import { ModalWrapper } from "@/components/forms/ModalWrapper";
import { FormField } from "@/components/forms/FormField";
import { DateField } from "@/components/forms/DateField";
import { formTokens } from "@/lib/designTokens";
import type { AssetVaultState } from "@/hooks/useAssetVault";
import { Check, Tag } from "lucide-react";

type Props = { vault: AssetVaultState };

export function AssetVaultForm({ vault }: Props) {
  const {
    editingAsset,
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
    locationTags,
    closeForm,
    saveAsset,
  } = vault;

  const isEditing = Boolean(editingAsset);
  const styles = ASSET_TYPE_STYLES[formAssetType];
  const typeInfo = getAssetTypeInfo(formAssetType);

  return (
    <ModalWrapper onClose={closeForm}>
      <ModalHeader
        title={isEditing ? "Edit Record" : "New Asset Record"}
        subtitle="Store important asset information for future reference."
      />
      <ModalContent>
        {/* Asset Type selector */}
        <div>
          <p className="mb-2 text-sm font-medium text-neutral-600 dark:text-neutral-400">Asset Type</p>
          <div className="grid grid-cols-4 gap-1.5">
            {ASSET_TYPES.map((type) => {
              const s = ASSET_TYPE_STYLES[type.id];
              const selected = formAssetType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormAssetType(type.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 transition ${
                    selected
                      ? `${s.badge} ${s.border} ring-1 ring-inset ring-white/10`
                      : "border-black/[0.08] bg-black/[0.03] text-neutral-500 hover:bg-black/[0.06] dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                  }`}
                >
                  <span className="text-xl leading-none">{type.emoji}</span>
                  <span className="text-[11px] font-semibold leading-tight">{type.label}</span>
                </button>
              );
            })}
          </div>
          {/* Selected type preview */}
          <div className={`mt-2 flex items-center gap-2 rounded-xl border px-3 py-2 ${styles.badge} ${styles.border}`}>
            <span className="text-base">{typeInfo.emoji}</span>
            <span className="text-sm font-semibold">{typeInfo.label}</span>
          </div>
        </div>

        <FormField label="Title *">
          <input
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="e.g. 50g Gold Purchase, Plot No.123"
            className={formTokens.input}
            autoFocus
          />
        </FormField>

        <DateField
          label="Date *"
          value={formDate}
          onChange={(e) => setFormDate(e.target.value)}
        />

        {/* Location Tags multi-select */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Tag size={13} className="text-neutral-500" />
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">Location Tags</p>
            <span className="text-xs text-neutral-500 dark:text-neutral-600">(optional, multi-select)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {locationTags.map((tag) => {
              const selected = formTagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleFormTag(tag.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    selected
                      ? "border-black/20 bg-black/[0.12] text-neutral-900 dark:border-white/20 dark:bg-white/[0.12] dark:text-white"
                      : "border-black/[0.08] bg-black/[0.03] text-neutral-500 hover:bg-black/[0.07] hover:text-neutral-700 dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:bg-white/[0.07] dark:hover:text-neutral-300"
                  }`}
                >
                  {selected && <Check size={10} strokeWidth={3} />}
                  {tag.name}
                </button>
              );
            })}
            {locationTags.length === 0 && (
              <p className="text-xs text-neutral-500 dark:text-neutral-600">
                No location tags yet. Add them via Manage Tags.
              </p>
            )}
          </div>
        </div>

        <FormField label="Details *">
          <textarea
            value={formDetails}
            onChange={(e) => setFormDetails(e.target.value)}
            placeholder="Description, reference numbers, notes, important details…"
            rows={4}
            className={`${formTokens.input} resize-none`}
          />
        </FormField>
      </ModalContent>

      <ModalFooter
        onCancel={closeForm}
        onSave={saveAsset}
        saveLabel={isEditing ? "Save Changes" : "Add Record"}
        tone="emerald"
      />
    </ModalWrapper>
  );
}
