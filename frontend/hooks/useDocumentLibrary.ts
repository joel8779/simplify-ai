"use client";

import { useCallback, useEffect } from "react";
import { DOCUMENTS_CHANGED_EVENT } from "@/lib/document-events";
import { useDocumentStore } from "@/store/useDocumentStore";

export function useDocumentLibrary(options: { enabled?: boolean } = {}) {
  const enabled = options.enabled ?? true;
  const documents = useDocumentStore((s) => s.documents);
  const isLoading = useDocumentStore((s) => s.isLoading);
  const error = useDocumentStore((s) => s.error);
  const fetchDocuments = useDocumentStore((s) => s.fetchDocuments);

  const refresh = useCallback(() => fetchDocuments(), [fetchDocuments]);

  useEffect(() => {
    if (!enabled) return;
    void fetchDocuments();
  }, [enabled, fetchDocuments]);

  useEffect(() => {
    const handleDocumentsChanged = () => {
      void fetchDocuments();
    };

    window.addEventListener(DOCUMENTS_CHANGED_EVENT, handleDocumentsChanged);
    return () => {
      window.removeEventListener(
        DOCUMENTS_CHANGED_EVENT,
        handleDocumentsChanged
      );
    };
  }, [fetchDocuments]);

  return { documents, isLoading, error, refresh };
}
