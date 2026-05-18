"use client";

import { motion } from "framer-motion";
import { GetStartedButton } from "@/components/marketing/GetStartedButton";
import { BRAND_DESCRIPTION, BRAND_TAGLINE } from "@/lib/constants/brand";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
      <motion.div
        className="pointer-events-none absolute inset-0 -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.14),transparent_42%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,hsl(var(--background)/0),hsl(var(--background))_88%)]" />
      </motion.div>

      <div className="mx-auto max-w-4xl text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 inline-flex items-center rounded-full border border-border/60 bg-card/55 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-lg shadow-black/10 backdrop-blur-sm"
        >
          {BRAND_TAGLINE}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
        >
          <span className="gradient-text">Simplify</span>{" "}
          <span className="text-foreground">how your team uses AI</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.16 }}
          className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8"
        >
          {BRAND_DESCRIPTION}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.24 }}
          className="mt-10 flex justify-center"
        >
          <GetStartedButton size="lg" />
        </motion.div>
      </div>
    </section>
  );
}
