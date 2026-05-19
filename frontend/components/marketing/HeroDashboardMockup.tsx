"use client";

import type { ElementType } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  BarChart3,
  Bot,
  CheckCircle2,
  Database,
  FileText,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const floatCards = [
  {
    label: "PDF Uploaded",
    value: "98 pages indexed",
    icon: UploadCloud,
    className: "left-0 top-10 -translate-x-4 sm:-translate-x-12",
    delay: 0.2,
  },
  {
    label: "AI Response Generated",
    value: "1.4s latency",
    icon: Bot,
    className: "right-0 top-24 translate-x-3 sm:translate-x-10",
    delay: 0.45,
  },
  {
    label: "Sources Cited",
    value: "12 citations",
    icon: ShieldCheck,
    className: "bottom-16 left-2 sm:-left-8",
    delay: 0.7,
  },
  {
    label: "Semantic Search Active",
    value: "Vector match 94%",
    icon: Database,
    className: "bottom-4 right-2 sm:-right-6",
    delay: 0.95,
  },
];

const documentCards = ["Q4 research.pdf", "Security brief.docx", "Roadmap notes.md"];
const sourcePills = ["Policy 4.2", "SOC2 Report", "Roadmap"];

export function HeroDashboardMockup() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 26, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-[620px] lg:max-w-none"
      aria-label="AI document intelligence dashboard preview"
    >
      <div className="absolute inset-6 rounded-[2rem] bg-primary/20 blur-3xl" />

      {floatCards.map((card) => {
        const Icon = card.icon;

        return (
          <motion.div
            key={card.label}
            className={cn(
              "absolute z-20 hidden w-48 rounded-2xl border border-white/10 bg-background/70 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl sm:block",
              card.className
            )}
            initial={{ opacity: 0, y: 14 }}
            animate={{
              opacity: 1,
              y: shouldReduceMotion ? 0 : [0, -8, 0],
            }}
            transition={{
              opacity: { duration: 0.45, delay: card.delay },
              y: {
                duration: 5,
                delay: card.delay,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/90 to-violet-600/90 shadow-lg shadow-primary/20">
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">
                  {card.label}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {card.value}
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}

      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.055] p-3 shadow-2xl shadow-blue-950/40 backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,hsl(217_91%_60%/0.18),transparent_30%),radial-gradient(circle_at_92%_10%,hsl(270_65%_58%/0.16),transparent_26%)]" />
        <div className="relative rounded-[1.35rem] border border-white/10 bg-background/70 p-4 backdrop-blur-xl sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_hsl(142_76%_45%/0.9)]" />
              RAG pipeline live
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
            <aside className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
                <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                  <Search className="h-3.5 w-3.5 text-primary" />
                  Ask across uploaded docs
                </div>
                <div className="space-y-2">
                  {documentCards.map((doc, index) => (
                    <motion.div
                      key={doc}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] p-2.5"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.35 + index * 0.08 }}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">
                          {doc}
                        </p>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-blue-400 to-violet-400"
                            initial={{ width: "22%" }}
                            animate={{ width: `${72 + index * 8}%` }}
                            transition={{ duration: 1.2, delay: 0.45 + index * 0.12 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <MetricCard icon={BarChart3} label="Recall" value="94%" />
                <MetricCard icon={CheckCircle2} label="Grounded" value="99.2%" />
              </div>
            </aside>

            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3 shadow-inner shadow-white/5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-primary/20">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Simplify AI
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Cited enterprise answer
                    </p>
                  </div>
                </div>
                <MessageSquareText className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="mb-3 rounded-2xl border border-white/10 bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">
                  Summarize contract renewal risk and cite the relevant sources.
                </p>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium text-blue-200">
                  <Bot className="h-4 w-4" />
                  Answer generated from 3 indexed sources
                </div>
                <div className="space-y-2">
                  <SkeletonLine width="w-full" />
                  <SkeletonLine width="w-11/12" />
                  <SkeletonLine width="w-4/5" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {sourcePills.map((source) => (
                    <span
                      key={source}
                      className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] text-muted-foreground"
                    >
                      {source}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-background/50 p-3">
                <div className="mb-3 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Semantic vector search</span>
                  <span>live clusters</span>
                </div>
                <VectorSearchVisual />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
      <Icon className="mb-3 h-4 w-4 text-primary" />
      <p className="text-lg font-semibold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function SkeletonLine({ width }: { width: string }) {
  return (
    <div className={cn("h-2 rounded-full bg-gradient-to-r from-white/25 to-white/5", width)} />
  );
}

function VectorSearchVisual() {
  return (
    <div className="relative h-24 overflow-hidden rounded-xl bg-black/20">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.08)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.08)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />
      {[18, 34, 52, 68, 82].map((left, index) => (
        <motion.span
          key={left}
          className="absolute h-2 w-2 rounded-full bg-blue-300 shadow-[0_0_18px_hsl(217_91%_65%/0.85)]"
          style={{ left: `${left}%`, top: `${24 + (index % 3) * 18}%` }}
          animate={{ scale: [1, 1.45, 1], opacity: [0.55, 1, 0.55] }}
          transition={{
            duration: 2.4,
            delay: index * 0.25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
      <div className="absolute left-[18%] top-[35%] h-px w-[64%] rotate-6 bg-gradient-to-r from-transparent via-violet-300/60 to-transparent" />
      <div className="absolute left-[30%] top-[62%] h-px w-[44%] -rotate-12 bg-gradient-to-r from-transparent via-blue-300/50 to-transparent" />
    </div>
  );
}
