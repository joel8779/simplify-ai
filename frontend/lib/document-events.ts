export const DOCUMENTS_CHANGED_EVENT = "simplify:documents-changed";

export function notifyDocumentsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(DOCUMENTS_CHANGED_EVENT));
}
