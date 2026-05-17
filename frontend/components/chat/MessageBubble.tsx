"use client";

import { cn } from "@/lib/utils/cn";
import type { ChatMessage } from "@/store/useChatStore";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "animate-fade-in flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed md:max-w-[75%]",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card text-foreground ring-1 ring-border/50"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
