export type AssetType =
  | "gold"
  | "land"
  | "property"
  | "vehicle"
  | "investment"
  | "document"
  | "other";

export type AssetRecord = {
  id: string;
  title: string;
  assetType: AssetType;
  details: string;
  date: string;
  locationTagIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type LocationTag = {
  id: string;
  name: string;
  createdAt: string;
};

export const ASSET_TYPES: { id: AssetType; label: string; emoji: string }[] = [
  { id: "gold", label: "Gold", emoji: "🥇" },
  { id: "land", label: "Land", emoji: "🏡" },
  { id: "property", label: "Property", emoji: "🏢" },
  { id: "vehicle", label: "Vehicle", emoji: "🚗" },
  { id: "investment", label: "Investment", emoji: "💰" },
  { id: "document", label: "Document", emoji: "📄" },
  { id: "other", label: "Other", emoji: "📦" },
];

export const ASSET_TYPE_STYLES: Record<
  AssetType,
  {
    gradient: string;
    border: string;
    textAccent: string;
    badge: string;
    glow: string;
  }
> = {
  gold: {
    gradient:
      "bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.18),rgba(245,158,11,0.06)_55%,transparent_80%)]",
    border: "border-amber-500/30",
    textAccent: "text-amber-300",
    badge: "bg-amber-400/15 text-amber-300 border-amber-400/25",
    glow: "shadow-[0_0_40px_rgba(251,191,36,0.08)]",
  },
  land: {
    gradient:
      "bg-[radial-gradient(ellipse_at_top_right,rgba(34,197,94,0.18),rgba(16,185,129,0.06)_55%,transparent_80%)]",
    border: "border-green-500/30",
    textAccent: "text-green-300",
    badge: "bg-green-400/15 text-green-300 border-green-400/25",
    glow: "shadow-[0_0_40px_rgba(34,197,94,0.08)]",
  },
  property: {
    gradient:
      "bg-[radial-gradient(ellipse_at_top_right,rgba(168,85,247,0.18),rgba(139,92,246,0.06)_55%,transparent_80%)]",
    border: "border-purple-500/30",
    textAccent: "text-purple-300",
    badge: "bg-purple-400/15 text-purple-300 border-purple-400/25",
    glow: "shadow-[0_0_40px_rgba(168,85,247,0.08)]",
  },
  vehicle: {
    gradient:
      "bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.18),rgba(6,182,212,0.06)_55%,transparent_80%)]",
    border: "border-blue-500/30",
    textAccent: "text-blue-300",
    badge: "bg-blue-400/15 text-blue-300 border-blue-400/25",
    glow: "shadow-[0_0_40px_rgba(59,130,246,0.08)]",
  },
  investment: {
    gradient:
      "bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.18),rgba(6,182,212,0.06)_55%,transparent_80%)]",
    border: "border-teal-500/30",
    textAccent: "text-teal-300",
    badge: "bg-teal-400/15 text-teal-300 border-teal-400/25",
    glow: "shadow-[0_0_40px_rgba(20,184,166,0.08)]",
  },
  document: {
    gradient:
      "bg-[radial-gradient(ellipse_at_top_right,rgba(100,116,139,0.15),rgba(71,85,105,0.05)_55%,transparent_80%)]",
    border: "border-slate-500/30",
    textAccent: "text-slate-300",
    badge: "bg-slate-400/15 text-slate-300 border-slate-400/25",
    glow: "shadow-[0_0_40px_rgba(100,116,139,0.06)]",
  },
  other: {
    gradient:
      "bg-[radial-gradient(ellipse_at_top_right,rgba(244,63,94,0.15),rgba(251,113,133,0.05)_55%,transparent_80%)]",
    border: "border-rose-500/30",
    textAccent: "text-rose-300",
    badge: "bg-rose-400/15 text-rose-300 border-rose-400/25",
    glow: "shadow-[0_0_40px_rgba(244,63,94,0.06)]",
  },
};

export const DEFAULT_LOCATION_TAGS = [
  "Australia",
  "India",
  "Melbourne",
  "Sydney",
  "Brisbane",
  "Perth",
  "Adelaide",
  "Surat",
  "Ahmedabad",
];

export function getAssetTypeInfo(type: AssetType) {
  return ASSET_TYPES.find((t) => t.id === type) ?? ASSET_TYPES[6];
}
