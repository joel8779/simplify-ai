"use client";

import { MarketingNavbar } from "@/components/marketing/MarketingNavbar";
import { Footer } from "@/components/marketing/Footer";

export function MarketingLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <MarketingNavbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
