"use client";

export function StreamingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2 animate-fade-in">
      <span className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse-soft" />
      <span
        className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse-soft"
        style={{ animationDelay: "0.2s" }}
      />
      <span
        className="h-2 w-2 rounded-full bg-muted-foreground animate-pulse-soft"
        style={{ animationDelay: "0.4s" }}
      />
    </div>
  );
}
