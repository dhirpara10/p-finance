"use client";

import { useRef, useState } from "react";

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  symbol?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
  name?: string;
}

export function CurrencyInput({
  value,
  onChange,
  symbol = "$",
  placeholder = "0.00",
  className = "",
  disabled = false,
  autoFocus = false,
  id,
  name,
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  function formatDisplay(raw: string): string {
    const num = parseFloat(raw.replace(/,/g, ""));
    if (isNaN(num)) return raw;
    return num.toLocaleString("en-AU", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Allow digits, one decimal point, and commas (commas stripped internally)
    const raw = e.target.value.replace(/,/g, "").replace(/[^\d.]/g, "");
    // Prevent multiple decimals
    const parts = raw.split(".");
    const cleaned = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : raw;
    // Limit to 2 decimal places
    if (cleaned.includes(".")) {
      const [whole, dec] = cleaned.split(".");
      onChange(dec.length > 2 ? `${whole}.${dec.slice(0, 2)}` : cleaned);
    } else {
      onChange(cleaned);
    }
  }

  const displayValue = isFocused ? value : (value ? formatDisplay(value) : "");

  return (
    <div className={`relative flex items-center ${className}`}>
      <span className="pointer-events-none absolute left-3 text-sm text-neutral-400">
        {symbol}
      </span>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className="min-h-12 w-full rounded-xl border border-black/[0.09] bg-black/[0.04] py-3 pl-8 pr-4 text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-emerald-600/50 focus:bg-black/[0.06] focus:ring-2 focus:ring-emerald-600/10 dark:border-white/[0.08] dark:bg-white/[0.045] dark:text-white dark:placeholder:text-neutral-600 dark:focus:border-emerald-300/50 dark:focus:bg-white/[0.06] dark:focus:ring-emerald-300/10 md:min-h-[52px] disabled:opacity-50"
      />
    </div>
  );
}
