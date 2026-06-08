"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Props = { state: FinanceDashboardState };
const colors = ["#34d399", "#38bdf8", "#a78bfa", "#fb923c", "#f472b6", "#22d3ee", "#facc15"];

function monthKey(date: string) {
  const value = new Date(date);
  return Number.isNaN(value.getTime())
    ? "Unknown"
    : value.toLocaleString("en-AU", { month: "short", year: "2-digit" });
}

function AnalyticsCard({ title, subtitle, className = "", children }: { title: string; subtitle: string; className?: string; children: ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className={`rounded-3xl border border-neutral-800 bg-neutral-900 p-5 ${className}`}>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mb-4 text-sm text-neutral-500">{subtitle}</p>
      {children}
    </motion.section>
  );
}

export function Statistics({ state }: Props) {
  const { incomes, effectiveExpenses, currencySymbol, trackerSummaries, sharedRolloverJar, activeLent, activeBorrowed, monthlyHours, savingsBucketBalances } = state;
  const grouped = new Map<string, { month: string; income: number; expenses: number; hours: number }>();
  incomes.forEach((item) => {
    const key = monthKey(item.date);
    const row = grouped.get(key) || { month: key, income: 0, expenses: 0, hours: 0 };
    row.income += item.amount;
    row.hours += item.hours;
    grouped.set(key, row);
  });
  effectiveExpenses.forEach((item) => {
    const key = monthKey(item.date);
    const row = grouped.get(key) || { month: key, income: 0, expenses: 0, hours: 0 };
    row.expenses += item.amount;
    grouped.set(key, row);
  });
  const monthly = [...grouped.values()].slice(-12).map((row, index, rows) => ({
    ...row,
    remaining: row.income - row.expenses,
    netWorth: rows.slice(0, index + 1).reduce((sum, item) => sum + item.income - item.expenses, 0),
  }));
  const categoryMap = new Map<string, number>();
  effectiveExpenses.forEach((expense) => categoryMap.set(expense.category, (categoryMap.get(expense.category) || 0) + expense.amount));
  const categories = [...categoryMap.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  const jarData = monthly.map((row, index) => ({
    month: row.month,
    allocation: sharedRolloverJar.monthlyAllocation,
    spending: row.expenses,
    available: sharedRolloverJar.previousBalance + sharedRolloverJar.monthlyAllocation * (index + 1) - monthly.slice(0, index + 1).reduce((sum, item) => sum + item.expenses, 0),
  }));
  const tooltipStyle = { background: "#171717", border: "1px solid #333", borderRadius: 14 };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-emerald-300">FINANCIAL INTELLIGENCE</p>
        <h2 className="mt-1 text-3xl font-bold">Stats & Analytics</h2>
        <p className="mt-1 text-neutral-500">Patterns, momentum, and the story behind your money.</p>
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <AnalyticsCard title="Net Worth Trend" subtitle="Financial movement across recorded months">
          <div className="h-72"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthly}><defs><linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38bdf8" stopOpacity={0.45}/><stop offset="100%" stopColor="#34d399" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#262626" vertical={false}/><XAxis dataKey="month" stroke="#737373" tickLine={false}/><YAxis hide/><Tooltip contentStyle={tooltipStyle}/><Area type="monotone" dataKey="netWorth" stroke="#38bdf8" strokeWidth={3} fill="url(#netWorthFill)"/></AreaChart></ResponsiveContainer></div>
        </AnalyticsCard>
        <AnalyticsCard title="Income vs Expense" subtitle="How much arrived, left, and remained">
          <div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthly}><CartesianGrid stroke="#262626" vertical={false}/><XAxis dataKey="month" stroke="#737373" tickLine={false}/><YAxis hide/><Tooltip contentStyle={tooltipStyle}/><Legend/><Line type="monotone" dataKey="income" stroke="#34d399" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="expenses" stroke="#fb7185" strokeWidth={3} dot={false}/><Line type="monotone" dataKey="remaining" stroke="#38bdf8" strokeWidth={2} dot={false}/></LineChart></ResponsiveContainer></div>
        </AnalyticsCard>
        <AnalyticsCard title="Monthly Spending" subtitle="Compare spending intensity month by month">
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly}><CartesianGrid stroke="#262626" vertical={false}/><XAxis dataKey="month" stroke="#737373" tickLine={false}/><YAxis hide/><Tooltip contentStyle={tooltipStyle}/><Bar dataKey="expenses" fill="#fb7185" radius={[10,10,3,3]}/></BarChart></ResponsiveContainer></div>
        </AnalyticsCard>
        <AnalyticsCard title="Category Breakdown" subtitle="Where discretionary and essential spending goes">
          <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>{categories.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]}/>)}</Pie><Tooltip contentStyle={tooltipStyle}/><Legend/></PieChart></ResponsiveContainer></div>
        </AnalyticsCard>
        <AnalyticsCard title="Shared Rollover Jar Analytics" subtitle="One lifestyle pool: allocations, spending, and carry-forward" className="border-purple-500/25 bg-purple-500/[0.06]">
          <div className="mb-4 grid grid-cols-3 gap-2 text-sm"><div className="rounded-2xl bg-neutral-950 p-3"><p className="text-neutral-500">Available</p><p className="font-bold text-purple-200">{currencySymbol}{sharedRolloverJar.available.toLocaleString()}</p></div><div className="rounded-2xl bg-neutral-950 p-3"><p className="text-neutral-500">Allocated</p><p className="font-bold">{currencySymbol}{sharedRolloverJar.monthlyAllocation.toLocaleString()}</p></div><div className="rounded-2xl bg-neutral-950 p-3"><p className="text-neutral-500">Result</p><p className="font-bold text-purple-300">{currencySymbol}{sharedRolloverJar.monthlyResult.toLocaleString()}</p></div></div>
          <div className="h-56"><ResponsiveContainer width="100%" height="100%"><AreaChart data={jarData}><XAxis dataKey="month" stroke="#737373" tickLine={false}/><YAxis hide/><Tooltip contentStyle={tooltipStyle}/><Area type="monotone" dataKey="available" stroke="#a78bfa" strokeWidth={3} fill="#a78bfa22"/></AreaChart></ResponsiveContainer></div>
        </AnalyticsCard>
        <AnalyticsCard title="Bucket Usage Progress" subtitle="Virtual tracker health, not separate balances">
          <div className="space-y-4">{trackerSummaries.map((tracker) => { const width = Math.min(100, tracker.progress); const statusColor = tracker.status === "Overspent" ? "text-red-300 bg-red-500/15" : tracker.status === "Near Limit" ? "text-orange-300 bg-orange-500/15" : "text-green-300 bg-green-500/15"; return <div key={tracker.id}><div className="mb-2 flex items-center justify-between gap-2"><span className="font-medium">{tracker.name}</span><span className={`rounded-full px-2 py-1 text-xs ${statusColor}`}>{tracker.status}</span></div><div className="h-2 overflow-hidden rounded-full bg-neutral-800"><motion.div initial={{ width: 0 }} animate={{ width: `${width}%` }} className="h-full rounded-full bg-purple-500"/></div><p className="mt-1 text-xs text-neutral-500">{currencySymbol}{tracker.spentThisMonth.toLocaleString()} of {currencySymbol}{tracker.monthlyBudget.toLocaleString()}</p></div>; })}</div>
        </AnalyticsCard>
        <AnalyticsCard title="Lending vs Borrowing" subtitle="Receivables compared with liabilities">
          <div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={[{ name: "Outstanding", lent: activeLent, borrowed: activeBorrowed }]} layout="vertical"><XAxis type="number" hide/><YAxis dataKey="name" type="category" hide/><Tooltip contentStyle={tooltipStyle}/><Legend/><Bar dataKey="lent" fill="#34d399" radius={[0,10,10,0]}/><Bar dataKey="borrowed" fill="#fb7185" radius={[0,10,10,0]}/></BarChart></ResponsiveContainer></div>
        </AnalyticsCard>
        <AnalyticsCard title="Monthly Financial Summary" subtitle="Historical totals stay intact across monthly resets">
          <div className="space-y-2">{monthly.slice(-6).reverse().map((row) => <div key={row.month} className="grid grid-cols-[1fr_repeat(3,auto)] items-center gap-4 rounded-2xl bg-neutral-950 p-3 text-sm"><span className="font-semibold">{row.month}</span><span className="text-green-300">+{currencySymbol}{row.income.toLocaleString()}</span><span className="text-red-300">-{currencySymbol}{row.expenses.toLocaleString()}</span><span className="text-blue-300">{row.hours || monthlyHours}h</span></div>)}</div>
          <p className="mt-4 text-xs text-neutral-500">Savings buckets total {currencySymbol}{savingsBucketBalances.reduce((sum, item) => sum + item.currentBalance, 0).toLocaleString()}.</p>
        </AnalyticsCard>
      </div>
    </div>
  );
}

export default Statistics;
