import { create } from "zustand";
import {
  documentService,
  mapDocumentMetadataToDocument,
  type DocumentMetadata,
} from "@/lib/services/document.service";
import type { Document } from "@/lib/types/document";

interface DocumentState {
  documents: Document[];
  rawDocuments: DocumentMetadata[];
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  fetchDocuments: () => Promise<void>;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  rawDocuments: [],
  isLoading: false,
  error: null,
  lastFetchedAt: null,

  fetchDocuments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await documentService.listDocuments();

      set({
        documents: response.items.map(mapDocumentMetadataToDocument),
        rawDocuments: response.items,
        isLoading: false,
        lastFetchedAt: Date.now(),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load documents";
      console.error("[documents] fetch failed", error);
      set({ error: message, isLoading: false });
    }
  },
}));
