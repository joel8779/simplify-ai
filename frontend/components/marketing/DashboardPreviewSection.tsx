"use client";

import { motion } from "framer-motion";
import { 
  BarChart3, 
  FileText, 
  MessageSquare, 
  Settings, 
  ChevronRight, 
  Terminal 
} from "lucide-react";

export function DashboardPreviewSection() {
  return (
    <section
      id="preview"
      className="scroll-mt-[4.5rem] border-t border-border/40 px-4 py-20 pb-24 sm:px-6 sm:py-28 sm:pb-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Console Interface
          </h2>
          <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
            Monitor vector spaces, verify source citations, and manage isolated document namespaces.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          {/* Subtle outline highlight, no giant neon gradient */}
          <div className="absolute inset-0 rounded-2xl border border-border/50 bg-background/5 pointer-events-none" />
          
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card/90 shadow-2xl shadow-black/80 backdrop-blur-xl">
            
            {/* Top status bar (Vercel-style) */}
            <div className="flex items-center justify-between border-b border-border/50 bg-muted/40 px-4 py-3 text-xs">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-mono text-[11px] text-muted-foreground">env: production</span>
                </div>
                <div className="h-3 w-px bg-border/60 hidden sm:block" />
                <div className="hidden sm:flex items-center gap-2 text-muted-foreground font-mono text-[11px]">
                  <span>sk_live_...9a2f</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] uppercase font-semibold">Active</span>
                </div>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
                <span>model: gemini-1.5-flash</span>
                <span className="rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 text-[9px]">
                  RAG mode
                </span>
              </div>
            </div>

            {/* Sidebar + Main Grid */}
            <div className="grid gap-0 md:grid-cols-[200px_1fr]">
              
              {/* Sidebar (Linear-style navigation) */}
              <aside className="hidden border-r border-border/50 bg-muted/10 p-3 md:block font-mono">
                <div className="space-y-4">
                  <div>
                    <span className="block px-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
                      Navigation
                    </span>
                    <nav className="space-y-1">
                      {[
                        { label: "Dashboard", icon: BarChart3, active: false },
                        { label: "New Chat", icon: MessageSquare, active: true },
                        { label: "Documents", icon: FileText, active: false },
                        { label: "Settings", icon: Settings, active: false },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={`flex items-center gap-2 rounded px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                            item.active
                              ? "bg-muted text-foreground font-medium"
                              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                          }`}
                        >
                          <item.icon className="h-3.5 w-3.5" />
                          {item.label}
                        </div>
                      ))}
                    </nav>
                  </div>

                  <div>
                    <span className="block px-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
                      Active namespaces
                    </span>
                    <div className="space-y-1 text-[11px] text-muted-foreground px-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span>usr_prod_default</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span>usr_security_scope</span>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main Content Area */}
              <div className="p-4 sm:p-6 grid gap-6 lg:grid-cols-[250px_1fr]">
                
                {/* Left panel: Context Document list */}
                <aside className="space-y-4 border-b lg:border-b-0 lg:border-r border-border/40 pb-4 lg:pb-0 lg:pr-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Document Inventory
                    </h4>
                    <span className="font-mono text-[10px] text-muted-foreground">3 files</span>
                  </div>
                  
                  <div className="space-y-2">
                    {[
                      { name: "q4_board_deck.pdf", size: "1.2 MB", status: "Indexed", color: "text-emerald-400 border-emerald-400/20 bg-emerald-500/5" },
                      { name: "security_policy_v2.docx", size: "420 KB", status: "Ready", color: "text-emerald-400 border-emerald-400/20 bg-emerald-500/5" },
                      { name: "api_key_policy.md", size: "84 KB", status: "Cached", color: "text-blue-400 border-blue-400/20 bg-blue-500/5" },
                    ].map((file) => (
                      <div
                        key={file.name}
                        className="rounded border border-border/50 bg-background/50 p-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate text-foreground font-medium">{file.name}</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px]">
                          <span className="text-muted-foreground">{file.size}</span>
                          <span className={`rounded border px-1.5 py-0.5 text-[9px] font-mono ${file.color}`}>
                            {file.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </aside>

                {/* Right panel: Active Chat UI with detailed Citations */}
                <div className="space-y-4 flex flex-col justify-between min-h-[380px]">
                  
                  {/* Chat flow */}
                  <div className="space-y-4">
                    {/* User Prompt */}
                    <div className="ml-auto max-w-[85%] rounded border border-border/60 bg-muted/20 px-3.5 py-2.5 text-xs text-foreground font-mono">
                      &gt; summarize key metrics from the Q4 board deck
                    </div>
                    
                    {/* Assistant Response */}
                    <div className="max-w-[95%] rounded border border-border bg-background p-4 text-xs space-y-3 leading-relaxed">
                      <div className="flex items-center gap-2 border-b border-border/40 pb-2 mb-2">
                        <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                          RAG Response Pipeline (Grounded)
                        </span>
                      </div>
                      
                      <p className="text-foreground/90">
                        Based on the uploaded <code className="font-mono bg-muted px-1 py-0.5 rounded text-[11px] text-indigo-400">q4_board_deck.pdf</code>:
                      </p>
                      
                      <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground">
                        <li>QoQ revenue expansion reached <strong className="text-foreground">18%</strong>, bringing consolidated revenue to $12.4M.</li>
                        <li>Enterprise RAG contract expansions accounted for <strong className="text-foreground">72%</strong> of new recurring growth.</li>
                        <li>Operational hosting overhead decreased by 14% via vector similarity cache optimization.</li>
                      </ul>

                      {/* Deep Source Citations Inspection */}
                      <div className="mt-4 pt-3 border-t border-border/40 space-y-2">
                        <span className="block font-mono text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                          VERIFIED CITATIONS (2)
                        </span>
                        
                        <div className="grid gap-2 sm:grid-cols-2">
                          {[
                            { name: "q4_board_deck.pdf", page: 12, match: 0.892, excerpt: "...consolidated Q4 revenue reached $12.4M, representing an 18% growth quarter-over-quarter..." },
                            { name: "q4_board_deck.pdf", page: 14, match: 0.844, excerpt: "...recurring growth expansion vectors were heavily anchored in enterprise client accounts..." }
                          ].map((cit, idx) => (
                            <div key={idx} className="rounded border border-border/50 bg-muted/10 p-2 font-mono text-[10px]">
                              <div className="flex items-center justify-between border-b border-border/30 pb-1 mb-1 text-[9px]">
                                <span className="text-indigo-400 font-semibold">{idx+1}. {cit.name} [p. {cit.page}]</span>
                                <span className="text-muted-foreground">score: {cit.match}</span>
                              </div>
                              <p className="text-muted-foreground leading-normal line-clamp-2 italic">
                                "{cit.excerpt}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input form mockup */}
                  <div className="rounded border border-border bg-background p-2 flex items-center justify-between gap-3">
                    <span className="font-mono text-xs text-muted-foreground pl-2">&gt; Ask RAG pipeline...</span>
                    <button className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground">
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                </div>

              </div>

            </div>

            {/* Bottom metrics console panel (Vercel-style stats bar) */}
            <div className="border-t border-border/50 bg-muted/20 px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
              {[
                { label: "Pinecone Vectors", value: "148,290" },
                { label: "MongoDB Size", value: "42.4 MB" },
                { label: "Avg RAG Latency", value: "145ms" },
                { label: "Token Cache Hit", value: "84.2%" },
              ].map((stat) => (
                <div key={stat.label} className="text-xs">
                  <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                  <span className="mt-1 block text-sm font-semibold text-foreground">{stat.value}</span>
                </div>
              ))}
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
}
