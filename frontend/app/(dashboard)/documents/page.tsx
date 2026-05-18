"use client";

import { useEffect, useState } from "react";
import { FileText, Trash2, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { DashboardPageShell } from "@/components/layout/DashboardPageShell";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { documentService, type DocumentMetadata } from "@/lib/services/document.service";
import { notifyDocumentsChanged } from "@/lib/document-events";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = async () => {
    try {
      const response = await documentService.listDocuments();
      console.log("Documents response:", response);
      console.log("Documents items:", response.items);
      setDocuments(response.items);
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    try {
      await documentService.deleteDocument(documentId);
      notifyDocumentsChanged();
      await loadDocuments();
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  const handleUploadSuccess = () => {
    loadDocuments();
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "indexed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <DashboardPageShell
      title="Documents"
      description="Upload and manage files in your knowledge base."
    >
      <div className="space-y-6">
        <DocumentUploader onUploadSuccess={handleUploadSuccess} />

        {loading ? (
          <div className="text-center text-muted-foreground py-8">
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No documents uploaded yet
          </div>
        ) : (
          <div className="grid gap-3">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="border-border/50 bg-card/50 transition-colors hover:border-primary/30"
              >
                <CardHeader className="flex-row items-center gap-4 space-y-0 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base">{doc.original_name}</CardTitle>
                    <CardDescription>
                      {formatFileSize(doc.size_bytes)} • {doc.chunk_count} chunks • {formatDate(doc.created_at)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(doc.status)}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(doc.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardPageShell>
  );
}
