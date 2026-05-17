"use client";

import { useParams } from "next/navigation";
import { BackButton } from "@/components/layout/BackButton";
import { DashboardPageShell } from "@/components/layout/DashboardPageShell";
import { ROUTES } from "@/lib/constants/navigation";

export default function DocumentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <DashboardPageShell
      title={`Document ${id}`}
      description="Preview and metadata for this file."
    >
      <BackButton fallbackHref={ROUTES.documents} label="All documents" />
      <p className="mt-6 text-sm text-muted-foreground">
        Document detail view — coming soon.
      </p>
    </DashboardPageShell>
  );
}
