"use client";

import { useCallback, useEffect } from "react";
import { chatService } from "@/lib/services/chat.service";
import { useChatStore } from "@/store/useChatStore";

export function useChatSessions() {
  const sessions = useChatStore((s) => s.sessions);
  const isLoading = useChatStore((s) => s.sessionsLoading);
  const error = useChatStore((s) => s.sessionsError);
  const setSessions = useChatStore((s) => s.setSessions);
  const setLoading = useChatStore((s) => s.setSessionsLoading);
  const setError = useChatStore((s) => s.setSessionsError);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const nextSessions = await chatService.listSessions();
      setSessions(nextSessions);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load chats");
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, setSessions]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { sessions, isLoading, error, refresh };
}
