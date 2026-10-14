export const LOCAL_BACKEND_URL = "http://127.0.0.1:8000";

export function resolveBackendApiBase(): string {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (envUrl && envUrl.trim()) return envUrl.replace(/\/+$/, "");

  if (typeof window === "undefined") return LOCAL_BACKEND_URL;

  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") return LOCAL_BACKEND_URL;
  // Production Studio is served by the local FastAPI application unless an
  // explicit VITE_API_URL selects another backend.
  return window.location.origin.replace(/\/+$/, "");
}

export function resolveBackendWsBase(): string {
  return resolveBackendApiBase()
    .replace(/^https:\/\//, "wss://")
    .replace(/^http:\/\//, "ws://");
}
