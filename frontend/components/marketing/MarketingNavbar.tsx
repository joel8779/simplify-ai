"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { GetStartedButton } from "@/components/marketing/GetStartedButton";
import { MarketingNavLink } from "@/components/marketing/MarketingNavLink";
import {
  MARKETING_NAV,
  MARKETING_SECTION_IDS,
  ROUTES,
} from "@/lib/constants/navigation";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { scrollToSection } from "@/lib/utils/scroll";
import { cn } from "@/lib/utils/cn";

export function MarketingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const activeId = useScrollSpy(MARKETING_SECTION_IDS);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSectionClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    scrollToSection(href);
    setMobileOpen(false);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-border/50 bg-background/70 shadow-lg shadow-black/10 backdrop-blur-2xl"
          : "border-b border-transparent bg-background/35 backdrop-blur-md"
      )}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/10 via-background/75 to-transparent opacity-0 transition-opacity duration-500"
        animate={{ opacity: scrolled ? 1 : 0 }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Mobile: logo + menu */}
        <div className="flex h-16 items-center justify-between md:hidden">
          <Logo size="sm" className="shrink-0" />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Desktop: balanced 3-column grid */}
        <div className="hidden h-16 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 md:grid">
          {/* Left — logo */}
          <div className="flex min-w-0 items-center justify-start">
            <Logo size="sm" className="shrink-0" />
          </div>

          {/* Center — nav links (true geometric center) */}
          <nav
            className="flex items-center justify-center gap-1"
            aria-label="Main"
          >
            {MARKETING_NAV.map((item) => {
              const sectionId = item.href.replace("#", "");
              return (
                <MarketingNavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  isActive={activeId === sectionId}
                  onClick={(e) => handleSectionClick(e, item.href)}
                />
              );
            })}
          </nav>

          {/* Right — auth / CTA (mirrors left column width) */}
          <div className="flex min-w-0 items-center justify-end gap-2.5">
            <Button variant="ghost" size="sm" className="h-9 px-3" asChild>
              <Link href={ROUTES.login}>Log in</Link>
            </Button>
            <GetStartedButton />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border/40 bg-background/80 backdrop-blur-xl md:hidden"
          >
            <nav className="flex flex-col gap-0.5 px-4 py-4 sm:px-6">
              {MARKETING_NAV.map((item) => {
                const sectionId = item.href.replace("#", "");
                const isActive = activeId === sectionId;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleSectionClick(e, item.href)}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-purple-500/10 font-medium text-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </a>
                );
              })}
              <div className="mt-3 flex flex-col gap-2 border-t border-border/40 pt-4">
                <Button variant="outline" asChild className="w-full">
                  <Link
                    href={ROUTES.login}
                    onClick={() => setMobileOpen(false)}
                  >
                    Log in
                  </Link>
                </Button>
                <GetStartedButton
                  fullWidth
                  onClick={() => setMobileOpen(false)}
                />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
