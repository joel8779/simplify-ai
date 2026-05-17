"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { ROUTES } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils/cn";

interface GetStartedButtonProps {
  size?: "default" | "lg";
  className?: string;
  fullWidth?: boolean;
  onClick?: () => void;
}

export function GetStartedButton({
  size = "default",
  className,
  fullWidth,
  onClick,
}: GetStartedButtonProps) {
  const isLg = size === "lg";

  return (
    <motion.div
      className={cn(fullWidth && "w-full")}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Link
        href={ROUTES.signup}
        onClick={onClick}
        className={cn(
          "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-medium",
          "bg-primary text-primary-foreground",
          "shadow-lg shadow-primary/20 transition-all duration-300",
          "hover:shadow-xl hover:shadow-primary/35",
          isLg ? "h-12 px-8 text-base" : "h-10 px-6 text-sm",
          fullWidth && "w-full",
          className
        )}
      >
        <span
          className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-violet-500/40 to-purple-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          aria-hidden
        />
        <span
          className="absolute -inset-px rounded-full bg-gradient-to-r from-blue-500/50 via-violet-500/50 to-purple-500/50 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-70"
          aria-hidden
        />
        <span className="relative">Get Started</span>
        <ArrowRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}
