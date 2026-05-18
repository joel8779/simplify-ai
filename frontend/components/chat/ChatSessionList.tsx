"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Clock3, Files, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatSessions } from "@/hooks/useChatSessions";
import { chatService } from "@/lib/services/chat.service";
import { useChatStore } from "@/store/useChatStore";
import { cn } from "@/lib/utils/cn";
import { useState } from "react";

interface ChatSessionListProps {
  onSelect?: () => void;
}

export function ChatSessionList({ onSelect }: ChatSessionListProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { sessions, isLoading, error } = useChatSessions();
  const upsertSession = useChatStore((s) => s.upsertSession);
  const removeSession = useChatStore((s) => s.removeSession);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const clearActiveDocuments = useChatStore((s) => s.clearActiveDocuments);
  const setActiveSessionId = useChatStore((s) => s.setActiveSessionId);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleRename = async (sessionId: string, currentTitle: string) => {
    const nextTitle = window.prompt("Rename chat", currentTitle)?.trim();
    if (!nextTitle || nextTitle === currentTitle) return;

    try {
      upsertSession(await chatService.renameSession(sessionId, nextTitle));
    } catch (error) {
      console.error("[chat] failed to rename session", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await chatService.deleteSession(deleteTarget.id);
      removeSession(deleteTarget.id);
      if (pathname === `/chat/${deleteTarget.id}`) {
        clearMessages();
        clearActiveDocuments();
        setActiveSessionId(null);
        router.replace("/chat");
      }
      setDeleteTarget(null);
    } catch (error) {
      console.error("[chat] failed to delete session", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading && sessions.length === 0) {
    return (
      <p className="px-3 py-2 text-sm text-muted-foreground">Loading chats...</p>
    );
  }

  if (error) {
    return <p className="px-3 py-2 text-sm text-destructive">{error}</p>;
  }

  if (sessions.length === 0) {
    return (
      <p className="px-3 py-2 text-sm text-muted-foreground">
        No chats yet
      </p>
    );
  }

  return (
    <>
    <ul className="scrollbar-thin flex flex-col gap-0.5 overflow-y-auto">
      {sessions.map((session, i) => {
        const href = `/chat/${session.id}`;
        const isActive = pathname === href;
        const updatedLabel = formatSessionTime(session.updated_at);
        const documentCount = session.document_ids.length;

        return (
          <li
            key={session.id}
            className="animate-slide-in-left"
            style={{ animationDelay: `${i * 35}ms` }}
          >
            <div
              className={cn(
                "group flex items-center gap-1 rounded-lg transition-colors duration-200",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Link
                href={href}
                onClick={onSelect}
                className="flex min-w-0 flex-1 items-start gap-2.5 px-3 py-2 text-sm"
              >
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 opacity-60" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {session.title}
                  </span>
                  <span className="mt-1 flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex min-w-0 items-center gap-1">
                      <Clock3 className="h-3 w-3 shrink-0" />
                      <span className="truncate">{updatedLabel}</span>
                    </span>
                    {documentCount > 0 && (
                      <span className="inline-flex shrink-0 items-center gap-1">
                        <Files className="h-3 w-3" />
                        {documentCount}
                      </span>
                    )}
                  </span>
                </span>
              </Link>
              <button
                type="button"
                className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-background/60 group-hover:opacity-100"
                onClick={() => handleRename(session.id, session.title)}
                aria-label={`Rename ${session.title}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                onClick={() =>
                  setDeleteTarget({ id: session.id, title: session.title })
                }
                aria-label={`Delete ${session.title}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
    {deleteTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-2xl">
          <h2 className="text-sm font-semibold text-foreground">Delete chat?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This will permanently delete "{deleteTarget.title}" and its
            messages.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function formatSessionTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Recently";

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
