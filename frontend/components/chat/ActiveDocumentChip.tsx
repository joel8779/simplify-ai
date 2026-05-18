"use client";

import { FileText, X } from "lucide-react";
import type { Document } from "@/lib/types/document";
import { cn } from "@/lib/utils/cn";

interface ActiveDocumentChipProps {
  document: Document;
  onRemove: (id: string) => void;
  className?: string;
}

export function ActiveDocumentChip({
  document,
  onRemove,
  className,
}: ActiveDocumentChipProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-[150px] items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 py-1 pl-2.5 pr-1 text-xs font-medium text-foreground sm:max-w-[190px]",
        "transition-all duration-200 hover:border-primary/50 hover:bg-primary/15",
        className
      )}
    >
      <FileText className="h-3 w-3 shrink-0 text-primary" />
      <span className="truncate">{document.name}</span>
      <button
        type="button"
        onClick={() => onRemove(document.id)}
        className="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
        aria-label={`Remove ${document.name}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
