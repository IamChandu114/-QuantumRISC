/**
 * useBackend — connects the speedy-mode Studio to the real QuantumRISC backend.
 *
 * Flow:
 *  1. Health check → if backend unavailable, return null immediately.
 *  2. Restore or create a session (persisted in sessionStorage).
 *  3. Open WebSocket → receive state.snapshot → convert to Capture.
 *  4. Expose Run / Pause / Step / Reset controls.
 *
 * Jump-to-cycle and Breakpoint: NOT supported by the backend.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import * as Api from "@/lib/backend";
import { WsClient } from "@/lib/ws-client";
import type { Capture } from "@/lib/quantum/capture";
import { abi } from "@/lib/quantum/capture";

const SESSION_KEY = "quantumrisc.session";

export type BackendStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "unavailable";

export type BackendControls = {
  run: () => Promise<void>;
  pause: () => Promise<void>;
  step: () => Promise<void>;
  reset: () => Promise<void>;
};

export type BackendState = {
  status: BackendStatus;
  detail: string;
  sessionId: string | null;
  capture: Capture | null;
  wave: import("@/lib/quantum/capture").WaveData | null;
  controls: BackendControls;
  discovery: Api.DiscoveryResponse | null;
  compileLog: string;
  runLog: string;
};

function getStr(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  return typeof v === "string" ? v : String(v ?? "");
}
function getNum(obj: Record<string, unknown>, key: string): number {
  const v = obj[key];
  return typeof v === "number" ? v : Number(v ?? 0);
}
function getBool(obj: Record<string, unknown>, key: string): boolean {
  return Boolean(obj[key]);
}
function getArr(obj: Record<string, unknown>, key: string): Array<Record<string, unknown>> {
  const v = obj[key];
  return Array.isArray(v) ? (v as Array<Record<string, unknown>>) : [];
}

function snapshotToCapture(snap: Api.SessionSnapshot): Capture {
  const pipeline = snap.pipeline;
  const regs = Array.isArray(snap.registers) ? snap.registers : [];
  const metrics = snap.metrics;
  const verification = snap.verification;
  const discovery = snap.discovery as Record<string, unknown>;
  const runResult = snap.run as Record<string, unknown>;
  const playback = snap.playback;
  const memory = snap.memory;

  const cycleNum =
    typeof playback["cursor"] === "number"
      ? (playback["cursor"] as number)
      : typeof metrics["cycles"] === "number"
      ? (metrics["cycles"] as number)
      : 0;

  const pipelineRecord: Record<string, { pc: string; instruction: string; stalled?: boolean; flushed?: boolean } | null> = {};
  
  // Backend now returns real stage mapping natively if the RTL exposes it.
  for (const stage of ["IF", "ID", "EX", "MEM", "WB"] as const) {
    const s = pipeline[stage];
    if (s && typeof s === "object") {
      const st = s as Record<string, unknown>;
      pipelineRecord[stage] = {
        pc: typeof st["pc"] === "number"
          ? `0x${(st["pc"] as number).toString(16).padStart(8, "0")}`
          : String(st["pc"] ?? "0x00000000"),
        instruction: typeof st["instruction"] === "string" ? (st["instruction"] as string) : typeof st["opcode"] === "string" ? (st["opcode"] as string) : "bubble",
        stalled: getBool(st, "stalled"),
        flushed: getBool(st, "flushed"),
      };
    } else {
      pipelineRecord[stage] = null;
    }
  }

  const registerRecord: Record<string, string> = {};
  for (const r of regs) {
    const idx = getNum(r, "index");
    if (idx >= 0 && idx < 32) {
      const name = `x${idx}`;
      const val = r["value"];
      if (typeof val === "string") {
        registerRecord[name] = val;
      } else if (typeof val === "number") {
        registerRecord[name] = `0x${(val >>> 0).toString(16).padStart(8, "0")}`;
      }
    }
  }

  const memWords = getArr(memory, "words").slice(0, 256);
  const memRecord: Record<string, string> = {};
  for (const w of memWords) {
    const addr = getNum(w, "address");
    const val = w["value"];
    if (typeof val === "string") {
      memRecord[`0x${addr.toString(16).padStart(8, "0")}`] = val;
    } else if (typeof val === "number") {
      memRecord[`0x${addr.toString(16).padStart(8, "0")}`] = `0x${(val >>> 0).toString(16).padStart(8, "0")}`;
    }
  }

  const verResults: Capture["verification"] = [];
  const verFiles = getArr(discovery, "verification_files");
  for (const f of verFiles) {
    const modNames = getArr(f, "module_names").map(m => String(m["name"] ?? m));
    verResults.push({
      name: getStr(f, "path").split('/').pop() || "tb",
      status: runResult["ok"] === true ? "passed" : runResult["ok"] === false ? "failed" : "unavailable",
      description: `Testbench module: ${modNames.join(', ')}`,
    });
  }

  const rtlResults: Capture["rtl"] = [];
  const rtlFiles = getArr(discovery, "rtl_files");
  for (const f of rtlFiles) {
    const mods = getArr(f, "module_names") as unknown as string[];
    for (const m of mods) {
      rtlResults.push({
        module: typeof m === "string" ? m : String(m),
        file: getStr(f, "path"),
        source: "Backend Discovery",
      });
    }
  }

  const perf: Record<string, number> = {};
  for (const k of ["ipc", "cpi", "cycles", "retired", "stalls", "forwards", "flushes"] as const) {
    if (typeof metrics[k] === "number") perf[k] = metrics[k] as number;
  }

  return {
    name: `${snap.top} — session ${snap.session_id.slice(0, 8)}`,
    processor: "RV32I Processor",
    testbench: snap.testbench,
    rtlVersion: snap.top,
    timestamp: snap.updated_at,
    cycles: [
      {
        cycle: cycleNum,
        pipeline: pipelineRecord,
        registers: registerRecord,
        memory: memRecord,
        events: [],
      },
    ],
    performance: perf,
    verification: verResults.length > 0 ? verResults : undefined,
    rtl: rtlResults.length > 0 ? rtlResults : undefined,
  };
}

function snapshotToWaveData(snap: Api.SessionSnapshot): import("@/lib/quantum/capture").WaveData | null {
  const waveforms = snap.waveforms as Record<string, unknown>;
  const wfTimeline = waveforms["timeline"];
  if (!waveforms || !Array.isArray(wfTimeline) || wfTimeline.length === 0) return null;

  const wfSignals = getArr(waveforms, "signals");
  const waveSignals: import("@/lib/quantum/capture").WaveSignal[] = wfSignals.map(s => ({
    name: getStr(s, "full_name") || getStr(s, "name") || "unknown",
    width: getNum(s, "size") || 1,
    transitions: [],
  }));

  let maxTime = 0;
  for (const sample of wfTimeline as Array<Record<string, unknown>>) {
    const time = getNum(sample, "time");
    maxTime = Math.max(maxTime, time);
    const changed = sample["changed"];
    if (changed && typeof changed === "object") {
      for (const sig of waveSignals) {
        const val = (changed as any)[sig.name];
        if (val !== undefined) {
          sig.transitions.push({ time, value: String(val) });
        }
      }
    }
  }

  // Filter out signals with no transitions for cleaner UI, unless there are very few
  const activeSignals = waveSignals.filter(s => s.transitions.length > 0);
  return {
    signals: activeSignals.length > 0 ? activeSignals : waveSignals,
    timescale: "1ns", // Backend default
    maxTime,
  };
}

export function useBackend(): BackendState {
  const [status, setStatus] = useState<BackendStatus>("idle");
  const [detail, setDetail] = useState("Initialising");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [capture, setCapture] = useState<Capture | null>(null);
  const [wave, setWave] = useState<import("@/lib/quantum/capture").WaveData | null>(null);
  const [discovery, setDiscovery] = useState<Api.DiscoveryResponse | null>(null);
  const [compileLog, setCompileLog] = useState("");
  const [runLog, setRunLog] = useState("");

  const wsRef = useRef<WsClient | null>(null);
  const sessionRef = useRef<string | null>(null);

  const applySnapshot = useCallback((snap: Api.SessionSnapshot) => {
    try {
      const newCaptureBase = snapshotToCapture(snap);
      const newWaveBase = snapshotToWaveData(snap);
      if (newWaveBase) setWave(newWaveBase);
      setCapture((prev) => {
        let prevCapture = prev;
        
        // Recover from session storage if prev is null
        if (!prevCapture && sessionRef.current) {
          const cached = sessionStorage.getItem(`quantum-capture-${sessionRef.current}`);
          if (cached) {
            try {
              prevCapture = JSON.parse(cached) as Capture;
            } catch (e) { /* ignore */ }
          }
        }
        
        if (!prevCapture) {
          if (sessionRef.current) sessionStorage.setItem(`quantum-capture-${sessionRef.current}`, JSON.stringify(newCaptureBase));
          return newCaptureBase;
        }
        
        const newCycle = newCaptureBase.cycles[0];
        if (!newCycle) return prevCapture;
        
        // Accumulate cycles over time to allow timeline navigation
        let updatedCycles = [...prevCapture.cycles];
        
        // If the backend cursor was reset to 0, and we receive a cycle 0 that doesn't match our history length,
        // it might be a simulation reset. If it's a reset, we should clear the timeline.
        if (newCycle.cycle === 0 && prevCapture.cycles.length > 1 && (snap.playback as Record<string, unknown>)?.["mode"] === "idle") {
           updatedCycles = [newCycle];
        } else {
          const existingIdx = updatedCycles.findIndex(c => c.cycle === newCycle.cycle);
          if (existingIdx >= 0) {
            updatedCycles[existingIdx] = newCycle; // Update existing cycle state
          } else {
            updatedCycles.push(newCycle);
            updatedCycles.sort((a, b) => a.cycle - b.cycle);
          }
        }
        
        const updatedCapture = {
          ...prevCapture,
          ...newCaptureBase,
          cycles: updatedCycles,
        };
        
        if (sessionRef.current) sessionStorage.setItem(`quantum-capture-${sessionRef.current}`, JSON.stringify(updatedCapture));
        return updatedCapture;
      });
    } catch (e) {
      console.error("[QuantumRISC] snapshot→capture failed", e);
    }
  }, []);

  const connectWs = useCallback((sid: string) => {
    wsRef.current?.disconnect();
    sessionRef.current = sid;
    const client = new WsClient(sid, {
      onSnapshot: applySnapshot,
      onStateChange: (s, d) => {
        if (s === "connected") setStatus("connected");
        else if (s === "reconnecting") setStatus("reconnecting");
        else if (s === "unavailable") setStatus("unavailable");
        else setStatus("connecting");
        setDetail(d ?? s);
      },
    });
    wsRef.current = client;
    client.connect();
  }, [applySnapshot]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setStatus("connecting");
      setDetail("Checking backend health…");
      try {
        const h = await Api.health();
        if (!h.ok) {
          setStatus("unavailable");
          setDetail(`Backend degraded: ${JSON.stringify(h.checks)}`);
          return;
        }
      } catch {
        setStatus("unavailable");
        setDetail("Backend unavailable — is uvicorn running on port 8000?");
        return;
      }
      if (cancelled) return;

      const disc = await Api.discovery().catch(() => null);
      if (disc) setDiscovery(disc);

      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        try {
          const snap = await Api.getSession(stored);
          if (!cancelled) {
            setSessionId(stored);
            sessionRef.current = stored;
            
            // Try to load cached capture
            const cached = sessionStorage.getItem(`quantum-capture-${stored}`);
            if (cached) {
              try { setCapture(JSON.parse(cached)); } catch (e) {}
            }
            
            setDetail("Restored session");
            applySnapshot(snap);
            connectWs(stored);
            return;
          }
        } catch {
          sessionStorage.removeItem(SESSION_KEY);
          sessionStorage.removeItem(`quantum-capture-${stored}`);
        }
      }

      try {
        const resp = await Api.createSession(disc?.default_top, disc?.default_testbench);
        if (cancelled) return;
        sessionStorage.setItem(SESSION_KEY, resp.id);
        setSessionId(resp.id);
        sessionRef.current = resp.id;
        setDetail("Session created");
        connectWs(resp.id);
      } catch (e) {
        setStatus("unavailable");
        setDetail(`Session creation failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    })();
    return () => {
      cancelled = true;
      wsRef.current?.disconnect();
    };
  }, [applySnapshot, connectWs]);

  const controls: BackendControls = {
    run: useCallback(async () => {
      const id = sessionRef.current;
      if (!id) return;
      const r = await Api.run(id);
      setRunLog(r.stdout + r.stderr);
      const snap = await Api.getSnapshot(id).catch(() => null);
      if (snap) applySnapshot(snap);
    }, [applySnapshot]),

    pause: useCallback(async () => {
      const id = sessionRef.current;
      if (!id) return;
      const snap = await Api.pause(id).catch(() => null);
      if (snap) applySnapshot(snap);
    }, [applySnapshot]),

    step: useCallback(async () => {
      const id = sessionRef.current;
      if (!id) return;
      const snap = await Api.step(id).catch(() => null);
      if (snap) applySnapshot(snap);
    }, [applySnapshot]),

    reset: useCallback(async () => {
      const id = sessionRef.current;
      if (!id) return;
      const snap = await Api.reset(id).catch(() => null);
      if (snap) applySnapshot(snap);
    }, [applySnapshot]),
  };

  return { status, detail, sessionId, capture, wave, controls, discovery, compileLog, runLog };
}
