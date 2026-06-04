"use client";

import { motion } from "framer-motion";
import { GetStartedButton } from "@/components/marketing/GetStartedButton";
import { HeroBackground } from "@/components/marketing/HeroBackground";
import { HeroDashboardMockup } from "@/components/marketing/HeroDashboardMockup";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20">
      <HeroBackground />

      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10">
        <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded border border-border/80 bg-muted/40 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground shadow-sm"
          >
            <span>FastAPI</span>
            <span className="text-muted-foreground/30">•</span>
            <span>MongoDB</span>
            <span className="text-muted-foreground/30">•</span>
            <span>Pinecone</span>
            <span className="text-muted-foreground/30">•</span>
            <span>Gemini</span>
            <span className="text-muted-foreground/30">•</span>
            <span>Next.js</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl"
          >
            RAG engine for secure document intelligence
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0"
          >
            Query your files securely with grounded, traceable source citations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="mt-8 flex justify-center lg:justify-start"
          >
            <GetStartedButton size="lg" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.32 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3 font-mono text-[11px] text-muted-foreground lg:justify-start"
          >
            <span className="inline-flex items-center gap-1.5 rounded border border-border/80 bg-muted/30 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              ENV: PRODUCTION
            </span>
            <span className="inline-flex items-center gap-1.5 rounded border border-border/80 bg-muted/30 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              SECURE: ENABLED
            </span>
            <span className="inline-flex items-center gap-1.5 rounded border border-border/80 bg-muted/30 px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              CITED RESPONSES
            </span>
          </motion.div>
        </div>

        <HeroDashboardMockup />
      </div>
    </section>
  );
}
