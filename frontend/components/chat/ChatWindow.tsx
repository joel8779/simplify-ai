"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { EmptyChatState } from "@/components/chat/EmptyChatState";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { SessionContextBar } from "@/components/chat/SessionContextBar";
import { useActiveDocuments } from "@/hooks/useActiveDocuments";
import { chatService } from "@/lib/services/chat.service";
import {
  mapApiMessage,
  useChatStore,
} from "@/store/useChatStore";

function getRouteSessionId(value: string | string[] | undefined): string | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function ChatWindow() {
  const params = useParams<{ sessionId?: string | string[] }>();
  const router = useRouter();
  const routeSessionId = getRouteSessionId(params.sessionId);
  const {
    messages,
    isStreaming,
    addMessage,
    appendToMessage,
    setMessages,
    setStreaming,
    updateMessage,
    activeDocumentIds,
    setActiveSessionId,
    setActiveDocuments,
    setSessions,
    upsertSession,
  } = useChatStore();
  const activeDocuments = useActiveDocuments();
  const [draft, setDraft] = useState("");
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [contextWarning, setContextWarning] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastPersistedDocumentIdsRef = useRef<string[]>([]);
  const skipNextContextPersistRef = useRef(false);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (!routeSessionId) {
      setActiveSessionId(null);
      setMessages([]);
      return;
    }

    let cancelled = false;
    const sessionId = routeSessionId;
    async function loadSession() {
      setIsLoadingSession(true);
      try {
        const [sessions, apiMessages] = await Promise.all([
          chatService.listSessions(),
          chatService.getMessages(sessionId),
        ]);
        if (cancelled) return;

        setSessions(sessions);
        setActiveSessionId(sessionId);
        setMessages(apiMessages.map(mapApiMessage));

        const session = sessions.find((item) => item.id === sessionId);
        const sessionDocumentIds = session?.document_ids ?? [];
        setActiveDocuments(sessionDocumentIds);
        lastPersistedDocumentIdsRef.current = sessionDocumentIds;
      } catch (error) {
        if (!cancelled) {
          console.error("[chat] failed to load session", error);
          setMessages([
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content:
                error instanceof Error
                  ? error.message
                  : "Failed to load this chat.",
            },
          ]);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSession(false);
        }
      }
    }

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, [
    routeSessionId,
    setActiveDocuments,
    setActiveSessionId,
    setMessages,
    setSessions,
  ]);

  useEffect(() => {
    if (!routeSessionId || isLoadingSession) return;
    if (skipNextContextPersistRef.current) {
      skipNextContextPersistRef.current = false;
      return;
    }
    if (sameIds(activeDocumentIds, lastPersistedDocumentIdsRef.current)) return;

    let cancelled = false;
    async function persistSessionContext() {
      try {
        setContextWarning(null);
        const updated = await chatService.updateSessionDocuments(
          routeSessionId!,
          activeDocumentIds
        );
        if (cancelled) return;
        lastPersistedDocumentIdsRef.current = updated.document_ids;
        upsertSession(updated);
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error
            ? error.message
            : "Could not update attached documents.";
        setContextWarning(message);
        skipNextContextPersistRef.current = true;
        setActiveDocuments(lastPersistedDocumentIdsRef.current);
      }
    }

    void persistSessionContext();
    return () => {
      cancelled = true;
    };
  }, [
    activeDocumentIds,
    isLoadingSession,
    routeSessionId,
    setActiveDocuments,
    upsertSession,
  ]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isStreaming]);

  const refreshSessions = useCallback(async () => {
    try {
      setSessions(await chatService.listSessions());
    } catch (error) {
      console.error("[chat] failed to refresh sessions", error);
    }
  }, [setSessions]);

  const handleSend = useCallback(
    async (text: string) => {
      const documentIds = activeDocumentIds;

      addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        documentIds,
      });

      setStreaming(true);
      const assistantDraftId = crypto.randomUUID();
      addMessage({
        id: assistantDraftId,
        role: "assistant",
        content: "",
        documentIds,
        responseMode: null,
        citations: [],
      });

      try {
        let sessionId = routeSessionId;
        if (!sessionId) {
          const created = await chatService.createSession(documentIds);
          sessionId = created.id;
          upsertSession(created);
          setActiveSessionId(created.id);
          lastPersistedDocumentIdsRef.current = created.document_ids;
        }

        const abortController = new AbortController();
        abortRef.current = abortController;

        await chatService.streamMessage(
          sessionId,
          text,
          [],
          (event) => {
            if (event.type === "meta") {
              updateMessage(assistantDraftId, {
                responseMode: event.response_mode,
                citations: event.citations,
              });
              return;
            }

            if (event.type === "delta") {
              appendToMessage(assistantDraftId, event.content);
              return;
            }

            updateMessage(assistantDraftId, {
              id: event.message.id,
              content: event.message.content,
              documentIds: event.message.document_ids,
              responseMode: event.response_mode,
              citations: event.citations,
            });
          },
          abortController.signal
        );

        await refreshSessions();
        if (!routeSessionId) {
          router.replace(`/chat/${sessionId}`);
        }
      } catch (error) {
        console.error("[chat] send failed", error);
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        updateMessage(assistantDraftId, {
          content:
            error instanceof Error
              ? error.message
              : "Failed to generate an answer.",
          responseMode: null,
          citations: [],
        });
      } finally {
        abortRef.current = null;
        setStreaming(false);
      }
    },
    [
      activeDocumentIds,
      addMessage,
      appendToMessage,
      refreshSessions,
      routeSessionId,
      router,
      setActiveSessionId,
      setStreaming,
      updateMessage,
      upsertSession,
    ]
  );

  const handleSuggestion = (text: string) => {
    setDraft(text);
    void handleSend(text);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      <SessionContextBar warning={contextWarning} />
      {!hasMessages && !isLoadingSession ? (
        <EmptyChatState
          onSuggestionClick={handleSuggestion}
          activeDocumentCount={activeDocuments.length}
        />
      ) : (
        <div
          ref={scrollRef}
          className="scrollbar-thin flex-1 overflow-y-auto overscroll-contain px-3 pb-[15rem] pt-4 sm:px-4 md:px-8 md:pb-[18rem] md:pt-5"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 sm:gap-5">
            <div className="flex flex-col gap-5">
              {isLoadingSession && (
                <div className="rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground ring-1 ring-border/50">
                  Loading chat...
                </div>
              )}
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>
          </div>
        </div>
      )}

      <ChatComposer
        onSend={handleSend}
        onStop={() => {
          abortRef.current?.abort();
          setStreaming(false);
        }}
        isStreaming={isStreaming}
        defaultValue={draft}
      />
    </div>
  );
}

function sameIds(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const bSet = new Set(b);
  return a.every((id) => bSet.has(id));
}
