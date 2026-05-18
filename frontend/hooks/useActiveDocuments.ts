"use client";

import { useMemo } from "react";
import { useChatStore } from "@/store/useChatStore";
import { useDocumentLibrary } from "@/hooks/useDocumentLibrary";

/** Resolves active document IDs from chat store to full document records. */
export function useActiveDocuments() {
  const activeDocumentIds = useChatStore((s) => s.activeDocumentIds);
  const { documents } = useDocumentLibrary();

  return useMemo(
    () => documents.filter((doc) => activeDocumentIds.includes(doc.id)),
    [documents, activeDocumentIds]
  );
}
