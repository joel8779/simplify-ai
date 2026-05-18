"use client";

import {
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { NavItem } from "@/components/layout/NavItem";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ChatSessionList } from "@/components/chat/ChatSessionList";
import { DASHBOARD_NAV, ROUTES } from "@/lib/constants/navigation";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils/cn";

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();

  return (
    <aside
      className={cn(
        "hidden h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out md:flex",
        sidebarCollapsed ? "w-[68px]" : "w-64"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
        <Logo
          href={ROUTES.dashboard}
          size="sm"
          showLabel={!sidebarCollapsed}
          className={cn(
            "overflow-hidden transition-opacity",
            sidebarCollapsed && "w-full justify-center"
          )}
        />
        {!sidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={toggleSidebarCollapsed}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>

      <nav className="flex flex-col gap-1 p-3">
        {DASHBOARD_NAV.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon!}
            label={item.label}
            collapsed={sidebarCollapsed}
          />
        ))}
      </nav>

      {!sidebarCollapsed && (
        <div className="flex min-h-0 flex-1 flex-col border-t border-sidebar-border px-2 py-3 animate-fade-in">
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recent
          </p>
          <ChatSessionList />
        </div>
      )}

      <div
        className={cn(
          "mt-auto flex items-center border-t border-sidebar-border p-3",
          sidebarCollapsed ? "flex-col gap-2" : "justify-between"
        )}
      >
        {sidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSidebarCollapsed}
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}
        <ThemeToggle />
        <LogoutButton collapsed={sidebarCollapsed} />
      </div>
    </aside>
  );
}
