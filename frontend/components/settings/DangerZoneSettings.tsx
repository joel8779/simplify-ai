"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsSection } from "@/components/settings/SettingsSection";

export function DangerZoneSettings() {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <SettingsSection
      title="Danger zone"
      description="Irreversible actions for your workspace."
      variant="danger"
      delay={0.2}
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              Clear chat history
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Remove all conversations. Your documents stay connected.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            Clear history
          </Button>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              Delete account
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Permanently delete your account and all associated data.
            </p>
          </div>
          {!confirmingDelete ? (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete account
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                This cannot be undone
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 text-white hover:bg-red-600/90"
              >
                Confirm delete
              </Button>
            </div>
          )}
        </div>
      </div>
    </SettingsSection>
  );
}
