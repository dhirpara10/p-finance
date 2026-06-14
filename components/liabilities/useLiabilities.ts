"use client";

import { useMemo, useRef, useState } from "react";
import {
  applyRepaymentToLiability,
  defaultLiabilitySettings,
  generateBnplSchedule,
  generateRepaymentSchedule,
  getDueBnplRepayments,
  parseLiabilitySettings,
} from "@/lib/liabilities";
import {
  createSheetRecord,
  deleteSheetRecord,
  saveSetting,
  updateSheetRecord,
} from "@/lib/sheetsApi";
import type {
  Liability,
  LiabilityChannel,
  LiabilitySettings,
  LiabilityType,
  RepaymentSchedule,
} from "@/lib/types";

export type LiabilityDraft = Omit<
  Liability,
  "id" | "createdAt" | "updatedAt" | "status"
> & {
  status?: Liability["status"];
};

function toNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function parseLiability(item: Record<string, unknown>): Liability {
  return {
    ...item,
    id: String(item.id || ""),
    type:
      item.type === "credit_card" || item.type === "loan"
        ? item.type
        : "bnpl",
    name: String(item.name || ""),
    provider: String(item.provider || ""),
    originalAmount: toNumber(item.originalAmount),
    outstandingBalance: Math.max(toNumber(item.outstandingBalance), 0),
    status:
      item.status === "paid" || item.status === "closed"
        ? item.status
        : "active",
    category: String(item.category || ""),
    notes: String(item.notes || ""),
    createdAt: String(item.createdAt || ""),
    updatedAt: String(item.updatedAt || ""),
  } as Liability;
}

function parseSchedule(item: Record<string, unknown>): RepaymentSchedule {
  return {
    id: String(item.id || ""),
    liabilityId: String(item.liabilityId || ""),
    dueDate: String(item.dueDate || ""),
    amount: toNumber(item.amount),
    principalAmount: toNumber(item.principalAmount),
    interestAmount: toNumber(item.interestAmount),
    feeAmount: toNumber(item.feeAmount),
    status:
      item.status === "paid" || item.status === "missed"
        ? item.status
        : "upcoming",
    paidDate: String(item.paidDate || ""),
    processedAt: String(item.processedAt || ""),
    repaymentTransactionId: String(item.repaymentTransactionId || ""),
    notes: String(item.notes || ""),
    createdAt: String(item.createdAt || ""),
    updatedAt: String(item.updatedAt || ""),
  };
}

function validateDraft(draft: LiabilityDraft) {
  const validDate = (value?: string) =>
    Boolean(value && !Number.isNaN(new Date(`${value}T12:00:00`).getTime()));
  if (!draft.name.trim()) throw new Error("Name is required.");
  if (!draft.provider.trim()) throw new Error("Provider is required.");
  if (draft.originalAmount <= 0) throw new Error("Amount must be greater than 0.");
  if (draft.outstandingBalance < 0) {
    throw new Error("Outstanding balance cannot be negative.");
  }
  if (
    (draft.status === "paid" || draft.status === "closed") &&
    draft.outstandingBalance > 0
  ) {
    throw new Error("Paid or closed liabilities must have a zero outstanding balance.");
  }

  const allowedExtra =
    draft.type === "credit_card"
      ? toNumber(draft.annualFee) + toNumber(draft.charges)
      : draft.type === "loan"
        ? toNumber(draft.fees) + toNumber(draft.charges) - toNumber(draft.discount)
        : 0;

  if (draft.outstandingBalance > draft.originalAmount + Math.max(allowedExtra, 0)) {
    throw new Error(
      "Outstanding balance cannot exceed the original amount unless fees or charges are included."
    );
  }

  if (draft.type === "bnpl") {
    if ((draft.numberOfPayments || 0) < 1) {
      throw new Error("BNPL payments must be at least 1.");
    }
    if (!draft.purchaseDate || !draft.firstPaymentDate) {
      throw new Error("Purchase and first payment dates are required.");
    }
    if (!validDate(draft.purchaseDate) || !validDate(draft.firstPaymentDate)) {
      throw new Error("Enter valid BNPL dates.");
    }
  }

  if (draft.type === "credit_card") {
    if (!validDate(draft.statementDate) || !validDate(draft.dueDate)) {
      throw new Error("Valid statement and due dates are required.");
    }
  }

  if (draft.type === "loan") {
    if (!validDate(draft.startDate)) {
      throw new Error("A valid loan start date is required.");
    }
    if (draft.endDate && !validDate(draft.endDate)) {
      throw new Error("Enter a valid loan end date.");
    }
  }
}

export function useLiabilities() {
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [repaymentSchedules, setRepaymentSchedules] = useState<
    RepaymentSchedule[]
  >([]);
  const [liabilitySettings, setLiabilitySettings] =
    useState<LiabilitySettings>(defaultLiabilitySettings);
  const [showLiabilityForm, setShowLiabilityForm] = useState(false);
  const [liabilityFormType, setLiabilityFormType] =
    useState<LiabilityType>("bnpl");
  const [editingLiabilityId, setEditingLiabilityId] = useState<string | null>(
    null
  );
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(
    null
  );
  const [liabilityError, setLiabilityError] = useState("");
  const [liabilitySaving, setLiabilitySaving] = useState(false);
  const processingScheduleIds = useRef(new Set<string>());

  const editingLiability = useMemo(
    () =>
      liabilities.find((item) => item.id === editingLiabilityId) || null,
    [editingLiabilityId, liabilities]
  );
  const editingSchedule = useMemo(
    () =>
      repaymentSchedules.find((item) => item.id === editingScheduleId) || null,
    [editingScheduleId, repaymentSchedules]
  );

  function hydrateLiabilities(
    rawLiabilities: unknown[],
    rawSchedules: unknown[],
    rawSettings: unknown
  ) {
    const parsedLiabilities = rawLiabilities
      .filter((item): item is Record<string, unknown> =>
        Boolean(item && typeof item === "object")
      )
      .map(parseLiability)
      .filter((item) => item.id);
    const parsedSchedules = rawSchedules
      .filter((item): item is Record<string, unknown> =>
        Boolean(item && typeof item === "object")
      )
      .map(parseSchedule)
      .filter((item) => item.id && item.liabilityId);

    setLiabilities(parsedLiabilities);
    setRepaymentSchedules(parsedSchedules);
    setLiabilitySettings(parseLiabilitySettings(rawSettings));
    return {
      liabilities: parsedLiabilities,
      repaymentSchedules: parsedSchedules,
    };
  }

  async function processDueBnplRepayments(
    sourceLiabilities = liabilities,
    sourceSchedules = repaymentSchedules
  ) {
    const dueSchedules = getDueBnplRepayments({
      liabilities: sourceLiabilities,
      schedules: sourceSchedules,
    });
    if (!dueSchedules.length) {
      return {
        liabilities: sourceLiabilities,
        repaymentSchedules: sourceSchedules,
        processedCount: 0,
      };
    }

    let nextLiabilities = [...sourceLiabilities];
    let nextSchedules = [...sourceSchedules];
    let processedCount = 0;

    for (const schedule of dueSchedules) {
      if (processingScheduleIds.current.has(schedule.id)) continue;
      const currentSchedule = nextSchedules.find(
        (item) => item.id === schedule.id
      );
      if (
        !currentSchedule ||
        currentSchedule.status === "paid" ||
        currentSchedule.processedAt
      ) {
        continue;
      }

      const liability = nextLiabilities.find(
        (item) => item.id === currentSchedule.liabilityId
      );
      if (!liability || liability.type !== "bnpl") continue;

      processingScheduleIds.current.add(schedule.id);
      const now = new Date().toISOString();
      const paidSchedule: RepaymentSchedule = {
        ...currentSchedule,
        status: "paid",
        paidDate: now.split("T")[0],
        processedAt: now,
        repaymentTransactionId:
          currentSchedule.repaymentTransactionId ||
          `repayment:${currentSchedule.id}`,
        updatedAt: now,
      };
      const updatedLiability: Liability = {
        ...applyRepaymentToLiability(liability, paidSchedule),
        updatedAt: now,
      };

      try {
        await updateSheetRecord(
          "RepaymentSchedules",
          paidSchedule.id,
          paidSchedule
        );
        try {
          await updateSheetRecord(
            "Liabilities",
            updatedLiability.id,
            updatedLiability
          );
        } catch (error) {
          await updateSheetRecord(
            "RepaymentSchedules",
            currentSchedule.id,
            currentSchedule
          );
          throw error;
        }

        nextSchedules = nextSchedules.map((item) =>
          item.id === paidSchedule.id ? paidSchedule : item
        );
        nextLiabilities = nextLiabilities.map((item) =>
          item.id === updatedLiability.id ? updatedLiability : item
        );
        processedCount += 1;
      } finally {
        processingScheduleIds.current.delete(schedule.id);
      }
    }

    setRepaymentSchedules(nextSchedules);
    setLiabilities(nextLiabilities);
    return {
      liabilities: nextLiabilities,
      repaymentSchedules: nextSchedules,
      processedCount,
    };
  }

  function openNewLiability(type: LiabilityType) {
    setLiabilityFormType(type);
    setEditingLiabilityId(null);
    setLiabilityError("");
    setShowLiabilityForm(true);
  }

  function openEditLiability(id: string) {
    const liability = liabilities.find((item) => item.id === id);
    if (!liability) return;
    setLiabilityFormType(liability.type);
    setEditingLiabilityId(id);
    setLiabilityError("");
    setShowLiabilityForm(true);
  }

  function closeLiabilityForm() {
    setShowLiabilityForm(false);
    setEditingLiabilityId(null);
    setLiabilityError("");
  }

  async function createSchedules(liability: Liability) {
    const created: RepaymentSchedule[] = [];
    try {
      for (const row of generateRepaymentSchedule(liability)) {
        created.push(
          await createSheetRecord<RepaymentSchedule>(
            "RepaymentSchedules",
            row
          )
        );
      }
      return created;
    } catch (error) {
      await Promise.allSettled(
        created.map((row) =>
          deleteSheetRecord("RepaymentSchedules", row.id)
        )
      );
      throw error;
    }
  }

  async function replaceUpcomingSchedule(liability: Liability) {
    const existingUpcoming = repaymentSchedules.filter(
      (row) => row.liabilityId === liability.id && row.status !== "paid"
    );
    const created = await createSchedules(liability);
    try {
      await Promise.all(
        existingUpcoming.map((row) =>
          deleteSheetRecord("RepaymentSchedules", row.id)
        )
      );
    } catch (error) {
      await Promise.allSettled(
        created.map((row) =>
          deleteSheetRecord("RepaymentSchedules", row.id)
        )
      );
      throw error;
    }

    const nextSchedules = [
      ...repaymentSchedules.filter(
        (row) => row.liabilityId !== liability.id || row.status === "paid"
      ),
      ...created,
    ];
    setRepaymentSchedules(nextSchedules);
    return nextSchedules;
  }

  async function saveLiability(draft: LiabilityDraft) {
    setLiabilityError("");
    setLiabilitySaving(true);
    try {
      validateDraft(draft);
      const now = new Date().toISOString();

      if (editingLiability) {
        const updated: Liability = {
          ...editingLiability,
          ...draft,
          status:
            draft.outstandingBalance <= 0
              ? "paid"
              : draft.status || editingLiability.status,
          updatedAt: now,
        };
        const saved = await updateSheetRecord<Liability>(
          "Liabilities",
          updated.id,
          updated
        );
        if (!saved.id) throw new Error("Updated liability is missing an id.");
        const nextLiabilities = liabilities.map((item) =>
          item.id === saved.id ? saved : item
        );
        setLiabilities(nextLiabilities);
        const nextSchedules = await replaceUpcomingSchedule(saved);
        await processDueBnplRepayments(nextLiabilities, nextSchedules);
      } else {
        const created = await createSheetRecord<Liability>("Liabilities", {
          ...draft,
          status: draft.outstandingBalance <= 0 ? "paid" : "active",
          createdAt: now,
          updatedAt: now,
        });
        if (!created.id) throw new Error("Created liability is missing an id.");
        try {
          const scheduleRows = await createSchedules(created);
          const nextLiabilities = [created, ...liabilities];
          const nextSchedules = [...scheduleRows, ...repaymentSchedules];
          setLiabilities(nextLiabilities);
          setRepaymentSchedules(nextSchedules);
          await processDueBnplRepayments(nextLiabilities, nextSchedules);
        } catch (scheduleError) {
          await deleteSheetRecord("Liabilities", created.id);
          throw scheduleError;
        }
      }

      closeLiabilityForm();
    } catch (error: unknown) {
      setLiabilityError(
        error instanceof Error ? error.message : "Unable to save liability."
      );
    } finally {
      setLiabilitySaving(false);
    }
  }

  async function deleteLiabilityNoConfirm(id: string) {
    const schedules = repaymentSchedules.filter((row) => row.liabilityId === id);
    await Promise.all(
      schedules.map((row) => deleteSheetRecord("RepaymentSchedules", row.id))
    );
    await deleteSheetRecord("Liabilities", id);
    setRepaymentSchedules((current) =>
      current.filter((row) => row.liabilityId !== id)
    );
    setLiabilities((current) => current.filter((item) => item.id !== id));
  }

  async function deleteLiability(id: string) {
    if (!window.confirm("Delete this liability and its repayment schedule?")) return;
    await deleteLiabilityNoConfirm(id);
  }

  async function markRepaymentPaid(scheduleId: string) {
    setLiabilityError("");
    try {
      const schedule = repaymentSchedules.find((item) => item.id === scheduleId);
      if (!schedule || schedule.status === "paid") return;
      const liability = liabilities.find((item) => item.id === schedule.liabilityId);
      if (!liability) throw new Error("Liability record was not found.");

      const now = new Date().toISOString();
      const updatedSchedule: RepaymentSchedule = {
        ...schedule,
        status: "paid",
        paidDate: now.split("T")[0],
        processedAt: schedule.processedAt || now,
        repaymentTransactionId:
          schedule.repaymentTransactionId || `repayment:${schedule.id}`,
        updatedAt: now,
      };
      const updatedLiability: Liability = {
        ...applyRepaymentToLiability(liability, updatedSchedule),
        updatedAt: now,
      };

      await updateSheetRecord("RepaymentSchedules", schedule.id, updatedSchedule);
      try {
        await updateSheetRecord("Liabilities", liability.id, updatedLiability);
      } catch (error) {
        await updateSheetRecord("RepaymentSchedules", schedule.id, schedule);
        throw error;
      }
      setRepaymentSchedules((current) =>
        current.map((item) =>
          item.id === schedule.id ? updatedSchedule : item
        )
      );
      setLiabilities((current) =>
        current.map((item) =>
          item.id === liability.id ? updatedLiability : item
        )
      );
    } catch (error: unknown) {
      setLiabilityError(
        error instanceof Error ? error.message : "Unable to mark repayment paid."
      );
    }
  }

  async function saveRepaymentSchedule(
    scheduleId: string,
    changes: Pick<
      RepaymentSchedule,
      "dueDate" | "amount" | "principalAmount" | "interestAmount" | "feeAmount" | "notes"
    >
  ) {
    setLiabilityError("");
    try {
      if (
        !changes.dueDate ||
        Number.isNaN(new Date(`${changes.dueDate}T12:00:00`).getTime())
      ) {
        throw new Error("Enter a valid repayment due date.");
      }
      if (changes.amount <= 0) throw new Error("Repayment amount must be positive.");
      if (changes.principalAmount < 0) {
        throw new Error("Principal amount cannot be negative.");
      }
      const existing = repaymentSchedules.find((item) => item.id === scheduleId);
      if (!existing) throw new Error("Repayment was not found.");
      const updated = {
        ...existing,
        ...changes,
        updatedAt: new Date().toISOString(),
      };
      let restored: Liability | null = null;
      let originalLiability: Liability | null = null;
      if (existing.status === "paid") {
        const liability = liabilities.find(
          (item) => item.id === existing.liabilityId
        );
        if (liability) {
          originalLiability = liability;
          const oldReduction =
            liability.type === "loan"
              ? existing.principalAmount
              : existing.amount;
          const newReduction =
            liability.type === "loan"
              ? updated.principalAmount
              : updated.amount;
          const outstandingBalance = Math.max(
            liability.outstandingBalance + oldReduction - newReduction,
            0
          );
          restored = {
            ...liability,
            outstandingBalance,
            currentBalance:
              liability.type === "credit_card"
                ? outstandingBalance
                : liability.currentBalance,
            outstandingPrincipal:
              liability.type === "loan"
                ? outstandingBalance
                : liability.outstandingPrincipal,
            status: outstandingBalance > 0 ? "active" : "paid",
            updatedAt: new Date().toISOString(),
          };
          await updateSheetRecord("Liabilities", liability.id, restored);
        }
      }
      try {
        await updateSheetRecord("RepaymentSchedules", scheduleId, updated);
      } catch (error) {
        if (originalLiability) {
          await updateSheetRecord(
            "Liabilities",
            originalLiability.id,
            originalLiability
          );
        }
        throw error;
      }
      if (restored) {
        setLiabilities((current) =>
          current.map((item) =>
            item.id === restored?.id ? restored : item
          )
        );
      }
      setRepaymentSchedules((current) =>
        current.map((item) => (item.id === scheduleId ? updated : item))
      );
      setEditingScheduleId(null);
      return true;
    } catch (error: unknown) {
      setLiabilityError(
        error instanceof Error ? error.message : "Unable to save repayment."
      );
      return false;
    }
  }

  async function deleteRepaymentSchedule(scheduleId: string) {
  const schedule = repaymentSchedules.find(
    (item) => String(item.id) === String(scheduleId)
  );

  if (!schedule) return;

  const liability = liabilities.find(
    (item) => String(item.id) === String(schedule.liabilityId)
  );

  const confirmed = confirm(
    schedule.status === "paid"
      ? "Delete this paid repayment? This will also add the repayment amount back to the liability outstanding balance."
      : "Delete this repayment schedule?"
  );

  if (!confirmed) return;

  try {
    let nextLiabilities = liabilities;

    if (liability && schedule.status === "paid") {
      const restoredOutstanding =
        Number(liability.outstandingBalance || 0) +
        Number(schedule.principalAmount || schedule.amount || 0);

      const restoredLiability = {
        ...liability,
        outstandingBalance: restoredOutstanding,
        status: restoredOutstanding > 0 ? "active" : liability.status,
        updatedAt: new Date().toISOString(),
      };

      await updateSheetRecord(
        "Liabilities",
        restoredLiability.id,
        restoredLiability
      );

      nextLiabilities = liabilities.map((item) =>
        String(item.id) === String(restoredLiability.id)
          ? restoredLiability
          : item
      );
    }

    await deleteSheetRecord("RepaymentSchedules", schedule.id);

    setRepaymentSchedules((current) =>
      current.filter((item) => String(item.id) !== String(schedule.id))
    );

    setLiabilities(nextLiabilities);
  } catch (error: any) {
    console.error(error);
    alert(error.message || "Failed to delete repayment schedule.");
  }
}

  function resetLiabilityData() {
    setLiabilities([]);
    setRepaymentSchedules([]);
  }

  async function createLiabilityFromExpense(params: {
    channel: LiabilityChannel;
    amount: number;
    expenseDate: string;
    expenseCategory: string;
    expenseNotes?: string;
  }) {
    console.log("[createLiabilityFromExpense] called with", params);
    const { channel, amount, expenseDate, expenseCategory } = params;
    const now = new Date().toISOString();

    const noPaymentUpfront = channel.noPaymentUpfrontEnabled ?? false;
    const delayDays = channel.noPaymentUpfrontFirstDelayDays ?? 14;
    const linkedAccount = channel.linkedRepaymentAccount ?? "Bank";
    const installmentCount = channel.installmentCount || 4;
    const frequency = channel.installmentFrequency || "fortnightly";

    // Handle StepPay under-minimum as single pending deduction
    const minSplit = channel.minimumSplitAmount ?? 0;
    if (minSplit > 0 && amount < minSplit) {
      const deductDelayDays = channel.underMinimumDeductionDelayDays ?? 2;
      const d = new Date(`${expenseDate}T12:00:00`);
      d.setDate(d.getDate() + deductDelayDays);
      const dueDateStr = d.toISOString().split("T")[0];

      const draft: Omit<Liability, "id"> = {
        type: "bnpl",
        name: `${channel.name} – ${expenseCategory}`,
        provider: channel.name,
        originalAmount: amount,
        outstandingBalance: amount,
        status: "active",
        category: expenseCategory,
        notes: params.expenseNotes || "",
        purchaseDate: expenseDate,
        firstPaymentDate: dueDateStr,
        numberOfPayments: 1,
        paymentFrequency: frequency,
        installmentAmount: amount,
        purchaseAmount: amount,
        createdAt: now,
        updatedAt: now,
      };
      const created = await createSheetRecord<Liability>("Liabilities", draft as unknown as Record<string, unknown>);
      if (!created.id) throw new Error("Created liability is missing an id.");

      const schedRow: Omit<RepaymentSchedule, "id"> = {
        liabilityId: created.id,
        dueDate: dueDateStr,
        amount,
        principalAmount: amount,
        interestAmount: 0,
        feeAmount: 0,
        status: "upcoming",
        paidDate: "",
        linkedRepaymentAccount: linkedAccount,
        notes: "",
        createdAt: now,
        updatedAt: now,
      };
      const savedSched = await createSheetRecord<RepaymentSchedule>("RepaymentSchedules", schedRow as unknown as Record<string, unknown>);
      setLiabilities((prev) => [created, ...prev]);
      setRepaymentSchedules((prev) => [savedSched, ...prev]);
      console.log("[createLiabilityFromExpense] under-minimum single deduction created");
      return { liability: created, deductedToday: 0 };
    }

    // Normal 4-installment BNPL — use generateBnplSchedule
    // We need a placeholder id first so we can reference it in schedules
    const tempId = crypto.randomUUID();
    const { schedule, deductedToday, remainingLiability } = generateBnplSchedule({
      liabilityId: tempId,
      amount,
      purchaseDate: expenseDate,
      installmentCount,
      frequency,
      noPaymentUpfrontEnabled: noPaymentUpfront,
      noPaymentUpfrontFirstDelayDays: delayDays,
      linkedRepaymentAccount: linkedAccount,
    });

    const firstPaymentDate = schedule[0]?.dueDate || expenseDate;
    const installmentAmount = installmentCount > 0 ? Math.floor((amount / installmentCount) * 100) / 100 : amount;

    const draft: Omit<Liability, "id"> = {
      type: "bnpl",
      name: `${channel.name} – ${expenseCategory}`,
      provider: channel.name,
      originalAmount: amount,
      outstandingBalance: remainingLiability,
      status: remainingLiability <= 0 ? "paid" : "active",
      category: expenseCategory,
      notes: params.expenseNotes || "",
      purchaseDate: expenseDate,
      firstPaymentDate,
      numberOfPayments: installmentCount,
      paymentFrequency: frequency,
      installmentAmount,
      purchaseAmount: amount,
      createdAt: now,
      updatedAt: now,
    };

    console.log("[createLiabilityFromExpense] saving draft:", draft);
    const created = await createSheetRecord<Liability>("Liabilities", draft as unknown as Record<string, unknown>);
    console.log("[createLiabilityFromExpense] created:", created);
    if (!created.id) throw new Error("Created liability is missing an id.");

    // Save schedule rows using the real id
    const scheduleWithRealId = schedule.map((row) => ({ ...row, liabilityId: created.id }));
    const savedSchedules: RepaymentSchedule[] = [];
    for (const row of scheduleWithRealId) {
      const saved = await createSheetRecord<RepaymentSchedule>("RepaymentSchedules", row as unknown as Record<string, unknown>);
      savedSchedules.push(saved);
    }

    setLiabilities((prev) => [created, ...prev]);
    setRepaymentSchedules((prev) => [...savedSchedules, ...prev]);
    console.log("[createLiabilityFromExpense] done. deductedToday=", deductedToday, "remainingLiability=", remainingLiability);
    return { liability: created, deductedToday };
  }

  async function saveLiabilitySettings() {
    const clean = (items: string[]) =>
      [...new Set(items.map((item) => item.trim()).filter(Boolean))];
    const nextSettings: LiabilitySettings = {
      ...liabilitySettings,
      bnplProviders: clean(liabilitySettings.bnplProviders),
      creditCardProviders: clean(liabilitySettings.creditCardProviders),
      loanTypes: clean(liabilitySettings.loanTypes),
      repaymentFrequencies: [
        ...new Set(liabilitySettings.repaymentFrequencies),
      ],
    };
    if (
      !nextSettings.bnplProviders.length ||
      !nextSettings.creditCardProviders.length ||
      !nextSettings.loanTypes.length ||
      !nextSettings.repaymentFrequencies.length
    ) {
      setLiabilityError("Keep at least one option in every liability setting.");
      return false;
    }
    const saved = await saveSetting(
      "liability_settings",
      JSON.stringify(nextSettings)
    );
    if (saved) setLiabilitySettings(nextSettings);
    return saved;
  }

  return {
    liabilities,
    repaymentSchedules,
    liabilitySettings,
    setLiabilitySettings,
    showLiabilityForm,
    liabilityFormType,
    editingLiability,
    editingSchedule,
    liabilityError,
    liabilitySaving,
    hydrateLiabilities,
    processDueBnplRepayments,
    openNewLiability,
    openEditLiability,
    closeLiabilityForm,
    saveLiability,
    deleteLiability,
    deleteLiabilityNoConfirm,
    markRepaymentPaid,
    setEditingScheduleId,
    saveRepaymentSchedule,
    deleteRepaymentSchedule,
    saveLiabilitySettings,
    resetLiabilityData,
    createLiabilityFromExpense,
  };
}

export type LiabilityModuleState = ReturnType<typeof useLiabilities>;
