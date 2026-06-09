"use client";

import { formTokens } from "@/lib/designTokens";
import { FormField } from "@/components/forms/FormField";
import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: { value: string; label: string }[];
  helper?: string;
};

export function SelectField({ label, options, helper, ...props }: Props) {
  const control = (
    <div className="relative">
      <select
        {...props}
        className={`${formTokens.input} appearance-none pr-11 ${props.className || ""}`}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-[#111419] text-white"
          >
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden="true"
        size={17}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500"
      />
    </div>
  );

  return label ? (
    <FormField label={label} helper={helper}>
      {control}
    </FormField>
  ) : (
    control
  );
}
