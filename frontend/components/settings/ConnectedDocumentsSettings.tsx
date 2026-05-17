"use client";

import Link from "next/link";
import { ArrowRight, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOCUMENT_LIBRARY } from "@/lib/constants/documents";
import { ROUTES } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils/cn";
import { SettingsSection } from "@/components/settings/SettingsSection";

const STATUS_LABEL = {
  indexed: { label: "Indexed", className: "text-emerald-400 bg-emerald-500/10" },
  processing: { label: "Processing", className: "text-amber-400 bg-amber-500/10" },
  failed: { label: "Failed", className: "text-red-400 bg-red-500/10" },
} as const;

export function ConnectedDocumentsSettings() {
  const indexedCount = DOCUMENT_LIBRARY.filter(
    (d) => d.status === "indexed"
  ).length;

  return (
    <SettingsSection
      title="Connected documents"
      description={`${indexedCount} of ${DOCUMENT_LIBRARY.length} documents ready for chat.`}
      delay={0.15}
    >
      <ul className="space-y-2">
        {DOCUMENT_LIBRARY.map((doc) => {
          const status = STATUS_LABEL[doc.status];
          return (
            <li
              key={doc.id}
              className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/30 px-4 py-3 transition-colors hover:border-border/60"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{doc.size}</p>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  status.className
                )}
              >
                {doc.status === "processing" && (
                  <Loader2 className="h-3 w-3 animate-spin" />
                )}
                {status.label}
              </span>
            </li>
          );
        })}
      </ul>

      <Button variant="ghost" className="mt-4 gap-2 px-0 hover:bg-transparent" asChild>
        <Link href={ROUTES.documents}>
          Manage all documents
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </SettingsSection>
  );
}
