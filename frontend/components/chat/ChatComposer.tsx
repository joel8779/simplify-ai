"use client";

import { ChatDocumentBar } from "@/components/chat/ChatDocumentBar";
import { ChatInput } from "@/components/chat/ChatInput";
import { useActiveDocuments } from "@/hooks/useActiveDocuments";

interface ChatComposerProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  defaultValue?: string;
}

export function ChatComposer({
  onSend,
  onStop,
  isStreaming,
  defaultValue,
}: ChatComposerProps) {
  const activeDocuments = useActiveDocuments();
  const hasScope = activeDocuments.length > 0;

  const placeholder = hasScope
    ? `Ask about ${activeDocuments.length} attached document${activeDocuments.length !== 1 ? "s" : ""}…`
    : "Attach documents to scope your question…";

  const disclaimer = hasScope
    ? `Answers are scoped to ${activeDocuments.length} attached document${activeDocuments.length !== 1 ? "s" : ""} only. Simplify can make mistakes.`
    : "Attach documents to scope responses. Simplify can make mistakes.";

  return (
    <ChatInput
      onSend={onSend}
      onStop={onStop}
      isStreaming={isStreaming}
      defaultValue={defaultValue}
      placeholder={placeholder}
      disclaimer={disclaimer}
      toolbar={<ChatDocumentBar />}
    />
  );
}
