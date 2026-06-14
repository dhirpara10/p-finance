"use client";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Plus, Trash2 } from "lucide-react";

type Props = { state: FinanceDashboardState };

export function LogsView({ state }: Props) {
  const logs = [...state.activityLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Activity Logs" description="Every transaction creation and deletion, with who did it." />
      <section className="surface-card rounded-[28px] border border-white/[0.055] p-5">
        {logs.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutral-500">No logs yet. Logs are written when you add or delete transactions.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-3">
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${log.action === "created" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                  {log.action === "created" ? <Plus size={13} /> : <Trash2 size={13} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{log.description}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${log.user === "me" ? "bg-blue-500/15 text-blue-300" : "bg-pink-500/15 text-pink-300"}`}>
                      {log.userName}
                    </span>
                    <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[9px] text-neutral-500">
                      {log.entityType}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {log.action === "created" ? "Added" : "Deleted"} · {new Date(log.timestamp).toLocaleString("en-AU", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
