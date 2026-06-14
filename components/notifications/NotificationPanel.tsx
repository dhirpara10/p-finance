"use client";

import { useEffect, useRef } from "react";
import { Bell, Check, AlertTriangle, Clock, X } from "lucide-react";
import type { AppNotification } from "@/lib/types";

type Props = {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClose: () => void;
};

function NotifIcon({ type }: { type: AppNotification["type"] }) {
  if (type === "repayment_overdue") return <AlertTriangle size={15} className="text-red-400 shrink-0" />;
  if (type === "repayment_due") return <Clock size={15} className="text-orange-400 shrink-0" />;
  if (type === "insufficient_usable_balance") return <AlertTriangle size={15} className="text-amber-400 shrink-0" />;
  if (type === "repayment_upcoming") return <Clock size={15} className="text-blue-400 shrink-0" />;
  return <Bell size={15} className="text-neutral-400 shrink-0" />;
}

function notifBg(type: AppNotification["type"]) {
  if (type === "repayment_overdue") return "border-red-500/20 bg-red-500/5";
  if (type === "repayment_due") return "border-orange-500/20 bg-orange-500/5";
  if (type === "insufficient_usable_balance") return "border-amber-500/20 bg-amber-500/5";
  return "border-white/[0.05] bg-white/[0.02]";
}

export function NotificationPanel({ notifications, onMarkRead, onMarkAllRead, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const unread = notifications.filter((n) => !n.isRead);
  const sorted = [...notifications].sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-14 z-50 w-80 rounded-2xl border border-white/[0.08] bg-[#111419] shadow-2xl"
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <span className="font-semibold text-sm">Notifications</span>
        <div className="flex items-center gap-2">
          {unread.length > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Mark all read
            </button>
          )}
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-white">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-neutral-500">
            No new notifications.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {sorted.map((notif) => (
              <div
                key={notif.id}
                className={`flex gap-3 px-4 py-3 transition ${notif.isRead ? "opacity-50" : ""}`}
              >
                <NotifIcon type={notif.type} />
                <div className={`flex-1 min-w-0 rounded-xl border p-2.5 ${notifBg(notif.type)}`}>
                  <p className="text-xs font-semibold text-neutral-100">{notif.title}</p>
                  <p className="mt-0.5 text-xs text-neutral-400 leading-relaxed">{notif.message}</p>
                  <p className="mt-1 text-[10px] text-neutral-600">
                    {new Date(notif.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short" })}
                  </p>
                </div>
                {!notif.isRead && (
                  <button
                    type="button"
                    onClick={() => onMarkRead(notif.id)}
                    aria-label="Mark as read"
                    className="self-start mt-2 text-neutral-600 hover:text-emerald-400"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function NotificationBell({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Notifications"
      onClick={onClick}
      className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.035] text-neutral-300 transition hover:bg-white/[0.07]"
    >
      <Bell size={18} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
