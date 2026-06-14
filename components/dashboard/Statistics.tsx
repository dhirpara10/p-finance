"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { PageHeader } from "@/components/dashboard/PageHeader";
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
const categoryColors = ["#34d399", "#38bdf8", "#a78bfa", "#fb923c", "#f472b6", "#22d3ee"];
const tooltipStyle = {
  background: "#111419",
  border: "1px solid rgba(255,255,255,.09)",
  borderRadius: 14,
  boxShadow: "0 18px 50px rgba(0,0,0,.35)",
  color: "#f5f5f5",
};

function AnalyticsCard({
  title,
  subtitle,
  className = "",
  children,
}: {
  title: string;
  subtitle: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      className={`surface-card min-w-0 rounded-[28px] border border-white/[0.055] p-5 sm:p-6 ${className}`}
    >
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </motion.section>
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
  } = state;
  const monthly = financialAnalytics.monthly;
  const categories = financialAnalytics.categories;
  const jarData = monthly.map((row, index) => ({
    month: row.month,
    allocation: row.jarInflow,
    spending: row.trackedSpending,
    available:
      sharedRolloverJar.previousBalance +
      monthly
        .slice(0, index + 1)
        .reduce((sum, item) => sum + item.jarInflow, 0) -
      monthly
        .slice(0, index + 1)
        .reduce(
          (sum, item) =>
            sum + item.trackedSpending + item.jarWithdrawals,
          0
        ),
  }));
  const moneyTick = (value: number) =>
    `${currencySymbol}${Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stats & Analytics"
        description="Trends and behavior without spreadsheet noise."
        actions={
          <div className="flex gap-6 rounded-2xl border border-white/[0.055] bg-white/[0.025] px-5 py-3">
            <MiniStat label="Hours" value={`${monthlyHours.toLocaleString()}h`} />
            <MiniStat label="Savings" value={`${currencySymbol}${savingsBucketBalances.reduce((sum, item) => sum + item.currentBalance, 0).toLocaleString()}`} />
          </div>
        }
      />
      <p className="text-xs text-neutral-600">Data available from FY 26-27</p>

      <div className="grid gap-5 xl:grid-cols-12">
        <AnalyticsCard title="Net Worth Trend" subtitle="Cumulative financial movement" className="xl:col-span-7">
          <ChartFrame height="h-80">
            <AreaChart data={monthly} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
              <XAxis dataKey="month" stroke="#65676d" axisLine={false} tickLine={false} fontSize={11} />
              <YAxis stroke="#65676d" axisLine={false} tickLine={false} fontSize={11} tickFormatter={moneyTick} width={48} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="netWorth" stroke="#38bdf8" strokeWidth={2.5} fill="url(#netWorthFill)" />
            </AreaChart>
          </ChartFrame>
        </AnalyticsCard>

        <AnalyticsCard title="Category Mix" subtitle="Where spending concentrates" className="xl:col-span-5">
          <ChartFrame height="h-80">
            <PieChart>
              <Pie data={categories.length ? categories : [{ name: "No spending", value: 1 }]} dataKey="value" nameKey="name" innerRadius={70} outerRadius={104} paddingAngle={4} cornerRadius={6}>
                {(categories.length ? categories : [{ name: "No spending", value: 1 }]).map((item, index) => (
                  <Cell key={item.name} fill={categories.length ? categoryColors[index % categoryColors.length] : "#26292f"} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              {categories.length > 0 && <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "#a3a3a3" }} />}
            </PieChart>
          </ChartFrame>
        </AnalyticsCard>

        <AnalyticsCard title="Income vs Expense" subtitle="Cash flow by recorded month" className="xl:col-span-7">
          <ChartFrame height="h-72">
            <LineChart data={monthly} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
              <XAxis dataKey="month" stroke="#65676d" axisLine={false} tickLine={false} fontSize={11} />
              <YAxis stroke="#65676d" axisLine={false} tickLine={false} fontSize={11} tickFormatter={moneyTick} width={48} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="income" stroke="#34d399" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="expenses" stroke="#fb7185" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="remaining" stroke="#38bdf8" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartFrame>
        </AnalyticsCard>

        <AnalyticsCard title="Monthly Spending" subtitle="Outgoing intensity over time" className="xl:col-span-5">
          <ChartFrame height="h-72">
            <BarChart data={monthly} margin={{ left: 0, right: 6, top: 8 }}>
              <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
              <XAxis dataKey="month" stroke="#65676d" axisLine={false} tickLine={false} fontSize={11} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="expenses" fill="#fb7185" radius={[8, 8, 3, 3]} maxBarSize={34} />
            </BarChart>
          </ChartFrame>
        </AnalyticsCard>

        <AnalyticsCard title="Shared Jar Growth" subtitle="Allocation, tracked spend, and rollover" className="border-purple-400/15 xl:col-span-7">
          <div className="mb-5 grid grid-cols-3 gap-3">
            <MiniStat label="Available" value={`${currencySymbol}${sharedRolloverJar.available.toLocaleString()}`} tone="text-purple-200" />
            <MiniStat label="Monthly" value={`${currencySymbol}${sharedRolloverJar.monthlyAllocation.toLocaleString()}`} />
            <MiniStat label="Result" value={`${currencySymbol}${sharedRolloverJar.monthlyResult.toLocaleString()}`} tone={sharedRolloverJar.monthlyResult >= 0 ? "text-emerald-300" : "text-orange-300"} />
          </div>
          <ChartFrame height="h-64">
            <AreaChart data={jarData} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
              <XAxis dataKey="month" stroke="#65676d" axisLine={false} tickLine={false} fontSize={11} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="available" stroke="#c084fc" strokeWidth={2.5} fill="#a855f722" />
            </AreaChart>
          </ChartFrame>
        </AnalyticsCard>

        <AnalyticsCard title="Tracker Health" subtitle="Monthly cap usage" className="xl:col-span-5">
          <div className="space-y-5">
            {trackerSummaries.slice(0, 6).map((tracker) => (
              <div key={tracker.id}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{tracker.name}</span>
                  <span className={`text-xs ${tracker.status === "Overspent" ? "text-red-300" : tracker.status === "Near Limit" ? "text-orange-300" : "text-emerald-300"}`}>{tracker.status}</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, tracker.progress)}%` }} className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-400" />
                </div>
                <p className="mt-1.5 text-xs text-neutral-500">{currencySymbol}{tracker.spentThisMonth.toLocaleString()} of {currencySymbol}{tracker.monthlyBudget.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Lending Position" subtitle="Receivables compared with liabilities" className="xl:col-span-5">
          <ChartFrame height="h-56">
            <BarChart data={[{ name: "Outstanding", lent: activeLent, borrowed: activeBorrowed }]} layout="vertical" margin={{ left: 0, right: 12 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" hide />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" />
              <Bar dataKey="lent" fill="#34d399" radius={[0, 8, 8, 0]} />
              <Bar dataKey="borrowed" fill="#fb7185" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ChartFrame>
        </AnalyticsCard>

        <AnalyticsCard title="Monthly Summary" subtitle="Income, spending, and work history" className="xl:col-span-7">
          <div className="divide-y divide-white/[0.05]">
            {monthly.slice(-6).reverse().map((row) => (
              <div key={row.month} className="grid grid-cols-[1fr_repeat(3,auto)] items-center gap-4 py-3 text-sm">
                <span className="font-medium">{row.month}</span>
                <span className="text-emerald-300">+{currencySymbol}{row.income.toLocaleString()}</span>
                <span className="text-red-300">-{currencySymbol}{row.expenses.toLocaleString()}</span>
                {row.financeCosts > 0 && (
                  <span className="text-orange-300">
                    Finance -{currencySymbol}{row.financeCosts.toLocaleString()}
                  </span>
                )}
                <span className="text-neutral-500">{row.hours}h</span>
              </div>
            ))}
          </div>
        </AnalyticsCard>
      </div>
    </div>
  );
}

function ChartFrame({ height, children }: { height: string; children: ReactNode }) {
  return (
    <div className={`min-h-px min-w-0 w-full ${height}`}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 640, height: 288 }}
      >
        {children as never}
      </ResponsiveContainer>
    </div>
  );
}

function MiniStat({ label, value, tone = "text-white" }: { label: string; value: string; tone?: string }) {
  return <div><p className="text-[11px] text-neutral-500">{label}</p><p className={`mt-1 text-sm font-semibold ${tone}`}>{value}</p></div>;
}

export default Statistics;
