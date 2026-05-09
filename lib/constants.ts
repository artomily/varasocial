import {
  Home,
  Search,
  TrendingUp,
  SlidersHorizontal,
  ShieldCheck,
  Bot,
  Bell,
  Mail,
  Bookmark,
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
  { label: "Proven Truth", href: "/proven-truth", icon: ShieldCheck },
  { label: "Mode Turu", href: "/mode-turu", icon: Bot },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Messages", href: "/messages", icon: Mail },
  { label: "Bookmarks", href: "/bookmarks", icon: Bookmark },
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
  suspicious: "#ffd400",
  hoax: "#f4212e",
} as const;

export const BRAND = {
  name: "VaraSocial",
  accent: "#ff9500",
  token: "$VARA",
} as const;
