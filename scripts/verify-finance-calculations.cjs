const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    request = path.join(root, request.slice(2));
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

require.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  module._compile(output, filename);
};

const { calculateDashboardValues } = require("../lib/calculations.ts");
const {
  applyRepaymentToLiability,
  getDueBnplRepayments,
} = require("../lib/liabilities.ts");

const today = new Date().toISOString().slice(0, 10);
const empty = {
  incomes: [],
  expenses: [],
  transfers: [],
  people: [],
  lendingTransactions: [],
  lentRecords: [],
  borrowedRecords: [],
  liabilities: [],
  repaymentSchedules: [],
  initialCashBalance: 0,
  initialBankBalance: 0,
  savingsBuckets: [],
  bucketListTrackers: [],
  sharedRolloverJarBalance: 0,
  monthlyResetDay: 1,
};

function calculate(overrides = {}) {
  return calculateDashboardValues({ ...empty, ...overrides });
}

function closeTo(actual, expected, message) {
  assert.ok(
    Math.abs(actual - expected) < 0.001,
    `${message}: expected ${expected}, received ${actual}`
  );
}

function run(name, test) {
  test();
  console.log(`PASS ${name}`);
}

run("income and expense update the selected account once", () => {
  const result = calculate({
    initialBankBalance: 100,
    initialCashBalance: 20,
    incomes: [
      {
        id: "income-1",
        income_type: "Fixed Amount",
        source: "Work",
        rate: 0,
        hours: 0,
        amount: 200,
        cash_received: 50,
        date: today,
        notes: "",
      },
    ],
    expenses: [
      {
        id: "expense-1",
        amount: 30,
        category: "Food",
        categoryId: "category_food",
        account: "Cash",
        date: today,
        notes: "",
        isRecurring: false,
        createdAt: today,
      },
    ],
  });

  closeTo(result.bankBalance, 250, "bank balance");
  closeTo(result.cashBalance, 40, "cash balance");
  closeTo(result.totalMoney, 290, "total money");
});

run("account transfer preserves total money", () => {
  const result = calculate({
    initialBankBalance: 500,
    transfers: [
      {
        id: "transfer-1",
        from_bucket: "Bank",
        to_bucket: "Cash",
        amount: 125,
        date: today,
        notes: "",
      },
    ],
  });

  closeTo(result.bankBalance, 375, "bank after transfer");
  closeTo(result.cashBalance, 125, "cash after transfer");
  closeTo(result.totalMoney, 500, "transfer total money");
});

run("protected savings move real money without changing net worth", () => {
  const bucket = {
    id: "savings_emergency_fund",
    name: "Emergency Fund",
    targetAmount: 1000,
    currentBalance: 0,
    linkedStorageLabel: "Bank",
    active: true,
    createdAt: today,
    updatedAt: today,
  };
  const result = calculate({
    initialBankBalance: 500,
    savingsBuckets: [bucket],
    transfers: [
      {
        id: "transfer-2",
        from_bucket: "Bank",
        to_bucket: bucket.id,
        amount: 200,
        date: today,
        notes: "",
      },
    ],
  });

  closeTo(result.bankBalance, 300, "bank after savings allocation");
  closeTo(result.savingsBucketBalances[0].currentBalance, 200, "bucket balance");
  closeTo(result.netWorth, 500, "savings allocation net worth");
});

run("shared jar transfer debits Bank and remains an asset", () => {
  const result = calculate({
    initialBankBalance: 500,
    transfers: [
      {
        id: "transfer-3",
        from_bucket: "Bank",
        to_bucket: "shared_rollover_jar",
        amount: 200,
        date: today,
        notes: "",
      },
    ],
  });

  closeTo(result.bankBalance, 300, "bank after jar allocation");
  closeTo(result.sharedRolloverJar.storedBalance, 200, "stored jar balance");
  closeTo(result.sharedRolloverJar.monthlyAllocation, 200, "jar monthly inflow");
  closeTo(result.sharedRolloverJar.available, 200, "jar available balance");
  closeTo(result.netWorth, 500, "jar allocation net worth");
});

run("shared jar uses real transfers and normalized tracker categories", () => {
  const result = calculate({
    initialBankBalance: 1000,
    transfers: [
      {
        id: "jar-transfer",
        from_bucket: "Bank",
        to_bucket: "shared_rollover_jar",
        amount: 100,
        date: today,
        notes: "",
      },
    ],
    expenses: [
      {
        id: "food-expense",
        amount: 33,
        category: " Food ",
        categoryId: "CATEGORY_FOOD",
        account: "Bank",
        date: today,
        notes: "",
        isRecurring: false,
        createdAt: today,
      },
    ],
    bucketListTrackers: [
      {
        id: "tracker-food",
        name: "Food",
        icon: "Compass",
        monthlyBudget: 10000,
        linkedCategoryIds: ["category_food"],
        active: true,
        createdAt: today,
        updatedAt: today,
      },
    ],
  });

  closeTo(result.trackerSummaries[0].spentThisMonth, 33, "tracker spend");
  closeTo(
    result.trackerSummaries[0].remainingThisMonth,
    9967,
    "tracker remaining"
  );
  closeTo(result.sharedRolloverJar.monthlyAllocation, 100, "real jar inflow");
  closeTo(result.sharedRolloverJar.spentThisMonth, 33, "jar tracked spend");
  closeTo(result.sharedRolloverJar.monthlyResult, 67, "jar month result");
  closeTo(result.sharedRolloverJar.available, 67, "jar available");
});

run("BNPL commitment and repayment are not double-counted", () => {
  const liability = {
    id: "bnpl-1",
    type: "bnpl",
    name: "Phone",
    provider: "Afterpay",
    originalAmount: 400,
    outstandingBalance: 400,
    status: "active",
    category: "Tech",
    notes: "",
    createdAt: today,
    updatedAt: today,
  };
  const before = calculate({
    initialBankBalance: 1000,
    liabilities: [liability],
  });
  closeTo(before.usableBalance, 600, "BNPL usable balance");
  closeTo(before.netWorth, 600, "BNPL net worth");

  const after = calculate({
    initialBankBalance: 1000,
    liabilities: [{ ...liability, outstandingBalance: 300 }],
    repaymentSchedules: [
      {
        id: "payment-1",
        liabilityId: liability.id,
        dueDate: today,
        amount: 100,
        principalAmount: 100,
        interestAmount: 0,
        feeAmount: 0,
        status: "paid",
        paidDate: today,
        notes: "",
        createdAt: today,
        updatedAt: today,
      },
    ],
  });
  closeTo(after.bankBalance, 900, "BNPL repayment bank balance");
  closeTo(after.netWorth, 600, "BNPL repayment net worth");
});

run("due BNPL repayments are selected once and reduce outstanding balance", () => {
  const liability = {
    id: "bnpl-auto",
    type: "bnpl",
    name: "Shoes",
    provider: "Afterpay",
    originalAmount: 700,
    outstandingBalance: 700,
    status: "active",
    category: "Shopping",
    notes: "",
    createdAt: today,
    updatedAt: today,
  };
  const schedules = [0, 1, 2, 3].map((index) => ({
    id: `auto-${index + 1}`,
    liabilityId: liability.id,
    dueDate:
      index < 2
        ? today
        : new Date(Date.now() + (index + 1) * 86400000)
            .toISOString()
            .slice(0, 10),
    amount: 175,
    principalAmount: 175,
    interestAmount: 0,
    feeAmount: 0,
    status: "upcoming",
    paidDate: "",
    notes: "",
    createdAt: today,
    updatedAt: today,
  }));

  const due = getDueBnplRepayments({
    liabilities: [liability],
    schedules,
    today,
  });
  assert.equal(due.length, 2);
  const afterFirst = applyRepaymentToLiability(liability, due[0]);
  const afterSecond = applyRepaymentToLiability(afterFirst, due[1]);
  closeTo(afterSecond.outstandingBalance, 350, "two BNPL repayments");

  const processed = {
    ...due[0],
    status: "paid",
    paidDate: today,
    processedAt: new Date().toISOString(),
    repaymentTransactionId: `repayment:${due[0].id}`,
  };
  const remainingDue = getDueBnplRepayments({
    liabilities: [afterFirst],
    schedules: [processed, ...schedules.slice(1)],
    today,
  });
  assert.equal(remainingDue.length, 1);
});

run("credit card commitment reduces usable balance", () => {
  const result = calculate({
    initialBankBalance: 1000,
    liabilities: [
      {
        id: "card-1",
        type: "credit_card",
        name: "Main card",
        provider: "Bank",
        originalAmount: 250,
        outstandingBalance: 250,
        status: "active",
        category: "Card",
        notes: "",
        createdAt: today,
        updatedAt: today,
      },
    ],
  });
  closeTo(result.usableBalance, 750, "card usable balance");
  closeTo(result.netWorth, 750, "card net worth");
});

run("loan commitment uses upcoming payment and principal-only reduction", () => {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);
  const due = dueDate.toISOString().slice(0, 10);
  const liability = {
    id: "loan-1",
    type: "loan",
    name: "Personal loan",
    provider: "Bank",
    originalAmount: 1000,
    outstandingBalance: 1000,
    status: "active",
    category: "Loan",
    notes: "",
    createdAt: today,
    updatedAt: today,
  };
  const schedule = {
    id: "loan-payment-1",
    liabilityId: liability.id,
    dueDate: due,
    amount: 100,
    principalAmount: 80,
    interestAmount: 20,
    feeAmount: 0,
    status: "upcoming",
    paidDate: "",
    notes: "",
    createdAt: today,
    updatedAt: today,
  };
  const before = calculate({
    initialBankBalance: 1000,
    liabilities: [liability],
    repaymentSchedules: [schedule],
  });
  closeTo(before.usableBalance, 1000, "loan usable balance");
  closeTo(before.safeToSpend, 900, "loan safe to spend");

  const after = calculate({
    initialBankBalance: 1000,
    liabilities: [{ ...liability, outstandingBalance: 920 }],
    repaymentSchedules: [{ ...schedule, status: "paid", paidDate: today }],
  });
  closeTo(after.bankBalance, 900, "loan repayment bank balance");
  closeTo(after.netWorth, -20, "loan interest net worth effect");
});

run("lending, borrowing, and settlements move cash in the right direction", () => {
  const people = [
    {
      id: "person-1",
      name: "Alex",
      phone: "",
      createdAt: today,
      updatedAt: today,
    },
  ];
  const lentAndSettled = calculate({
    initialBankBalance: 1000,
    people,
    lendingTransactions: [
      {
        id: "lending-1",
        personId: "person-1",
        type: "lent",
        amount: 100,
        account: "Bank",
        affectsAccountBalance: true,
        date: today,
        note: "",
        createdAt: today,
      },
      {
        id: "lending-2",
        personId: "person-1",
        type: "settlement",
        amount: 40,
        account: "Bank",
        affectsAccountBalance: true,
        date: today,
        note: "",
        createdAt: today,
      },
    ],
  });
  closeTo(lentAndSettled.bankBalance, 940, "lending settlement bank balance");
  closeTo(lentAndSettled.activeLent, 60, "remaining receivable");
  closeTo(lentAndSettled.netWorth, 1000, "lending settlement net worth");

  const borrowed = calculate({
    initialBankBalance: 1000,
    people,
    lendingTransactions: [
      {
        id: "lending-3",
        personId: "person-1",
        type: "borrowed",
        amount: 100,
        account: "Bank",
        affectsAccountBalance: true,
        date: today,
        note: "",
        createdAt: today,
      },
      {
        id: "lending-4",
        personId: "person-1",
        type: "settlement",
        amount: 40,
        account: "Bank",
        affectsAccountBalance: true,
        date: today,
        note: "",
        createdAt: today,
      },
    ],
  });
  closeTo(borrowed.bankBalance, 1060, "borrowing settlement bank balance");
  closeTo(borrowed.activeBorrowed, 60, "remaining personal debt");
  closeTo(borrowed.netWorth, 1000, "borrowing settlement net worth");
});

console.log("All finance calculation checks passed.");
