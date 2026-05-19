"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, CheckCircle2, PlayCircle, ShieldCheck, Sparkles } from "lucide-react";
import { GetStartedButton } from "@/components/marketing/GetStartedButton";
import { HeroBackground } from "@/components/marketing/HeroBackground";
import { HeroDashboardMockup } from "@/components/marketing/HeroDashboardMockup";
import { BRAND_DESCRIPTION, BRAND_TAGLINE } from "@/lib/constants/brand";
import { ROUTES } from "@/lib/constants/navigation";

const trustIndicators = [
  "Cited answers",
  "Secure document scope",
  "Production RAG",
];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-20 lg:pb-32 lg:pt-24">
      <HeroBackground />

      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10">
        <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-xs font-medium text-muted-foreground shadow-lg shadow-black/10 backdrop-blur-xl"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Sparkles className="h-3 w-3" />
            </span>
            {BRAND_TAGLINE}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl xl:text-7xl"
          >
            <span className="animated-gradient-text">Simplify</span>{" "}
            document intelligence for teams building with AI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="mx-auto mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8 lg:mx-0"
          >
            {BRAND_DESCRIPTION} Upload knowledge, ask natural questions, and ship
            reliable AI workflows with traceable sources.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start"
          >
            <GetStartedButton size="lg" />
            <Link
              href={ROUTES.login}
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-6 text-sm font-medium text-foreground shadow-lg shadow-black/10 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-white/[0.075] hover:shadow-primary/15"
            >
              <PlayCircle className="h-4 w-4 text-primary" />
              View demo workspace
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.32 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground lg:justify-start"
          >
            {trustIndicators.map((indicator) => (
              <span
                key={indicator}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 backdrop-blur-md"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                {indicator}
              </span>
            ))}
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-blue-200 backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5" />
              Enterprise ready
            </span>
          </motion.div>
        </div>

        <HeroDashboardMockup />
      </div>
    </section>
  );
}
