"use client";

import { ChevronDown, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

import { cn } from "@/lib/utils/cn";
import type { ChatMessage } from "@/store/useChatStore";

type Citation = NonNullable<ChatMessage["citations"]>[number];

interface SourceCitationProps {
  citation: Citation;
  index: number;
}

export function SourceCitation({ citation, index }: SourceCitationProps) {
  const [open, setOpen] = useState(false);
  const pageLabel =
    citation.page_number !== null && citation.page_number !== undefined
      ? `Page ${citation.page_number}`
      : `Chunk ${citation.chunk_index + 1}`;

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-background/45">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/40"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-[11px] font-semibold text-primary">
          {index + 1}
        </span>
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-foreground">
            {citation.document_name || "Source document"}
          </span>
          <span className="block text-[11px] text-muted-foreground">{pageLabel}</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <p className="border-t border-border/50 px-3 py-2.5 text-xs leading-6 text-muted-foreground">
              {citation.excerpt}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
