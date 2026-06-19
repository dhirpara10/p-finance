# Personal Finance App

A full-stack personal finance tracker built for real daily use — tracking income, expenses, savings, lending, liabilities, remittances, and net worth across multiple accounts and currencies.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (single-table pattern) |
| Auth | Supabase Auth |
| Hosting | Vercel |
| PWA | Web Push (VAPID) |

## Features

### Income
- Log income from multiple named sources (salary, freelance, etc.)
- Supports cash vs. bank split per income entry
- Recurring income flag
- Added-by field (me / spouse)

### Expenses
- Single "Payment source" field: Bank, Cash, Afterpay, StepPay, CreditCard, SharedJar
- Auto-detects tracker-linked categories and defaults to SharedJar
- BNPL and credit card expenses skip immediate bank deduction — deducted via repayment schedules instead
- SharedJar expenses charged to the lifestyle tracker jar, not bank
- Recurring expense flag, added-by field

### Transfers
- Move money between: Bank, Cash, Savings Buckets, SharedJar, RemittanceFund
- All transfers appear in Recent Activity with → sign

### Savings Buckets
- Named savings targets with goal amounts and deadlines
- Transfer in/out to/from Bank
- Progress visualised per bucket

### Lifestyle Trackers / Shared Jar
- Monthly budget trackers linked to expense categories
- Expenses tagged to a tracker-linked category auto-allocate to the SharedJar
- Tracks spent vs. budget per tracker
- SharedJar rollover balance carries month-to-month

### Lending & Borrowing
- Log money lent to or borrowed from named people
- Mark as affecting bank balance or not
- Settlements reduce outstanding balance
- All lending transactions appear in Recent Activity

### Liabilities (BNPL / Credit Card / Loans)
- Add liabilities: Afterpay, StepPay, CreditCard, Loan
- Auto-generates repayment schedules with configurable installments and delays
- Mark individual installments as paid
- Paid installments deduct from bank balance
- Liability progress tracked per provider

### Remittances
- Send money abroad: AUD amount, exchange rate, foreign currency amount
- Optional charges (AUD) and tax (AUD) fields — included in total bank deduction
- Source account: Bank, Cash, or RemittanceFund
- All remittances appear in Recent Activity

### Asset Vault
- Track assets by category: property, vehicles, investments, crypto, superannuation, and more
- Category grid home screen with drill-down per category
- Add/edit/delete assets with current value and notes
- Total asset value contributes to net worth

### Dreams & Goals
- Track financial goals with target amounts and deadlines
- Category-first layout matching Asset Vault design
- Visual progress toward each goal

### Recent Activity
- Unified feed of every real money movement: income, expenses, transfers, remittances, lending, repayments
- Colour-coded icons per transaction type
- Account badge (Bank, Cash, Fund, Afterpay, etc.) per item
- Added-by badge (me / spouse names)
- Recurring badge, payment progress badge (e.g., "2/4")
- Inline edit and delete for each transaction type
- Search by title, subtitle, or account
- Type filter chips: All, Income, Expenses, Transfers, Remittance, Lent, Borrowed, Settlements, Repayments

### Activity Tab
- Full history view using the same Recent Activity component
- Shows identical data to the Recent Activity card on the dashboard
- Supports same search and type filters

### Statistics & Reports
- Monthly income vs. expense charts
- Net worth over time
- Per-category expense breakdown
- Export to PDF

### Push Notifications
- PWA push notifications via VAPID / web-push
- BNPL repayment alerts: notifies when a repayment is due today, tomorrow, or overdue
- Bank-balance gating: push sent only when bank balance covers the repayment; in-app-only when insufficient
- Stable dedup key per instalment — never re-notifies the same repayment
- Notification panel in-app with read/unread state and clear all

### Settings
- Initial bank and cash balance configuration
- Currency symbol selection
- Income source management (name, rate)
- Savings bucket management
- Lifestyle tracker management with linked categories
- Liability management with repayment schedule configuration
- Personal names (me / spouse) for added-by display
- Dark / light mode toggle

## Architecture

### Data Model
Single Supabase table: `app_rows(sheet TEXT, id TEXT, data JSONB)`. Each feature is a named sheet (e.g., `income`, `expenses`, `transfers`, `Liabilities`, `RepaymentSchedules`, `LendingTransactions`, `remittances`, `app_notifications`, `settings`).

### Balance Calculation
All balances computed client-side from raw sheet data on every load — no cached balance columns. Formula:

```
Bank Balance = initial_bank
  + income (minus cash portion)
  − bank expenses (excluding BNPL, credit card, SharedJar)
  ± transfers to/from bank
  − paid repayment schedules (bank-sourced)
  ± lending transactions (bank-affecting)
  − remittances (bank-sourced, including charges + tax)
```

### Transaction Engine
`lib/engine/` — double-entry ledger engine:
- `generateLedgerEntries()` — maps each transaction type to debit/credit pairs
- `validateTransaction()` — pre-flight checks before commit
- `createFinanceTransaction()` — atomic write with rollback on failure

## Running Locally

```bash
npm install
cp .env.example .env.local
# Fill in:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
# NEXT_PUBLIC_VAPID_PUBLIC_KEY
# VAPID_PRIVATE_KEY
# VAPID_SUBJECT
npm run dev
```

## Tests

```bash
node scripts/test-engine.cjs              # Transaction engine: 20 tests
node scripts/test-bnpl-notifications.cjs  # BNPL notification logic: 14 tests
```

## Navigation

| Page | Path |
|---|---|
| Dashboard | `/` |
| Income | `/income` |
| Expenses | `/expenses` |
| Transfers | `/transfers` |
| Savings | `/savings` |
| Lifestyle Trackers | `/trackers` |
| Lending | `/lending` |
| Liabilities | `/liabilities` |
| Remittance | `/remittance` |
| Asset Vault | `/vault` |
| Dreams & Goals | `/goals` |
| Activity | `/logs` |
| Statistics | `/statistics` |
| Settings | `/settings` |
