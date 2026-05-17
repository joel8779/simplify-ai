"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { DocumentScopeBanner } from "@/components/chat/DocumentScopeBanner";
import { EmptyChatState } from "@/components/chat/EmptyChatState";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { StreamingIndicator } from "@/components/chat/StreamingIndicator";
import { useActiveDocuments } from "@/hooks/useActiveDocuments";
import { getDocumentsByIds } from "@/lib/documents";
import { useChatStore } from "@/store/useChatStore";

export function ChatWindow() {
  const { messages, isStreaming, addMessage, setStreaming, activeDocumentIds } =
    useChatStore();
  const activeDocuments = useActiveDocuments();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isStreaming]);

  const simulateReply = useCallback(
    (userText: string, documentIds: string[]) => {
      const scopedDocs = getDocumentsByIds(documentIds);
      setStreaming(true);
      setTimeout(() => {
        const scopeNote =
          scopedDocs.length > 0
            ? ` (scoped to: ${scopedDocs.map((d) => d.name).join(", ")})`
            : " (no documents attached — attach files to enable RAG)";

        addMessage({
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Here's a response to: "${userText}"${scopeNote}. Connect the backend SSE stream with \`documentIds: [${documentIds.map((id) => `"${id}"`).join(", ")}]\` to replace this placeholder.`,
        });
        setStreaming(false);
      }, 1200);
    },
    [addMessage, setStreaming]
  );

  const handleSend = useCallback(
    (text: string) => {
      addMessage({ id: crypto.randomUUID(), role: "user", content: text });
      simulateReply(text, activeDocumentIds);
    },
    [addMessage, simulateReply, activeDocumentIds]
  );

  const handleSuggestion = (text: string) => {
    setDraft(text);
    handleSend(text);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col">
      {!hasMessages ? (
        <EmptyChatState
          onSuggestionClick={handleSuggestion}
          activeDocumentCount={activeDocuments.length}
        />
      ) : (
        <div
          ref={scrollRef}
          className="scrollbar-thin flex-1 overflow-y-auto px-4 pb-52 pt-4 md:px-8 md:pb-56"
        >
          <div className="mx-auto flex max-w-3xl flex-col gap-4">
            <DocumentScopeBanner />
            <div className="flex flex-col gap-6">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-card px-4 py-3 ring-1 ring-border/50">
                    <StreamingIndicator />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ChatComposer
        onSend={handleSend}
        onStop={() => setStreaming(false)}
        isStreaming={isStreaming}
        defaultValue={draft}
      />
    </div>
  );
}
