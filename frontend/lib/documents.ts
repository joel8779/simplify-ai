import { DOCUMENT_LIBRARY } from "@/lib/constants/documents";
import type { Document } from "@/lib/types/document";

export function getDocumentById(id: string): Document | undefined {
  return DOCUMENT_LIBRARY.find((doc) => doc.id === id);
}

export function getDocumentsByIds(ids: string[]): Document[] {
  return ids
    .map((id) => getDocumentById(id))
    .filter((doc): doc is Document => doc !== undefined);
}

export function getIndexedDocuments(): Document[] {
  return DOCUMENT_LIBRARY.filter((doc) => doc.status === "indexed");
}
