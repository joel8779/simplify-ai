"use client";

import { motion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";
import { ROUTES } from "@/lib/constants/navigation";

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <motion.div
      className="mb-8 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.4 }}
    >
      <Logo href={ROUTES.home} size="lg" className="mb-6 justify-center" />

      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
    </motion.div>
  );
}
