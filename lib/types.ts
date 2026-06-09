export type Status = "Pending" | "Partly Paid" | "Fully Settled";
export type IncomeType = "Hourly" | "Fixed Amount";
export type ExpenseAccount = "Bank" | "Cash";
export type AccountBucket = "Bank" | "Cash";
export type Bucket = AccountBucket | string;

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

export type Expense = {
  id: string | number;
  type?: "expense";
  amount: number;
  category: string;
  categoryId: string;
  account: ExpenseAccount;
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
};

export type MoneyRecord = {
  id: string | number;
  name: string;
  amount: number;
  date: string;
  phone: string;
  notes: string;
  status: Status;
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

export type EditingItemType = "income" | "expense" | "lent" | "borrowed" | "transfer";
export type RecentActivityType = EditingItemType | "settlement";

export type RecentActivityItem = {
  id: string | number;
  type: RecentActivityType;
  title: string;
  subtitle: string;
  amount: number;
  date: string;
  source?: "lendingTransaction";
  isRecurring?: boolean;
};
