"use client";

import { useMemo } from "react";
import { getDocumentsByIds } from "@/lib/documents";
import { useChatStore } from "@/store/useChatStore";

/** Resolves active document IDs from chat store to full document records. */
export function useActiveDocuments() {
  const activeDocumentIds = useChatStore((s) => s.activeDocumentIds);

  return useMemo(
    () => getDocumentsByIds(activeDocumentIds),
    [activeDocumentIds]
  );
}
