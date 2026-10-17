import { resolveBackendApiBase } from "./backend-endpoint";

const API_BASE = `${resolveBackendApiBase()}/api`;

function describeHttpStatus(method: string, endpoint: string, status: number): string {
  if (status === 500) {
    return `QuantumRISC backend error while handling ${method} ${endpoint}`;
  }
  if (status === 404) {
    return `QuantumRISC could not find ${method} ${endpoint}`;
  }
  if (status === 503) {
    return `QuantumRISC backend is temporarily unavailable for ${method} ${endpoint}`;
  }
  return `Backend returned HTTP ${status} for ${method} ${endpoint}`;
}

export class ApiClient {
  static async health() {
    return this.get("/health");
  }

  static async get(endpoint: string) {
    const response = await fetch(`${API_BASE}${endpoint}`);
    if (!response.ok) {
      throw await this.httpError("GET", endpoint, response);
    }
    return response.json();
  }

  static async post(endpoint: string, body?: unknown) {
    const init: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...init,
    });
    if (!response.ok) {
      throw await this.httpError("POST", endpoint, response);
    }
    return response.json();
  }

  private static async httpError(
    method: string,
    endpoint: string,
    response: Response,
  ): Promise<Error> {
    const fallback = describeHttpStatus(method, endpoint, response.status);
    try {
      const text = await response.text();
      if (!text) return new Error(fallback);

      try {
        const parsed = JSON.parse(text) as { detail?: unknown; message?: unknown };
        const detail = parsed.detail ?? parsed.message;
        if (typeof detail === "string" && detail.trim()) {
          return new Error(`${fallback}: ${detail}`);
        }
      } catch {
        // Not JSON, fall through to raw text.
      }

      return new Error(`${fallback}: ${text.slice(0, 240)}`);
    } catch {
      return new Error(fallback);
    }
  }

  static async getDiscovery() {
    return this.get("/discovery");
  }

  static async createSession(top?: string, testbench?: string) {
    return this.post("/sessions", { top, testbench });
  }

  static async getSession(id: string) {
    return this.get(`/sessions/${id}`);
  }

  static async compile(id: string) {
    return this.post(`/sessions/${id}/compile`);
  }

  static async run(id: string) {
    return this.post(`/sessions/${id}/run`);
  }

  static async pause(id: string) {
    return this.post(`/sessions/${id}/pause`);
  }

  static async resume(id: string) {
    return this.post(`/sessions/${id}/resume`);
  }

  static async step(id: string) {
    return this.post(`/sessions/${id}/step`);
  }

  static async reset(id: string) {
    return this.post(`/sessions/${id}/reset`);
  }

  static async getSnapshot(id: string) {
    return this.get(`/sessions/${id}/snapshot`);
  }
}
