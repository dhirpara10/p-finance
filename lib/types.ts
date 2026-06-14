export type Status = "Pending" | "Partly Paid" | "Fully Settled";
export type IncomeType = "Hourly" | "Fixed Amount";
export type ExpenseAccount = "Bank" | "Cash";
export type AccountBucket = "Bank" | "Cash";
export type Bucket = AccountBucket | string;
export type AllocationFrequency = "weekly" | "biweekly" | "monthly" | "yearly";
export type LiabilityType = "bnpl" | "credit_card" | "loan";
export type LiabilityStatus = "active" | "paid" | "closed";
export type LiabilityPaymentFrequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "yearly";
export type LiabilityInterestType = "simple" | "compound";
export type LiabilityCompoundingFrequency = "monthly" | "yearly";

export type SavingsBucket = {
  id: string;
  name: string;
  targetAmount: number;
  currentBalance: number;
  linkedStorageLabel: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BucketListTracker = {
  id: string;
  name: string;
  icon: string;
  monthlyBudget: number;
  linkedCategoryIds: string[];
  recurringAllocation?: {
    sourceAccountId: AccountBucket;
    allocationAmount: number;
    frequency: AllocationFrequency;
    active: boolean;
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Income = {
  id: string | number;
  income_type: "Hourly" | "Fixed Amount";
  source: string;
  rate: number;
  hours: number;
  amount: number;
  cash_received: number;
  date: string;
  notes: string;
};

export type IncomeSourceRate = {
  name: string;
  rate: number;
};

export type ExpensePaymentMethod = "Bank" | "Cash" | "Afterpay" | "StepPay" | "CreditCard";

export type LiabilityChannel = {
  id: string;
  name: string;
  type: "bnpl" | "bnpl_card" | "credit_card";
  enabled: boolean;
  installmentCount?: number;
  installmentFrequency?: "weekly" | "fortnightly" | "monthly";
  // Payment upfront control
  noPaymentUpfrontEnabled?: boolean;
  noPaymentUpfrontFirstDelayDays?: number;
  linkedRepaymentAccount?: "Bank" | "Cash";
  // StepPay under-minimum behavior
  minimumSplitAmount?: number;
  underMinimumBehaviour?: "single_deduction" | "block";
  underMinimumDeductionDelayDays?: number;
  // Legacy / credit card fields
  firstPaymentDelayDays?: number;
  upfrontPaymentRequired?: boolean;
  minimumPurchaseAmount?: number;
  statementCycleDay?: number;
  paymentDueDay?: number;
  notes?: string;
};

export type Expense = {
  id: string | number;
  type?: "expense";
  amount: number;
  category: string;
  categoryId: string;
  account: ExpenseAccount;
  paymentMethod?: ExpensePaymentMethod;
  liabilityId?: string;
  date: string;
  notes: string;
  isRecurring: boolean;
  recurringFrequency?: "weekly" | "biweekly" | "monthly" | "yearly";
  recurringStartDate?: string;
  recurringEndDate?: string;
  recurringStatus?: "active" | "paused" | "cancelled";
  createdAt: string;
  updatedAt?: string;
};

export type Transfer = {
  id: string | number;
  from_bucket: Bucket;
  to_bucket: Bucket;
  amount: number;
  date: string;
  notes: string;
  trackerId?: string;
};

export type MoneyRecord = {
  id: string | number;
  name: string;
  amount: number;
  date: string;
  phone: string;
  notes: string;
  status: Status;
  affectsAccountBalance?: boolean;
};

export type Person = {
  id: string | number;
  name: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
};

export type LendingTransactionRecord = {
  id: string | number;
  personId: string | number;
  type: "lent" | "borrowed" | "settlement";
  amount: number;
  account?: ExpenseAccount;
  affectsAccountBalance?: boolean;
  date: string;
  note: string;
  createdAt: string;
};

export type LendingTransaction = {
  id: string | number;
  personId?: string | number;
  type: "lent" | "borrowed" | "settlement";
  amount: number;
  account?: ExpenseAccount;
  affectsAccountBalance?: boolean;
  date: string;
  note?: string;
  createdAt?: string;
  legacy?: boolean;
};

export type Liability = {
  id: string;
  type: LiabilityType;
  name: string;
  provider: string;
  originalAmount: number;
  outstandingBalance: number;
  status: LiabilityStatus;
  category: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  purchaseAmount?: number;
  firstPaymentDate?: string;
  numberOfPayments?: number;
  paymentFrequency?: Exclude<LiabilityPaymentFrequency, "yearly">;
  installmentAmount?: number;
  purchaseDate?: string;
  creditLimit?: number;
  currentBalance?: number;
  statementDate?: string;
  dueDate?: string;
  minimumPayment?: number;
  interestRate?: number;
  annualFee?: number;
  charges?: number;
  principalAmount?: number;
  outstandingPrincipal?: number;
  interestType?: LiabilityInterestType;
  compoundingFrequency?: LiabilityCompoundingFrequency;
  repaymentAmount?: number;
  repaymentFrequency?: LiabilityPaymentFrequency;
  startDate?: string;
  endDate?: string;
  termMonths?: number;
  fees?: number;
  discount?: number;
  loanType?: string;
};

export type RepaymentSchedule = {
  id: string;
  liabilityId: string;
  dueDate: string;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  feeAmount: number;
  status: "upcoming" | "paid" | "missed";
  paidDate: string;
  linkedRepaymentAccount?: "Bank" | "Cash";
  processedAt?: string;
  repaymentTransactionId?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type AppNotification = {
  id: string;
  type: "repayment_due" | "repayment_overdue" | "repayment_upcoming" | "insufficient_usable_balance" | "general";
  title: string;
  message: string;
  relatedEntityType?: "repayment_schedule" | "liability";
  relatedEntityId?: string;
  isRead: boolean;
  createdAt: string;
  scheduledFor?: string;
  pushedAt?: string;
  dedupeKey: string;
};

export type LiabilitySettings = {
  bnplProviders: string[];
  creditCardProviders: string[];
  loanTypes: string[];
  repaymentFrequencies: LiabilityPaymentFrequency[];
  defaultInterestType: LiabilityInterestType;
  defaultCompoundingFrequency: LiabilityCompoundingFrequency;
  liabilityChannels?: LiabilityChannel[];
};

export type PersonProfile = {
  id: string | number;
  personId?: string | number;
  name: string;
  phone?: string;
  createdAt: string;
  updatedAt?: string;
  transactions: LendingTransaction[];
  totalLent: number;
  totalBorrowed: number;
  totalSettled: number;
  netBalance: number;
  status: string;
};

export type RemittanceAccount = "Bank" | "Cash" | "RemittanceFund";

export type Remittance = {
  id: string | number;
  audAmount: number;
  exchangeRate: number;
  inrAmount: number;
  account: RemittanceAccount;
  date: string;
  provider?: string;
  notes?: string;
  createdAt: string;
  fromFund?: boolean;
  preExisting?: boolean;
};

export type EditingItemType = "income" | "expense" | "lent" | "borrowed" | "transfer" | "remittance";
export type RecentActivityType =
  | EditingItemType
  | "settlement"
  | "liability_repayment";

export type RecentActivityItem = {
  id: string | number;
  type: RecentActivityType;
  title: string;
  subtitle: string;
  amount: number;
  account?: string;
  createdAt?: string;
  updatedAt?: string;
  date: string;
  source?: "lendingTransaction";
  isRecurring?: boolean;
  paymentProgress?: string;
};
