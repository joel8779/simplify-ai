import { useState } from 'react';
import { documentService, type DocumentUploadResponse } from '@/lib/services/document.service';

export interface UploadState {
  isUploading: boolean;
  progress: number;
  uploaded: number;
  failed: number;
  error: string | null;
}

export function useUpload() {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    uploaded: 0,
    failed: 0,
    error: null,
  });

  const upload = async (files: File[]) => {
    setState({
      isUploading: true,
      progress: 0,
      uploaded: 0,
      failed: 0,
      error: null,
    });

    try {
      const response = await documentService.uploadDocuments(files);
      
      setState((prev) => ({
        ...prev,
        isUploading: false,
        progress: 100,
        uploaded: response.uploaded.length,
        failed: response.failed.length,
        error: response.failed.length > 0 ? 'Some files failed to upload' : null,
      }));

      return response;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }));
      throw error;
    }
  };

  const reset = () => {
    setState({
      isUploading: false,
      progress: 0,
      uploaded: 0,
      failed: 0,
      error: null,
    });
  };

  return {
    ...state,
    upload,
    reset,
  };
}
