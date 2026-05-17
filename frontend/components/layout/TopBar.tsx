"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/layout/BackButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import {
  getBackFallback,
  shouldShowBackButton,
} from "@/lib/utils/navigation";
import { useUIStore } from "@/store/useUIStore";

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const pathname = usePathname();
  const { setSidebarOpen } = useUIStore();
  const showBack = shouldShowBackButton(pathname);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border/50 bg-background/80 px-4 backdrop-blur-md md:hidden">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {showBack ? (
          <BackButton fallbackHref={getBackFallback(pathname)} />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {title && (
          <h1 className="truncate text-sm font-medium text-foreground">
            {title}
          </h1>
        )}
      </div>

      <ThemeToggle />
    </header>
  );
}
