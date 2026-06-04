"use client";

import { motion } from "framer-motion";
import { ArrowRight, Code2 } from "lucide-react";

const PIPELINE_STEPS = [
  {
    step: "Upload",
    description: "Multipart binary upload stream",
    detail: "FastAPI handles PDF, DOCX, or TXT file buffer ingestion",
  },
  {
    step: "Parse",
    description: "Text extraction & layout parsing",
    detail: "Extract metadata, pages, structural headers, and layouts",
  },
  {
    step: "Chunk",
    description: "Recursive character chunking",
    detail: "500-token sliding windows with 10% semantic token overlap",
  },
  {
    step: "Embed",
    description: "Vector representation",
    detail: "Generate 1024-dimensional embeddings via Gemini API",
  },
  {
    step: "Retrieve",
    description: "Namespace vector search",
    detail: "Pinecone top-k cosine similarity filtered by document scope",
  },
  {
    step: "Generate",
    description: "Context-grounded LLM inference",
    detail: "LLM parses query grounded strictly on matching document chunks",
  },
  {
    step: "Citations",
    description: "Source verification",
    detail: "Verify token offsets and map citations directly to source pages",
  },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="scroll-mt-[4.5rem] border-t border-border/40 px-4 py-20 sm:px-6 sm:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 text-center lg:text-left max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Ingestion & Retrieval Pipeline
          </h2>
          <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
            Every document is split, embedded, and indexed with user isolation. 
            Access your database through raw REST endpoints.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_1.25fr]">
          
          {/* LEFT: Architecture Flow */}
          <div className="relative rounded-xl border border-border/60 bg-card/25 p-5 sm:p-6">
            <h3 className="mb-6 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Pipeline Stages
            </h3>
            
            <div className="relative space-y-6 pl-6">
              {/* Vertical timeline line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
              
              {PIPELINE_STEPS.map((step, idx) => (
                <div key={step.step} className="relative flex gap-4 text-xs">
                  {/* Timeline dot */}
                  <span className="absolute -left-[20px] flex h-[10px] w-[10px] items-center justify-center rounded-full bg-background border border-border">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-muted-foreground">0{idx + 1}.</span>
                      <span className="font-mono font-semibold text-foreground uppercase tracking-wide">
                        {step.step}
                      </span>
                      {idx < PIPELINE_STEPS.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-muted-foreground/35" />
                      )}
                    </div>
                    <p className="mt-0.5 text-foreground/90 font-medium">{step.description}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground font-mono leading-relaxed">
                      {step.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Developer integration code playground */}
          <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-card/10 p-1">
            <div className="rounded-lg border border-border/60 bg-background/90 p-4 font-mono">
              <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                    query_rag.py
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">Python 3.11</span>
              </div>
              
              <div className="overflow-x-auto text-[11px] leading-6 text-slate-300">
                <pre>
                  <code>
                    <span className="text-blue-400">import</span> httpx<br /><br />
                    
                    client = httpx.Client(base_url=<span className="text-amber-300">"https://api.simplify.ai/v1"</span>)<br /><br />
                    
                    <span className="text-muted-foreground"># Scope vector search to document namespaces</span><br />
                    response = client.post(<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-300">"/chat/query"</span>,<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;headers=<span className="text-violet-400">{"{"}</span><span className="text-amber-300">"Authorization"</span>: <span className="text-amber-300">"Bearer sk_live_9a2f"</span><span className="text-violet-400">{"}"}</span>,<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;json=<span className="text-violet-400">{"{"}</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-300">"query"</span>: <span className="text-amber-300">"What is the log retention period?"</span>,<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-300">"document_ids"</span>: [<span className="text-amber-300">"doc_policy_v4"</span>],<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-300">"response_mode"</span>: <span className="text-amber-300">"rag_mode"</span>,<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-300">"parameters"</span>: <span className="text-violet-400">{"{"}</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-300">"temperature"</span>: <span className="text-emerald-400">0.2</span>,<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-300">"max_tokens"</span>: <span className="text-emerald-400">1024</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-violet-400">{"}"}</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-violet-400">{"}"}</span><br />
                    )<br /><br />
                    
                    payload = response.json()<br />
                    print(<span className="text-amber-300">f"Answer: {"{"}payload['content']{"}"}"</span>)<br />
                    print(<span className="text-amber-300">f"Sources: {"{"}len(payload['citations']){"}"} cited."</span>)
                  </code>
                </pre>
              </div>
            </div>
            
            <div className="mt-4 p-4 font-mono text-[10px] text-muted-foreground space-y-2">
              <div className="flex justify-between border-b border-border/30 pb-1">
                <span>Default Chunk Size</span>
                <span className="text-foreground">500 tokens</span>
              </div>
              <div className="flex justify-between border-b border-border/30 pb-1">
                <span>Overlap Margin</span>
                <span className="text-foreground">50 tokens</span>
              </div>
              <div className="flex justify-between border-b border-border/30 pb-1">
                <span>Database Client</span>
                <span className="text-foreground">Motor (MongoDB Async)</span>
              </div>
              <div className="flex justify-between">
                <span>Auth Middleware</span>
                <span className="text-foreground">HMAC-SHA256 JWT Rotation</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
