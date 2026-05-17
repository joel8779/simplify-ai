"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  variant?: "default" | "danger";
  delay?: number;
}

export function SettingsSection({
  title,
  description,
  children,
  variant = "default",
  delay = 0,
}: SettingsSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className={cn(
        "rounded-xl border bg-card/50 backdrop-blur-sm",
        variant === "danger"
          ? "border-red-500/30 bg-red-500/5"
          : "border-border/50"
      )}
    >
      <div className="border-b border-border/40 px-5 py-4 sm:px-6">
        <h2
          className={cn(
            "text-base font-semibold tracking-tight",
            variant === "danger" && "text-red-400"
          )}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="px-5 py-4 sm:px-6">{children}</div>
    </motion.section>
  );
}
