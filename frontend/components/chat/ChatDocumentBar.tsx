"use client";

import { useState } from "react";
import Link from "next/link";
import { FilePlus2, Paperclip, Upload } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ActiveDocumentChip } from "@/components/chat/ActiveDocumentChip";
import { DocumentSelectorSheet } from "@/components/chat/DocumentSelectorSheet";
import { DocumentScopeBanner } from "@/components/chat/DocumentScopeBanner";
import { useActiveDocuments } from "@/hooks/useActiveDocuments";
import { ROUTES } from "@/lib/constants/navigation";
import { useChatStore } from "@/store/useChatStore";

export function ChatDocumentBar() {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const activeDocuments = useActiveDocuments();
  const detachDocument = useChatStore((s) => s.detachDocument);

  return (
    <>
      <div className="mb-3 space-y-2">
        <DocumentScopeBanner compact />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-full border-border/60 bg-card/50 text-xs backdrop-blur-sm"
            onClick={() => setSelectorOpen(true)}
          >
            <Paperclip className="h-3.5 w-3.5" />
            Attach
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-full border-border/60 bg-card/50 text-xs backdrop-blur-sm"
            asChild
          >
            <Link href={ROUTES.documents}>
              <Upload className="h-3.5 w-3.5" />
              Upload
            </Link>
          </Button>

          {activeDocuments.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 rounded-full text-xs text-muted-foreground"
              onClick={() => setSelectorOpen(true)}
            >
              <FilePlus2 className="mr-1 h-3.5 w-3.5" />
              Manage
            </Button>
          )}
        </div>

        <AnimatePresence mode="popLayout">
          {activeDocuments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {activeDocuments.map((doc) => (
                  <ActiveDocumentChip
                    key={doc.id}
                    document={doc}
                    onRemove={detachDocument}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <DocumentSelectorSheet
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
      />
    </>
  );
}
