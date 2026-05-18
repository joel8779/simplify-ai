import { create } from "zustand";
import type {
  ChatMessageResponse,
  ChatSessionResponse,
} from "@/lib/services/chat.service";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  documentIds?: string[];
  responseMode?: "rag_mode" | "general_mode" | null;
  citations?: Array<{
    document_id: string;
    document_name: string;
    chunk_index: number;
    excerpt: string;
    page_number?: number | null;
  }>;
}

interface ChatState {
  messages: ChatMessage[];
  sessions: ChatSessionResponse[];
  activeSessionId: string | null;
  sessionsLoading: boolean;
  sessionsError: string | null;
  isStreaming: boolean;
  composerSelectorOpen: boolean;
  /** Document IDs scoped to the current conversation (sent with each RAG request). */
  activeDocumentIds: string[];
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  appendToMessage: (id: string, content: string) => void;
  setMessages: (messages: ChatMessage[]) => void;
  setActiveSessionId: (id: string | null) => void;
  setSessions: (sessions: ChatSessionResponse[]) => void;
  upsertSession: (session: ChatSessionResponse) => void;
  removeSession: (id: string) => void;
  setSessionsLoading: (loading: boolean) => void;
  setSessionsError: (error: string | null) => void;
  setStreaming: (streaming: boolean) => void;
  setComposerSelectorOpen: (open: boolean) => void;
  clearMessages: () => void;
  attachDocuments: (ids: string[]) => void;
  detachDocument: (id: string) => void;
  setActiveDocuments: (ids: string[]) => void;
  clearActiveDocuments: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  sessions: [],
  activeSessionId: null,
  sessionsLoading: false,
  sessionsError: null,
  isStreaming: false,
  composerSelectorOpen: false,
  activeDocumentIds: [],

  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),

  updateMessage: (id, updates) =>
    set((s) => ({
      messages: s.messages.map((message) =>
        message.id === id ? { ...message, ...updates } : message
      ),
    })),

  appendToMessage: (id, content) =>
    set((s) => ({
      messages: s.messages.map((message) =>
        message.id === id
          ? { ...message, content: `${message.content}${content}` }
          : message
      ),
    })),

  setMessages: (messages) => set({ messages }),

  setActiveSessionId: (activeSessionId) => set({ activeSessionId }),

  setSessions: (sessions) => set({ sessions }),

  upsertSession: (session) =>
    set((s) => ({
      sessions: [
        session,
        ...s.sessions.filter((existing) => existing.id !== session.id),
      ],
    })),

  removeSession: (id) =>
    set((s) => ({
      sessions: s.sessions.filter((session) => session.id !== id),
    })),

  setSessionsLoading: (sessionsLoading) => set({ sessionsLoading }),

  setSessionsError: (sessionsError) => set({ sessionsError }),

  setStreaming: (isStreaming) => set({ isStreaming }),

  setComposerSelectorOpen: (composerSelectorOpen) => set({ composerSelectorOpen }),

  clearMessages: () => set({ messages: [] }),

  attachDocuments: (ids) =>
    set((s) => ({
      activeDocumentIds: [...new Set([...s.activeDocumentIds, ...ids])],
    })),

  detachDocument: (id) =>
    set((s) => ({
      activeDocumentIds: s.activeDocumentIds.filter((docId) => docId !== id),
    })),

  setActiveDocuments: (ids) => set({ activeDocumentIds: [...new Set(ids)] }),

  clearActiveDocuments: () => set({ activeDocumentIds: [] }),
}));

export function mapApiMessage(message: ChatMessageResponse): ChatMessage {
  return {
    id: message.id,
    role: message.role === "assistant" ? "assistant" : "user",
    content: message.content,
    documentIds: message.document_ids,
    responseMode: message.response_mode,
    citations: message.citations,
  };
}
