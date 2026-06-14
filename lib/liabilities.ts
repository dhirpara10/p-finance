import type {
  Liability,
  LiabilityChannel,
  LiabilityPaymentFrequency,
  LiabilitySettings,
  RepaymentSchedule,
} from "@/lib/types";

export type BnplScheduleResult = {
  schedule: Omit<RepaymentSchedule, "id">[];
  deductedToday: number;
  remainingLiability: number;
};

export const defaultLiabilityChannels: LiabilityChannel[] = [
  {
    id: "afterpay",
    name: "Afterpay",
    type: "bnpl",
    enabled: true,
    installmentCount: 4,
    installmentFrequency: "fortnightly",
    noPaymentUpfrontEnabled: false,
    noPaymentUpfrontFirstDelayDays: 14,
    linkedRepaymentAccount: "Bank",
    minimumPurchaseAmount: 0,
  },
  {
    id: "steppay",
    name: "CommBank StepPay",
    type: "bnpl_card",
    enabled: true,
    installmentCount: 4,
    installmentFrequency: "fortnightly",
    noPaymentUpfrontEnabled: false,
    noPaymentUpfrontFirstDelayDays: 14,
    linkedRepaymentAccount: "Bank",
    minimumSplitAmount: 100,
    underMinimumBehaviour: "single_deduction",
    underMinimumDeductionDelayDays: 2,
  },
];

export const defaultLiabilitySettings: LiabilitySettings = {
  bnplProviders: ["Afterpay", "StepPay", "Other"],
  creditCardProviders: ["ANZ", "CommBank", "NAB", "Westpac", "Other"],
  loanTypes: [
    "Home Loan",
    "Car Loan",
    "Personal Loan",
    "Education Loan",
    "Other",
  ],
  repaymentFrequencies: ["weekly", "fortnightly", "monthly", "yearly"],
  defaultInterestType: "simple",
  defaultCompoundingFrequency: "monthly",
  liabilityChannels: defaultLiabilityChannels,
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function addFrequency(dateString: string, frequency: LiabilityPaymentFrequency) {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;

  if (frequency === "weekly") date.setDate(date.getDate() + 7);
  if (frequency === "fortnightly") date.setDate(date.getDate() + 14);
  if (frequency === "monthly") date.setMonth(date.getMonth() + 1);
  if (frequency === "yearly") date.setFullYear(date.getFullYear() + 1);

  return date.toISOString().split("T")[0];
}

function frequencyPeriodsPerYear(frequency: LiabilityPaymentFrequency) {
  if (frequency === "weekly") return 52;
  if (frequency === "fortnightly") return 26;
  if (frequency === "yearly") return 1;
  return 12;
}

function loanPaymentCount(liability: Liability) {
  const frequency = liability.repaymentFrequency || "monthly";
  if (liability.startDate && liability.endDate) {
    let count = 0;
    let cursor = liability.startDate;
    const end = new Date(`${liability.endDate}T23:59:59`);
    while (new Date(`${cursor}T12:00:00`) <= end && count < 600) {
      count += 1;
      cursor = addFrequency(cursor, frequency);
    }
    return Math.max(count, 1);
  }

  const months = Math.max(liability.termMonths || 1, 1);
  if (frequency === "weekly") return Math.ceil((months * 52) / 12);
  if (frequency === "fortnightly") return Math.ceil((months * 26) / 12);
  if (frequency === "yearly") return Math.ceil(months / 12);
  return months;
}

function scheduleRow(
  liabilityId: string,
  dueDate: string,
  amount: number,
  principalAmount: number,
  interestAmount = 0,
  feeAmount = 0
): Omit<RepaymentSchedule, "id"> {
  const now = new Date().toISOString();
  return {
    liabilityId,
    dueDate,
    amount: roundMoney(amount),
    principalAmount: roundMoney(principalAmount),
    interestAmount: roundMoney(interestAmount),
    feeAmount: roundMoney(feeAmount),
    status: "upcoming",
    paidDate: "",
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function generateBnplSchedule({
  liabilityId,
  amount,
  purchaseDate,
  installmentCount,
  frequency,
  noPaymentUpfrontEnabled,
  noPaymentUpfrontFirstDelayDays = 14,
  linkedRepaymentAccount = "Bank",
}: {
  liabilityId: string;
  amount: number;
  purchaseDate: string;
  installmentCount: number;
  frequency: LiabilityPaymentFrequency;
  noPaymentUpfrontEnabled: boolean;
  noPaymentUpfrontFirstDelayDays?: number;
  linkedRepaymentAccount?: "Bank" | "Cash";
}): BnplScheduleResult {
  const count = Math.max(installmentCount, 1);
  const baseInstallment = Math.floor((amount / count) * 100) / 100;
  const lastInstallment = roundMoney(amount - baseInstallment * (count - 1));
  const now = new Date().toISOString();

  let firstDueDate: string;
  let deductedToday: number;

  if (noPaymentUpfrontEnabled) {
    const d = new Date(`${purchaseDate}T12:00:00`);
    d.setDate(d.getDate() + noPaymentUpfrontFirstDelayDays);
    firstDueDate = d.toISOString().split("T")[0];
    deductedToday = 0;
  } else {
    firstDueDate = purchaseDate;
    deductedToday = count === 1 ? lastInstallment : baseInstallment;
  }

  const schedule: Omit<RepaymentSchedule, "id">[] = [];
  let dueDate = firstDueDate;

  for (let i = 0; i < count; i++) {
    const installmentAmount = i === count - 1 ? lastInstallment : baseInstallment;
    const isPaid = !noPaymentUpfrontEnabled && i === 0;

    schedule.push({
      liabilityId,
      dueDate,
      amount: installmentAmount,
      principalAmount: installmentAmount,
      interestAmount: 0,
      feeAmount: 0,
      status: isPaid ? "paid" : "upcoming",
      paidDate: isPaid ? purchaseDate : "",
      linkedRepaymentAccount: isPaid ? linkedRepaymentAccount : undefined,
      notes: "",
      createdAt: now,
      updatedAt: now,
    });

    dueDate = addFrequency(dueDate, frequency);
  }

  const remainingLiability = roundMoney(amount - deductedToday);
  return { schedule, deductedToday, remainingLiability };
}

export function generateRepaymentSchedule(
  liability: Liability
): Omit<RepaymentSchedule, "id">[] {
  if (liability.type === "bnpl") {
    const count = Math.max(liability.numberOfPayments || 1, 1);
    const frequency = liability.paymentFrequency || "fortnightly";
    const baseAmount =
      liability.installmentAmount ||
      roundMoney((liability.purchaseAmount || liability.originalAmount) / count);
    let dueDate =
      liability.firstPaymentDate ||
      liability.purchaseDate ||
      new Date().toISOString().split("T")[0];
    let remaining = liability.outstandingBalance;

    return Array.from({ length: count }, (_, index) => {
      const amount =
        index === count - 1 ? roundMoney(remaining) : Math.min(baseAmount, remaining);
      remaining = roundMoney(Math.max(remaining - amount, 0));
      const row = scheduleRow(liability.id, dueDate, amount, amount);
      dueDate = addFrequency(dueDate, frequency);
      return row;
    });
  }

  if (liability.type === "credit_card") {
    const amount = Math.min(
      liability.minimumPayment || liability.outstandingBalance,
      liability.outstandingBalance
    );
    if (amount <= 0 || !liability.dueDate) return [];
    return [scheduleRow(liability.id, liability.dueDate, amount, amount)];
  }

  const frequency = liability.repaymentFrequency || "monthly";
const maxPeriods = loanPaymentCount(liability);
const periodsPerYear = frequencyPeriodsPerYear(frequency);
const periodicRate =
  Math.max(liability.interestRate || 0, 0) / 100 / periodsPerYear;

const originalPrincipal = Math.max(
  liability.principalAmount || liability.originalAmount,
  0
);

let outstanding = Math.max(
  liability.outstandingPrincipal ?? liability.outstandingBalance,
  0
);

let dueDate = liability.startDate || new Date().toISOString().split("T")[0];
const scheduledPayment = Math.max(liability.repaymentAmount || 0, 0);
const rows: Omit<RepaymentSchedule, "id">[] = [];

for (let index = 0; index < maxPeriods && outstanding > 0; index += 1) {
  const remainingPeriods = Math.max(maxPeriods - index, 1);

  const interestBase =
    liability.interestType === "compound" ? outstanding : outstanding;

  const interest = roundMoney(outstanding * periodicRate);

  const fee = index === 0 ? Math.max(liability.fees || 0, 0) : 0;

  const fallbackPayment = roundMoney(
    outstanding / remainingPeriods + interest + fee
  );

  const desiredPayment =
    scheduledPayment > 0 ? scheduledPayment : fallbackPayment;

  const amount = Math.min(
    desiredPayment,
    roundMoney(outstanding + interest + fee)
  );

  const principal = roundMoney(
    Math.min(Math.max(amount - interest - fee, 0), outstanding)
  );

  if (amount <= 0 || principal <= 0) break;

  rows.push(
    scheduleRow(liability.id, dueDate, amount, principal, interest, fee)
  );

  outstanding = roundMoney(Math.max(outstanding - principal, 0));
  dueDate = addFrequency(dueDate, frequency);
}

return rows;
}

function mergeChannelDefaults(saved: LiabilityChannel[]): LiabilityChannel[] {
  if (!saved.length) return defaultLiabilityChannels;
  // Merge saved channels with defaults so new fields are filled in
  return defaultLiabilityChannels.map((def) => {
    const existing = saved.find((ch) => ch.id === def.id);
    if (!existing) return def;
    return { ...def, ...existing };
  });
}

export function parseLiabilitySettings(value: unknown): LiabilitySettings {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== "object") return defaultLiabilitySettings;
    const settings = parsed as Partial<LiabilitySettings>;
    return {
      bnplProviders: settings.bnplProviders?.filter(Boolean) || defaultLiabilitySettings.bnplProviders,
      creditCardProviders:
        settings.creditCardProviders?.filter(Boolean) ||
        defaultLiabilitySettings.creditCardProviders,
      loanTypes: settings.loanTypes?.filter(Boolean) || defaultLiabilitySettings.loanTypes,
      repaymentFrequencies:
        settings.repaymentFrequencies?.filter(Boolean) ||
        defaultLiabilitySettings.repaymentFrequencies,
      defaultInterestType:
        settings.defaultInterestType || defaultLiabilitySettings.defaultInterestType,
      defaultCompoundingFrequency:
        settings.defaultCompoundingFrequency ||
        defaultLiabilitySettings.defaultCompoundingFrequency,
      liabilityChannels: mergeChannelDefaults(
        (settings.liabilityChannels as LiabilityChannel[] | undefined) || []
      ),
    };
  } catch {
    return defaultLiabilitySettings;
  }
}

export function isRepaymentDue(
  schedule: RepaymentSchedule,
  today = new Date().toISOString().split("T")[0]
) {
  return (
    schedule.status !== "paid" &&
    !schedule.processedAt &&
    Boolean(schedule.dueDate) &&
    schedule.dueDate <= today
  );
}

export function getDueBnplRepayments({
  liabilities,
  schedules,
  today,
}: {
  liabilities: Liability[];
  schedules: RepaymentSchedule[];
  today?: string;
}) {
  const bnplIds = new Set(
    liabilities
      .filter(
        (liability) =>
          liability.type === "bnpl" &&
          liability.status === "active" &&
          liability.outstandingBalance > 0
      )
      .map((liability) => liability.id)
  );

  return schedules
    .filter(
      (schedule) =>
        bnplIds.has(schedule.liabilityId) &&
        isRepaymentDue(schedule, today)
    )
    .sort(
      (a, b) =>
        a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id)
    );
}

export function applyRepaymentToLiability(
  liability: Liability,
  schedule: RepaymentSchedule
) {
  const principalReduction =
    liability.type === "loan" ? schedule.principalAmount : schedule.amount;
  const outstandingBalance = Math.max(
    liability.outstandingBalance - principalReduction,
    0
  );

  return {
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
    status:
      outstandingBalance <= 0
        ? ("paid" as const)
        : liability.status,
  };
}
