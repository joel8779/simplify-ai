"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const MOCK_SESSIONS = [
  { id: "1", title: "Q4 revenue analysis" },
  { id: "2", title: "Product roadmap summary" },
  { id: "3", title: "Contract review notes" },
  { id: "4", title: "Onboarding checklist" },
];

interface ChatSessionListProps {
  onSelect?: () => void;
}

export function ChatSessionList({ onSelect }: ChatSessionListProps) {
  const pathname = usePathname();

  return (
    <ul className="scrollbar-thin flex flex-col gap-0.5 overflow-y-auto">
      {MOCK_SESSIONS.map((session, i) => {
        const href = `/chat/${session.id}`;
        const isActive = pathname === href;

        return (
          <li
            key={session.id}
            className="animate-slide-in-left"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <Link
              href={href}
              onClick={onSelect}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-200",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <MessageSquare className="h-4 w-4 shrink-0 opacity-60" />
              <span className="truncate">{session.title}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
