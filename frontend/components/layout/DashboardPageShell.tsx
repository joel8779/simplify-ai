"use client";

import { motion } from "framer-motion";

interface DashboardPageShellProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function DashboardPageShell({
  title,
  description,
  children,
}: DashboardPageShellProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-4xl"
      >
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-2 text-muted-foreground">{description}</p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </motion.div>
    </div>
  );
}
