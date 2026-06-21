"use client";

import { useState, useEffect, useCallback } from "react";
import type { GoalRecord, GoalCategory, GoalStatus } from "@/lib/dreamsGoals";
import {
  createSheetRecord,
  deleteFromSheet,
  getAllData,
  updateSheetRecord,
} from "@/lib/sheetsApi";

const GOALS_SHEET = "dreams_goals";

function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function useDreamsGoals() {
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<GoalCategory | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "completed" | "archived" | "cancelled"
  >("all");

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalRecord | null>(null);
  const [viewingGoal, setViewingGoal] = useState<GoalRecord | null>(null);

  // Form fields
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState<GoalCategory>("wishlist");
  const [formDetails, setFormDetails] = useState("");
  const [formOccasion, setFormOccasion] = useState("");
  const [formTargetDate, setFormTargetDate] = useState("");
  const [formStatus, setFormStatus] = useState<GoalStatus>("planned");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllData();

      const raw = (data[GOALS_SHEET] || data["goals"] || []) as Record<string, unknown>[];
      const parsed: GoalRecord[] = raw
        .filter((item) => item && item.id)
        .map((item) => ({
          id: String(item.id),
          title: String(item.title || item.name || ""),
          category: (item.category as GoalCategory) || "other",
          details: String(item.details || ""),
          occasion: String(item.occasion || ""),
          targetDate: String(item.targetDate || ""),
          status: (item.status as GoalStatus) || "planned",
          createdAt: String(item.createdAt || new Date().toISOString()),
          updatedAt: String(item.updatedAt || new Date().toISOString()),
          completedAt: String(item.completedAt || ""),
          archivedAt: String(item.archivedAt || ""),
        }))
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

      setGoals(parsed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load goals";
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
    setFormCategory("wishlist");
    setFormDetails("");
    setFormOccasion("");
    setFormTargetDate("");
    setFormStatus("planned");
    setEditingGoal(null);
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function openAddForCategory(category: GoalCategory) {
    resetForm();
    setFormCategory(category);
    setShowForm(true);
  }

  function openEditForm(goal: GoalRecord) {
    setFormTitle(goal.title);
    setFormCategory(goal.category);
    setFormDetails(goal.details);
    setFormOccasion(goal.occasion);
    setFormTargetDate(goal.targetDate);
    setFormStatus(goal.status);
    setEditingGoal(goal);
    setViewingGoal(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  // ── CRUD ────────────────────────────────────────────────────────────────────

  async function saveGoal() {
    if (!formTitle.trim()) return;
    const now = new Date().toISOString();

    if (editingGoal) {
      const updated: GoalRecord = {
        ...editingGoal,
        title: formTitle.trim(),
        category: formCategory,
        details: formDetails.trim(),
        occasion: formOccasion.trim(),
        targetDate: formTargetDate,
        status: formStatus,
        completedAt:
          formStatus === "completed" && !editingGoal.completedAt
            ? now
            : editingGoal.completedAt,
        archivedAt:
          formStatus === "archived" && !editingGoal.archivedAt
            ? now
            : editingGoal.archivedAt,
        updatedAt: now,
      };
      await updateSheetRecord(
        GOALS_SHEET,
        editingGoal.id,
        updated as unknown as Record<string, unknown>
      );
      setGoals((prev) => prev.map((g) => (g.id === editingGoal.id ? updated : g)));
      setViewingGoal(updated);
    } else {
      const newGoal: GoalRecord = {
        id: `goal_${uid()}`,
        title: formTitle.trim(),
        category: formCategory,
        details: formDetails.trim(),
        occasion: formOccasion.trim(),
        targetDate: formTargetDate,
        status: formStatus,
        createdAt: now,
        updatedAt: now,
        completedAt: formStatus === "completed" ? now : "",
        archivedAt: formStatus === "archived" ? now : "",
      };
      await createSheetRecord(
        GOALS_SHEET,
        newGoal as unknown as Record<string, unknown>
      );
      setGoals((prev) => [newGoal, ...prev]);
    }

    closeForm();
  }

  async function deleteGoal(id: string) {
    await deleteFromSheet(GOALS_SHEET, id);
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setViewingGoal(null);
  }

  async function completeGoal(id: string) {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    const now = new Date().toISOString();
    const updated: GoalRecord = {
      ...goal,
      status: "completed",
      completedAt: now,
      updatedAt: now,
    };
    await updateSheetRecord(
      GOALS_SHEET,
      id,
      updated as unknown as Record<string, unknown>
    );
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    setViewingGoal((prev) => (prev?.id === id ? updated : prev));
  }

  async function archiveGoal(id: string) {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;
    const now = new Date().toISOString();
    const updated: GoalRecord = {
      ...goal,
      status: "archived",
      archivedAt: now,
      updatedAt: now,
    };
    await updateSheetRecord(
      GOALS_SHEET,
      id,
      updated as unknown as Record<string, unknown>
    );
    setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)));
    setViewingGoal((prev) => (prev?.id === id ? updated : prev));
  }

  // ── Filtering ───────────────────────────────────────────────────────────────

  function getFilteredGoals(category: GoalCategory | null = activeCategory) {
    return goals.filter((goal) => {
      if (category && goal.category !== category) return false;

      if (statusFilter === "active") {
        if (goal.status !== "planned" && goal.status !== "in_progress")
          return false;
      } else if (statusFilter !== "all") {
        if (goal.status !== statusFilter) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !goal.title.toLowerCase().includes(q) &&
          !goal.details.toLowerCase().includes(q) &&
          !goal.occasion.toLowerCase().includes(q)
        )
          return false;
      }

      return true;
    });
  }

  const filteredGoals = getFilteredGoals();

  return {
    // Data
    goals,
    filteredGoals,
    loading,
    error,
    reload: loadData,

    // Filter state
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    statusFilter,
    setStatusFilter,

    // Modal state
    showForm,
    editingGoal,
    viewingGoal,
    setViewingGoal,

    // Form state
    formTitle,
    setFormTitle,
    formCategory,
    setFormCategory,
    formDetails,
    setFormDetails,
    formOccasion,
    setFormOccasion,
    formTargetDate,
    setFormTargetDate,
    formStatus,
    setFormStatus,

    // Actions
    openAddForm,
    openAddForCategory,
    openEditForm,
    closeForm,
    saveGoal,
    deleteGoal,
    completeGoal,
    archiveGoal,
  };
}

export type DreamsGoalsState = ReturnType<typeof useDreamsGoals>;
