"use client";

import { BookOpen } from "lucide-react";

import { SourceCitation } from "@/components/chat/SourceCitation";
import type { ChatMessage } from "@/store/useChatStore";

interface CitationPanelProps {
  citations?: ChatMessage["citations"];
}

export function CitationPanel({ citations }: CitationPanelProps) {
  if (!citations?.length) return null;

  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        <BookOpen className="h-3.5 w-3.5" />
        Sources
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {citations.map((citation, index) => (
          <SourceCitation
            key={`${citation.document_id}-${citation.chunk_index}-${index}`}
            citation={citation}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
