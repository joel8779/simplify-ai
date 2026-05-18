"use client";

import Link from "next/link";
import { FileSearch, Paperclip, Upload } from "lucide-react";

import { ActiveDocumentChip } from "@/components/chat/ActiveDocumentChip";
import { DocumentSelectorSheet } from "@/components/chat/DocumentSelectorSheet";
import { Button } from "@/components/ui/button";
import { useActiveDocuments } from "@/hooks/useActiveDocuments";
import { ROUTES } from "@/lib/constants/navigation";
import { useChatStore } from "@/store/useChatStore";

interface SessionContextBarProps {
  warning?: string | null;
}

export function SessionContextBar({ warning }: SessionContextBarProps) {
  const activeDocuments = useActiveDocuments();
  const detachDocument = useChatStore((s) => s.detachDocument);
  const selectorOpen = useChatStore((s) => s.composerSelectorOpen);
  const setSelectorOpen = useChatStore((s) => s.setComposerSelectorOpen);
  const hasDocuments = activeDocuments.length > 0;

  return (
    <>
      <div className="sticky top-0 z-10 border-b border-border/40 bg-background/85 px-3 py-2 backdrop-blur-xl sm:px-4 md:px-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-2.5 font-medium text-primary">
                <FileSearch className="h-3.5 w-3.5" />
                {hasDocuments
                  ? `${activeDocuments.length} document${activeDocuments.length !== 1 ? "s" : ""}`
                  : "General chat"}
              </span>
              <span className="hidden truncate sm:block">
                {hasDocuments
                  ? "This session will use attached documents when relevant."
                  : "Attach documents to ground this conversation."}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-2.5 text-xs"
                onClick={() => setSelectorOpen(true)}
              >
                <Paperclip className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Attach</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                asChild
              >
                <Link href={ROUTES.documents} aria-label="Upload documents">
                  <Upload className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          {hasDocuments && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {activeDocuments.map((doc) => (
                <ActiveDocumentChip
                  key={doc.id}
                  document={doc}
                  onRemove={detachDocument}
                  className="shrink-0"
                />
              ))}
            </div>
          )}

          {warning && (
            <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              {warning}
            </p>
          )}
        </div>
      </div>

      <DocumentSelectorSheet
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
      />
    </>
  );
}
