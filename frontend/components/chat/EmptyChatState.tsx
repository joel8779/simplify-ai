"use client";

import { Sparkles } from "lucide-react";
import { DocumentScopeBanner } from "@/components/chat/DocumentScopeBanner";
import { cn } from "@/lib/utils/cn";

const SUGGESTIONS = [
  "Summarize my latest uploaded document",
  "What are the key risks mentioned in the contract?",
  "Compare Q3 vs Q4 performance metrics",
  "Draft an executive summary from my PDFs",
];

interface EmptyChatStateProps {
  onSuggestionClick?: (text: string) => void;
  activeDocumentCount?: number;
}

export function EmptyChatState({
  onSuggestionClick,
  activeDocumentCount = 0,
}: EmptyChatStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 pb-[18rem] animate-fade-in md:pb-[20rem]">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-600/20 ring-1 ring-white/10">
        <Sparkles className="h-8 w-8 text-violet-400" />
      </div>

      <h1 className="mb-2 text-center text-3xl font-semibold tracking-tight md:text-4xl">
        <span className="gradient-text">Hello</span>
        <span className="text-foreground">, how can I help?</span>
      </h1>

      <p className="mb-6 max-w-md text-center text-sm text-muted-foreground md:text-base">
        {activeDocumentCount > 0
          ? "Ask about your attached documents. Answers will be scoped to your selection only."
          : "Attach documents from your library to scope this conversation, then ask anything."}
      </p>

      <div className="mb-8 w-full max-w-lg px-2">
        <DocumentScopeBanner />
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((suggestion, i) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestionClick?.(suggestion)}
            className={cn(
              "group rounded-2xl border border-border/60 bg-card/50 px-4 py-3.5 text-left text-sm text-muted-foreground",
              "transition-all duration-200 hover:border-primary/30 hover:bg-accent/40 hover:text-foreground",
              "animate-fade-in-up"
            )}
            style={{ animationDelay: `${i * 80 + 200}ms`, opacity: 0 }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
