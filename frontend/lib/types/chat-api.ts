/**
 * Payload shape for RAG chat requests.
 * Pass `documentIds` from `useChatStore.getState().activeDocumentIds`.
 */
export interface ChatCompletionRequest {
  message: string;
  sessionId?: string;
  /** When set, retrieval is filtered to these document IDs only. */
  documentIds: string[];
}
