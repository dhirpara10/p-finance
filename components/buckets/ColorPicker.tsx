"use client";

export const COLOR_OPTIONS = [
  { name: "cyan", label: "Cyan", bg: "bg-cyan-500", ring: "ring-cyan-400" },
  { name: "emerald", label: "Emerald", bg: "bg-emerald-500", ring: "ring-emerald-400" },
  { name: "blue", label: "Blue", bg: "bg-blue-500", ring: "ring-blue-400" },
  { name: "purple", label: "Purple", bg: "bg-purple-500", ring: "ring-purple-400" },
  { name: "orange", label: "Orange", bg: "bg-orange-500", ring: "ring-orange-400" },
  { name: "rose", label: "Rose", bg: "bg-rose-500", ring: "ring-rose-400" },
  { name: "amber", label: "Amber", bg: "bg-amber-500", ring: "ring-amber-400" },
  { name: "indigo", label: "Indigo", bg: "bg-indigo-500", ring: "ring-indigo-400" },
  { name: "pink", label: "Pink", bg: "bg-pink-500", ring: "ring-pink-400" },
  { name: "slate", label: "Slate", bg: "bg-slate-500", ring: "ring-slate-400" },
] as const;

export type AppColor = (typeof COLOR_OPTIONS)[number]["name"];

export function getColorClasses(color?: string) {
  return COLOR_OPTIONS.find((c) => c.name === color) ?? COLOR_OPTIONS[0];
}

export function ColorPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_OPTIONS.map(({ name, label, bg, ring }) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          title={label}
          className={`h-7 w-7 rounded-full transition ${bg} ${
            value === name ? `ring-2 ring-offset-2 ring-offset-black/50 ${ring}` : "opacity-60 hover:opacity-100"
          }`}
        />
      ))}
    </div>
  );
}
