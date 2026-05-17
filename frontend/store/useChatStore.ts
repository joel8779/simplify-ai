import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  /** Document IDs scoped to the current conversation (sent with each RAG request). */
  activeDocumentIds: string[];
  addMessage: (message: ChatMessage) => void;
  setStreaming: (streaming: boolean) => void;
  clearMessages: () => void;
  attachDocuments: (ids: string[]) => void;
  detachDocument: (id: string) => void;
  setActiveDocuments: (ids: string[]) => void;
  clearActiveDocuments: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  activeDocumentIds: [],

  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),

  setStreaming: (isStreaming) => set({ isStreaming }),

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
