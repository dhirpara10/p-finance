"use client";

import { useState, useCallback } from "react";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { useAssetVault } from "@/hooks/useAssetVault";
import { useDreamsGoals } from "@/hooks/useDreamsGoals";
import {
  type ReportPeriod,
  type DateRange,
  getMonthRange,
  getCalendarYTD,
  getFinancialYTD,
  getYearlyRange,
  getCustomRange,
} from "@/lib/reports/dateRanges";
import { type ReportData, generateCSV, downloadCSV } from "@/lib/reports/csvExport";
import { toast } from "@/lib/toast";
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react";

type Props = { state: FinanceDashboardState };

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
];

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export function ReportsSection({ state }: Props) {
  const { assets, locationTags } = useAssetVault();
  const { goals } = useDreamsGoals();

  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [customEnd, setCustomEnd] = useState(() => new Date().toISOString().split("T")[0]);
  const [csvLoading, setCsvLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  function getRange(): DateRange {
    switch (period) {
      case "monthly":
        return getMonthRange(year, month);
      case "calendar_ytd":
        return getCalendarYTD(year);
      case "financial_ytd":
        return getFinancialYTD();
      case "yearly":
        return getYearlyRange(year);
      case "custom":
        return getCustomRange(new Date(customStart), new Date(customEnd));
    }
  }

  const buildReportData = useCallback((): ReportData => {
    const range = getRange();
    return {
      range,
      incomes: state.incomes,
      expenses: state.expenses,
      transfers: state.transfers,
      lendingTransactions: state.lendingTransactions,
      people: state.people,
      liabilities: state.liabilities ?? [],
      repaymentSchedules: state.repaymentSchedules ?? [],
      savingsBuckets: state.savingsBuckets ?? [],
      bucketListTrackers: state.bucketListTrackers ?? [],
      savingsBucketBalances: state.savingsBucketBalances,
      trackerSummaries: state.trackerSummaries,
      assets,
      locationTags,
      goals,
      bankBalance: state.bankBalance,
      cashBalance: state.cashBalance,
      usableBalance: state.usableBalance,
      netWorth: state.netWorth,
      activeLent: state.activeLent,
      activeBorrowed: state.activeBorrowed,
      currencySymbol: state.currencySymbol,
      userNameMe: state.userNameMe,
      userNameSpouse: state.userNameSpouse,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, year, month, customStart, customEnd, state, assets, locationTags, goals]);

  async function handleCSV() {
    setCsvLoading(true);
    try {
      const data = buildReportData();
      const csv = generateCSV(data);
      downloadCSV(`finance-report-${data.range.filenameSlug}.csv`, csv);
      toast("CSV downloaded successfully.", "success");
    } catch (err) {
      console.error(err);
      toast("Failed to generate CSV. Please try again.", "error");
    } finally {
      setCsvLoading(false);
    }
  }

  async function handlePDF() {
    setPdfLoading(true);
    try {
      const data = buildReportData();
      const { generatePDF } = await import("@/lib/reports/pdfExport");
      await generatePDF(data, state);
      toast("PDF downloaded successfully.", "success");
    } catch (err) {
      console.error(err);
      toast("Failed to generate PDF. Please try again.", "error");
    } finally {
      setPdfLoading(false);
    }
  }

  const range = getRange();

  return (
    <section className="surface-card rounded-[28px] border border-white/[0.055] p-5 sm:p-6 mb-6">
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15">
          <Download className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
            Reports &amp; Export
          </h3>
          <p className="text-sm text-neutral-500">Download your financial data as CSV or PDF</p>
        </div>
      </div>

      {/* Period selector */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["monthly", "Monthly"],
              ["calendar_ytd", "Calendar YTD"],
              ["financial_ytd", "Financial YTD"],
              ["yearly", "Yearly"],
              ["custom", "Custom Range"],
            ] as [ReportPeriod, string][]
          ).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setPeriod(val)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                period === val
                  ? "bg-emerald-500 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-white/[0.06] dark:text-neutral-300 dark:hover:bg-white/[0.10]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Secondary selectors */}
        {period === "monthly" && (
          <div className="flex flex-wrap gap-2">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-neutral-200"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-neutral-200"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        )}

        {(period === "calendar_ytd" || period === "yearly") && (
          <div>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-neutral-200"
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}

        {period === "custom" && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-neutral-200"
            />
            <span className="text-neutral-400 text-sm">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-neutral-200"
            />
          </div>
        )}

        {/* Date range preview */}
        <div className="rounded-xl bg-neutral-50 px-4 py-3 dark:bg-white/[0.04]">
          <p className="text-xs text-neutral-400 mb-0.5">Report range</p>
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
            {formatDate(range.start)} – {formatDate(range.end)}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">{range.label}</p>
        </div>

        {/* Export buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleCSV}
            disabled={csvLoading || pdfLoading}
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-400 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {csvLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            {csvLoading ? "Generating…" : "Export CSV"}
          </button>

          <button
            onClick={handlePDF}
            disabled={csvLoading || pdfLoading}
            className="inline-flex items-center gap-2 rounded-2xl bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed dark:bg-white/[0.08] dark:hover:bg-white/[0.12]"
          >
            {pdfLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {pdfLoading ? "Generating…" : "Export PDF"}
          </button>
        </div>
      </div>
    </section>
  );
}
