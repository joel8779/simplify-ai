export function getApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  throw new Error("NEXT_PUBLIC_API_URL is required.");
}
