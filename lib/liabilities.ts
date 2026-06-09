import type {
  Liability,
  LiabilityPaymentFrequency,
  LiabilitySettings,
  RepaymentSchedule,
} from "@/lib/types";

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
  const periods = loanPaymentCount(liability);
  const periodsPerYear = frequencyPeriodsPerYear(frequency);
  const periodicRate = Math.max(liability.interestRate || 0, 0) / 100 / periodsPerYear;
  const originalPrincipal = Math.max(
    liability.principalAmount || liability.originalAmount,
    0
  );
  let outstanding = Math.max(
    liability.outstandingPrincipal ?? liability.outstandingBalance,
    0
  );
  let dueDate =
    liability.startDate || new Date().toISOString().split("T")[0];
  const scheduledPayment = Math.max(liability.repaymentAmount || 0, 0);

  return Array.from({ length: periods }, (_, index) => {
    const interestBase =
      liability.interestType === "compound" ? outstanding : originalPrincipal;
    const interest = roundMoney(interestBase * periodicRate);
    const fee = index === 0 ? Math.max(liability.fees || 0, 0) : 0;
    const fallbackPayment = roundMoney(outstanding / Math.max(periods - index, 1) + interest + fee);
    const amount = Math.min(
      scheduledPayment > 0 ? scheduledPayment : fallbackPayment,
      roundMoney(outstanding + interest + fee)
    );
    const principal = roundMoney(
      Math.min(Math.max(amount - interest - fee, 0), outstanding)
    );
    outstanding = roundMoney(Math.max(outstanding - principal, 0));
    const row = scheduleRow(liability.id, dueDate, amount, principal, interest, fee);
    dueDate = addFrequency(dueDate, frequency);
    return row;
  }).filter((row) => row.amount > 0);
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
    };
  } catch {
    return defaultLiabilitySettings;
  }
}
