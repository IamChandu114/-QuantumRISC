import { z } from 'zod';

export const stages = ['IF', 'ID', 'EX', 'MEM', 'WB'] as const;
const instruction = z.object({ pc: z.string(), instruction: z.string(), stalled: z.boolean().optional(), flushed: z.boolean().optional() });
const event = z.object({ type: z.string(), description: z.string(), register: z.string().optional(), pc: z.string().optional(), signal: z.string().optional(), resolution: z.string().optional() });
const cycle = z.object({
  cycle: z.number().int().nonnegative(),
  pipeline: z.record(z.enum(stages), instruction.nullable()).optional(),
  registers: z.record(z.union([z.string(), z.number()])).optional(),
  memory: z.record(z.union([z.string(), z.number()])).optional(),
  events: z.array(event).optional(),
  signals: z.record(z.string()).optional(),
  cache: z.array(z.object({ set: z.number(), way: z.number(), tag: z.string(), valid: z.boolean(), data: z.string().optional() })).optional(),
});
export const captureSchema = z.object({
  name: z.string().min(1), processor: z.string().optional(), testbench: z.string().optional(), rtlVersion: z.string().optional(), timestamp: z.string().optional(),
  cycles: z.array(cycle).min(1).max(100000),
  performance: z.record(z.number()).optional(),
  verification: z.array(z.object({ name: z.string(), status: z.enum(['passed', 'failed', 'unavailable']), cycle: z.number().optional(), description: z.string().optional() })).optional(),
  rtl: z.array(z.object({ module: z.string(), file: z.string().optional(), source: z.string().optional(), signals: z.array(z.string()).optional() })).optional(),
});
export type Capture = z.infer<typeof captureSchema>;
export type Cycle = z.infer<typeof cycle>;
export type ExecutionEvent = z.infer<typeof event>;
export type SelectedObject = { kind: 'cycle' | 'instruction' | 'register' | 'memory' | 'signal' | 'event'; name: string; value?: string | undefined; pc?: string | undefined };
export const abi = ['zero', 'ra', 'sp', 'gp', 'tp', 't0', 't1', 't2', 's0', 's1', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 't3', 't4', 't5', 't6'];
export function parseCapture(text: string): Capture {
  const data = captureSchema.parse(JSON.parse(text));
  const sorted = [...data.cycles].sort((a,b) => a.cycle-b.cycle);
  if (new Set(sorted.map(c => c.cycle)).size !== sorted.length) throw new Error('Duplicate cycle numbers. Each captured cycle must be unique.');
  return { ...data, cycles: sorted };
}
export function formatHex(value: string | number | undefined) {
  if (value === undefined) return '—';
  try { return '0x' + BigInt(value).toString(16).padStart(8, '0'); } catch { return String(value); }
}
export type WaveSignal = { name: string; width: number; transitions: { time: number; value: string }[] };
export type WaveData = { signals: WaveSignal[]; timescale: string; maxTime: number };
// Conservative VCD reader: scalar and binary values only. Unknown/real/string records are not invented.
export function parseVcd(text: string): WaveData {
  const signals: WaveSignal[] = []; const codes = new Map<string, WaveSignal[]>(); const scope: string[] = [];
  let time = 0; let maxTime = 0; let timescale = 'unspecified';
  const scale = text.match(/\$timescale\s+([\s\S]*?)\$end/); if (scale?.[1]) timescale = scale[1].trim().replace(/\s+/g, ' ');
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (line.startsWith('$scope')) scope.push(line.split(/\s+/)[2] ?? '');
    else if (line.startsWith('$upscope')) scope.pop();
    else if (line.startsWith('$var')) {
      const [, kind, width, code, name] = line.split(/\s+/); if (!code || !name) continue; const signal: WaveSignal = { name: [...scope,name].join('.'), width: Number(width), transitions: [] };
      if (kind === 'real' || !Number.isFinite(signal.width)) continue;
      signals.push(signal); codes.set(code, [...(codes.get(code) ?? []), signal]);
    } else if (/^#\d+$/.test(line)) { time = Number(line.slice(1)); maxTime = Math.max(time,maxTime); }
    else {
      const binary = line.match(/^b([01xz]+)\s+(\S+)$/i); const scalar = line.match(/^([01xz])(\S+)$/i);
      const match = binary ?? scalar;
      const value = match?.[1]; const id = match?.[2]; if (value && id) for (const signal of codes.get(id) ?? []) signal.transitions.push({ time, value });
    }
  }
  if (!signals.length) throw new Error('No supported scalar or binary signals found in this VCD.');
  return { signals, timescale, maxTime };
}
export function downloadFile(name: string, text: string, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
