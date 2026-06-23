"use client";

import { useState } from "react";
import { Archive, Edit2, Plus, Tag } from "lucide-react";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { SharedJarCard } from "@/components/dashboard/SharedJarCard";
import { FlipBucketCard, SavingsBucketCard, TrackerCard } from "@/components/dashboard/BucketCards";
import { BucketHistoryBack } from "@/components/dashboard/DashboardLayout";
import { BucketEditModal } from "./BucketEditModal";
import { TrackerEditModal } from "./TrackerEditModal";
import { CategoryEditModal } from "./CategoryEditModal";
import { getIconComponent } from "./IconPicker";
import { getLinkedCategoryIds, getTrackerForCategory } from "@/lib/definitionSelectors";
import type { BucketDefinition, CategoryDefinition, TrackerDefinition } from "@/lib/types";
import { showConfirm } from "@/lib/confirm";
import { toast } from "@/lib/toast";

type BucketHistory = { type: "savings" | "tracker"; id: string } | null;

function SectionTitle({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h3 className="text-sm font-semibold text-neutral-100">{title}</h3>
        <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-xl border border-dashed border-white/15 px-3 py-1.5 text-xs text-neutral-400 transition hover:border-purple-400/30 hover:text-purple-300"
    >
      <Plus size={13} />
      {label}
    </button>
  );
}

export function BucketsManagementView({ state }: { state: FinanceDashboardState }) {
  const { finDefs } = state;
  const [bucketHistory, setBucketHistory] = useState<BucketHistory>(null);

  const [editingBucket, setEditingBucket] = useState<BucketDefinition | null | "new">(null);
  const [editingTracker, setEditingTracker] = useState<TrackerDefinition | null | "new">(null);
  const [editingCategory, setEditingCategory] = useState<CategoryDefinition | null | "new">(null);

  function toggleSavingsHistory(id: string) {
    setBucketHistory(bucketHistory?.type === "savings" && bucketHistory.id === id ? null : { type: "savings", id });
  }
  function toggleTrackerHistory(id: string) {
    setBucketHistory(bucketHistory?.type === "tracker" && bucketHistory.id === id ? null : { type: "tracker", id });
  }

  async function archiveBucket(bucket: BucketDefinition) {
    const ok = await showConfirm(`Archive "${bucket.name}"? It will be hidden from the view but can be re-enabled later.`);
    if (!ok) return;
    await finDefs.archiveBucketDef(bucket.id);
    toast(`${bucket.name} archived.`);
  }

  async function archiveTracker(tracker: TrackerDefinition) {
    const ok = await showConfirm(`Archive "${tracker.name}"? It will stop tracking expenses.`);
    if (!ok) return;
    await finDefs.archiveTrackerDef(tracker.id);
    toast(`${tracker.name} archived.`);
  }

  async function archiveCategory(cat: CategoryDefinition) {
    const ok = await showConfirm(`Archive "${cat.name}"? It will be hidden from expense forms.`);
    if (!ok) return;
    await finDefs.archiveCategoryDef(cat.id);
    toast(`${cat.name} archived.`);
  }

  const activeBuckets = finDefs.bucketDefs.filter((b) => b.isActive && b.type === "protected");
  const activeTrackers = finDefs.trackerDefs.filter((t) => t.isActive);
  const activeCategories = finDefs.categoryDefs.filter((c) => c.isActive && c.kind === "expense");

  return (
    <div className="space-y-10 pb-10">
      <div className="px-4 sm:px-0">
        <h1 className="text-xl font-bold">Buckets</h1>
        <p className="mt-1 text-sm text-neutral-500">Protected savings hold real money. Lifestyle trackers organize spending through one shared jar.</p>
      </div>

      {/* ── Shared Rollover Jar ── */}
      <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth sm:mx-0 sm:block sm:overflow-visible sm:px-0">
        <SharedJarCard
          state={state}
          onAllocate={() => {
            state.setFromBucket("Bank");
            state.setToBucket("shared_rollover_jar");
            state.setShowTransferForm(true);
          }}
        />
      </div>

      {/* ── Protected Savings ── */}
      <section className="px-4 sm:px-0">
        <SectionTitle
          title="Protected savings"
          subtitle="Real money held away from your usable balance"
          action={<AddButton label="Add bucket" onClick={() => setEditingBucket("new")} />}
        />

        <div className="no-scrollbar mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 scroll-smooth md:mx-0 md:grid md:grid-cols-2 md:overflow-visible xl:grid-cols-3">
          {activeBuckets.map((bucketDef) => {
            const bucketSummary = state.savingsBucketBalances.find((b) => b.id === bucketDef.id);
            if (!bucketSummary) return null;
            return (
              <div key={bucketDef.id} className="min-w-[82vw] shrink-0 snap-start sm:min-w-[360px] md:min-w-0">
                <FlipBucketCard
                  flipped={bucketHistory?.type === "savings" && bucketHistory.id === bucketDef.id}
                  front={
                    <SavingsBucketCard
                      bucket={bucketSummary}
                      currencySymbol={state.currencySymbol}
                      onFund={() => { state.setFromBucket("Bank"); state.setToBucket(bucketDef.id); state.setShowTransferForm(true); }}
                      onWithdraw={() => { state.setFromBucket(bucketDef.id); state.setToBucket("Bank"); state.setShowTransferForm(true); }}
                      onHistory={() => toggleSavingsHistory(bucketDef.id)}
                    />
                  }
                  back={null}
                />
                <div className="mt-2 flex gap-2 px-1">
                  <button onClick={() => setEditingBucket(bucketDef)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] py-1.5 text-xs text-neutral-500 hover:border-white/15 hover:text-neutral-200">
                    <Edit2 size={12} /> Edit
                  </button>
                  <button onClick={() => archiveBucket(bucketDef)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] py-1.5 text-xs text-neutral-500 hover:border-rose-400/20 hover:text-rose-400">
                    <Archive size={12} /> Archive
                  </button>
                </div>
              </div>
            );
          })}
          {activeBuckets.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-neutral-500">No buckets yet. Add one to start saving.</p>
          )}
        </div>
      </section>

      {/* ── Lifestyle Trackers ── */}
      <section className="px-4 sm:px-0">
        <SectionTitle
          title="Lifestyle trackers"
          subtitle="Virtual monthly plans powered by the shared jar"
          action={<AddButton label="Add tracker" onClick={() => setEditingTracker("new")} />}
        />

        <div className="no-scrollbar mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 scroll-smooth md:mx-0 md:grid md:grid-cols-2 md:overflow-visible xl:grid-cols-3">
          {state.trackerSummaries.map((tracker) => (
            <div key={tracker.id} className="min-w-[82vw] shrink-0 snap-start sm:min-w-[360px] md:min-w-0">
              <FlipBucketCard
                flipped={bucketHistory?.type === "tracker" && bucketHistory.id === tracker.id}
                front={
                  <TrackerCard
                    tracker={tracker}
                    currencySymbol={state.currencySymbol}
                    onHistory={() => toggleTrackerHistory(tracker.id)}
                  />
                }
                back={
                  <BucketHistoryBack
                    state={state}
                    tracker={tracker}
                    onClose={() => setBucketHistory(null)}
                  />
                }
              />
              <div className="mt-2 flex gap-2 px-1">
                <button
                  onClick={() => { const def = finDefs.trackerDefs.find((t) => t.id === tracker.id); if (def) setEditingTracker(def); }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] py-1.5 text-xs text-neutral-500 hover:border-white/15 hover:text-neutral-200"
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={() => { const def = finDefs.trackerDefs.find((t) => t.id === tracker.id); if (def) archiveTracker(def); }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] py-1.5 text-xs text-neutral-500 hover:border-rose-400/20 hover:text-rose-400"
                >
                  <Archive size={12} /> Archive
                </button>
              </div>
            </div>
          ))}
          {activeTrackers.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-neutral-500">No trackers yet.</p>
          )}
        </div>
      </section>

      {/* ── Category Manager ── */}
      <section className="px-4 sm:px-0">
        <SectionTitle
          title="Category manager"
          subtitle="Expense categories used across forms and trackers"
          action={<AddButton label="Add category" onClick={() => setEditingCategory("new")} />}
        />

        <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.06]">
          {activeCategories.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-neutral-500">No categories yet.</p>
          )}
          {activeCategories.map((cat, i) => {
            const linkedTracker = getTrackerForCategory(cat.id, finDefs.ctLinks, finDefs.trackerDefs);
            const Icon = getIconComponent(cat.icon);
            return (
              <div
                key={cat.id}
                className={`flex items-center gap-3 px-4 py-3 ${i !== activeCategories.length - 1 ? "border-b border-white/[0.04]" : ""}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-neutral-300">
                  <Icon size={15} />
                </span>
                <span className="flex-1 text-sm">{cat.name}</span>
                {linkedTracker && (
                  <span className="flex items-center gap-1 rounded-full border border-purple-400/20 bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300">
                    <Tag size={9} />
                    {linkedTracker.name}
                  </span>
                )}
                <div className="flex gap-1.5">
                  <button onClick={() => setEditingCategory(cat)} className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 hover:text-white">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => archiveCategory(cat)} className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 hover:text-rose-400">
                    <Archive size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Modals ── */}
      {editingBucket !== null && (
        <BucketEditModal
          bucket={editingBucket === "new" ? undefined : editingBucket}
          nextSortOrder={finDefs.bucketDefs.length}
          finDefs={finDefs}
          onClose={() => setEditingBucket(null)}
        />
      )}
      {editingTracker !== null && (
        <TrackerEditModal
          tracker={editingTracker === "new" ? undefined : editingTracker}
          nextSortOrder={finDefs.trackerDefs.length}
          finDefs={finDefs}
          categoryDefs={finDefs.categoryDefs}
          ctLinks={finDefs.ctLinks}
          onClose={() => setEditingTracker(null)}
        />
      )}
      {editingCategory !== null && (
        <CategoryEditModal
          category={editingCategory === "new" ? undefined : editingCategory}
          nextSortOrder={finDefs.categoryDefs.length}
          finDefs={finDefs}
          trackerDefs={finDefs.trackerDefs}
          ctLinks={finDefs.ctLinks}
          onClose={() => setEditingCategory(null)}
        />
      )}
    </div>
  );
}
