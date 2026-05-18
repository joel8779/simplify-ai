import { api } from '@/lib/api/client';

export interface DocumentMetadata {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  status: 'processing' | 'indexed' | 'failed';
  chunk_count: number;
  created_at: string;
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
