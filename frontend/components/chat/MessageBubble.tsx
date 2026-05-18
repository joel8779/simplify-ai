"use client";

import { cn } from "@/lib/utils/cn";
import type { ChatMessage } from "@/store/useChatStore";

import { CitationPanel } from "./CitationPanel";
import { MarkdownMessage } from "./MarkdownMessage";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const modeLabel =
    message.responseMode === "rag_mode"
      ? "Using uploaded documents"
      : message.responseMode === "general_mode"
        ? "General AI response"
        : null;

  return (
    <div
      className={cn(
        "animate-fade-in flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[92%] overflow-hidden rounded-2xl px-4 py-3 text-sm leading-relaxed md:max-w-[76%]",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card text-foreground ring-1 ring-border/50"
        )}
      >
        {modeLabel && !isUser && (
          <div
            className={cn(
              "mb-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
              message.responseMode === "rag_mode"
                ? "bg-primary/10 text-primary"
                : "bg-amber-500/10 text-amber-300"
            )}
          >
            {modeLabel}
          </div>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap leading-7">{message.content}</p>
        ) : message.content ? (
          <>
            <MarkdownMessage content={message.content} />
            <CitationPanel citations={message.citations} />
          </>
        ) : (
          <div className="flex min-h-7 items-center gap-1.5 text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:120ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current [animation-delay:240ms]" />
          </div>
        )}
      </div>
    </div>
  );
}
