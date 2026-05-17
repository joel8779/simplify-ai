"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-white/10",
        "bg-card/40 p-8 shadow-2xl shadow-black/40 backdrop-blur-xl",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl",
        "before:bg-gradient-to-b before:from-white/[0.08] before:to-transparent",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
