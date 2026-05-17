import { DashboardPageShell } from "@/components/layout/DashboardPageShell";
import { DocumentUploader } from "@/components/documents/DocumentUploader";

export default function DocumentsPage() {
  return (
    <DashboardPageShell
      title="Documents"
      description="Upload and manage files in your knowledge base."
    >
      <DocumentUploader />
    </DashboardPageShell>
  );
}
