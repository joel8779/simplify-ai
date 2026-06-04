"use client";

import { motion } from "framer-motion";
import { Database, FileText } from "lucide-react";

export function HeroDashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-[620px] lg:max-w-none"
      aria-label="RAG query execution trace dashboard preview"
    >
      {/* Faint, subtle glow in dark theme */}
      <div className="absolute inset-6 rounded-[2rem] bg-primary/5 blur-3xl pointer-events-none" />

      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/30 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="relative rounded-xl border border-border/60 bg-background/90 p-4">
          
          {/* Header bar */}
          <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="h-2 w-2 rounded-full bg-border" />
                <span className="h-2 w-2 rounded-full bg-border" />
                <span className="h-2 w-2 rounded-full bg-border" />
              </div>
              <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                trace_console::session_4b92x
              </span>
            </div>
            <div className="flex items-center gap-2 rounded bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              READY
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid gap-4 md:grid-cols-[1fr_1.3fr]">
            
            {/* Left side: Workspace scope */}
            <aside className="space-y-4 border-r-0 md:border-r border-border/40 pr-0 md:pr-4">
              <div>
                <h3 className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  Document Scope (3)
                </h3>
                <div className="space-y-1.5">
                  {[
                    { name: "policy_sample.pdf", chunks: 24 },
                    { name: "soc2_sample.pdf", chunks: 142 },
                    { name: "api_key_policy_example.md", chunks: 8 },
                  ].map((doc) => (
                    <div
                      key={doc.name}
                      className="flex items-center justify-between rounded border border-border/45 bg-muted/15 p-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate font-medium text-foreground">{doc.name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                        {doc.chunks} chk
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded border border-border/45 bg-muted/10 p-2.5">
                <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  <Database className="h-3.5 w-3.5 text-muted-foreground" />
                  Vector Store (Pinecone)
                </div>
                <div className="space-y-1 font-mono text-[10px] text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Index:</span>
                    <span className="text-foreground">simplify-demo</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Namespace:</span>
                    <span className="text-foreground">usr_demo_92f81</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Metric:</span>
                    <span className="text-foreground">Cosine</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Right side: Execution trace */}
            <div className="space-y-3 pt-2 md:pt-0">
              <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                RAG Pipeline Trace
              </h3>
              
              {/* Query block */}
              <div className="rounded border border-border/60 bg-muted/40 p-2.5">
                <span className="font-mono text-[10px] text-muted-foreground">INPUT QUERY</span>
                <p className="mt-0.5 font-mono text-xs text-primary font-medium">
                  &gt; What is our log retention period?
                </p>
              </div>

              {/* Log trace */}
              <div className="space-y-1.5 rounded border border-border/40 bg-muted/10 p-2.5 font-mono text-[10px] text-muted-foreground">
                <div className="flex justify-between">
                  <span>[10:33:41.02] EMBEDDING_GEN</span>
                  <span className="text-foreground">embeddings generator [~40ms]</span>
                </div>
                <div className="flex justify-between">
                  <span>[10:33:41.07] VECTOR_MATCH</span>
                  <span className="text-foreground">vector similarity [~80ms]</span>
                </div>
                <div className="flex justify-between">
                  <span>[10:33:41.15] CONTEXT_BUILD</span>
                  <span className="text-foreground">context compiled [~5ms]</span>
                </div>
                <div className="flex justify-between border-t border-border/30 pt-1.5 mt-1.5 font-medium text-indigo-400">
                  <span>[10:33:41.16] LLM_RESPONSE</span>
                  <span>context inference [~700ms]</span>
                </div>
              </div>

              {/* Citations generated */}
              <div className="rounded border border-border/60 bg-muted/30 p-2.5">
                <span className="block font-mono text-[10px] text-muted-foreground mb-1">CITED DOCUMENT SEGMENT</span>
                <p className="text-xs text-foreground leading-relaxed line-clamp-2">
                  "...Log data is retained for 90 days. After this retention period, audit logs are permanently deleted..."
                </p>
                <div className="mt-2 flex items-center justify-between border-t border-border/30 pt-1.5 text-[10px] text-muted-foreground font-mono">
                  <span>source: policy_sample.pdf</span>
                  <span>relevance: high</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  );
}
