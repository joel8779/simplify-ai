import type { Document } from "@/lib/types/document";

/** Mock library — replace with API fetch in production. */
export const DOCUMENT_LIBRARY: Document[] = [
  {
    id: "1",
    name: "Q4-Board-Deck.pdf",
    size: "2.4 MB",
    status: "indexed",
    uploadedAt: "2026-05-10",
  },
  {
    id: "2",
    name: "Product-Roadmap.docx",
    size: "890 KB",
    status: "indexed",
    uploadedAt: "2026-05-12",
  },
  {
    id: "3",
    name: "Enterprise-Contract.pdf",
    size: "1.1 MB",
    status: "processing",
    uploadedAt: "2026-05-16",
  },
  {
    id: "4",
    name: "Onboarding-Guide.pdf",
    size: "540 KB",
    status: "indexed",
    uploadedAt: "2026-05-14",
  },
];

/** @deprecated Use DOCUMENT_LIBRARY */
export const CONNECTED_DOCUMENTS = DOCUMENT_LIBRARY;
