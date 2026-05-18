"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils/cn";

interface MarkdownMessageProps {
  content: string;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  return (
    <div className="space-y-2.5 whitespace-normal break-words text-[0.94rem]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        p: ({ className, ...props }) => (
          <p className={cn("leading-6 text-foreground/95", className)} {...props} />
        ),
        a: ({ className, ...props }) => (
          <a
            className={cn(
              "font-medium text-primary underline decoration-primary/35 underline-offset-4 transition-colors hover:text-primary/80",
              className
            )}
            target="_blank"
            rel="noreferrer"
            {...props}
          />
        ),
        strong: ({ className, ...props }) => (
          <strong
            className={cn("font-semibold text-foreground", className)}
            {...props}
          />
        ),
        em: ({ className, ...props }) => (
          <em className={cn("text-foreground/90", className)} {...props} />
        ),
        ul: ({ className, ...props }) => (
          <ul
            className={cn("ml-5 list-disc space-y-1 leading-6", className)}
            {...props}
          />
        ),
        ol: ({ className, ...props }) => (
          <ol
            className={cn("ml-5 list-decimal space-y-1 leading-6", className)}
            {...props}
          />
        ),
        li: ({ className, ...props }) => (
          <li className={cn("pl-1 marker:text-foreground/35", className)} {...props} />
        ),
        blockquote: ({ className, ...props }) => (
          <blockquote
            className={cn(
              "border-l border-primary/40 pl-4 text-foreground/80",
              className
            )}
            {...props}
          />
        ),
        h1: ({ className, ...props }) => (
          <h1
            className={cn("text-base font-semibold leading-7 text-foreground", className)}
            {...props}
          />
        ),
        h2: ({ className, ...props }) => (
          <h2
            className={cn("text-sm font-semibold leading-7 text-foreground", className)}
            {...props}
          />
        ),
        h3: ({ className, ...props }) => (
          <h3
            className={cn("text-sm font-semibold leading-7 text-foreground", className)}
            {...props}
          />
        ),
        hr: ({ className, ...props }) => (
          <hr className={cn("border-border/50", className)} {...props} />
        ),
        code: ({ className, children, ...props }) => (
          <code
            className={cn(
              "rounded-md bg-muted/70 px-1.5 py-0.5 font-mono text-[0.88em] text-foreground",
              className
            )}
            {...props}
          >
            {children}
          </code>
        ),
        pre: ({ className, ...props }) => (
          <pre
            className={cn(
              "max-w-full overflow-x-auto rounded-xl border border-border/60 bg-background/75 p-3 text-xs leading-6",
              className
            )}
            {...props}
          />
        ),
        table: ({ className, ...props }) => (
          <div className="overflow-x-auto">
            <table
              className={cn(
                "w-full border-collapse text-left text-xs leading-6",
                className
              )}
              {...props}
            />
          </div>
        ),
        th: ({ className, ...props }) => (
          <th
            className={cn("border-b border-border/60 px-3 py-2 font-semibold", className)}
            {...props}
          />
        ),
        td: ({ className, ...props }) => (
          <td
            className={cn("border-b border-border/40 px-3 py-2 text-foreground/85", className)}
            {...props}
          />
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
