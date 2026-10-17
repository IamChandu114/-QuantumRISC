/**
 * QuantumRISC WebSocket Client
 * Matches the REAL backend WebSocket contract from backend/app/api/routes.py:
 *   - Server sends: { type: "session.created", session_id }, { type: "state.snapshot", payload: SessionSnapshot }, { type: "ping" }
 *   - Client replies: { type: "pong" } on ping
 *   - Close code 4004 = session not found (no retry)
 *   - Heartbeat: server sends ping every 10s; client replies pong
 */

import type { SessionSnapshot } from "./quantumrisc-api";
import { resolveBackendWsBase } from "./backend-endpoint";

export type WsMessage =
  | { type: "session.created"; session_id: string }
  | { type: "state.snapshot"; payload: SessionSnapshot }
  | { type: "ping" }
  | { type: "compile.progress"; payload?: unknown }
  | { type: "compile.done"; payload?: unknown }
  | { type: "run.progress"; payload?: unknown }
  | { type: "run.done"; payload?: unknown }
  | { type: "timeline.sample"; payload?: unknown }
  | { type: "cursor.changed"; payload?: unknown }
  | { type: "playback.state"; payload?: unknown }
  | { type: string; payload?: unknown; session_id?: string };

export type WsConnectionState =
  "connecting" | "connected" | "reconnecting" | "unavailable" | "closed";

export interface WsClientOptions {
  baseUrl?: string;
  onSnapshot: (snap: SessionSnapshot) => void;
  onStateChange?: (state: WsConnectionState, detail?: string) => void;
  onMessage?: (msg: WsMessage) => void;
}

const MAX_ATTEMPTS = 5;

export class WsClient {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private opts: WsClientOptions;
  private attempts = 0;
  private dead = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(sessionId: string, opts: WsClientOptions) {
    this.sessionId = sessionId;
    this.opts = opts;
  }

  private getWsUrl(): string {
    const base = this.opts.baseUrl
      ? this.opts.baseUrl.replace(/^http:\/\//, "ws://").replace(/^https:\/\//, "wss://")
      : resolveBackendWsBase();
    return `${base.replace(/\/+$/, "")}/ws/sessions/${this.sessionId}`;
  }

  connect() {
    if (this.dead || this.ws) return;
    this.opts.onStateChange?.(this.attempts > 0 ? "reconnecting" : "connecting");
    try {
      const url = this.getWsUrl();
      const ws = new WebSocket(url);
      this.ws = ws;

      ws.onopen = () => {
        this.attempts = 0;
        this.opts.onStateChange?.("connected");
        this.resetHeartbeat();
      };

      ws.onmessage = (ev: MessageEvent) => {
        this.resetHeartbeat();
        let msg: WsMessage;
        try {
          msg = JSON.parse(ev.data as string) as WsMessage;
        } catch {
          return;
        }

        if (msg.type === "ping") {
          try {
            ws.send(JSON.stringify({ type: "pong" }));
          } catch {
            // ignore send error
          }
        } else if (msg.type === "state.snapshot" && msg.payload) {
          this.opts.onSnapshot(msg.payload as SessionSnapshot);
        }

        this.opts.onMessage?.(msg);
      };

      ws.onerror = () => {
        this.opts.onStateChange?.("unavailable", "WebSocket error");
      };

      ws.onclose = (ev: CloseEvent) => {
        this.clearHeartbeat();
        this.ws = null;
        if (this.dead) {
          this.opts.onStateChange?.("closed");
          return;
        }
        // 4004 = session rejected by backend, do not retry
        if (ev.code === 4004) {
          this.opts.onStateChange?.("unavailable", "Session not found on backend");
          return;
        }
        this.scheduleReconnect();
      };
    } catch (err) {
      this.opts.onStateChange?.(
        "unavailable",
        err instanceof Error ? err.message : "WebSocket connection error",
      );
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.attempts >= MAX_ATTEMPTS) {
      this.opts.onStateChange?.("unavailable", "Max reconnect attempts reached");
      return;
    }
    this.attempts++;
    const delay = Math.min(1000 * 2 ** this.attempts, 10000);
    this.opts.onStateChange?.("reconnecting", `retry ${this.attempts}/${MAX_ATTEMPTS}`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private resetHeartbeat() {
    this.clearHeartbeat();
    // If server stops pinging for 30s (> 3x interval), mark as dead
    this.heartbeatTimer = setTimeout(() => {
      this.opts.onStateChange?.("unavailable", "Heartbeat timeout");
      this.ws?.close();
    }, 30000);
  }

  private clearHeartbeat() {
    if (this.heartbeatTimer) {
      clearTimeout(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  disconnect() {
    this.dead = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.clearHeartbeat();
    this.ws?.close();
    this.ws = null;
  }
}
