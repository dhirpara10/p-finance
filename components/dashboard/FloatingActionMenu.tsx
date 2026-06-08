"use client";

import { Plus, X, ArrowDown, ArrowUp, ArrowRightLeft, HandCoins, LockKeyhole } from "lucide-react";
import { useState } from "react";

type FloatingActionMenuProps = {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onTransfer: () => void;
  onLent: () => void;
  onBorrowed: () => void;
};

const actions = [
  { label: "Add Income", accent: "text-emerald-300", icon: ArrowDown },
  { label: "Add Expense", accent: "text-red-300", icon: ArrowUp },
  { label: "Transfer", accent: "text-blue-300", icon: ArrowRightLeft },
  { label: "Lent", accent: "text-green-300", icon: HandCoins },
  { label: "Borrowed", accent: "text-rose-300", icon: LockKeyhole },
];

export function FloatingActionMenu({
  onAddIncome,
  onAddExpense,
  onTransfer,
  onLent,
  onBorrowed,
}: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const handlers = [onAddIncome, onAddExpense, onTransfer, onLent, onBorrowed];

  function runAction(action: () => void) {
    action();
    setIsOpen(false);
  }

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Close actions"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
        />
      )}

      <div className="fixed bottom-28 right-5 z-50 md:hidden">
        {isOpen && (
          <div className="mb-4 w-56 origin-bottom-right rounded-3xl border border-white/10 bg-neutral-900/95 p-2 shadow-xl backdrop-blur animate-in fade-in slide-in-from-bottom-2">
            {actions.map((action, index) => (
              <button
                key={action.label}
                type="button"
                onClick={() => runAction(handlers[index])}
                className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold text-white hover:bg-neutral-800"
              >
                <div className="flex items-center gap-3">
                  <action.icon size={18} className={action.accent} />
                  <span>{action.label}</span>
                </div>
                <span className={action.accent}>+</span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          aria-label="Open actions"
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-black shadow-xl transition active:scale-95"
        >
          {isOpen ? <X size={24} /> : <Plus size={26} />}
        </button>
      </div>
    </>
  );
}
