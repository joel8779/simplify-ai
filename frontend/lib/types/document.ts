export type DocumentStatus = "indexed" | "processing" | "failed";

export interface Document {
  id: string;
  name: string;
  size: string;
  status: DocumentStatus;
  uploadedAt?: string;
}
