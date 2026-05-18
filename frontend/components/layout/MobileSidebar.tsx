"use client";

import Link from "next/link";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Logo } from "@/components/brand/Logo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { NavItem } from "@/components/layout/NavItem";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { ChatSessionList } from "@/components/chat/ChatSessionList";
import { DASHBOARD_NAV, ROUTES } from "@/lib/constants/navigation";
import { useUIStore } from "@/store/useUIStore";

export function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="flex w-72 flex-col p-0">
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <Logo href={ROUTES.dashboard} size="sm" />
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {DASHBOARD_NAV.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon!}
              label={item.label}
            />
          ))}
        </nav>

        <div className="flex min-h-0 flex-1 flex-col border-t border-sidebar-border px-2 py-3">
          <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recent
          </p>
          <ChatSessionList onSelect={() => setSidebarOpen(false)} />
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-sidebar-border p-4">
          <div className="flex items-center gap-2">
            <Link
              href={ROUTES.settings}
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              Settings
            </Link>
            <LogoutButton onLoggedOut={() => setSidebarOpen(false)} />
          </div>
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
