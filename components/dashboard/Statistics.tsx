"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ReportsSection } from "@/components/stats/ReportsSection";
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
import { BarChart3, TrendingUp, TrendingDown, Minus } from "lucide-react";

type Props = { state: FinanceDashboardState };

const categoryColors = ["#34d399", "#38bdf8", "#a78bfa", "#fb923c", "#f472b6", "#22d3ee"];
const tooltipStyle = {
  background: "#111419",
  border: "1px solid rgba(255,255,255,.09)",
  borderRadius: 14,
  boxShadow: "0 18px 50px rgba(0,0,0,.35)",
  color: "#f5f5f5",
  fontSize: 12,
};

function Card({
  title,
  subtitle,
  className = "",
  children,
  flush = false,
}: {
  title: string;
  subtitle: string;
  className?: string;
  children: ReactNode;
  flush?: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className={`surface-card min-w-0 rounded-[28px] border border-black/[0.07] dark:border-white/[0.055] ${flush ? "" : "p-5 sm:p-6"} ${className}`}
    >
      {!flush && (
        <>
          <h3 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-white">{title}</h3>
          <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>
          <div className="mt-5">{children}</div>
        </>
      )}
      {flush && children}
    </motion.section>
  );
}

function ChartFrame({ height, children, empty }: { height: string; children: ReactNode; empty?: boolean }) {
  if (empty) {
    return (
      <div className={`${height} flex flex-col items-center justify-center gap-2 rounded-2xl border border-black/[0.06] bg-black/[0.03] dark:border-white/[0.05] dark:bg-white/[0.02]`}>
        <BarChart3 size={22} className="text-neutral-400 dark:text-neutral-600" />
        <p className="text-xs text-neutral-500 dark:text-neutral-600">No data yet</p>
      </div>
    );
  }
  return (
    <div className={`min-w-0 w-full ${height}`}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        {children as never}
      </ResponsiveContainer>
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone = "text-neutral-900 dark:text-white",
  trend,
}: {
  label: string;
  value: string;
  tone?: string;
  trend?: "up" | "down" | "flat";
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-neutral-500";
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-black/[0.07] bg-black/[0.03] px-4 py-3.5 dark:border-white/[0.055] dark:bg-white/[0.025]">
      <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">{label}</p>
      <div className="flex items-end justify-between gap-2">
        <p className={`text-xl font-bold tabular-nums leading-none ${tone}`}>{value}</p>
        {trend && <TrendIcon size={14} className={trendColor} />}
      </div>
    </div>
  );
}

export function Statistics({ state }: Props) {
  const {
    currencySymbol,
    trackerSummaries,
    sharedRolloverJar,
    activeLent,
    activeBorrowed,
    monthlyHours,
    savingsBucketBalances,
    financialAnalytics,
    monthlyIncome,
    monthlyExpenses,
    netWorth,
  } = state;

  const monthly = financialAnalytics.monthly;
  const categories = financialAnalytics.categories;
  const hasData = monthly.some((m) => m.income > 0 || m.expenses > 0);
  const hasCategories = categories.length > 0;

  const savingsRate =
    monthlyIncome > 0
      ? Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100)
      : null;

  const totalSavings = savingsBucketBalances.reduce((sum, b) => sum + b.currentBalance, 0);

  const jarData = monthly.map((row, index) => ({
    month: row.month,
    available:
      sharedRolloverJar.previousBalance +
      monthly.slice(0, index + 1).reduce((s, r) => s + r.jarInflow, 0) -
      monthly.slice(0, index + 1).reduce((s, r) => s + r.trackedSpending + r.jarWithdrawals, 0),
  }));

  const moneyTick = (v: number) =>
    `${currencySymbol}${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`;

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      {/* Reports & Export */}
      <ReportsSection state={state} />

      <PageHeader title="Stats & Analytics" description="Trends and behavior at a glance." />

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          label="Net Worth"
          value={`${currencySymbol}${fmt(netWorth)}`}
          tone={netWorth >= 0 ? "text-emerald-300" : "text-red-300"}
          trend={netWorth >= 0 ? "up" : "down"}
        />
        <KpiCard
          label="This Month Income"
          value={`${currencySymbol}${fmt(monthlyIncome)}`}
          tone="text-emerald-300"
          trend="up"
        />
        <KpiCard
          label="This Month Spent"
          value={`${currencySymbol}${fmt(monthlyExpenses)}`}
          tone="text-red-300"
          trend="down"
        />
        <KpiCard
          label="Savings Rate"
          value={savingsRate !== null ? `${savingsRate}%` : "—"}
          tone={
            savingsRate === null
              ? "text-neutral-400"
              : savingsRate >= 20
                ? "text-emerald-300"
                : savingsRate >= 0
                  ? "text-amber-300"
                  : "text-red-300"
          }
        />
        <KpiCard
          label="Total Savings"
          value={`${currencySymbol}${fmt(totalSavings)}`}
          tone="text-sky-300"
        />
        <KpiCard
          label="Work Hours"
          value={`${monthlyHours.toLocaleString()}h`}
        />
      </div>

      {/* Net Worth Trend — full width */}
      <Card title="Net Worth Trend" subtitle="Cumulative financial movement over time">
        <ChartFrame height="h-72" empty={!hasData}>
          <AreaChart data={monthly} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(128,128,128,.1)" vertical={false} />
            <XAxis dataKey="month" stroke="#65676d" axisLine={false} tickLine={false} fontSize={11} />
            <YAxis stroke="#65676d" axisLine={false} tickLine={false} fontSize={11} tickFormatter={moneyTick} width={52} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="netWorth" stroke="#38bdf8" strokeWidth={2.5} fill="url(#netWorthFill)" dot={false} />
          </AreaChart>
        </ChartFrame>
      </Card>

      {/* Row 2: Income vs Expense + Category Mix */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Income vs Expense" subtitle="Cash flow by recorded month">
          <ChartFrame height="h-64" empty={!hasData}>
            <LineChart data={monthly} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid stroke="rgba(128,128,128,.1)" vertical={false} />
              <XAxis dataKey="month" stroke="#65676d" axisLine={false} tickLine={false} fontSize={11} />
              <YAxis stroke="#65676d" axisLine={false} tickLine={false} fontSize={11} tickFormatter={moneyTick} width={52} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Line type="monotone" dataKey="income" stroke="#34d399" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="expenses" stroke="#fb7185" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="remaining" stroke="#38bdf8" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ChartFrame>
        </Card>

        <Card title="Spending by Category" subtitle="Where your money goes">
          <ChartFrame height="h-64" empty={!hasCategories}>
            <PieChart>
              <Pie
                data={categories.length ? categories : [{ name: "No spending", value: 1 }]}
                dataKey="value"
                nameKey="name"
                innerRadius={64}
                outerRadius={96}
                paddingAngle={3}
                cornerRadius={5}
              >
                {(categories.length ? categories : [{ name: "No spending", value: 1 }]).map((item, index) => (
                  <Cell key={item.name} fill={categories.length ? categoryColors[index % categoryColors.length] : "#1e2025"} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              {categories.length > 0 && (
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "#a3a3a3" }} />
              )}
            </PieChart>
          </ChartFrame>
        </Card>
      </div>

      {/* Row 3: Monthly Spending bar + Tracker Health */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Monthly Spending" subtitle="Outgoing intensity over time">
          <ChartFrame height="h-64" empty={!hasData}>
            <BarChart data={monthly} margin={{ left: 0, right: 6, top: 8 }}>
              <CartesianGrid stroke="rgba(128,128,128,.1)" vertical={false} />
              <XAxis dataKey="month" stroke="#65676d" axisLine={false} tickLine={false} fontSize={11} />
              <YAxis stroke="#65676d" axisLine={false} tickLine={false} fontSize={11} tickFormatter={moneyTick} width={52} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="expenses" fill="#fb7185" radius={[6, 6, 2, 2]} maxBarSize={32} />
            </BarChart>
          </ChartFrame>
        </Card>

        <Card title="Tracker Health" subtitle="Monthly budget cap usage">
          {trackerSummaries.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-black/[0.06] bg-black/[0.03] dark:border-white/[0.05] dark:bg-white/[0.02]">
              <BarChart3 size={22} className="text-neutral-400 dark:text-neutral-600" />
              <p className="text-xs text-neutral-500 dark:text-neutral-600">No trackers set up</p>
            </div>
          ) : (
            <div className="space-y-4">
              {trackerSummaries.slice(0, 6).map((tracker) => (
                <div key={tracker.id}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{tracker.name}</span>
                    <span
                      className={`text-xs font-semibold ${
                        tracker.status === "Overspent"
                          ? "text-red-300"
                          : tracker.status === "Near Limit"
                            ? "text-orange-300"
                            : "text-emerald-300"
                      }`}
                    >
                      {tracker.status}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[0.07] dark:bg-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, tracker.progress)}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-full rounded-full ${
                        tracker.status === "Overspent"
                          ? "bg-gradient-to-r from-red-500 to-red-400"
                          : tracker.status === "Near Limit"
                            ? "bg-gradient-to-r from-orange-500 to-amber-400"
                            : "bg-gradient-to-r from-purple-500 to-pink-400"
                      }`}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-500">
                    {currencySymbol}{tracker.spentThisMonth.toLocaleString()} of {currencySymbol}{tracker.monthlyBudget.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Row 4: Shared Jar Growth + Lending Position */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Shared Jar" subtitle="Allocation, tracked spend, and rollover">
          <div className="mb-5 grid grid-cols-3 gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-neutral-500">Available</p>
              <p className="mt-1 text-sm font-bold text-purple-300">{currencySymbol}{sharedRolloverJar.available.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-neutral-500">Monthly</p>
              <p className="mt-1 text-sm font-bold text-neutral-900 dark:text-white">{currencySymbol}{sharedRolloverJar.monthlyAllocation.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-neutral-500">Result</p>
              <p className={`mt-1 text-sm font-bold ${sharedRolloverJar.monthlyResult >= 0 ? "text-emerald-300" : "text-orange-300"}`}>
                {sharedRolloverJar.monthlyResult >= 0 ? "+" : ""}{currencySymbol}{sharedRolloverJar.monthlyResult.toLocaleString()}
              </p>
            </div>
          </div>
          <ChartFrame height="h-48" empty={!hasData}>
            <AreaChart data={jarData} margin={{ left: 0, right: 8, top: 4 }}>
              <CartesianGrid stroke="rgba(128,128,128,.1)" vertical={false} />
              <XAxis dataKey="month" stroke="#65676d" axisLine={false} tickLine={false} fontSize={11} />
              <YAxis stroke="#65676d" axisLine={false} tickLine={false} fontSize={11} tickFormatter={moneyTick} width={48} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="available" stroke="#c084fc" strokeWidth={2.5} fill="#a855f722" dot={false} />
            </AreaChart>
          </ChartFrame>
        </Card>

        <Card title="Lending Position" subtitle="What you're owed vs. what you owe">
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-neutral-500">Lent out</p>
              <p className="mt-1 text-lg font-bold text-emerald-300">{currencySymbol}{fmt(activeLent)}</p>
            </div>
            <div className="rounded-2xl border border-red-500/15 bg-red-500/5 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-neutral-500">Borrowed</p>
              <p className="mt-1 text-lg font-bold text-red-300">{currencySymbol}{fmt(activeBorrowed)}</p>
            </div>
          </div>
          <ChartFrame height="h-48">
            <BarChart
              data={[{ name: "You lent", lent: activeLent }, { name: "You borrowed", borrowed: activeBorrowed }]}
              margin={{ left: 0, right: 8, top: 4 }}
            >
              <CartesianGrid stroke="rgba(128,128,128,.1)" vertical={false} />
              <XAxis dataKey="name" stroke="#65676d" axisLine={false} tickLine={false} fontSize={11} />
              <YAxis stroke="#65676d" axisLine={false} tickLine={false} fontSize={11} tickFormatter={moneyTick} width={48} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="lent" fill="#34d399" radius={[6, 6, 2, 2]} maxBarSize={48} name="Lent" />
              <Bar dataKey="borrowed" fill="#fb7185" radius={[6, 6, 2, 2]} maxBarSize={48} name="Borrowed" />
            </BarChart>
          </ChartFrame>
        </Card>
      </div>

      {/* Monthly Summary — full width table */}
      <Card title="Monthly Summary" subtitle="Income, expenses, savings rate, and hours by month">
        {monthly.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">No monthly data yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-black/[0.07] dark:border-white/[0.055]">
                  {["Month", "Income", "Expenses", "Remaining", "Rate", "Hours"].map((h) => (
                    <th key={h} className="pb-3 text-left text-[11px] font-semibold uppercase tracking-wider text-neutral-500 first:pl-0 last:pr-0 [&:not(:first-child)]:pl-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.05] dark:divide-white/[0.04]">
                {monthly.slice(-12).reverse().map((row) => {
                  const rate = row.income > 0 ? Math.round(((row.income - row.expenses) / row.income) * 100) : null;
                  return (
                    <tr key={row.month} className="group transition hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                      <td className="py-3 font-medium text-neutral-900 dark:text-neutral-100">{row.month}</td>
                      <td className="py-3 pl-4 tabular-nums text-emerald-400">+{currencySymbol}{row.income.toLocaleString()}</td>
                      <td className="py-3 pl-4 tabular-nums text-red-400">−{currencySymbol}{row.expenses.toLocaleString()}</td>
                      <td className={`py-3 pl-4 tabular-nums ${row.remaining >= 0 ? "text-sky-300" : "text-orange-300"}`}>
                        {row.remaining >= 0 ? "+" : "−"}{currencySymbol}{Math.abs(row.remaining).toLocaleString()}
                      </td>
                      <td className={`py-3 pl-4 tabular-nums font-semibold ${rate === null ? "text-neutral-500" : rate >= 20 ? "text-emerald-400" : rate >= 0 ? "text-amber-300" : "text-red-400"}`}>
                        {rate !== null ? `${rate}%` : "—"}
                      </td>
                      <td className="py-3 pl-4 tabular-nums text-neutral-500">{row.hours}h</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default Statistics;
