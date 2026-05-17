"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface MarketingNavLinkProps {
  href: string;
  label: string;
  isActive: boolean;
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  className?: string;
}

export function MarketingNavLink({
  href,
  label,
  isActive,
  onClick,
  className,
}: MarketingNavLinkProps) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-colors duration-300",
        isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      <span
        className={cn(
          "relative z-10 transition-all duration-300",
          isActive && "bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent"
        )}
      >
        {label}
      </span>

      {isActive && (
        <motion.span
          layoutId="nav-underline"
          className="absolute -bottom-0.5 left-0 right-0 h-px bg-gradient-to-r from-blue-500/80 via-violet-500 to-purple-500/80"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}

      {isActive && (
        <motion.span
          layoutId="nav-glow"
          className="pointer-events-none absolute -inset-x-2 -inset-y-1 rounded-lg bg-gradient-to-r from-blue-500/10 via-violet-500/15 to-purple-500/10 blur-md"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </a>
  );
}
