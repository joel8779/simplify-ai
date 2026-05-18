import { api } from '@/lib/api/client';
import type { Document } from '@/lib/types/document';

export interface DocumentMetadata {
  id: string;
  filename?: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  status: 'processing' | 'indexed' | 'failed';
  chunk_count: number;
  error_message?: string | null;
  storage_provider?: string;
  storage_path?: string | null;
  file_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface DocumentUploadResponse {
  uploaded: DocumentMetadata[];
  failed: Array<{ filename: string; error: string }>;
}

export interface DocumentListResponse {
  items: DocumentMetadata[];
  total: number;
}

export const documentService = {
  async uploadDocuments(files: File[]): Promise<DocumentUploadResponse> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    return await api.post<DocumentUploadResponse>('/api/v1/documents/upload', formData);
  },

  async listDocuments(): Promise<DocumentListResponse> {
    return await api.get<DocumentListResponse>('/api/v1/documents');
  },

  async getDocument(documentId: string): Promise<DocumentMetadata> {
    return await api.get<DocumentMetadata>(`/api/v1/documents/${documentId}`);
  },

  async deleteDocument(documentId: string): Promise<void> {
    await api.delete(`/api/v1/documents/${documentId}`);
  },
};

export function mapDocumentMetadataToDocument(doc: DocumentMetadata): Document {
  return {
    id: doc.id,
    name: doc.original_name,
    size: formatFileSize(doc.size_bytes),
    status: doc.status,
    uploadedAt: doc.created_at,
  };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}
