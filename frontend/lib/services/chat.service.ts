import { api } from "@/lib/api/client";
import { getApiBaseUrl } from "@/lib/api/config";

const API_BASE_URL = getApiBaseUrl();

export interface Citation {
  document_id: string;
  document_name: string;
  chunk_index: number;
  excerpt: string;
  page_number?: number | null;
}

export interface ChatSessionResponse {
  id: string;
  title: string;
  document_ids: string[];
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageResponse {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  document_ids: string[];
  citations: Citation[];
  response_mode?: "rag_mode" | "general_mode" | null;
  created_at: string;
}

export interface ChatCompletionResponse {
  session_id: string;
  message: ChatMessageResponse;
  citations: Citation[];
  response_mode: "rag_mode" | "general_mode";
}

export type ChatStreamEvent =
  | {
      type: "meta";
      session_id: string;
      response_mode: "rag_mode" | "general_mode";
      citations: Citation[];
    }
  | { type: "delta"; content: string }
  | {
      type: "done";
      session_id: string;
      message: ChatMessageResponse;
      citations: Citation[];
      response_mode: "rag_mode" | "general_mode";
    };

export interface ChatStatsResponse {
  total_documents: number;
  total_chats: number;
  total_messages: number;
}

export const chatService = {
  async listSessions(): Promise<ChatSessionResponse[]> {
    return api.get<ChatSessionResponse[]>("/api/v1/chat/sessions");
  },

  async getMessages(sessionId: string): Promise<ChatMessageResponse[]> {
    return api.get<ChatMessageResponse[]>(
      `/api/v1/chat/sessions/${sessionId}/messages`
    );
  },

  async createSession(documentIds: string[]): Promise<ChatSessionResponse> {
    return api.post<ChatSessionResponse>("/api/v1/chat/sessions", {
      document_ids: documentIds,
    });
  },

  async sendMessage(
    sessionId: string,
    content: string,
    documentIds: string[]
  ): Promise<ChatCompletionResponse> {
    return api.post<ChatCompletionResponse>(
      `/api/v1/chat/sessions/${sessionId}/messages`,
      {
        content,
        document_ids: documentIds,
      }
    );
  },

  async streamMessage(
    sessionId: string,
    content: string,
    documentIds: string[],
    onEvent: (event: ChatStreamEvent) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    const response = await fetch(
      `${API_BASE_URL}/api/v1/chat/sessions/${sessionId}/messages/stream`,
      {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content,
          document_ids: documentIds,
        }),
      }
    );

    if (!response.ok || !response.body) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.message || response.statusText || "Streaming failed");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const rawEvent of events) {
        const parsed = parseSseEvent(rawEvent);
        if (parsed) onEvent(parsed);
      }
    }

    const tail = buffer.trim();
    if (tail) {
      const parsed = parseSseEvent(tail);
      if (parsed) onEvent(parsed);
    }
  },

  async renameSession(
    sessionId: string,
    title: string
  ): Promise<ChatSessionResponse> {
    return api.patch<ChatSessionResponse>(`/api/v1/chat/sessions/${sessionId}`, {
      title,
    });
  },

  async updateSessionDocuments(
    sessionId: string,
    documentIds: string[]
  ): Promise<ChatSessionResponse> {
    return api.patch<ChatSessionResponse>(`/api/v1/chat/sessions/${sessionId}`, {
      document_ids: documentIds,
    });
  },

  async deleteSession(sessionId: string): Promise<void> {
    await api.delete(`/api/v1/chat/sessions/${sessionId}`);
  },

  async clearHistory(): Promise<void> {
    await api.delete("/api/v1/chat/sessions");
  },

  async getStats(): Promise<ChatStatsResponse> {
    return api.get<ChatStatsResponse>("/api/v1/chat/stats");
  },
};

function parseSseEvent(raw: string): ChatStreamEvent | null {
  const lines = raw.split("\n");
  const eventName = lines
    .find((line) => line.startsWith("event:"))
    ?.replace("event:", "")
    .trim();
  const data = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.replace("data:", "").trim())
    .join("\n");

  if (!eventName || !data) return null;
  const payload = JSON.parse(data);
  return { type: eventName, ...payload } as ChatStreamEvent;
}
