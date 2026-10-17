/**
 * QuantumRISC Backend API Client
 * Authoritative types and methods matching backend/app/api/routes.py and schemas.py.
 */

import { resolveBackendApiBase, resolveBackendWsBase } from "./backend-endpoint";

export { resolveBackendApiBase, resolveBackendWsBase };

export type HealthCheckResult =
  | { state: "reachable"; baseUrl: string; statusCode: number; checks?: Record<string, string> }
  | { state: "unreachable"; baseUrl: string; message: string; statusCode?: number };

export function normalizeBackendUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Enter a backend address.");

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Enter a complete address, such as http://127.0.0.1:8000.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Use an HTTP or HTTPS address.");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Backend addresses cannot include a username or password.");
  }
  if (parsed.search || parsed.hash) {
    throw new Error("Backend addresses cannot include a query string or fragment.");
  }

  return parsed.toString().replace(/\/$/, "");
}

export async function checkBackendHealth(value: string): Promise<HealthCheckResult> {
  let baseUrl: string;
  try {
    baseUrl = normalizeBackendUrl(value);
  } catch (error) {
    return {
      state: "unreachable",
      baseUrl: value.trim(),
      message: error instanceof Error ? error.message : "The address is invalid.",
    };
  }

  try {
    const response = await fetch(`${baseUrl}/api/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return {
        state: "unreachable",
        baseUrl,
        statusCode: response.status,
        message: `Health check returned HTTP ${response.status}.`,
      };
    }

    const data = await response.json().catch(() => ({}));
    return {
      state: "reachable",
      baseUrl,
      statusCode: response.status,
      checks: data.checks,
    };
  } catch (error) {
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "The health check timed out after 5 seconds."
        : "Could not reach the health endpoint. Check the address, server, and browser access settings.";
    return { state: "unreachable", baseUrl, message };
  }
}

// ── Models & Schemas ──────────────────────────────────────────────────────────

export interface FileEntry {
  path: string;
  kind: "rtl" | "tb" | "verification" | "docs" | "other" | string;
  module_names: string[];
}

export interface DiscoveryResponse {
  tops: string[];
  smoke_tops: string[];
  testbenches: string[];
  rtl_files: FileEntry[];
  verification_files: FileEntry[];
  default_top: string;
  default_testbench: string;
}

export interface SessionCreateRequest {
  top?: string | null | undefined;
  testbench?: string | null | undefined;
}

export interface SessionCreateResponse {
  id: string;
  top: string;
  testbench: string;
  created_at: string;
}

export interface CompileResponse {
  ok: boolean;
  returncode: number;
  stdout: string;
  stderr: string;
  executable: string | null;
  vcd_path: string | null;
}

export interface RunResponse {
  ok: boolean;
  returncode: number;
  stdout: string;
  stderr: string;
  vcd_path: string | null;
}

export interface PipelineStageInfo {
  pc?: string | number | undefined;
  instruction?: string | undefined;
  alu_result?: string | undefined;
  stalled?: boolean | undefined;
  flushed?: boolean | undefined;
}

export interface RegisterEntry {
  index: number;
  name: string;
  abi: string;
  value: string;
}

export interface MemoryWord {
  address: string;
  value: string;
}

export interface HazardEvent {
  kind: string;
  resolved: string;
  producer_pc: string;
  consumer_pc: string;
  producer_rd: number;
}

export interface ForwardingEvent {
  path: string;
  reason: string;
  consumer_pc?: string;
  producer_pc?: string;
}

export interface SessionMetrics {
  cycles: number;
  retired: number;
  stalls: number;
  hazards: number;
  forwards: number;
  flushes: number;
  ipc: number;
  cpi: number;
}

export interface SessionSnapshot {
  session_id: string;
  status: string;
  top: string;
  testbench: string;
  created_at: string;
  updated_at: string;
  discovery: Record<string, unknown>;
  playback: {
    cursor: number;
    total: number;
    paused: boolean;
    mode: string;
  };
  compile: CompileResponse;
  run: RunResponse;
  architecture: {
    signals: string[];
  };
  registers: RegisterEntry[];
  memory: {
    base: string;
    words: MemoryWord[];
  };
  pipeline: Record<string, PipelineStageInfo>;
  hazards: HazardEvent[];
  forwarding: ForwardingEvent[];
  metrics: SessionMetrics;
  waveforms: {
    timeline: Array<Record<string, unknown>>;
    signals: string[];
    cursor: number;
    current: Record<string, unknown>;
  };
  vcd: {
    path: string | null;
    name: string | null;
  };
  cache: {
    signals: string[];
    current: Record<string, unknown>;
    available: boolean;
    reason: string;
  };
  branch: {
    signals: string[];
    current: Record<string, unknown>;
    available: boolean;
    reason: string;
    hazards: HazardEvent[];
    forwarding: ForwardingEvent[];
  };
  verification: {
    files: FileEntry[];
    compile: CompileResponse;
    run: RunResponse;
    vcd: { path: string | null; name: string | null };
    signals: string[];
    current: Record<string, unknown>;
    logs: {
      compile_stdout?: string;
      compile_stderr?: string;
      run_stdout?: string;
      run_stderr?: string;
    };
  };
  fpga: {
    available: boolean;
    reason: string;
  };
}

export interface VcdResponse {
  path: string;
  name: string;
}

// ── HTTP API Client ──────────────────────────────────────────────────────────

async function apiRequest<T>(baseUrl: string, path: string, init?: RequestInit): Promise<T> {
  const url = `${baseUrl.replace(/\/+$/, "")}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} (${res.statusText}): ${errorBody || "Unknown error"}`);
  }

  return res.json() as Promise<T>;
}

export async function fetchDiscovery(baseUrl: string): Promise<DiscoveryResponse> {
  return apiRequest<DiscoveryResponse>(baseUrl, "/api/discovery");
}

export async function createSession(
  baseUrl: string,
  req?: SessionCreateRequest,
): Promise<SessionCreateResponse> {
  return apiRequest<SessionCreateResponse>(baseUrl, "/api/sessions", {
    method: "POST",
    body: JSON.stringify(req ?? {}),
  });
}

export async function getSession(baseUrl: string, sessionId: string): Promise<SessionSnapshot> {
  return apiRequest<SessionSnapshot>(baseUrl, `/api/sessions/${sessionId}`);
}

export async function getSnapshot(baseUrl: string, sessionId: string): Promise<SessionSnapshot> {
  return apiRequest<SessionSnapshot>(baseUrl, `/api/sessions/${sessionId}/snapshot`);
}

export async function compileSession(baseUrl: string, sessionId: string): Promise<CompileResponse> {
  return apiRequest<CompileResponse>(baseUrl, `/api/sessions/${sessionId}/compile`, {
    method: "POST",
  });
}

export async function runSession(baseUrl: string, sessionId: string): Promise<RunResponse> {
  return apiRequest<RunResponse>(baseUrl, `/api/sessions/${sessionId}/run`, {
    method: "POST",
  });
}

export async function pauseSession(
  baseUrl: string,
  sessionId: string,
): Promise<{ paused: boolean; cursor: number }> {
  return apiRequest<{ paused: boolean; cursor: number }>(
    baseUrl,
    `/api/sessions/${sessionId}/pause`,
    { method: "POST" },
  );
}

export async function resumeSession(
  baseUrl: string,
  sessionId: string,
): Promise<{ paused: boolean; cursor: number }> {
  return apiRequest<{ paused: boolean; cursor: number }>(
    baseUrl,
    `/api/sessions/${sessionId}/resume`,
    { method: "POST" },
  );
}

export async function stepSession(
  baseUrl: string,
  sessionId: string,
): Promise<{ cursor: number; total: number }> {
  return apiRequest<{ cursor: number; total: number }>(baseUrl, `/api/sessions/${sessionId}/step`, {
    method: "POST",
  });
}

export async function resetSession(
  baseUrl: string,
  sessionId: string,
): Promise<{ cursor: number; paused: boolean }> {
  return apiRequest<{ cursor: number; paused: boolean }>(
    baseUrl,
    `/api/sessions/${sessionId}/reset`,
    { method: "POST" },
  );
}

export async function getVcd(baseUrl: string, sessionId: string): Promise<VcdResponse> {
  return apiRequest<VcdResponse>(baseUrl, `/api/sessions/${sessionId}/vcd`);
}
