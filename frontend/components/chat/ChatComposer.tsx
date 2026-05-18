"use client";

import Link from "next/link";
import { Paperclip, Upload } from "lucide-react";
import { ChatInput } from "@/components/chat/ChatInput";
import { Button } from "@/components/ui/button";
import { useActiveDocuments } from "@/hooks/useActiveDocuments";
import { ROUTES } from "@/lib/constants/navigation";
import { useChatStore } from "@/store/useChatStore";

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
  const setComposerSelectorOpen = useChatStore((s) => s.setComposerSelectorOpen);
  const hasScope = activeDocuments.length > 0;

  const placeholder = hasScope
    ? `Ask about ${activeDocuments.length} attached document${activeDocuments.length !== 1 ? "s" : ""}...`
    : "Ask anything, or attach documents for grounded answers...";

  const disclaimer = hasScope
    ? `Using ${activeDocuments.length} attached document${activeDocuments.length !== 1 ? "s" : ""} when relevant. Simplify can make mistakes.`
    : "General AI response. Attach documents for grounded answers. Simplify can make mistakes.";

  return (
    <ChatInput
      onSend={onSend}
      onStop={onStop}
      isStreaming={isStreaming}
      defaultValue={defaultValue}
      placeholder={placeholder}
      disclaimer={disclaimer}
      leftActions={
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground transition-all duration-200 hover:bg-accent/70 hover:text-foreground"
            onClick={() => setComposerSelectorOpen(true)}
            aria-label="Attach documents"
          >
            <Paperclip className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full text-muted-foreground transition-all duration-200 hover:bg-accent/70 hover:text-foreground"
            asChild
          >
            <Link href={ROUTES.documents} aria-label="Upload documents">
              <Upload className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </>
      }
    />
  );
}
