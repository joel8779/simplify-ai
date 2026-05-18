const DEFAULT_LOCAL_API_URL = "http://127.0.0.1:8000";

export function getApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
    throw new Error("NEXT_PUBLIC_API_URL is required in production.");
  }

  return DEFAULT_LOCAL_API_URL;
}
