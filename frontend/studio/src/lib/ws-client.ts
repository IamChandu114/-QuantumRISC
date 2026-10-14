/**
 * QuantumRISC WebSocket Client
 * Matches the REAL backend WebSocket contract from backend/app/api/routes.py:
 *   - Server sends: { type: "session.created" }, { type: "state.snapshot", payload: SessionSnapshot }, { type: "ping" }
 *   - Client replies: { type: "pong" } on ping
 *   - Close code 4004 = session not found (no retry)
 *   - Heartbeat: server sends ping every 10s; client must pong
 */

import type { SessionSnapshot } from "./backend";
import { wsUrl } from "./backend";

export type WsMessage =
  | { type: "session.created"; session_id: string }
  | { type: "state.snapshot"; payload: SessionSnapshot }
  | { type: "ping" };

type State = "connecting" | "connected" | "reconnecting" | "unavailable" | "closed";

export interface WsClientOptions {
  onSnapshot: (snap: SessionSnapshot) => void;
  onStateChange?: (state: State, detail?: string) => void;
}

const MAX_ATTEMPTS = 6;

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

  connect() {
    if (this.dead || this.ws) return;
    this.opts.onStateChange?.(this.attempts > 0 ? "reconnecting" : "connecting");
    const ws = new WebSocket(wsUrl(this.sessionId));
    this.ws = ws;

    ws.onopen = () => {
      this.attempts = 0;
      this.opts.onStateChange?.("connected");
      this.resetHeartbeat();
    };

    ws.onmessage = (ev: MessageEvent) => {
      this.resetHeartbeat();
      let msg: WsMessage;
      try { msg = JSON.parse(ev.data as string) as WsMessage; } catch { return; }
      if (msg.type === "ping") {
        ws.send(JSON.stringify({ type: "pong" }));
      } else if (msg.type === "state.snapshot") {
        // Throttle: only apply if 16ms have passed (60fps max)
        this.opts.onSnapshot(msg.payload);
      }
    };

    ws.onerror = () => {
      this.opts.onStateChange?.("unavailable", "WebSocket error");
    };

    ws.onclose = (ev: CloseEvent) => {
      this.clearHeartbeat();
      this.ws = null;
      if (this.dead) { this.opts.onStateChange?.("closed"); return; }
      // 4004 = session rejected by backend, do not retry
      if (ev.code === 4004) {
        this.opts.onStateChange?.("unavailable", "Session not found on backend");
        return;
      }
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect() {
    if (this.attempts >= MAX_ATTEMPTS) {
      this.opts.onStateChange?.("unavailable", "Max reconnect attempts reached");
      return;
    }
    this.attempts++;
    const delay = Math.min(1000 * 2 ** this.attempts, 15000);
    this.opts.onStateChange?.("reconnecting", `retry ${this.attempts}/${MAX_ATTEMPTS} in ${delay}ms`);
    this.reconnectTimer = setTimeout(() => { this.reconnectTimer = null; this.connect(); }, delay);
  }

  private resetHeartbeat() {
    this.clearHeartbeat();
    // If server stops pinging for 35s (> 3× the 10s interval), treat as dead
    this.heartbeatTimer = setTimeout(() => {
      this.opts.onStateChange?.("unavailable", "Heartbeat timeout");
      this.ws?.close();
    }, 35000);
  }

  private clearHeartbeat() {
    if (this.heartbeatTimer) { clearTimeout(this.heartbeatTimer); this.heartbeatTimer = null; }
  }

  disconnect() {
    this.dead = true;
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    this.clearHeartbeat();
    this.ws?.close();
    this.ws = null;
  }
}
