"use client";

import { motion } from "framer-motion";
import { BarChart3, FileText, MessageSquare } from "lucide-react";

export function DashboardPreviewSection() {
  return (
    <section
      id="preview"
      className="scroll-mt-[4.5rem] border-t border-border/40 px-4 py-20 pb-24 sm:px-6 sm:py-28 sm:pb-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            A dashboard built for{" "}
            <span className="gradient-text">clarity and speed</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Monitor usage, manage documents, and jump into chats from one
            unified workspace.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-14"
        >
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-500/20 via-violet-500/20 to-purple-500/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <div className="flex items-center gap-2 border-b border-border/50 bg-muted/30 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-3 text-xs text-muted-foreground">
                app.simplify.ai/dashboard
              </span>
            </div>

            <div className="grid gap-0 md:grid-cols-[220px_1fr]">
              <aside className="hidden border-r border-border/50 bg-sidebar/80 p-4 md:block">
                <div className="mb-6 h-8 w-28 rounded-lg bg-muted/50" />
                <div className="space-y-2">
                  {["Dashboard", "Chat", "Documents", "Settings"].map((label) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-muted-foreground"
                    >
                      <div className="h-4 w-4 rounded bg-muted" />
                      {label}
                    </div>
                  ))}
                </div>
              </aside>

              <div className="p-4 sm:p-6">
                <div className="mb-6 grid gap-3 sm:grid-cols-3">
                  {[
                    { icon: MessageSquare, label: "Active chats", value: "24" },
                    { icon: FileText, label: "Documents", value: "186" },
                    { icon: BarChart3, label: "Queries today", value: "1.2k" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-border/50 bg-background/50 p-4"
                    >
                      <stat.icon className="mb-2 h-4 w-4 text-primary" />
                      <p className="text-2xl font-semibold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-border/50 bg-background/40 p-4">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Recent conversation
                  </p>
                  <div className="space-y-3">
                    <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary/90 px-4 py-2.5 text-sm text-primary-foreground">
                      Summarize the Q4 board deck highlights
                    </div>
                    <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-border/50 bg-card px-4 py-3 text-sm text-muted-foreground">
                      Based on your uploaded deck, revenue grew 18% QoQ with
                      strongest performance in enterprise…
                      <span className="mt-2 block text-xs text-primary/80">
                        Sources: Q4-Board-Deck.pdf, p. 12–14
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
