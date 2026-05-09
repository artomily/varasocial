import {
  Home,
  Search,
  TrendingUp,
  SlidersHorizontal,
  ShieldCheck,
  Bot,
  Bell,
  Mail,
  User,
  Settings,
  DollarSign,
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
  { label: "SocialFlow", href: "/socialflow", icon: TrendingUp },
  { label: "AI Filter", href: "/ai-filter", icon: SlidersHorizontal },
  { label: "Mode Turu", href: "/mode-turu", icon: Bot },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Messages", href: "/messages", icon: Mail },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Monetize", href: "/monetize", icon: DollarSign },
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

export const BRAND = {
  name: "VaraSocial",
  accent: "#7c3aed",
  token: "$VARA",
} as const;
