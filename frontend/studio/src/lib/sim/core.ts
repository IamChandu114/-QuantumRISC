// Presentation-only types retained for the uploaded Studio components.
// Runtime hardware state is supplied exclusively by the FastAPI snapshot.
export const STAGES = ["IF", "ID", "EX", "MEM", "WB"] as const;
export type StageName = (typeof STAGES)[number];

export type Cache = {
  config: { name: string; sizeBytes: number; ways: number; lineBytes: number; policy: string; missPenalty: number };
  stats: { accesses: number; hits: number; misses: number; evictions: number; writeBacks: number };
  sets: number;
  hitRate: number;
  recent: Array<{ addr: number; hit: boolean }>;
  lines: Array<Array<{ valid: boolean; dirty: boolean; tag: number }>>;
};

export type HazardKind = "RAW-forward" | "RAW-stall" | "WAR" | "WAW" | "structural" | "control";
// The backend determines verification results; the ZIP page sees an empty
// presentation list until the backend supplies a corresponding result.
export const ASSERTIONS: Array<{ id: string; name: string; description: string; check: (state: unknown) => boolean }> = [];
