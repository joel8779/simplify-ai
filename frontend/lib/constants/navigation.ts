import {
  FileText,
  LayoutDashboard,
  MessageSquarePlus,
  Settings,
  type LucideIcon,
} from "lucide-react";

export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  dashboard: "/dashboard",
  chat: "/chat",
  documents: "/documents",
  settings: "/settings",
} as const;

export type NavRoute = (typeof ROUTES)[keyof typeof ROUTES];

export interface NavLinkItem {
  href: string;
  label: string;
  icon?: LucideIcon;
}

export const MARKETING_NAV: NavLinkItem[] = [
  { href: "#features", label: "Features" },
  { href: "#preview", label: "Product" },
];

export const MARKETING_SECTION_IDS = MARKETING_NAV.map((item) =>
  item.href.replace("#", "")
);

export const DASHBOARD_NAV: NavLinkItem[] = [
  { href: ROUTES.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.chat, label: "New chat", icon: MessageSquarePlus },
  { href: ROUTES.documents, label: "Documents", icon: FileText },
  { href: ROUTES.settings, label: "Settings", icon: Settings },
];
