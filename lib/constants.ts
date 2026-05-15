import {
  Home,
  Search,
  TrendingUp,
  SlidersHorizontal,
  Bot,
  Bell,
  Mail,
  User,
  Settings,
  DollarSign,
  Megaphone,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/explore", icon: Search },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Messages", href: "/messages", icon: Mail },
  { label: "Profile", href: "/profile", icon: User },
];

export const MAIN_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/explore", icon: Search },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Messages", href: "/messages", icon: Mail },
  { label: "Profile", href: "/profile", icon: User },
];

export const MORE_NAV_ITEMS: NavItem[] = [
  { label: "SocialFlow", href: "/socialflow", icon: TrendingUp },
  { label: "AI Filter", href: "/ai-filter", icon: SlidersHorizontal },
  { label: "Mode Sleep", href: "/mode-turu", icon: Bot },
  { label: "Monetize", href: "/monetize", icon: DollarSign },
  { label: "Ads Setup", href: "/ads/setup", icon: Megaphone },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const MOBILE_NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore", href: "/explore", icon: Search },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Messages", href: "/messages", icon: Mail },
  { label: "Profile", href: "/profile", icon: User },
];

export const TRUTH_COLORS = {
  valid: "#00ba7c",
  suspicious: "#c084fc",
  hoax: "#f4212e",
} as const;

/** Native reward / gas token displayed across the UI. */
export const BRAND = {
  name: "VaraSocial",
  accent: "#7c3aed",
  token: "$0G",
} as const;

/**
 * Default Blue subscription price in 0G shown in the UI.
 * The authoritative value is always read live from the smart contract
 * (`subscriptionPrice()`), but this constant is used as a fallback
 * while the contract read is loading.
 */
export const SUBSCRIPTION_PRICE_0G = 0.1 as const;
