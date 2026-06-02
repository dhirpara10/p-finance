export type FinanceNotification = {
  title: string;
  body: string;
};

export const DAILY_FINANCE_NOTIFICATIONS: FinanceNotification[] = [
  {
    title: "Log today before you forget",
    body: "Small expenses disappear from memory fast. Add them now.",
  },
  {
    title: "Money check",
    body: "Did you spend anything today? Record it before it becomes guesswork.",
  },
  {
    title: "Don’t lie to your budget",
    body: "If you spent it, log it. Ignoring it doesn’t make it free.",
  },
  {
    title: "Quick finance check",
    body: "Add today’s income, expense, or transfer in under 30 seconds.",
  },
  {
    title: "Your future self needs clean data",
    body: "Update today’s transactions so your monthly numbers stay accurate.",
  },
  {
    title: "Expense memory is unreliable",
    body: "You won’t remember every coffee, snack, or transfer later. Add it now.",
  },
  {
    title: "Daily money reset",
    body: "One minute now saves confusion at the end of the month.",
  },
  {
    title: "Spending check",
    body: "Did your money move today? Income, expense, transfer, or lending — log it.",
  },
  {
    title: "No fake numbers",
    body: "Your dashboard is only useful if you keep it updated.",
  },
  {
    title: "Track it while it’s fresh",
    body: "Open the app and add today’s real numbers.",
  },
  {
    title: "Budget discipline check",
    body: "If you want control, you need records. Add today’s spending.",
  },
  {
    title: "Don’t wait for month-end",
    body: "Month-end panic comes from ignoring daily entries.",
  },
  {
    title: "Money moved?",
    body: "Add income, expense, transfer, lending, or settlement if anything changed.",
  },
  {
    title: "One clean habit",
    body: "Update your finance app once today. That’s enough.",
  },
  {
    title: "Reality check",
    body: "Your bank balance tells part of the story. Your records tell the full story.",
  },
  {
    title: "Keep the dashboard honest",
    body: "Log today’s activity so your totals don’t become useless.",
  },
  {
    title: "Fast update",
    body: "Take 20 seconds: add today’s spending or income.",
  },
  {
    title: "Did you spend from cash?",
    body: "Cash expenses are easiest to forget. Record them now.",
  },
  {
    title: "Transfer check",
    body: "Moved money between buckets today? Log the transfer.",
  },
  {
    title: "Debt/lending check",
    body: "Did someone borrow, repay, or settle? Add it before you forget.",
  },
  {
    title: "Savings check",
    body: "Any money moved to emergency fund or remittance? Track it.",
  },
  {
    title: "Don’t make your app useless",
    body: "A finance tracker without daily updates is just decoration.",
  },
  {
    title: "Today’s money audit",
    body: "Open the app. Add what changed. Done.",
  },
  {
    title: "Small leak check",
    body: "Tiny expenses become big totals. Log today’s leaks.",
  },
  {
    title: "Clean data day",
    body: "Your future reports depend on what you enter today.",
  },
  {
    title: "No guessing later",
    body: "Update today’s transactions while you still remember them.",
  },
  {
    title: "Control starts with tracking",
    body: "Add today’s income, expense, or transfer.",
  },
  {
    title: "Before you sleep",
    body: "One quick money update before the day ends.",
  },
  {
    title: "Budget truth time",
    body: "Did you actually stay on plan today? Log it and check.",
  },
  {
    title: "Your money moved today",
    body: "Make sure your app knows where it went.",
  },
];

export function getDailyFinanceNotification(
  date = new Date()
): FinanceNotification {
  const dayIndex = Math.floor(date.getTime() / 86400000);
  const message = DAILY_FINANCE_NOTIFICATIONS[
    dayIndex % DAILY_FINANCE_NOTIFICATIONS.length
  ];
  return message;
}
