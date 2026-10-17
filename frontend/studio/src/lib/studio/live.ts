export type LiveRegister = {
  index: number;
  name?: string;
  abi?: string;
  value?: string | number;
  written_at_cycle?: number;
  is_written_this_cycle?: boolean;
};

export type LiveTimelineSample = {
  time?: number;
  changed?: Record<string, string>;
};

export type LiveWaveforms = {
  timeline?: LiveTimelineSample[];
  signals?: string[];
  cursor?: number;
  current?: Record<string, string>;
};

export type LiveHazard = {
  kind?: string;
  type?: string;
  cycle?: number;
  producer_pc?: string | number;
  consumer_pc?: string | number;
  producer?: string;
  consumer?: string;
  path?: string;
  resolution?: string;
  resolved?: string;
  register?: number;
  producer_rd?: number;
  penalty?: number;
};

export function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
    if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) {
      const hex = Number.parseInt(trimmed, 16);
      if (Number.isFinite(hex)) return hex;
    }
  }
  return fallback;
}

export function asText(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;
  const stringified = String(value).trim();
  return stringified.length ? stringified : fallback;
}

export function formatHex(value: unknown, pad = 8): string {
  const numeric = asNumber(value, 0) >>> 0;
  return `0x${numeric.toString(16).toUpperCase().padStart(pad, "0")}`;
}

export function formatBinary(value: unknown, pad = 32): string {
  const numeric = asNumber(value, 0) >>> 0;
  const raw = numeric.toString(2).padStart(pad, "0");
  return raw.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function formatRate(value: unknown, digits = 2): string {
  const numeric = asNumber(value, 0);
  return numeric.toFixed(digits);
}

/**
 * Return the live cycle number for display in the Forge workstation header.
 * Priority:
 *   1. metrics.cycles  — authoritative cycle count from backend analysis
 *   2. playback.cursor — step cursor (0 after reset, not the real cycle count)
 */
export function currentCycle(
  playback: Record<string, unknown> | null | undefined,
  metrics: Record<string, unknown> | null | undefined,
): number {
  const fromCursor = asNumber(playback?.["cursor"] ?? playback?.["cycle"], -1);
  if (fromCursor >= 0) return fromCursor;
  const fromMetrics = asNumber(metrics?.["cycles"], -1);
  if (fromMetrics > 0) return fromMetrics;
  return 0;
}

export function currentStatusLabel(
  status: string,
  connected: boolean,
  transportState?: string,
): string {
  if (transportState === "connected" && connected) return "connected";
  if (transportState === "reconnecting") return "reconnecting to backend";
  if (transportState === "backend-unavailable") return "backend unavailable";
  if (transportState === "websocket-failed") return "websocket failed";
  if (transportState === "connecting") return "connecting to backend";
  if (transportState === "closed") return "session closed";
  if (!connected) return "connecting to backend";
  if (status === "created" || status === "connecting") return "waiting for compilation";
  if (status === "compiled") return "compiled, awaiting run";
  if (status === "running") return "running live";
  if (status === "finished") return "simulation complete";
  if (status === "paused") return "paused";
  return status.replace(/_/g, " ");
}

export function normalizeRegisters(registers: unknown): LiveRegister[] {
  if (!Array.isArray(registers))
    return Array.from({ length: 32 }, (_, index) => ({ index, value: 0 }));
  return Array.from({ length: 32 }, (_, index) => {
    const row = registers[index] as LiveRegister | null | undefined;
    return {
      index,
      name: row?.name ?? `x${index}`,
      abi: row?.abi ?? "",
      value: row?.value ?? 0,
      written_at_cycle: asNumber(row?.written_at_cycle, -1),
      is_written_this_cycle: Boolean(row?.is_written_this_cycle),
    };
  });
}

export function normalizeMemoryWords(
  memory: Record<string, unknown> | null | undefined,
): Array<{ address: number; value: number }> {
  const words = memory?.["words"];
  if (!Array.isArray(words)) return [];
  return words
    .map((word: unknown) => {
      const w = word as Record<string, unknown>;
      return {
        address: asNumber(w?.["address"], 0),
        value: asNumber(w?.["value"], 0),
      };
    })
    .filter((word) => Number.isFinite(word.address) && Number.isFinite(word.value));
}

export function normalizeSignals(
  waveforms: Record<string, unknown> | null | undefined,
  architecture: Record<string, unknown> | null | undefined,
): string[] {
  const candidates = [
    ...(Array.isArray(waveforms?.["signals"]) ? (waveforms?.["signals"] as string[]) : []),
    ...(Array.isArray(architecture?.["signals"]) ? (architecture?.["signals"] as string[]) : []),
  ];
  return Array.from(
    new Set(candidates.filter((name) => typeof name === "string" && name.length > 0)),
  ).sort();
}

export function timelineSamples(
  waveforms: Record<string, unknown> | null | undefined,
): LiveTimelineSample[] {
  return Array.isArray(waveforms?.["timeline"])
    ? (waveforms?.["timeline"] as LiveTimelineSample[])
    : [];
}

export function historyWindow<T>(samples: T[], count: number): T[] {
  if (samples.length <= count) return samples;
  return samples.slice(samples.length - count);
}

export function sampleField(sample: LiveTimelineSample | null | undefined, field: string): string {
  const changed = sample?.changed ?? {};
  return asText(changed[field], "—");
}

export function programEvent(
  sample: LiveTimelineSample | null | undefined,
): { pc: number; instr: number; cycle: number } | null {
  if (!sample) return null;
  const changed = sample.changed ?? {};
  const pc = asNumber(
    changed["pipeline_cpu_complete_tb.DUT.PC.pc_current [31:0]"] ??
      changed["cpu_top_tb.dut.pc_debug [31:0]"] ??
      changed["pc"],
    NaN,
  );
  const instr = asNumber(
    changed["pipeline_cpu_complete_tb.DUT.if_instruction [31:0]"] ??
      changed["cpu_top_tb.dut.instruction_debug [31:0]"] ??
      changed["cpu_top_tb.dut.instruction [31:0]"] ??
      changed["instruction"],
    NaN,
  );
  if (!Number.isFinite(pc) || !Number.isFinite(instr)) return null;
  return { pc, instr, cycle: asNumber(sample.time, 0) };
}

/**
 * Build program execution history from VCD timeline samples.
 */
export function derivedProgramHistory(
  samples: LiveTimelineSample[],
  limit = 96,
): Array<{ cycle: number; pc: number; instr: number }> {
  const events: Array<{ cycle: number; pc: number; instr: number }> = [];
  const seenCycles = new Set<number>();
  for (const sample of samples) {
    const evt = programEvent(sample);
    if (!evt) continue;
    if (seenCycles.has(evt.cycle)) continue;
    seenCycles.add(evt.cycle);
    events.push(evt);
  }
  return events.slice(-limit);
}

export function registerHistory(
  samples: LiveTimelineSample[],
): Map<number, Array<{ cycle: number; value: number }>> {
  const history = new Map<number, Array<{ cycle: number; value: number }>>();
  for (const sample of samples) {
    const changed = sample.changed ?? {};
    const rd = asNumber(
      changed["pipeline_cpu_complete_tb.DUT.RF.rd [4:0]"] ?? changed["cpu_top_tb.dut.rd [4:0]"],
      -1,
    );
    const writeback = asNumber(
      changed["pipeline_cpu_complete_tb.DUT.RF.write_data [31:0]"] ??
        changed["cpu_top_tb.dut.alu_result [31:0]"],
      NaN,
    );
    if (rd < 0 || rd >= 32 || !Number.isFinite(writeback)) continue;
    const bucket = history.get(rd) ?? [];
    bucket.push({ cycle: asNumber(sample.time, 0), value: writeback >>> 0 });
    history.set(rd, bucket);
  }
  return history;
}

export function hazardLabel(kind?: string, type?: string): string {
  return asText(kind ?? type, "Unknown");
}

export function sortRecent<T extends { cycle?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => asNumber(b.cycle, 0) - asNumber(a.cycle, 0));
}
