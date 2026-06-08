"use client";

import { formTokens } from "@/lib/designTokens";
import { FormField } from "@/components/forms/FormField";
import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string };

export function DateField({ label, ...props }: Props) {
  return (
    <FormField label={label}>
      <input {...props} type="date" className={`${formTokens.input} ${props.className || ""}`} />
    </FormField>
  );
}
