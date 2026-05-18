"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { chatService } from "@/lib/services/chat.service";
import { useChatStore } from "@/store/useChatStore";

export function DangerZoneSettings() {
  const clearMessages = useChatStore((s) => s.clearMessages);
  const clearActiveDocuments = useChatStore((s) => s.clearActiveDocuments);
  const setActiveSessionId = useChatStore((s) => s.setActiveSessionId);
  const setSessions = useChatStore((s) => s.setSessions);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClearHistory = async () => {
    setIsClearing(true);
    setStatus(null);
    setError(null);
    try {
      await chatService.clearHistory();
      setSessions([]);
      clearMessages();
      clearActiveDocuments();
      setActiveSessionId(null);
      setConfirmingClear(false);
      setStatus("Chat history cleared");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to clear history");
    } finally {
      setIsClearing(false);
    }
  };

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
          {!confirmingClear ? (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={() => setConfirmingClear(true)}
            >
              Clear history
            </Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                Confirm clear
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmingClear(false)}
                disabled={isClearing}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 text-white hover:bg-red-600/90"
                onClick={handleClearHistory}
                disabled={isClearing}
              >
                {isClearing ? "Clearing..." : "Confirm"}
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">
              Delete account
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Account deletion is not available in this MVP yet.
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
                disabled
              >
                Not available
              </Button>
            </div>
          )}
        </div>
        {(status || error) && (
          <p className={error ? "text-sm text-red-400" : "text-sm text-emerald-400"}>
            {error ?? status}
          </p>
        )}
      </div>
    </SettingsSection>
  );
}
