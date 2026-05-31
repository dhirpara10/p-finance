"use client";

import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { getCategoryWiseSpend, getTimeWiseSpend } from "@/lib/calculations";
import { useEffect, useState } from "react";

type Props = { state: FinanceDashboardState };

export function Statistics({ state }: Props) {
  const { expenses, currencySymbol } = state;

  const [localMode, setLocalMode] = useState<string>((state as any).statisticsMode ?? "CATEGORY");
  const [localPeriod, setLocalPeriod] = useState<string>((state as any).statisticsPeriod ?? "1M");
  const [localStart, setLocalStart] = useState<string>((state as any).statisticsStartDate ?? "");
  const [localEnd, setLocalEnd] = useState<string>((state as any).statisticsEndDate ?? "");
  const [localGrouping, setLocalGrouping] = useState<string>((state as any).timeGrouping ?? "MONTHLY");

  useEffect(() => {
    // sync from external state if available
    if ((state as any).statisticsMode) setLocalMode((state as any).statisticsMode);
    if ((state as any).statisticsPeriod) setLocalPeriod((state as any).statisticsPeriod);
    if ((state as any).statisticsStartDate) setLocalStart((state as any).statisticsStartDate);
    if ((state as any).statisticsEndDate) setLocalEnd((state as any).statisticsEndDate);
    if ((state as any).timeGrouping) setLocalGrouping((state as any).timeGrouping);
  }, [state]);

  const periods = ["1M", "2M", "3M", "6M", "12M", "LIFETIME", "CUSTOM"] as const;

  const categoryData = getCategoryWiseSpend({
    expenses,
    period: localPeriod as any,
    customStartDate: localStart || undefined,
    customEndDate: localEnd || undefined,
  });

  const timeData = getTimeWiseSpend({
    expenses,
    period: localPeriod as any,
    grouping: localGrouping as any,
    customStartDate: localStart || undefined,
    customEndDate: localEnd || undefined,
  });

  return (
    <section className="rounded-3xl bg-neutral-900 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Statistics</h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setLocalMode("CATEGORY");
              (state as any).setStatisticsMode?.("CATEGORY");
            }}
            className={`rounded-full px-3 py-1 text-sm ${localMode === "CATEGORY" ? "bg-neutral-800" : "bg-neutral-700"}`}
          >
            Category Wise
          </button>
          <button
            onClick={() => {
              setLocalMode("TIME");
              (state as any).setStatisticsMode?.("TIME");
            }}
            className={`rounded-full px-3 py-1 text-sm ${localMode === "TIME" ? "bg-neutral-800" : "bg-neutral-700"}`}
          >
            Time Wise
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => {
              setLocalPeriod(p as any);
              (state as any).setStatisticsPeriod?.(p as any);
            }}
            className={`rounded-full px-3 py-1 text-sm ${localPeriod === p ? "bg-neutral-800" : "bg-neutral-700"}`}
          >
            {p}
          </button>
        ))}
      </div>

      {localPeriod === "CUSTOM" && (
        <div className="mb-3 flex gap-2">
          <input type="date" value={localStart} onChange={(e) => { setLocalStart(e.target.value); (state as any).setStatisticsStartDate?.(e.target.value); }} className="rounded-2xl bg-neutral-800 p-2" />
          <input type="date" value={localEnd} onChange={(e) => { setLocalEnd(e.target.value); (state as any).setStatisticsEndDate?.(e.target.value); }} className="rounded-2xl bg-neutral-800 p-2" />
        </div>
      )}

      {localMode === "CATEGORY" ? (
        <div>
          {categoryData.length === 0 ? (
            <p className="text-sm text-neutral-400">No expenses found for this period.</p>
          ) : (
            <div className="space-y-3">
              {categoryData.map((item) => (
                <div key={item.category} className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.category}</span>
                      <span className="font-semibold">{currencySymbol}{item.amount.toLocaleString()}</span>
                    </div>

                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                      <div className="h-full rounded-full bg-green-500" style={{ width: `${item.percentage}%` }} />
                    </div>
                  </div>
                  <div className="w-16 text-right text-sm text-neutral-400">{item.percentage.toFixed(0)}%</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <label className="text-sm text-neutral-400">Group:</label>
            <select value={localGrouping} onChange={(e) => { setLocalGrouping(e.target.value); (state as any).setTimeGrouping?.(e.target.value); }} className="rounded-2xl bg-neutral-800 p-2">
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
              <option value="YEARLY">Yearly</option>
            </select>
          </div>

          {timeData.length === 0 ? (
            <p className="text-sm text-neutral-400">No expenses found for this period.</p>
          ) : (
            <div className="space-y-2">
              {timeData.map((item) => (
                <div key={item.label + String(item.sortTime)} className="flex items-center justify-between">
                  <div className="text-sm text-neutral-300">{item.label}</div>
                  <div className="font-semibold">{currencySymbol}{item.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default Statistics;
