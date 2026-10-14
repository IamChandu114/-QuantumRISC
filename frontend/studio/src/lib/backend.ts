/**
 * QuantumRISC Backend API Client
 * Matches the REAL backend contract from backend/app/api/routes.py
 */

const BASE: string = (() => {
  const envUrl = (import.meta.env as Record<string, string | undefined>)["VITE_BACKEND_URL"];
  return envUrl ? envUrl.replace(/\/$/, "") : "http://127.0.0.1:8000";
})();

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ── Health ──────────────────────────────────────────────────────────────────
export interface HealthResponse {
  ok: boolean;
  status: "healthy" | "degraded";
  checks: {
    repository: "available" | "unavailable";
    iverilog: "available" | "unavailable";
    vvp: "available" | "unavailable";
    sqlite: "available" | "unavailable";
  };
}
export const health = () => req<HealthResponse>("/api/health");

// ── Discovery ────────────────────────────────────────────────────────────────
export interface FileEntry { path: string; kind: string; module_names: string[] }
export interface DiscoveryResponse {
  tops: string[];
  smoke_tops: string[];
  testbenches: string[];
  rtl_files: FileEntry[];
  verification_files: FileEntry[];
  default_top: string;
  default_testbench: string;
}
export const discovery = () => req<DiscoveryResponse>("/api/discovery");

// ── Sessions ─────────────────────────────────────────────────────────────────
export interface SessionCreateResponse {
  id: string;
  top: string;
  testbench: string;
  created_at: string;
}
export const createSession = (top?: string, testbench?: string) =>
  req<SessionCreateResponse>("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ top: top ?? null, testbench: testbench ?? null }),
  });

export type SessionStatus = string;

export interface SessionSnapshot {
  session_id: string;
  status: SessionStatus;
  top: string;
  testbench: string;
  created_at: string;
  updated_at: string;
  discovery: Record<string, unknown>;
  playback: Record<string, unknown>;
  compile: Record<string, unknown>;
  run: Record<string, unknown>;
  architecture: Record<string, unknown>;
  registers: Array<Record<string, unknown>>;
  memory: Record<string, unknown>;
  pipeline: Record<string, unknown>;
  hazards: Array<Record<string, unknown>>;
  forwarding: Array<Record<string, unknown>>;
  metrics: Record<string, unknown>;
  waveforms: Record<string, unknown>;
  vcd: Record<string, unknown>;
  cache: Record<string, unknown>;
  branch: Record<string, unknown>;
  verification: Record<string, unknown>;
  fpga: Record<string, unknown>;
}

export const getSession = (id: string) => req<SessionSnapshot>(`/api/sessions/${id}`);
export const getSnapshot = (id: string) => req<SessionSnapshot>(`/api/sessions/${id}/snapshot`);

// ── Simulation controls ───────────────────────────────────────────────────────
export interface CompileResponse { ok: boolean; returncode: number; stdout: string; stderr: string; executable: string | null; vcd_path: string | null }
export const compile = (id: string) => req<CompileResponse>(`/api/sessions/${id}/compile`, { method: "POST" });

export interface RunResponse { ok: boolean; returncode: number; stdout: string; stderr: string; vcd_path: string | null }
export const run = (id: string) => req<RunResponse>(`/api/sessions/${id}/run`, { method: "POST" });

export const pause = (id: string) => req<SessionSnapshot>(`/api/sessions/${id}/pause`, { method: "POST" });
export const resume = (id: string) => req<SessionSnapshot>(`/api/sessions/${id}/resume`, { method: "POST" });
export const reset = (id: string) => req<SessionSnapshot>(`/api/sessions/${id}/reset`, { method: "POST" });
export const step = (id: string) => req<SessionSnapshot>(`/api/sessions/${id}/step`, { method: "POST" });

// ── VCD ───────────────────────────────────────────────────────────────────────
export interface VcdResponse { path: string; name: string }
export const getVcd = (id: string) => req<VcdResponse>(`/api/sessions/${id}/vcd`);

// ── WebSocket base ────────────────────────────────────────────────────────────
export function wsUrl(sessionId: string): string {
  const http = BASE.replace(/^http/, "ws");
  return `${http}/ws/sessions/${sessionId}`;
}
