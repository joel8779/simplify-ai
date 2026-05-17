"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  isStreaming?: boolean;
  placeholder?: string;
  disclaimer?: string;
  defaultValue?: string;
  toolbar?: React.ReactNode;
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming = false,
  placeholder = "Ask anything about your documents…",
  disclaimer = "Simplify can make mistakes. Verify important information.",
  defaultValue = "",
  toolbar,
}: ChatInputProps) {
  const [value, setValue] = useState(defaultValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (defaultValue) setValue(defaultValue);
  }, [defaultValue]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const canSend = value.trim().length > 0 && !isStreaming;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center bg-gradient-to-t from-background via-background/95 to-transparent px-4 pb-4 pt-8 md:pb-6">
      <div className="pointer-events-auto w-full max-w-3xl">
        {toolbar}

        <div
          className={cn(
            "flex items-end gap-2 rounded-3xl border border-border/80 bg-card/90 p-2 shadow-2xl shadow-black/20 backdrop-blur-xl",
            "transition-all duration-300 focus-within:border-primary/40 focus-within:shadow-primary/10"
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            className="max-h-40 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />

          {isStreaming ? (
            <Button
              size="icon"
              variant="secondary"
              className="mb-0.5 h-10 w-10 shrink-0 rounded-full"
              onClick={onStop}
              aria-label="Stop generating"
            >
              <Square className="h-4 w-4 fill-current" />
            </Button>
          ) : (
            <Button
              size="icon"
              className={cn(
                "mb-0.5 h-10 w-10 shrink-0 rounded-full transition-all duration-200",
                canSend
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground"
              )}
              onClick={handleSend}
              disabled={!canSend}
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          )}
        </div>

        <p className="mt-2 text-center text-xs text-muted-foreground/70">
          {disclaimer}
        </p>
      </div>
    </div>
  );
}
