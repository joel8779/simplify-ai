"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, X, CheckCircle, AlertCircle } from "lucide-react";
import { useUpload } from "@/hooks/useUpload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { notifyDocumentsChanged } from "@/lib/document-events";

interface FileWithPreview extends File {
  preview?: string;
}

interface DocumentUploaderProps {
  onUploadSuccess?: () => void;
}

export function DocumentUploader({ onUploadSuccess }: DocumentUploaderProps) {
  const { isUploading, progress, uploaded, failed, error, upload, reset } = useUpload();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) => file.type === "application/pdf" || file.name.endsWith(".pdf")
    );
    
    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter(
      (file) => file.type === "application/pdf" || file.name.endsWith(".pdf")
    );
    
    if (selectedFiles.length > 0) {
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = async () => {
    if (files.length === 0) return;
    
    try {
      await upload(files);
      setFiles([]);
      notifyDocumentsChanged();
      onUploadSuccess?.();
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Card className="p-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${isDragging ? "border-primary bg-primary/5" : "border-border/40 hover:border-primary/50"}
        `}
      >
        <input
          type="file"
          id="file-upload"
          multiple
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
        
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center gap-3"
        >
          <motion.div
            animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
            className="p-4 rounded-full bg-primary/10"
          >
            <Upload className="h-8 w-8 text-primary" />
          </motion.div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Drop PDF files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Maximum file size: 25MB
            </p>
          </div>
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {files.length} file{files.length !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => setFiles([])}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear all
            </button>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/40"
              >
                <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors"
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <Button
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
            className="w-full"
          >
            {isUploading ? "Uploading..." : "Upload Documents"}
          </Button>
        </div>
      )}

      {isUploading && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Uploading...</span>
            <span className="text-foreground">{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-primary"
            />
          </div>
        </div>
      )}

      {uploaded > 0 && !isUploading && (
        <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 text-sm text-green-500">
            <CheckCircle className="h-4 w-4" />
            <span>
              {uploaded} file{uploaded !== 1 ? "s" : ""} uploaded successfully
            </span>
          </div>
        </div>
      )}

      {failed > 0 && !isUploading && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>
              {failed} file{failed !== 1 ? "s" : ""} failed to upload
            </span>
          </div>
        </div>
      )}

      {error && !isUploading && (
        <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {(uploaded > 0 || failed > 0) && !isUploading && (
        <Button
          onClick={reset}
          variant="outline"
          className="w-full mt-4"
        >
          Upload More
        </Button>
      )}
    </Card>
  );
}
