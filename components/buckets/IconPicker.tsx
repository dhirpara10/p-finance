"use client";

import {
  Briefcase, Camera, Car, Coffee, Compass, CreditCard, DollarSign, Dumbbell,
  Globe, GraduationCap, Heart, Home, Laptop, LockKeyhole, Map, Music,
  Plane, PiggyBank, ShieldCheck, ShoppingBag, ShoppingCart, Shirt, Smartphone,
  Sparkles, Star, Target, Utensils, Vault, Wallet, WalletCards, Zap,
  Package, Leaf, Flame, Gift, Book, Banknote, Building, Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const ICON_OPTIONS: { name: string; Icon: LucideIcon }[] = [
  { name: "ShieldCheck", Icon: ShieldCheck },
  { name: "LockKeyhole", Icon: LockKeyhole },
  { name: "Vault", Icon: Vault },
  { name: "PiggyBank", Icon: PiggyBank },
  { name: "Wallet", Icon: Wallet },
  { name: "WalletCards", Icon: WalletCards },
  { name: "DollarSign", Icon: DollarSign },
  { name: "Banknote", Icon: Banknote },
  { name: "CreditCard", Icon: CreditCard },
  { name: "Target", Icon: Target },
  { name: "Compass", Icon: Compass },
  { name: "Sparkles", Icon: Sparkles },
  { name: "Laptop", Icon: Laptop },
  { name: "ShoppingBag", Icon: ShoppingBag },
  { name: "ShoppingCart", Icon: ShoppingCart },
  { name: "Shirt", Icon: Shirt },
  { name: "Dumbbell", Icon: Dumbbell },
  { name: "Heart", Icon: Heart },
  { name: "Star", Icon: Star },
  { name: "Coffee", Icon: Coffee },
  { name: "Utensils", Icon: Utensils },
  { name: "Car", Icon: Car },
  { name: "Home", Icon: Home },
  { name: "Plane", Icon: Plane },
  { name: "Music", Icon: Music },
  { name: "Briefcase", Icon: Briefcase },
  { name: "Book", Icon: Book },
  { name: "Camera", Icon: Camera },
  { name: "Gift", Icon: Gift },
  { name: "Map", Icon: Map },
  { name: "Globe", Icon: Globe },
  { name: "Smartphone", Icon: Smartphone },
  { name: "GraduationCap", Icon: GraduationCap },
  { name: "Package", Icon: Package },
  { name: "Leaf", Icon: Leaf },
  { name: "Flame", Icon: Flame },
  { name: "Zap", Icon: Zap },
  { name: "Building", Icon: Building },
  { name: "Trophy", Icon: Trophy },
];

export function getIconComponent(name?: string): LucideIcon {
  return ICON_OPTIONS.find((o) => o.name === name)?.Icon ?? Wallet;
}

export function IconPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (name: string) => void;
}) {
  return (
    <div className="grid grid-cols-8 gap-1.5">
      {ICON_OPTIONS.map(({ name, Icon }) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
            value === name
              ? "bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/40"
              : "bg-white/5 text-neutral-400 hover:bg-white/10 hover:text-neutral-200"
          }`}
          title={name}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
