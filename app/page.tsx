"use client";

import { useState } from "react";

type Account = "cash" | "bank";
type Status = "Pending" | "Partly Paid" | "Fully Settled";

type Income = {
  id: number;
  amount: number;
  source: string;
  account: Account;
  date: string;
  notes: string;
};

type Expense = {
  id: number;
  amount: number;
  category: string;
  account: Account;
  date: string;
  notes: string;
};

type MoneyRecord = {
  id: number;
  name: string;
  amount: number;
  date: string;
  phone: string;
  notes: string;
  status: Status;
};

export default function Home() {
  const SHEETS_API_URL = process.env.NEXT_PUBLIC_SHEETS_API_URL;
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [lentRecords, setLentRecords] = useState<MoneyRecord[]>([]);
  const [borrowedRecords, setBorrowedRecords] = useState<MoneyRecord[]>([]);

  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showLentForm, setShowLentForm] = useState(false);
  const [showBorrowedForm, setShowBorrowedForm] = useState(false);
  const [detailsView, setDetailsView] = useState<"lent" | "borrowed" | null>(
    null
  );

  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeSource, setIncomeSource] = useState("Job 1");
  const [incomeAccount, setIncomeAccount] = useState<Account>("bank");
  const [incomeDate, setIncomeDate] = useState("");
  const [incomeNotes, setIncomeNotes] = useState("");

  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Spending Transfer");
  const [expenseAccount, setExpenseAccount] = useState<Account>("bank");
  const [expenseDate, setExpenseDate] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");

  const [moneyName, setMoneyName] = useState("");
  const [moneyAmount, setMoneyAmount] = useState("");
  const [moneyDate, setMoneyDate] = useState("");
  const [moneyPhone, setMoneyPhone] = useState("");
  const [moneyNotes, setMoneyNotes] = useState("");
  const [moneyStatus, setMoneyStatus] = useState<Status>("Pending");

  const baseCash = 420;
  const baseBank = 4400;

  const incomeCash = incomes
    .filter((item) => item.account === "cash")
    .reduce((sum, item) => sum + item.amount, 0);

  const incomeBank = incomes
    .filter((item) => item.account === "bank")
    .reduce((sum, item) => sum + item.amount, 0);

  const expenseCash = expenses
    .filter((item) => item.account === "cash")
    .reduce((sum, item) => sum + item.amount, 0);

  const expenseBank = expenses
    .filter((item) => item.account === "bank")
    .reduce((sum, item) => sum + item.amount, 0);

  const activeLent = lentRecords
    .filter((item) => item.status !== "Fully Settled")
    .reduce((sum, item) => sum + item.amount, 0);

  const activeBorrowed = borrowedRecords
    .filter((item) => item.status !== "Fully Settled")
    .reduce((sum, item) => sum + item.amount, 0);

  const cash = baseCash + incomeCash - expenseCash;
  const bank = baseBank + incomeBank - expenseBank;

  const monthlyIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const monthlyExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

  const totalMoney = cash + bank;
  const netWorth = cash + bank + activeLent - activeBorrowed;
  const remaining = monthlyIncome - monthlyExpenses;

  const recentActivity = [
    ...incomes.map((item) => ({
      id: item.id,
      type: "income",
      title: item.source,
      amount: item.amount,
      date: item.date,
      account: item.account,
    })),
    ...expenses.map((item) => ({
      id: item.id,
      type: "expense",
      title: item.category,
      amount: item.amount,
      date: item.date,
      account: item.account,
    })),
    ...lentRecords.map((item) => ({
      id: item.id,
      type: "lent",
      title: `Lent to ${item.name}`,
      amount: item.amount,
      date: item.date,
      account: item.status,
    })),
    ...borrowedRecords.map((item) => ({
      id: item.id,
      type: "borrowed",
      title: `Borrowed from ${item.name}`,
      amount: item.amount,
      date: item.date,
      account: item.status,
    })),
  ].sort((a, b) => b.id - a.id);

  function getToday() {
    return new Date().toISOString().split("T")[0];
  }

  function resetMoneyForm() {
    setMoneyName("");
    setMoneyAmount("");
    setMoneyDate("");
    setMoneyPhone("");
    setMoneyNotes("");
    setMoneyStatus("Pending");
  }
  
  async function saveToSheet(sheet: string, values: (string | number)[]) {
  if (!SHEETS_API_URL) {
    alert("Sheets API URL missing");
    return false;
  }

  try {
    const response = await fetch(SHEETS_API_URL, {
      method: "POST",
      body: JSON.stringify({
        sheet,
        values,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      alert("Failed to save to Google Sheets");
      return false;
    }

    return true;
  } catch (error) {
    console.error(error);
    alert("Error connecting to Google Sheets");
    return false;
  }
}

  async function addIncome() {
  if (!incomeAmount || Number(incomeAmount) <= 0) return;

  const newIncome: Income = {
    id: Date.now(),
    amount: Number(incomeAmount),
    source: incomeSource,
    account: incomeAccount,
    date: incomeDate || getToday(),
    notes: incomeNotes,
  };

  const saved = await saveToSheet("income", [
    newIncome.id,
    newIncome.amount,
    newIncome.source,
    newIncome.account,
    newIncome.date,
    newIncome.notes,
  ]);

  if (!saved) return;

  setIncomes([newIncome, ...incomes]);
  setIncomeAmount("");
  setIncomeSource("Job 1");
  setIncomeAccount("bank");
  setIncomeDate("");
  setIncomeNotes("");
  setShowIncomeForm(false);
}

 async function addExpense() {
  if (!expenseAmount || Number(expenseAmount) <= 0) return;

  const newExpense: Expense = {
    id: Date.now(),
    amount: Number(expenseAmount),
    category: expenseCategory,
    account: expenseAccount,
    date: expenseDate || getToday(),
    notes: expenseNotes,
  };

  const saved = await saveToSheet("expenses", [
    newExpense.id,
    newExpense.amount,
    newExpense.category,
    newExpense.account,
    newExpense.date,
    newExpense.notes,
  ]);

  if (!saved) return;

  setExpenses([newExpense, ...expenses]);
  setExpenseAmount("");
  setExpenseCategory("Spending Transfer");
  setExpenseAccount("bank");
  setExpenseDate("");
  setExpenseNotes("");
  setShowExpenseForm(false);
}

  async function addLent() {
  if (!moneyName || !moneyAmount || Number(moneyAmount) <= 0) return;

  const newRecord: MoneyRecord = {
    id: Date.now(),
    name: moneyName,
    amount: Number(moneyAmount),
    date: moneyDate || getToday(),
    phone: moneyPhone,
    notes: moneyNotes,
    status: moneyStatus,
  };

  const saved = await saveToSheet("lent", [
    newRecord.id,
    newRecord.name,
    newRecord.amount,
    newRecord.date,
    newRecord.phone,
    newRecord.notes,
    newRecord.status,
  ]);

  if (!saved) return;

  setLentRecords([newRecord, ...lentRecords]);
  resetMoneyForm();
  setShowLentForm(false);
}

  function addBorrowed() {
    if (!moneyName || !moneyAmount || Number(moneyAmount) <= 0) return;

    const newRecord: MoneyRecord = {
      id: Date.now(),
      name: moneyName,
      amount: Number(moneyAmount),
      date: moneyDate || getToday(),
      phone: moneyPhone,
      notes: moneyNotes,
      status: moneyStatus,
    };

    setBorrowedRecords([newRecord, ...borrowedRecords]);
    resetMoneyForm();
    setShowBorrowedForm(false);
  }

  function closeMoneyForms() {
    resetMoneyForm();
    setShowLentForm(false);
    setShowBorrowedForm(false);
  }

  function deleteIncome(id: number) {
  setIncomes(incomes.filter((item) => item.id !== id));
}

function deleteExpense(id: number) {
  setExpenses(expenses.filter((item) => item.id !== id));
}

function deleteLent(id: number) {
  setLentRecords(lentRecords.filter((item) => item.id !== id));
}

function deleteBorrowed(id: number) {
  setBorrowedRecords(borrowedRecords.filter((item) => item.id !== id));
}

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-md px-4 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Money Control</h1>
            <p className="text-sm text-neutral-400">May 2026</p>
          </div>

          <button className="rounded-full bg-neutral-900 px-4 py-2 text-sm text-neutral-300">
            Settings
          </button>
        </header>

        <section className="mb-5 rounded-3xl bg-neutral-900 p-5 shadow-lg">
          <p className="text-sm text-neutral-400">Total Money</p>
          <h2 className="mt-2 text-4xl font-bold">
            ${totalMoney.toLocaleString()}
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-neutral-800 p-4">
              <p className="text-xs text-neutral-400">Cash</p>
              <p className="mt-1 text-xl font-semibold">
                ${cash.toLocaleString()}
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-800 p-4">
              <p className="text-xs text-neutral-400">Bank</p>
              <p className="mt-1 text-xl font-semibold">
                ${bank.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-neutral-800 p-4">
            <p className="text-xs text-neutral-400">Net Worth</p>
            <p className="mt-1 text-2xl font-semibold">
              ${netWorth.toLocaleString()}
            </p>
          </div>
        </section>

        <section className="mb-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowIncomeForm(true)}
            className="rounded-2xl bg-green-500 p-4 text-left font-semibold text-black"
          >
            + Add Income
          </button>

          <button
            onClick={() => setShowExpenseForm(true)}
            className="rounded-2xl bg-red-500 p-4 text-left font-semibold text-black"
          >
            - Add Expense
          </button>

          <button
            onClick={() => setShowLentForm(true)}
            className="rounded-2xl border border-green-500 p-4 text-left font-semibold text-green-400"
          >
            Lent
          </button>

          <button
            onClick={() => setShowBorrowedForm(true)}
            className="rounded-2xl border border-red-500 p-4 text-left font-semibold text-red-400"
          >
            Borrowed
          </button>
        </section>

        <section className="mb-5 rounded-3xl bg-neutral-900 p-5">
          <h3 className="mb-4 text-lg font-semibold">This Month</h3>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-neutral-400">Income</span>
              <span className="text-green-400">
                +${monthlyIncome.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-neutral-400">Expenses</span>
              <span className="text-red-400">
                -${monthlyExpenses.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between border-t border-neutral-800 pt-3">
              <span className="font-medium">Remaining</span>
              <span className="font-semibold">
                ${remaining.toLocaleString()}
              </span>
            </div>
          </div>
        </section>

        <section className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-3xl bg-neutral-900 p-5">
            <p className="text-sm text-neutral-400">Money I Lent</p>
            <p className="mt-2 text-2xl font-bold text-green-400">
              ${activeLent.toLocaleString()}
            </p>
            <button
              onClick={() => setDetailsView("lent")}
              className="mt-3 text-sm text-green-400"
            >
              See More
            </button>
          </div>

          <div className="rounded-3xl bg-neutral-900 p-5">
            <p className="text-sm text-neutral-400">Money I Borrowed</p>
            <p className="mt-2 text-2xl font-bold text-red-400">
              ${activeBorrowed.toLocaleString()}
            </p>
            <button
              onClick={() => setDetailsView("borrowed")}
              className="mt-3 text-sm text-red-400"
            >
              See More
            </button>
          </div>
        </section>

        <section className="rounded-3xl bg-neutral-900 p-5">
          <h3 className="mb-4 text-lg font-semibold">Recent Activity</h3>

          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-neutral-500">No activity yet.</p>
            ) : (
              recentActivity.map((item) => {
                const isPositive =
                  item.type === "income" || item.type === "lent";

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="flex items-center justify-between rounded-2xl bg-neutral-800 p-4"
                  >
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-xs text-neutral-400">
                        {item.date} • {item.account}
                      </p>
                    </div>

                   <div className="text-right">
  <p className={isPositive ? "text-green-400" : "text-red-400"}>
    {isPositive ? "+" : "-"}${item.amount.toLocaleString()}
  </p>

  <button
    onClick={() => {
      if (item.type === "income") deleteIncome(item.id);
      if (item.type === "expense") deleteExpense(item.id);
      if (item.type === "lent") deleteLent(item.id);
      if (item.type === "borrowed") deleteBorrowed(item.id);
    }}
    className="mt-1 text-xs text-neutral-500"
  >
    Delete
  </button>
</div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {showIncomeForm && (
        <div className="fixed inset-0 flex items-end bg-black/70 px-4 pb-4">
          <div className="w-full rounded-3xl bg-neutral-900 p-5">
            <h2 className="mb-4 text-xl font-bold">Add Income</h2>

            <div className="space-y-3">
              <input
                type="number"
                placeholder="Amount"
                value={incomeAmount}
                onChange={(e) => setIncomeAmount(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <select
                value={incomeSource}
                onChange={(e) => setIncomeSource(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              >
                <option>Job 1</option>
                <option>Job 2</option>
                <option>Side Hustle</option>
                <option>Business</option>
                <option>Refund</option>
                <option>Gift</option>
              </select>

              <select
                value={incomeAccount}
                onChange={(e) => setIncomeAccount(e.target.value as Account)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              >
                <option value="bank">Bank</option>
                <option value="cash">Cash</option>
              </select>

              <input
                type="date"
                value={incomeDate}
                onChange={(e) => setIncomeDate(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <textarea
                placeholder="Notes"
                value={incomeNotes}
                onChange={(e) => setIncomeNotes(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowIncomeForm(false)}
                className="rounded-2xl bg-neutral-800 p-4 font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={addIncome}
                className="rounded-2xl bg-green-500 p-4 font-semibold text-black"
              >
                Save Income
              </button>
            </div>
          </div>
        </div>
      )}

      {showExpenseForm && (
        <div className="fixed inset-0 flex items-end bg-black/70 px-4 pb-4">
          <div className="w-full rounded-3xl bg-neutral-900 p-5">
            <h2 className="mb-4 text-xl font-bold">Add Expense</h2>

            <div className="space-y-3">
              <input
                type="number"
                placeholder="Amount"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              >
                <option>Spending Transfer</option>
                <option>Rent</option>
                <option>Food</option>
                <option>Transport</option>
                <option>Laundry</option>
                <option>Phone</option>
                <option>Visa</option>
                <option>College</option>
                <option>Gym</option>
                <option>Subscriptions</option>
                <option>Business</option>
                <option>Shopify</option>
                <option>Ads</option>
                <option>Emergency</option>
                <option>Other</option>
              </select>

              <select
                value={expenseAccount}
                onChange={(e) => setExpenseAccount(e.target.value as Account)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              >
                <option value="bank">Bank</option>
                <option value="cash">Cash</option>
              </select>

              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <textarea
                placeholder="Notes"
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowExpenseForm(false)}
                className="rounded-2xl bg-neutral-800 p-4 font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={addExpense}
                className="rounded-2xl bg-red-500 p-4 font-semibold text-black"
              >
                Save Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {(showLentForm || showBorrowedForm) && (
        <div className="fixed inset-0 flex items-end bg-black/70 px-4 pb-4">
          <div className="w-full rounded-3xl bg-neutral-900 p-5">
            <h2 className="mb-4 text-xl font-bold">
              {showLentForm ? "Add Lent Money" : "Add Borrowed Money"}
            </h2>

            <div className="space-y-3">
              <input
                type="text"
                placeholder={showLentForm ? "Borrower name" : "Lender name"}
                value={moneyName}
                onChange={(e) => setMoneyName(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <input
                type="number"
                placeholder="Amount"
                value={moneyAmount}
                onChange={(e) => setMoneyAmount(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <input
                type="date"
                value={moneyDate}
                onChange={(e) => setMoneyDate(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <input
                type="tel"
                placeholder="Phone number optional"
                value={moneyPhone}
                onChange={(e) => setMoneyPhone(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />

              <select
                value={moneyStatus}
                onChange={(e) => setMoneyStatus(e.target.value as Status)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              >
                <option>Pending</option>
                <option>Partly Paid</option>
                <option>Fully Settled</option>
              </select>

              <textarea
                placeholder="Notes"
                value={moneyNotes}
                onChange={(e) => setMoneyNotes(e.target.value)}
                className="w-full rounded-2xl bg-neutral-800 p-4 outline-none"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={closeMoneyForms}
                className="rounded-2xl bg-neutral-800 p-4 font-semibold"
              >
                Cancel
              </button>

              <button
                onClick={showLentForm ? addLent : addBorrowed}
                className={`rounded-2xl p-4 font-semibold text-black ${
                  showLentForm ? "bg-green-500" : "bg-red-500"
                }`}
              >
                {showLentForm ? "Save Lent" : "Save Borrowed"}
              </button>
            </div>
          </div>
        </div>
      )}

      {detailsView && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-neutral-950 px-4 py-6 text-white">
          <div className="mx-auto max-w-md">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  {detailsView === "lent"
                    ? "Money I Lent"
                    : "Money I Borrowed"}
                </h2>
                <p className="text-sm text-neutral-400">
                  {detailsView === "lent"
                    ? "People who owe you money"
                    : "People you owe money to"}
                </p>
              </div>

              <button
                onClick={() => setDetailsView(null)}
                className="rounded-full bg-neutral-900 px-4 py-2 text-sm"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              {(detailsView === "lent" ? lentRecords : borrowedRecords)
                .length === 0 ? (
                <p className="rounded-2xl bg-neutral-900 p-4 text-sm text-neutral-500">
                  No records yet.
                </p>
              ) : (
                (detailsView === "lent" ? lentRecords : borrowedRecords).map(
                  (item) => (
                    <div key={item.id} className="rounded-3xl bg-neutral-900 p-5">
                      <div className="mb-3 flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold">{item.name}</p>
                          <p className="text-sm text-neutral-400">{item.date}</p>
                        </div>

                        <p
                          className={
                            detailsView === "lent"
                              ? "text-xl font-bold text-green-400"
                              : "text-xl font-bold text-red-400"
                          }
                        >
                          ${item.amount.toLocaleString()}
                        </p>
                      </div>

                      <div className="space-y-2 text-sm text-neutral-300">
                        <p>Status: {item.status}</p>
                        {item.phone && <p>Phone: {item.phone}</p>}
                        {item.notes && <p>Notes: {item.notes}</p>}
                        <button
  onClick={() => {
    if (detailsView === "lent") deleteLent(item.id);
    if (detailsView === "borrowed") deleteBorrowed(item.id);
  }}
  className="mt-3 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-black"
>
  Delete
</button>
                      </div>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}