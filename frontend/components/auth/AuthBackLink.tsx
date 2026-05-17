"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ROUTES } from "@/lib/constants/navigation";

export function AuthBackLink() {
  return (
    <Link
      href={ROUTES.home}
      className="absolute left-4 top-4 z-20 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground sm:left-6 sm:top-6"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to home
    </Link>
  );
}
