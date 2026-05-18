"use client";

import { AlertCircle, FileSearch } from "lucide-react";
import { useActiveDocuments } from "@/hooks/useActiveDocuments";
import { cn } from "@/lib/utils/cn";

interface DocumentScopeBannerProps {
  className?: string;
  compact?: boolean;
}

export function DocumentScopeBanner({
  className,
  compact,
}: DocumentScopeBannerProps) {
  const activeDocuments = useActiveDocuments();
  const count = activeDocuments.length;

  if (count === 0) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90",
          compact && "py-1.5",
          className
        )}
      >
        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
        <span>
          No documents attached - attach files to scope answers to your library.
        </span>
      </div>
    );
  }

  const names = activeDocuments.map((d) => d.name).join(", ");

  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-muted-foreground",
        compact && "py-1.5",
        className
      )}
    >
      <FileSearch className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      <span>
        <span className="font-medium text-foreground">
          {count} document{count !== 1 ? "s" : ""} in scope
        </span>
        {" - "}
        AI responses use only:{" "}
        <span className="text-foreground/80">{names}</span>
      </span>
    </div>
  );
}
