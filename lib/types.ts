export type Status = "Pending" | "Partly Paid" | "Fully Settled";
export type IncomeType = "Hourly" | "Fixed Amount";
export type ExpenseAccount = "Usable Balance" | "Cash";
export type Bucket =
  | "Usable Balance"
  | "Emergency Fund"
  | "Debt Repayment"
  | "Remittance Fund"
  | "Cash";

export type Income = {
  id: number;
  income_type: "Hourly" | "Fixed Amount";
  source: string;
  rate: number;
  hours: number;
  amount: number;
  cash_received: number;
  date: string;
  notes: string;
};

export type Expense = {
  id: number;
  amount: number;
  category: string;
  account: ExpenseAccount;
  date: string;
  notes: string;
};

export type Transfer = {
  id: number;
  from_bucket: Bucket;
  to_bucket: Bucket;
  amount: number;
  date: string;
  notes: string;
};

export type MoneyRecord = {
  id: number;
  name: string;
  amount: number;
  date: string;
  phone: string;
  notes: string;
  status: Status;
};

export type EditingItemType = "income" | "expense" | "lent" | "borrowed" | "transfer";

export type RecentActivityItem = {
  id: number;
  type: EditingItemType;
  title: string;
  subtitle: string;
  amount: number;
  date: string;
};
