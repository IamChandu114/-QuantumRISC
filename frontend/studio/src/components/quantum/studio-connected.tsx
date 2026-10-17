/**
 * StudioWithBackend — wraps the QuantumRISC Studio and feeds it live backend data.
 *
 * Strategy: mount Studio normally (it manages its own state), then synchronise
 * the live Capture from the backend by dispatching custom events that Studio
 * listens to. Backend status and controls are also broadcast via events so
 * Studio's integrated topbar can surface them natively in the new GitHub UI design.
 *
 * Jump-to-cycle and Breakpoint are NOT available in the real backend.
 */

import { useEffect, useRef } from "react";
import { useBackend } from "@/hooks/use-backend";
import type { Capture } from "@/lib/quantum/capture";
import type { WaveData } from "@/lib/quantum/capture";
import { Studio } from "./studio";

// ── Main export ───────────────────────────────────────────────────────────────
export function StudioWithBackend() {
  const {
    status,
    detail,
    sessionId,
    capture: liveCapture,
    wave: liveWave,
    controls,
  } = useBackend();

  const lastCaptureRef = useRef<Capture | null>(null);
  const lastWaveRef = useRef<WaveData | null>(null);

  // Push live capture into Studio via event bus
  useEffect(() => {
    if (!liveCapture) return;
    if (liveCapture === lastCaptureRef.current) return;
    lastCaptureRef.current = liveCapture;
    window.dispatchEvent(new CustomEvent("quantumrisc:capture", { detail: liveCapture }));
  }, [liveCapture]);

  // Push waveform data into Studio via event bus
  useEffect(() => {
    if (!liveWave) return;
    if ((liveWave as WaveData) === lastWaveRef.current) return;
    lastWaveRef.current = liveWave as WaveData;
    window.dispatchEvent(new CustomEvent("quantumrisc:wave", { detail: liveWave }));
  }, [liveWave]);

  // Push backend status into Studio topbar via event bus
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("quantumrisc:backend-status", {
        detail: { status, detail, sessionId },
      }),
    );
  }, [status, detail, sessionId]);

  // Push backend controls into Studio topbar via event bus
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("quantumrisc:backend-controls", { detail: controls }));
  }, [controls]);

  // Render Studio directly — it owns the full chrome in the new UI design
  return <Studio />;
}
