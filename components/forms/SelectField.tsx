"use client";

import { formTokens } from "@/lib/designTokens";
import { FormField } from "@/components/forms/FormField";
import type { SelectHTMLAttributes } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: { value: string; label: string }[];
  helper?: string;
};

export function SelectField({ label, options, helper, ...props }: Props) {
  return (
    <FormField label={label} helper={helper}>
      <select {...props} className={`${formTokens.input} ${props.className || ""}`}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
