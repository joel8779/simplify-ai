"use client";

import { FileSearch } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ActiveDocumentChip } from "@/components/chat/ActiveDocumentChip";
import { useActiveDocuments } from "@/hooks/useActiveDocuments";
import { useChatStore } from "@/store/useChatStore";

export function ChatDocumentBar() {
  const activeDocuments = useActiveDocuments();
  const detachDocument = useChatStore((s) => s.detachDocument);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-primary/10 px-2.5 font-medium text-primary">
          <FileSearch className="h-3.5 w-3.5" />
          {activeDocuments.length > 0
            ? `${activeDocuments.length} in scope`
            : "No documents attached"}
        </span>
        {activeDocuments.length > 0 && (
          <span className="hidden truncate sm:inline">
            Answers use only attached documents.
          </span>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {activeDocuments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex max-h-20 flex-wrap gap-1.5 overflow-y-auto pr-1 scrollbar-thin sm:max-h-16">
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
  );
}
