"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DOCUMENT_LIBRARY } from "@/lib/constants/documents";
import type { Document } from "@/lib/types/document";
import { useChatStore } from "@/store/useChatStore";
import { cn } from "@/lib/utils/cn";

interface DocumentSelectorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocumentSelectorSheet({
  open,
  onOpenChange,
}: DocumentSelectorSheetProps) {
  const activeDocumentIds = useChatStore((s) => s.activeDocumentIds);
  const setActiveDocuments = useChatStore((s) => s.setActiveDocuments);

  const [query, setQuery] = useState("");
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setPendingIds(activeDocumentIds);
      setQuery("");
    }
  }, [open, activeDocumentIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DOCUMENT_LIBRARY;
    return DOCUMENT_LIBRARY.filter((doc) =>
      doc.name.toLowerCase().includes(q)
    );
  }, [query]);

  const toggleDoc = (doc: Document) => {
    if (doc.status !== "indexed") return;
    setPendingIds((prev) =>
      prev.includes(doc.id)
        ? prev.filter((id) => id !== doc.id)
        : [...prev, doc.id]
    );
  };

  const handleApply = () => {
    setActiveDocuments(pendingIds);
    onOpenChange(false);
  };

  const selectedCount = pendingIds.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col border-border/60 bg-background/95 p-0 backdrop-blur-xl sm:max-w-md"
      >
        <div className="flex flex-col border-b border-border/50 px-5 py-5 pr-12">
          <h2 className="text-lg font-semibold tracking-tight">
            Attach documents
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select files from your library to scope this conversation.
          </p>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents…"
              className="pl-9 bg-card/50"
            />
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto px-3 py-2">
          {filtered.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">
              No documents match your search.
            </li>
          ) : (
            filtered.map((doc) => {
              const isIndexed = doc.status === "indexed";
              const isSelected = pendingIds.includes(doc.id);

              return (
                <li key={doc.id}>
                  <button
                    type="button"
                    disabled={!isIndexed}
                    onClick={() => toggleDoc(doc)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
                      isIndexed
                        ? "hover:bg-accent/50"
                        : "cursor-not-allowed opacity-60",
                      isSelected && isIndexed && "bg-primary/10 ring-1 ring-primary/25"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      disabled={!isIndexed}
                      onCheckedChange={() => toggleDoc(doc)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${doc.name}`}
                    />
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">{doc.size}</p>
                    </div>
                    {!isIndexed && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Indexing
                      </span>
                    )}
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="flex flex-col gap-2 border-t border-border/50 p-4">
          <Button onClick={handleApply} className="w-full">
            {selectedCount === 0
              ? "Clear scope"
              : `Use ${selectedCount} document${selectedCount !== 1 ? "s" : ""}`}
          </Button>
          <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
