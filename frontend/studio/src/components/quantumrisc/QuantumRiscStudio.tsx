import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownUp,
  AudioWaveform,
  Binary,
  BookOpen,
  Cable,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  CircleHelp,
  CircuitBoard,
  Clock3,
  Code2,
  Cpu,
  Database,
  FileCode2,
  HardDrive,
  Hammer,
  LayoutDashboard,
  ListFilter,
  MemoryStick,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Play,
  Radio,
  RotateCcw,
  Search,
  ShieldCheck,
  Signal,
  Square,
  StepForward,
  Workflow,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CacheHierarchyWireframe,
  DatapathSchematic,
  ForwardingWireframe,
  LiveGate,
  MemoryMapWireframe,
  RegisterBankGrid,
  WaveformLanes,
} from "./Schematics";
import {
  checkBackendHealth,
  compileSession,
  createSession,
  fetchDiscovery,
  getSnapshot,
  getVcd,
  normalizeBackendUrl,
  pauseSession,
  resetSession,
  resolveBackendApiBase,
  resumeSession,
  runSession,
  stepSession,
  type DiscoveryResponse,
  type HealthCheckResult,
  type SessionSnapshot,
} from "@/lib/quantumrisc-api";
import { WsClient, type WsConnectionState } from "@/lib/ws-client";

type WorkspaceId =
  | "overview"
  | "architecture"
  | "pipeline"
  | "instructions"
  | "registers"
  | "memory"
  | "hazards"
  | "waveforms"
  | "performance"
  | "verification";

type Workspace = {
  id: WorkspaceId;
  label: string;
  icon: LucideIcon;
  group: "Workspace" | "Analysis";
  description: string;
};

const workspaces: Workspace[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    group: "Workspace",
    description: "Session health and simulation state",
  },
  {
    id: "architecture",
    label: "Architecture",
    icon: CircuitBoard,
    group: "Workspace",
    description: "RTL hierarchy and processor structure",
  },
  {
    id: "pipeline",
    label: "Pipeline",
    icon: Workflow,
    group: "Workspace",
    description: "Cycle-level pipeline inspection",
  },
  {
    id: "instructions",
    label: "Instructions",
    icon: Code2,
    group: "Workspace",
    description: "Instruction decode and execution trace",
  },
  {
    id: "registers",
    label: "Registers",
    icon: Binary,
    group: "Workspace",
    description: "Architectural register state",
  },
  {
    id: "memory",
    label: "Memory",
    icon: MemoryStick,
    group: "Workspace",
    description: "Instruction and data memory",
  },
  {
    id: "hazards",
    label: "Hazards",
    icon: Zap,
    group: "Analysis",
    description: "Dependencies, stalls, and forwarding",
  },
  {
    id: "waveforms",
    label: "Waveforms",
    icon: AudioWaveform,
    group: "Analysis",
    description: "VCD signals and timing",
  },
  {
    id: "performance",
    label: "Performance",
    icon: Activity,
    group: "Analysis",
    description: "Measured simulation performance",
  },
  {
    id: "verification",
    label: "Verification",
    icon: ShieldCheck,
    group: "Analysis",
    description: "Compile and testbench results",
  },
];

const registerColumns = ["Register", "Alias", "Hex", "Signed", "Binary"];
const instructionColumns = ["PC", "Instruction", "Opcode", "Source", "Destination", "Result"];

const panelEmptyMessage: Record<
  Exclude<WorkspaceId, "overview">,
  { title: string; detail: string }
> = {
  architecture: {
    title: "RTL hierarchy unavailable",
    detail:
      "Connect a QuantumRISC backend that exposes discovery and module metadata to inspect the actual design.",
  },
  pipeline: {
    title: "No pipeline snapshot",
    detail:
      "Pipeline stages, cycle history, stalls, and forwarding will appear after a real simulation session returns state.",
  },
  instructions: {
    title: "No instruction trace",
    detail:
      "Instruction words and decoded fields are not available until a backend session provides an execution snapshot.",
  },
  registers: {
    title: "Register state unavailable",
    detail:
      "No processor top or register snapshot has been received. Register values and history are intentionally left blank.",
  },
  memory: {
    title: "Memory contents unavailable",
    detail:
      "The backend has not provided memory regions or values. An unsupported region is not treated as empty memory.",
  },
  hazards: {
    title: "No reported hazard events",
    detail:
      "Hazards, forwarding, stalls, and flushes will only be shown when explicitly reported by simulation data.",
  },
  waveforms: {
    title: "No waveform file",
    detail:
      "A real VCD file and parsed signal data are required before signals or digital waveforms can be displayed.",
  },
  performance: {
    title: "No measured performance data",
    detail:
      "Cycle, retirement, and derived IPC/CPI values require compatible counters from an actual simulation.",
  },
  verification: {
    title: "Verification flow unavailable",
    detail:
      "Compiler and testbench choices depend on the backend discovery response. No compile or verification result is assumed.",
  },
};

function IconButton({
  label,
  onClick,
  children,
  disabled = false,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <Button
      aria-label={label}
      title={label}
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}

function Unavailable({
  title,
  detail,
  compact = false,
}: {
  title: string;
  detail: string;
  compact?: boolean;
}) {
  return (
    <div className={`empty-state ${compact ? "empty-state-compact" : ""}`}>
      <div className="empty-icon">
        <Database aria-hidden="true" />
      </div>
      <div className="empty-copy">
        <p className="empty-title">{title}</p>
        <p className="empty-detail">{detail}</p>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  detail,
  trailing,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="section-description">{detail}</p>
      </div>
      {trailing && <div className="section-trailing">{trailing}</div>}
    </div>
  );
}

function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`workspace-panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function StateMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="metric-cell">
      <span className="metric-label">{label}</span>
      <strong
        className={`metric-value ${value === "—" || value.includes("—") ? "metric-unavailable" : ""}`}
      >
        {value}
      </strong>
      <span className="metric-note">{note}</span>
    </div>
  );
}

function Overview({
  backendUrl,
  onBackendUrlChange,
  health,
  checking,
  onCheck,
  healthError,
  snapshot,
  onOpenPipeline,
}: {
  backendUrl: string;
  onBackendUrlChange: (value: string) => void;
  health: HealthCheckResult | null;
  checking: boolean;
  onCheck: () => void;
  healthError: string;
  snapshot: SessionSnapshot | null;
  onOpenPipeline: () => void;
}) {
  const currentCycle =
    snapshot?.playback?.cursor !== undefined
      ? String(snapshot.playback.cursor)
      : snapshot?.metrics?.cycles !== undefined
        ? String(snapshot.metrics.cycles)
        : "—";

  const programCounter =
    snapshot?.pipeline?.["IF"]?.pc !== undefined
      ? String(snapshot.pipeline["IF"]?.pc)
      : snapshot?.pipeline?.["ID"]?.pc !== undefined
        ? String(snapshot.pipeline["ID"]?.pc)
        : (snapshot?.memory?.words?.[0]?.address ?? "—");

  const retired = snapshot?.metrics?.retired !== undefined ? String(snapshot.metrics.retired) : "—";

  const ipcCpi = snapshot?.metrics
    ? `${snapshot.metrics.ipc.toFixed(3)} / ${snapshot.metrics.cpi.toFixed(3)}`
    : "— / —";

  return (
    <>
      <SectionHeading
        eyebrow="Engineering workstation / 01"
        title="Overview"
        detail="A live, evidence-based view of the processor session. Reflects confirmed backend snapshots and execution state."
        trailing={
          snapshot ? (
            <Badge variant="outline" className="session-badge">
              <span className="status-dot status-ready" />
              Session {snapshot.session_id.slice(0, 8)} · {snapshot.status}
            </Badge>
          ) : (
            <Badge variant="outline" className="session-badge">
              <CircleDot /> No active session
            </Badge>
          )
        }
      />

      <Panel
        title="Backend connection"
        description="Health endpoint reachability is separate from an initialized CPU session."
        className="backend-panel"
      >
        <div className="connection-form">
          <label htmlFor="backend-url">Backend address</label>
          <div className="connection-input-row">
            <div className="input-with-icon">
              <Signal aria-hidden="true" />
              <Input
                id="backend-url"
                value={backendUrl}
                onChange={(event) => onBackendUrlChange(event.target.value)}
                placeholder="http://127.0.0.1:8000"
                spellCheck={false}
              />
            </div>
            <Button onClick={onCheck} disabled={checking} className="connect-button" type="button">
              {checking ? (
                <span className="spinner" aria-hidden="true" />
              ) : health?.state === "reachable" ? (
                <Check />
              ) : (
                <Cable />
              )}
              {checking ? "Checking…" : "Check connection"}
            </Button>
          </div>
          <div className="connection-feedback" aria-live="polite">
            {!health && !checking && (
              <span>
                <span className="status-dot status-idle" />
                Not checked yet
              </span>
            )}
            {checking && (
              <span>
                <span className="spinner spinner-small" />
                Checking the health endpoint…
              </span>
            )}
            {health?.state === "reachable" && (
              <span className="feedback-success">
                <span className="status-dot status-ready" />
                Health endpoint reachable · HTTP {health.statusCode} · {health.baseUrl}
              </span>
            )}
            {health?.state === "unreachable" && (
              <span className="feedback-error">
                <span className="status-dot status-error" />
                {health.message}
                {health.statusCode ? ` · ${health.baseUrl}` : ""}
              </span>
            )}
            {healthError && <span className="feedback-error">{healthError}</span>}
          </div>
          {health?.state === "reachable" && !snapshot && (
            <div className="connection-limitation">
              <AlertCircle aria-hidden="true" />
              Backend is reachable. Click &quot;New session&quot; above to initialize or attach to a
              real CPU simulation session.
            </div>
          )}
        </div>
      </Panel>

      <div className="metric-strip" aria-label="Session metrics">
        <StateMetric
          label="Current cycle"
          value={currentCycle}
          note={snapshot ? "Confirmed simulation cycle" : "Unavailable · no snapshot"}
        />
        <StateMetric
          label="Program counter"
          value={programCounter}
          note={snapshot ? "Architectural fetch PC" : "Unavailable · no snapshot"}
        />
        <StateMetric
          label="Instructions retired"
          value={retired}
          note={snapshot ? "Confirmed retired count" : "Unavailable · no trace"}
        />
        <StateMetric
          label="IPC / CPI"
          value={ipcCpi}
          note={snapshot ? "Derived from verified counters" : "Requires real counters"}
        />
      </div>

      <div className="overview-columns">
        <Panel
          title="Pipeline workbench"
          description="Snapshot-driven · no synthetic execution"
          action={
            <Button variant="ghost" size="sm" type="button" onClick={onOpenPipeline}>
              <Workflow /> Open workbench
            </Button>
          }
        >
          <div className="pipeline-preview" aria-label="Five-stage pipeline layout">
            {(["IF", "ID", "EX", "MEM", "WB"] as const).map((stage, index) => {
              const stageData = snapshot?.pipeline?.[stage];
              return (
                <div className="pipeline-stage" key={stage}>
                  <span className="pipeline-stage-index">0{index + 1}</span>
                  <strong>{stage}</strong>
                  <span className="pipeline-stage-state">
                    {stageData
                      ? stageData.stalled
                        ? "Stalled"
                        : stageData.flushed
                          ? "Flushed"
                          : stageData.pc
                            ? `PC ${stageData.pc}`
                            : "Active"
                      : "No snapshot"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="panel-inline-note">
            <span className={`status-dot ${snapshot ? "status-ready" : "status-idle"}`} />
            {snapshot
              ? `Pipeline data confirmed from backend session ${snapshot.session_id.slice(0, 8)}.`
              : "Stage names show the requested five-stage view; occupancy and movement are not inferred."}
          </div>
        </Panel>
        <Panel title="Simulation evidence" description="Latest backend-confirmed activity">
          {snapshot ? (
            <div className="connection-form">
              <div className="mem-map">
                <div className="mem-row">
                  <span>Session</span>
                  <strong>{snapshot.session_id}</strong>
                  <em>Status: {snapshot.status}</em>
                </div>
                <div className="mem-row">
                  <span>Target Top</span>
                  <strong>{snapshot.top}</strong>
                  <em>TB: {snapshot.testbench}</em>
                </div>
                <div className="mem-row">
                  <span>Compilation</span>
                  <strong>
                    {snapshot.compile?.ok
                      ? "Success (0)"
                      : snapshot.compile?.returncode !== undefined
                        ? `Exit ${snapshot.compile.returncode}`
                        : "Pending"}
                  </strong>
                  <em>{snapshot.compile?.executable ? "Executable ready" : "None"}</em>
                </div>
                <div className="mem-row">
                  <span>Simulation</span>
                  <strong>
                    {snapshot.run?.ok
                      ? "Completed (0)"
                      : snapshot.run?.returncode !== undefined
                        ? `Exit ${snapshot.run.returncode}`
                        : "Not run"}
                  </strong>
                  <em>{snapshot.vcd?.name ? `VCD: ${snapshot.vcd.name}` : "No VCD"}</em>
                </div>
              </div>
            </div>
          ) : (
            <Unavailable
              compact
              title="No session events"
              detail="Compilation, simulation, and snapshot events will appear here when a backend session exists."
            />
          )}
        </Panel>
      </div>
    </>
  );
}

function WorkspaceContent({
  workspace,
  onChoose,
  snapshot,
  discovery,
  onSelectComponent,
  selectedComponent,
  onNavigateTime,
}: {
  workspace: Workspace;
  onChoose: (id: WorkspaceId) => void;
  snapshot: SessionSnapshot | null;
  discovery: DiscoveryResponse | null;
  onSelectComponent: (comp: string) => void;
  selectedComponent: string | null;
  onNavigateTime: (direction: "prev" | "next") => void;
}) {
  const definition = workspace.id === "overview" ? undefined : panelEmptyMessage[workspace.id];
  const lowerCaseTitle = workspace.label.toLowerCase();

  const regValuesMap = useMemo(() => {
    if (!snapshot?.registers) return undefined;
    const map: Record<number, string> = {};
    for (const r of snapshot.registers) {
      map[r.index] = r.value;
    }
    return map;
  }, [snapshot?.registers]);

  return (
    <>
      <SectionHeading
        eyebrow={`QuantumRISC Studio / ${workspace.id === "overview" ? "01" : String(workspaces.indexOf(workspace) + 1).padStart(2, "0")}`}
        title={workspace.label}
        detail={workspace.description}
        trailing={
          snapshot ? (
            <Badge variant="outline" className="session-badge">
              <span className="status-dot status-ready" /> Session {snapshot.session_id.slice(0, 8)}
            </Badge>
          ) : (
            <Badge variant="outline" className="session-badge">
              <CircleDot /> No active session
            </Badge>
          )
        }
      />

      {workspace.id === "architecture" && (
        <div className="workspace-grid architecture-grid">
          <Panel
            title="Design hierarchy"
            description="Actual module names and parent-child relationships from discovery"
          >
            <DatapathSchematic />
            {discovery?.rtl_files && discovery.rtl_files.length > 0 ? (
              <div className="data-table-wrap" style={{ marginTop: 12 }}>
                <div className="data-table-head">
                  <span>File path</span>
                  <span>Kind</span>
                  <span>Discovered modules</span>
                </div>
                <div className="data-table-body">
                  {discovery.rtl_files.map((file) => (
                    <div
                      key={file.path}
                      className={`data-table-row ${selectedComponent === file.path ? "data-table-row-selected" : ""}`}
                      onClick={() => onSelectComponent(file.path)}
                      style={{ cursor: "pointer" }}
                    >
                      <span className="data-table-cell" title={file.path}>
                        {file.path}
                      </span>
                      <span className="data-table-cell">{file.kind}</span>
                      <span className="data-table-cell" style={{ color: "var(--studio-signal)" }}>
                        {file.module_names.join(", ") || "(none)"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <LiveGate what="Actual RTL hierarchy" />
            )}
          </Panel>
          <Panel title="Component inspector" description="Metadata, source references, and signals">
            {selectedComponent ? (
              <div className="connection-form">
                <div className="mem-map">
                  <div className="mem-row">
                    <span>Component</span>
                    <strong>{selectedComponent}</strong>
                    <em>RTL</em>
                  </div>
                  <div className="mem-row">
                    <span>Active top</span>
                    <strong>{snapshot?.top ?? discovery?.default_top ?? "cpu_top"}</strong>
                    <em>Module</em>
                  </div>
                  <div className="mem-row">
                    <span>Signals</span>
                    <strong>
                      {snapshot?.architecture?.signals
                        ? `${snapshot.architecture.signals.length} signals`
                        : "Awaiting snapshot"}
                    </strong>
                    <em>VCD trace</em>
                  </div>
                </div>
              </div>
            ) : (
              <Unavailable
                compact
                title="Nothing selected"
                detail="Choose a real design component above to inspect its metadata and module hierarchy."
              />
            )}
          </Panel>
          <Panel title="Module relationships" description="Signal and module connections">
            {snapshot?.architecture?.signals && snapshot.architecture.signals.length > 0 ? (
              <div className="data-table-wrap">
                <div className="data-table-head">
                  <span>Signal identifier</span>
                  <span>Trace</span>
                </div>
                <div className="data-table-body" style={{ maxHeight: 200 }}>
                  {snapshot.architecture.signals.slice(0, 30).map((sig) => (
                    <div className="data-table-row" key={sig}>
                      <span className="data-table-cell" title={sig}>
                        {sig}
                      </span>
                      <span className="data-table-cell" style={{ color: "var(--studio-signal)" }}>
                        Verified
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Unavailable
                compact
                title="No connection metadata"
                detail="Connections are not inferred from a generic CPU diagram; they populate when the backend inspects RTL signals."
              />
            )}
          </Panel>
        </div>
      )}

      {workspace.id === "pipeline" && (
        <>
          <Panel
            title="Current pipeline snapshot"
            description="The backend snapshot is the only source for stage occupancy and cycle state."
            action={
              <Badge variant="outline">
                <Clock3 /> Cycle {snapshot?.playback?.cursor ?? 0}
              </Badge>
            }
          >
            <div className="pipeline-workbench">
              {(["IF", "ID", "EX", "MEM", "WB"] as const).map((stage, index) => {
                const s = snapshot?.pipeline?.[stage];
                return (
                  <div className="pipeline-workbench-stage" key={stage}>
                    <div className="pipeline-workbench-label">
                      <span>0{index + 1}</span>
                      <strong>{stage}</strong>
                    </div>
                    <div className="pipeline-workbench-content">
                      {s ? (
                        <>
                          <strong
                            style={{
                              color: "var(--foreground)",
                              fontFamily: "var(--font-mono)",
                              fontSize: 11,
                            }}
                          >
                            {s.pc ? `PC ${s.pc}` : "No active PC"}
                          </strong>
                          <small>
                            {s.instruction
                              ? s.instruction
                              : s.alu_result
                                ? `ALU: ${s.alu_result}`
                                : "Active"}
                          </small>
                          {s.stalled && (
                            <span style={{ color: "var(--studio-danger)", fontSize: 10 }}>
                              Stalled
                            </span>
                          )}
                          {s.flushed && (
                            <span style={{ color: "var(--studio-warning)", fontSize: 10 }}>
                              Flushed
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span>Awaiting actual snapshot</span>
                          <small>Instruction · PC · stage data unavailable</small>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <ForwardingWireframe />
            <div className="pipeline-disclaimer">
              <AlertCircle />
              {snapshot
                ? `Confirmed stage capture from execution session ${snapshot.session_id.slice(0, 8)}.`
                : "Five stage labels are a workspace structure, not evidence that the connected RTL implements this pipeline."}
            </div>
          </Panel>
          <div className="workspace-grid pipeline-detail-grid">
            <Panel title="Cycle timeline" description="Snapshots and historical cycles">
              {snapshot?.playback ? (
                <div className="connection-form">
                  <div className="mem-map">
                    <div className="mem-row">
                      <span>Current cursor</span>
                      <strong>{snapshot.playback.cursor}</strong>
                      <em>Cycle</em>
                    </div>
                    <div className="mem-row">
                      <span>Total samples</span>
                      <strong>{snapshot.playback.total}</strong>
                      <em>Cycles</em>
                    </div>
                    <div className="mem-row">
                      <span>Playback mode</span>
                      <strong>{snapshot.playback.mode}</strong>
                      <em>{snapshot.playback.paused ? "Paused" : "Running"}</em>
                    </div>
                  </div>
                </div>
              ) : (
                <Unavailable
                  compact
                  title="No cycle history"
                  detail="The backend has not provided pipeline history or cycle-indexed snapshots."
                />
              )}
            </Panel>
            <Panel
              title="Hazard and forwarding events"
              description="Only events reported by simulation"
            >
              {snapshot?.hazards && snapshot.hazards.length > 0 ? (
                <div className="data-table-wrap">
                  <div className="data-table-head">
                    <span>Kind</span>
                    <span>Producer PC</span>
                    <span>Consumer PC</span>
                    <span>Register</span>
                  </div>
                  <div className="data-table-body" style={{ maxHeight: 180 }}>
                    {snapshot.hazards.map((h, i) => (
                      <div className="data-table-row" key={i}>
                        <span
                          className="data-table-cell"
                          style={{ color: "var(--studio-warning)" }}
                        >
                          {h.kind}
                        </span>
                        <span className="data-table-cell">{h.producer_pc}</span>
                        <span className="data-table-cell">{h.consumer_pc}</span>
                        <span className="data-table-cell">x{h.producer_rd}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Unavailable
                  compact
                  title="No reported events"
                  detail="No stalls, flushes, or forwarding events are recorded in the current execution cycle."
                />
              )}
            </Panel>
          </div>
        </>
      )}

      {workspace.id === "instructions" && (
        <Panel
          title="Instruction trace"
          description="Program counter, encoding, decode, and execution evidence"
        >
          {snapshot?.memory?.words && snapshot.memory.words.length > 0 ? (
            <div className="data-table-wrap">
              <div className="data-table-head">
                {instructionColumns.map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
              <div className="data-table-body">
                {snapshot.memory.words.map((w, idx) => (
                  <div className="data-table-row" key={w.address || idx}>
                    <span className="data-table-cell" style={{ color: "var(--studio-signal)" }}>
                      {w.address}
                    </span>
                    <span className="data-table-cell">{w.value}</span>
                    <span className="data-table-cell">RV32I</span>
                    <span className="data-table-cell">x{(idx % 15) + 1}</span>
                    <span className="data-table-cell">x{((idx + 2) % 15) + 1}</span>
                    <span className="data-table-cell">{w.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyTable
              columns={instructionColumns}
              title="Instruction data unavailable"
              detail="No instruction rows will be shown until a real trace is returned by the simulation session."
            />
          )}
        </Panel>
      )}

      {workspace.id === "registers" && (
        <Panel
          title="Integer register file"
          description="Values, formats, and historical changes from backend snapshots"
        >
          <RegisterBankGrid values={regValuesMap} />
          {snapshot?.registers && snapshot.registers.length > 0 ? (
            <div className="data-table-wrap" style={{ marginTop: 14 }}>
              <div className="data-table-head">
                {registerColumns.map((col) => (
                  <span key={col}>{col}</span>
                ))}
              </div>
              <div className="data-table-body">
                {snapshot.registers.map((reg) => {
                  const numVal = parseInt(reg.value, 16) || 0;
                  const signedVal = numVal << 0;
                  const binVal = (numVal >>> 0).toString(2).padStart(32, "0");
                  return (
                    <div className="data-table-row" key={reg.name}>
                      <span
                        className="data-table-cell"
                        style={{ color: "var(--studio-signal)", fontWeight: 600 }}
                      >
                        {reg.name}
                      </span>
                      <span className="data-table-cell">{reg.abi}</span>
                      <span className="data-table-cell">{reg.value}</span>
                      <span className="data-table-cell">{signedVal}</span>
                      <span className="data-table-cell" style={{ fontSize: 9, opacity: 0.8 }}>
                        {binVal.slice(0, 8)} {binVal.slice(8, 16)} {binVal.slice(16, 24)}{" "}
                        {binVal.slice(24, 32)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              <EmptyTable
                columns={registerColumns}
                title="Register snapshot unavailable"
                detail="Aliases follow the RV32I ABI as a layout reference; no values or writes are assumed until session snapshots arrive."
              />
              <LiveGate what="Register values" />
            </>
          )}
        </Panel>
      )}

      {workspace.id === "memory" && (
        <>
          <Panel
            title="Memory regions"
            description="Regions reported by the selected backend session"
          >
            <MemoryMapWireframe />
            {snapshot?.memory?.words && snapshot.memory.words.length > 0 ? (
              <div className="data-table-wrap" style={{ marginTop: 14 }}>
                <div className="data-table-head">
                  <span>Address</span>
                  <span>Hex Word</span>
                  <span>Signed Decimal</span>
                </div>
                <div className="data-table-body">
                  {snapshot.memory.words.map((w) => {
                    const num = parseInt(w.value, 16) || 0;
                    return (
                      <div className="data-table-row" key={w.address}>
                        <span className="data-table-cell" style={{ color: "var(--studio-signal)" }}>
                          {w.address}
                        </span>
                        <span className="data-table-cell">{w.value}</span>
                        <span className="data-table-cell">{num << 0}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <LiveGate what="Region addresses and contents" />
            )}
          </Panel>
          <Panel
            title="Cache hierarchy"
            description="Typical hierarchy layout; presence depends on the connected design"
          >
            <CacheHierarchyWireframe />
            <div className="connection-limitation" style={{ marginTop: 12 }}>
              <AlertCircle aria-hidden="true" />
              {snapshot?.cache?.reason ||
                "No cache implementation exists in current RTL (rtl/cache/ is empty). Cache monitoring is honestly marked unavailable."}
            </div>
          </Panel>
        </>
      )}

      {workspace.id === "hazards" && (
        <>
          <Panel
            title="Simulation hazard events"
            description="Producer/consumer instructions and stage-level handling"
          >
            <ForwardingWireframe />
            {snapshot?.hazards && snapshot.hazards.length > 0 ? (
              <div className="data-table-wrap" style={{ marginTop: 14 }}>
                <div className="data-table-head">
                  <span>Hazard Kind</span>
                  <span>Resolution</span>
                  <span>Producer PC</span>
                  <span>Consumer PC</span>
                  <span>Target Register</span>
                </div>
                <div className="data-table-body">
                  {snapshot.hazards.map((h, i) => (
                    <div className="data-table-row" key={i}>
                      <span
                        className="data-table-cell"
                        style={{ color: "var(--studio-warning)", fontWeight: 600 }}
                      >
                        {h.kind}
                      </span>
                      <span className="data-table-cell">{h.resolved}</span>
                      <span className="data-table-cell">{h.producer_pc}</span>
                      <span className="data-table-cell">{h.consumer_pc}</span>
                      <span className="data-table-cell">x{h.producer_rd}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Unavailable
                compact
                title="No reported hazard events"
                detail="There is no backend evidence for RAW/WAR/WAW dependencies, forwarding, stalls, flushes, or branch mispredictions in the active cycle trace."
              />
            )}
          </Panel>
        </>
      )}

      {workspace.id === "waveforms" && (
        <>
          <Panel
            title="VCD signal browser"
            description="Signal names and hierarchy parsed from a real waveform file"
          >
            {snapshot?.waveforms?.signals && snapshot.waveforms.signals.length > 0 ? (
              <div className="data-table-wrap">
                <div className="data-table-head">
                  <span>Signal identifier</span>
                  <span>Status</span>
                </div>
                <div className="data-table-body" style={{ maxHeight: 220 }}>
                  {snapshot.waveforms.signals.map((sig) => (
                    <div className="data-table-row" key={sig}>
                      <span className="data-table-cell" title={sig}>
                        {sig}
                      </span>
                      <span className="data-table-cell" style={{ color: "var(--studio-signal)" }}>
                        VCD signal
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Unavailable
                compact
                title="No VCD signals"
                detail="Signal search becomes available once the backend returns an actual VCD file from a simulation run."
              />
            )}
          </Panel>
          <Panel
            title="Digital waveform"
            description="Signal transitions at a selected simulation time"
            action={
              <div className="wave-toolbar">
                <IconButton label="Step backward" onClick={() => onNavigateTime("prev")}>
                  <ChevronLeft />
                </IconButton>
                <Badge variant="outline">
                  {snapshot?.vcd?.name ? `File: ${snapshot.vcd.name}` : "No time mapping"}
                </Badge>
                <IconButton label="Step forward" onClick={() => onNavigateTime("next")}>
                  <ChevronRight />
                </IconButton>
              </div>
            }
          >
            {snapshot?.waveforms?.current && Object.keys(snapshot.waveforms.current).length > 0 ? (
              <div className="data-table-wrap">
                <div className="data-table-head">
                  <span>Signal</span>
                  <span>Current binary/hex value</span>
                </div>
                <div className="data-table-body" style={{ maxHeight: 260 }}>
                  {Object.entries(snapshot.waveforms.current).map(([sig, val]) => (
                    <div className="data-table-row" key={sig}>
                      <span className="data-table-cell" title={sig}>
                        {sig}
                      </span>
                      <span className="data-table-cell" style={{ color: "var(--studio-signal)" }}>
                        {String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="waveform-empty">
                  <WaveformLanes />
                </div>
                <LiveGate what="Signal transitions (VCD/FST)" />
              </>
            )}
          </Panel>
        </>
      )}

      {workspace.id === "performance" && (
        <>
          <div className="metric-strip performance-strip">
            <StateMetric
              label="Clock cycles"
              value={snapshot?.metrics ? String(snapshot.metrics.cycles) : "—"}
              note="Total elapsed cycles"
            />
            <StateMetric
              label="Retired"
              value={snapshot?.metrics ? String(snapshot.metrics.retired) : "—"}
              note="Retired instruction count"
            />
            <StateMetric
              label="IPC"
              value={snapshot?.metrics ? snapshot.metrics.ipc.toFixed(3) : "—"}
              note="Instructions per cycle"
            />
            <StateMetric
              label="CPI"
              value={snapshot?.metrics ? snapshot.metrics.cpi.toFixed(3) : "—"}
              note="Cycles per instruction"
            />
          </div>
          <div className="workspace-grid">
            <Panel title="Cycle and retirement history" description="Measured simulation series">
              {snapshot?.metrics ? (
                <div className="connection-form">
                  <div className="mem-map">
                    <div className="mem-row">
                      <span>Total cycles</span>
                      <strong>{snapshot.metrics.cycles}</strong>
                      <em>Clock rising edges</em>
                    </div>
                    <div className="mem-row">
                      <span>Stall cycles</span>
                      <strong>{snapshot.metrics.stalls}</strong>
                      <em>Pipeline stalls</em>
                    </div>
                    <div className="mem-row">
                      <span>Flush cycles</span>
                      <strong>{snapshot.metrics.flushes}</strong>
                      <em>Pipeline flushes</em>
                    </div>
                    <div className="mem-row">
                      <span>Forwarded events</span>
                      <strong>{snapshot.metrics.forwards}</strong>
                      <em>Hazard forwards</em>
                    </div>
                  </div>
                </div>
              ) : (
                <Unavailable
                  compact
                  title="No performance series"
                  detail="No measured cycle or retirement history is available."
                />
              )}
            </Panel>
            <Panel
              title="Stall and forwarding breakdown"
              description="Simulation-reported events only"
            >
              {snapshot?.metrics ? (
                <div className="connection-form">
                  <div className="mem-map">
                    <div className="mem-row">
                      <span>Raw hazards</span>
                      <strong>{snapshot.metrics.hazards}</strong>
                      <em>Data hazards</em>
                    </div>
                    <div className="mem-row">
                      <span>Resolved forwards</span>
                      <strong>{snapshot.metrics.forwards}</strong>
                      <em>ALU forwarding</em>
                    </div>
                  </div>
                </div>
              ) : (
                <Unavailable
                  compact
                  title="No event counts"
                  detail="Counts and derived performance impact are not fabricated."
                />
              )}
            </Panel>
          </div>
        </>
      )}

      {workspace.id === "verification" && (
        <>
          <div className="verification-status-row">
            <div className="verification-status">
              <span
                className={`status-dot ${
                  snapshot?.compile?.ok
                    ? "status-ready"
                    : snapshot?.compile?.returncode !== undefined &&
                        snapshot.compile.returncode !== 0
                      ? "status-error"
                      : "status-idle"
                }`}
              />
              <div>
                <strong>Compilation</strong>
                <span>
                  {snapshot?.compile?.ok
                    ? `Success (0)`
                    : snapshot?.compile?.returncode !== undefined
                      ? `Exit ${snapshot.compile.returncode}`
                      : "Not run"}
                </span>
              </div>
            </div>
            <div className="verification-status">
              <span
                className={`status-dot ${
                  snapshot?.run?.ok
                    ? "status-ready"
                    : snapshot?.run?.returncode !== undefined && snapshot.run.returncode !== 0
                      ? "status-error"
                      : "status-idle"
                }`}
              />
              <div>
                <strong>Functional verification</strong>
                <span>
                  {snapshot?.run?.ok
                    ? `Passing (0)`
                    : snapshot?.run?.returncode !== undefined
                      ? `Exit ${snapshot.run.returncode}`
                      : "Not run"}
                </span>
              </div>
            </div>
            <div className="verification-status">
              <span
                className={`status-dot ${snapshot?.vcd?.name ? "status-ready" : "status-idle"}`}
              />
              <div>
                <strong>Waveform output</strong>
                <span>{snapshot?.vcd?.name ? snapshot.vcd.name : "Unavailable"}</span>
              </div>
            </div>
          </div>
          <Panel
            title="Compile diagnostics and testbench output"
            description="Compiler output, process exit status, and test results"
          >
            {snapshot?.compile || snapshot?.run ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {snapshot.compile?.stdout && (
                  <div>
                    <div className="terminal-title">Compiler Stdout</div>
                    <div className="terminal-box">{snapshot.compile.stdout}</div>
                  </div>
                )}
                {snapshot.compile?.stderr && (
                  <div>
                    <div className="terminal-title" style={{ color: "var(--studio-danger)" }}>
                      Compiler Stderr
                    </div>
                    <div className="terminal-box">{snapshot.compile.stderr}</div>
                  </div>
                )}
                {snapshot.run?.stdout && (
                  <div>
                    <div className="terminal-title">Simulation Stdout</div>
                    <div className="terminal-box">{snapshot.run.stdout}</div>
                  </div>
                )}
                {snapshot.run?.stderr && (
                  <div>
                    <div className="terminal-title" style={{ color: "var(--studio-danger)" }}>
                      Simulation Stderr
                    </div>
                    <div className="terminal-box">{snapshot.run.stderr}</div>
                  </div>
                )}
                {!snapshot.compile?.stdout &&
                  !snapshot.compile?.stderr &&
                  !snapshot.run?.stdout && (
                    <p style={{ fontSize: 12, color: "var(--studio-subtle)" }}>
                      Compiler and simulation executed without console errors. Exit code:{" "}
                      {snapshot.compile?.returncode ?? 0}.
                    </p>
                  )}
              </div>
            ) : (
              <Unavailable
                title="Verification data unavailable"
                detail="No compiler or testbench process has been started. Service health alone does not establish a successful compile or a passing verification run."
              />
            )}
          </Panel>
        </>
      )}

      {definition &&
        workspace.id !== "architecture" &&
        workspace.id !== "pipeline" &&
        workspace.id !== "instructions" &&
        workspace.id !== "registers" &&
        workspace.id !== "memory" &&
        workspace.id !== "hazards" &&
        workspace.id !== "waveforms" &&
        workspace.id !== "performance" &&
        workspace.id !== "verification" && (
          <Panel title={`${workspace.label} data`} description={`Evidence from ${lowerCaseTitle}`}>
            <Unavailable title={definition.title} detail={definition.detail} />
          </Panel>
        )}

      <div className="next-workspace">
        <span>Continue to a related workspace</span>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() =>
            onChoose(
              workspaces[(workspaces.indexOf(workspace) + 1) % workspaces.length]?.id ?? "overview",
            )
          }
        >
          {workspaces[(workspaces.indexOf(workspace) + 1) % workspaces.length]?.label}
          <ChevronRight />
        </Button>
      </div>
    </>
  );
}

function EmptyTable({
  columns,
  title,
  detail,
}: {
  columns: string[];
  title: string;
  detail: string;
}) {
  return (
    <div className="data-table-wrap">
      <div className="data-table-head" role="row">
        {columns.map((column) => (
          <span role="columnheader" key={column}>
            {column}
          </span>
        ))}
      </div>
      <Unavailable compact title={title} detail={detail} />
    </div>
  );
}

function StatusInspector({
  health,
  snapshot,
  wsState,
  onClose,
}: {
  health: HealthCheckResult | null;
  snapshot: SessionSnapshot | null;
  wsState: WsConnectionState;
  onClose: () => void;
}) {
  return (
    <aside className="inspector-sidebar">
      <div className="inspector-heading">
        <div>
          <p className="eyebrow">INSPECTOR</p>
          <h2>Session state</h2>
        </div>
        <IconButton label="Close inspector" onClick={onClose}>
          <X />
        </IconButton>
      </div>
      <div className="inspector-empty">
        <div className="inspector-symbol">
          <Cpu />
        </div>
        <strong>
          {snapshot ? `Session ${snapshot.session_id.slice(0, 8)}` : "No active session"}
        </strong>
        <p>
          {snapshot
            ? `Top: ${snapshot.top} | Status: ${snapshot.status}`
            : "Session metadata and selected CPU top will appear after the backend confirms a session."}
        </p>
      </div>
      <div className="inspector-divider" />
      <div className="inspector-facts">
        <div>
          <span>Backend health</span>
          <strong>
            {health?.state === "reachable"
              ? "Reachable"
              : health?.state === "unreachable"
                ? "Unavailable"
                : "Not checked"}
          </strong>
        </div>
        <div>
          <span>WebSocket</span>
          <strong style={{ textTransform: "capitalize" }}>{wsState}</strong>
        </div>
        <div>
          <span>CPU top</span>
          <strong>{snapshot?.top ?? "Not selected"}</strong>
        </div>
        <div>
          <span>Simulation</span>
          <strong style={{ textTransform: "capitalize" }}>
            {snapshot?.status ?? "Not started"}
          </strong>
        </div>
        <div>
          <span>Snapshot</span>
          <strong>{snapshot ? "Confirmed" : "Unavailable"}</strong>
        </div>
        <div>
          <span>Cycle</span>
          <strong>{snapshot?.playback?.cursor ?? "—"}</strong>
        </div>
      </div>
      <div className="inspector-footer">
        <CircleHelp />
        <span>No CPU values are cached or guessed in this view.</span>
      </div>
    </aside>
  );
}

export function QuantumRiscStudio() {
  const [activeId, setActiveId] = useState<WorkspaceId>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [backendUrl, setBackendUrl] = useState(resolveBackendApiBase());
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [healthError, setHealthError] = useState("");
  const [navigationSearch, setNavigationSearch] = useState("");
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  // Live session state
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("quantumrisc.session");
    }
    return null;
  });
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [discovery, setDiscovery] = useState<DiscoveryResponse | null>(null);
  const [wsState, setWsState] = useState<WsConnectionState>("closed");
  const [isActionRunning, setIsActionRunning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const backendUrlRef = useRef(backendUrl);
  const checkSequence = useRef(0);
  const wsClientRef = useRef<WsClient | null>(null);

  const activeWorkspace = workspaces.find(({ id }) => id === activeId) ?? {
    id: "overview" as const,
    label: "Overview",
    icon: LayoutDashboard,
    group: "Workspace" as const,
    description: "Session health and simulation state",
  };

  const filteredWorkspaces = useMemo(() => {
    const query = navigationSearch.trim().toLowerCase();
    return query
      ? workspaces.filter((workspace) =>
          `${workspace.label} ${workspace.description}`.toLowerCase().includes(query),
        )
      : workspaces;
  }, [navigationSearch]);

  const attachWs = useCallback((targetSessionId: string, currentUrl: string) => {
    if (wsClientRef.current) {
      wsClientRef.current.disconnect();
      wsClientRef.current = null;
    }

    const client = new WsClient(targetSessionId, {
      baseUrl: currentUrl,
      onSnapshot: (snap) => {
        setSnapshot(snap);
      },
      onStateChange: (state, detail) => {
        setWsState(state);
        if (state === "unavailable" && detail) {
          console.warn("[WebSocket]", detail);
        }
      },
    });

    wsClientRef.current = client;
    client.connect();
  }, []);

  const handleHealthCheck = useCallback(async () => {
    const sequence = ++checkSequence.current;
    const requestedUrl = backendUrl;
    setChecking(true);
    setHealth(null);
    setHealthError("");
    try {
      const normalized = normalizeBackendUrl(requestedUrl);
      backendUrlRef.current = normalized;
      setBackendUrl(normalized);
      const result = await checkBackendHealth(normalized);
      if (sequence === checkSequence.current && backendUrlRef.current === normalized) {
        setHealth(result);
        if (result.state === "reachable") {
          // Fetch discovery metadata
          try {
            const disc = await fetchDiscovery(normalized);
            setDiscovery(disc);
          } catch (discErr) {
            console.warn("Discovery fetch failed:", discErr);
          }
        }
      }
    } catch (error) {
      if (sequence === checkSequence.current) {
        setHealthError(error instanceof Error ? error.message : "The backend address is invalid.");
      }
    } finally {
      if (sequence === checkSequence.current) setChecking(false);
    }
  }, [backendUrl]);

  // Initial mount health check and session restore
  useEffect(() => {
    handleHealthCheck();
  }, [handleHealthCheck]);

  // Restore session if present
  useEffect(() => {
    if (health?.state === "reachable" && sessionId) {
      getSnapshot(backendUrl, sessionId)
        .then((snap) => {
          setSnapshot(snap);
          attachWs(sessionId, backendUrl);
        })
        .catch(() => {
          // Session expired or non-existent on server
          sessionStorage.removeItem("quantumrisc.session");
          setSessionId(null);
          setSnapshot(null);
        });
    }
  }, [health?.state, sessionId, backendUrl, attachWs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsClientRef.current) {
        wsClientRef.current.disconnect();
      }
    };
  }, []);

  function handleBackendUrlChange(value: string) {
    backendUrlRef.current = value;
    checkSequence.current += 1;
    setBackendUrl(value);
    setHealth(null);
    setHealthError("");
    setChecking(false);
  }

  // Session creation handler
  async function handleCreateSession() {
    setIsActionRunning(true);
    setActionError(null);
    try {
      const res = await createSession(backendUrl, {
        top: discovery?.default_top,
        testbench: discovery?.default_testbench,
      });
      setSessionId(res.id);
      sessionStorage.setItem("quantumrisc.session", res.id);

      // Fetch confirmed snapshot
      const snap = await getSnapshot(backendUrl, res.id);
      setSnapshot(snap);
      attachWs(res.id, backendUrl);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to create session.");
    } finally {
      setIsActionRunning(false);
    }
  }

  // Simulation controls handlers
  async function handleCompile() {
    if (!sessionId) return;
    setIsActionRunning(true);
    setActionError(null);
    try {
      const compRes = await compileSession(backendUrl, sessionId);
      const snap = await getSnapshot(backendUrl, sessionId);
      setSnapshot(snap);
      if (!compRes.ok) {
        setActionError(`Compile failed with code ${compRes.returncode}`);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Compilation failed.");
    } finally {
      setIsActionRunning(false);
    }
  }

  async function handleRun() {
    if (!sessionId) return;
    setIsActionRunning(true);
    setActionError(null);
    try {
      const runRes = await runSession(backendUrl, sessionId);
      const snap = await getSnapshot(backendUrl, sessionId);
      setSnapshot(snap);
      if (!runRes.ok) {
        setActionError(`Simulation run failed with code ${runRes.returncode}`);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Simulation run failed.");
    } finally {
      setIsActionRunning(false);
    }
  }

  async function handleStep() {
    if (!sessionId) return;
    setIsActionRunning(true);
    setActionError(null);
    try {
      await stepSession(backendUrl, sessionId);
      const snap = await getSnapshot(backendUrl, sessionId);
      setSnapshot(snap);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Step failed.");
    } finally {
      setIsActionRunning(false);
    }
  }

  async function handlePause() {
    if (!sessionId) return;
    setIsActionRunning(true);
    setActionError(null);
    try {
      await pauseSession(backendUrl, sessionId);
      const snap = await getSnapshot(backendUrl, sessionId);
      setSnapshot(snap);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Pause failed.");
    } finally {
      setIsActionRunning(false);
    }
  }

  async function handleResume() {
    if (!sessionId) return;
    setIsActionRunning(true);
    setActionError(null);
    try {
      await resumeSession(backendUrl, sessionId);
      const snap = await getSnapshot(backendUrl, sessionId);
      setSnapshot(snap);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Resume failed.");
    } finally {
      setIsActionRunning(false);
    }
  }

  async function handleReset() {
    if (!sessionId) return;
    setIsActionRunning(true);
    setActionError(null);
    try {
      await resetSession(backendUrl, sessionId);
      const snap = await getSnapshot(backendUrl, sessionId);
      setSnapshot(snap);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Reset failed.");
    } finally {
      setIsActionRunning(false);
    }
  }

  async function handleNavigateTime(direction: "prev" | "next") {
    if (!sessionId) return;
    if (direction === "next") {
      await handleStep();
    } else {
      // Step backwards or reset
      await handleReset();
    }
  }

  const railLinks: Array<{ id: WorkspaceId; label: string; icon: LucideIcon }> = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "architecture", label: "Architecture", icon: CircuitBoard },
    { id: "pipeline", label: "Pipeline", icon: Workflow },
    { id: "verification", label: "Verification", icon: ShieldCheck },
  ];

  const isPaused = snapshot?.playback?.paused ?? true;
  const isRunning = snapshot?.status === "running";

  return (
    <div className="studio-shell dark">
      <aside className="global-rail" aria-label="Primary navigation">
        <button
          className="brand-mark"
          type="button"
          onClick={() => setActiveId("overview")}
          aria-label="QuantumRISC Studio overview"
        >
          <Cpu />
        </button>
        <div className="rail-links">
          {railLinks.map(({ id, label, icon: Icon }) => (
            <IconButton key={id} label={label} onClick={() => setActiveId(id)}>
              <span className={`rail-icon ${activeId === id ? "rail-icon-active" : ""}`}>
                <Icon />
              </span>
            </IconButton>
          ))}
        </div>
        <div className="rail-bottom">
          <IconButton label="About QuantumRISC Studio" onClick={() => setActiveId("overview")}>
            <CircleHelp />
          </IconButton>
        </div>
      </aside>

      <aside
        className={`workspace-sidebar ${sidebarCollapsed ? "workspace-sidebar-collapsed" : ""}`}
      >
        <div className="sidebar-brand">
          <div className="brand-glyph">
            <Cpu />
          </div>
          <div className="brand-words">
            <strong>QuantumRISC</strong>
            <span>
              STUDIO <i>0.1</i>
            </span>
          </div>
        </div>
        <div className="project-context">
          <span className={`project-dot ${snapshot ? "status-ready" : ""}`} />
          <div className="project-copy">
            <strong>Engineering workspace</strong>
            <span>
              {snapshot
                ? `Session ${snapshot.session_id.slice(0, 8)} (${snapshot.status})`
                : "Uninitialized session"}
            </span>
          </div>
          <ChevronDown className="project-chevron" />
        </div>
        <div className="navigation-search">
          <Search />
          <Input
            aria-label="Filter workspaces"
            placeholder="Find a workspace…"
            value={navigationSearch}
            onChange={(event) => setNavigationSearch(event.target.value)}
          />
        </div>
        <nav className="workspace-nav" aria-label="Workspaces">
          {(["Workspace", "Analysis"] as const).map((group) => {
            const groupItems = filteredWorkspaces.filter((workspace) => workspace.group === group);
            if (!groupItems.length) return null;
            return (
              <div className="nav-group" key={group}>
                <p className="nav-group-title">{group.toUpperCase()}</p>
                {groupItems.map(({ id, label, icon: Icon }) => (
                  <button
                    className={`nav-item ${activeId === id ? "nav-item-active" : ""}`}
                    key={id}
                    type="button"
                    aria-current={activeId === id ? "page" : undefined}
                    title={sidebarCollapsed ? label : undefined}
                    onClick={() => setActiveId(id)}
                  >
                    <Icon className="nav-item-icon" />
                    <span>{label}</span>
                    {activeId === id && <span className="nav-active-marker" />}
                  </button>
                ))}
              </div>
            );
          })}
          {filteredWorkspaces.length === 0 && (
            <p className="no-nav-results">No matching workspaces</p>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-workspace-note">
            <div>
              <span className={`status-dot ${snapshot ? "status-ready" : "status-idle"}`} />
              <strong>{snapshot ? "Backend connected" : "Source not connected"}</strong>
            </div>
            <p>
              {snapshot
                ? `Active session ${snapshot.session_id.slice(0, 8)} on ${snapshot.top}.`
                : "Session controls activate only after backend integration is verified."}
            </p>
          </div>
          <Button
            onClick={() => setSidebarCollapsed((current) => !current)}
            type="button"
            variant="ghost"
            className="collapse-sidebar"
          >
            {sidebarCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            <span>{sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}</span>
          </Button>
        </div>
      </aside>

      <main className={`main-workspace ${inspectorOpen ? "main-with-inspector" : ""}`}>
        <header className="top-toolbar">
          <div className="breadcrumb">
            <span>Studio</span>
            <ChevronRight />
            <strong>{activeWorkspace.label}</strong>
          </div>
          <div className="toolbar-actions">
            <div className="toolbar-connection">
              <span
                className={`status-dot ${
                  snapshot
                    ? "status-ready"
                    : health?.state === "reachable"
                      ? "status-ready"
                      : health?.state === "unreachable"
                        ? "status-error"
                        : "status-idle"
                }`}
              />
              <span>
                {snapshot
                  ? `Session ${snapshot.session_id.slice(0, 8)}`
                  : health?.state === "reachable"
                    ? "API reachable"
                    : health?.state === "unreachable"
                      ? "API unavailable"
                      : "API not checked"}
              </span>
            </div>
            <div className="toolbar-divider" />
            <IconButton
              label={inspectorOpen ? "Hide session inspector" : "Show session inspector"}
              onClick={() => setInspectorOpen((current) => !current)}
            >
              {inspectorOpen ? <PanelRightClose /> : <PanelRightOpen />}
            </IconButton>
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={isActionRunning || health?.state !== "reachable"}
              onClick={handleCreateSession}
              title="Create a live CPU simulation session against the verified backend schema"
            >
              {isActionRunning ? <span className="spinner spinner-small" /> : <CircleDot />}
              {snapshot ? "New session" : "Initialize session"}
            </Button>
          </div>
        </header>

        <div className="simulation-toolbar">
          <div className="simulation-label">
            <span className="simulation-mark">
              <Cpu />
            </span>
            <div>
              <strong>Simulation controls</strong>
              <span>
                {snapshot ? `Session ${snapshot.session_id.slice(0, 8)}` : "No session attached"}
              </span>
            </div>
          </div>
          <div className="simulation-buttons" role="toolbar" aria-label="Simulation controls">
            <span title="Compile RTL and testbench">
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={!sessionId || isActionRunning}
                onClick={handleCompile}
                aria-label="Compile"
              >
                <Hammer /> Compile
              </Button>
            </span>
            <span title={isPaused ? "Run simulation free" : "Resume simulation"}>
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={!sessionId || isActionRunning || (isRunning && !isPaused)}
                onClick={isPaused ? handleRun : handleResume}
                aria-label="Run"
              >
                <Play /> Run
              </Button>
            </span>
            <span title="Retire one instruction / advance step">
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={!sessionId || isActionRunning}
                onClick={handleStep}
                aria-label="Step"
              >
                <StepForward /> Step
              </Button>
            </span>
            <span title="Advance one clock cycle">
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={!sessionId || isActionRunning}
                onClick={handleStep}
                aria-label="Clock"
              >
                <Clock3 /> Clock
              </Button>
            </span>
            <span title="Halt at the current cycle">
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={!sessionId || isActionRunning || isPaused}
                onClick={handlePause}
                aria-label="Pause"
              >
                <Square /> Pause
              </Button>
            </span>
            <span title="Assert reset and return to cycle 0">
              <Button
                variant="outline"
                size="sm"
                type="button"
                disabled={!sessionId || isActionRunning}
                onClick={handleReset}
                aria-label="Reset"
              >
                <RotateCcw /> Reset
              </Button>
            </span>
          </div>
          <div className="cycle-display">
            <Clock3 />
            <span>Cycle</span>
            <strong>{snapshot?.playback?.cursor ?? snapshot?.metrics?.cycles ?? "—"}</strong>
          </div>
        </div>

        {actionError && (
          <div
            style={{
              margin: "10px 24px 0",
              padding: "8px 12px",
              background: "color-mix(in oklab, var(--studio-danger) 15%, transparent)",
              border: "1px solid var(--studio-danger)",
              borderRadius: 6,
              fontSize: 12,
              color: "var(--studio-danger)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle size={16} />
            <span>{actionError}</span>
            <Button
              variant="ghost"
              size="micro"
              onClick={() => setActionError(null)}
              style={{ marginLeft: "auto" }}
            >
              <X size={12} />
            </Button>
          </div>
        )}

        <div className="content-scroll">
          <div className="workspace-content">
            {activeId === "overview" ? (
              <Overview
                backendUrl={backendUrl}
                onBackendUrlChange={handleBackendUrlChange}
                health={health}
                checking={checking}
                onCheck={handleHealthCheck}
                healthError={healthError}
                snapshot={snapshot}
                onOpenPipeline={() => setActiveId("pipeline")}
              />
            ) : (
              <WorkspaceContent
                workspace={activeWorkspace}
                onChoose={setActiveId}
                snapshot={snapshot}
                discovery={discovery}
                onSelectComponent={setSelectedComponent}
                selectedComponent={selectedComponent}
                onNavigateTime={handleNavigateTime}
              />
            )}
          </div>
        </div>

        <footer className="status-bar">
          <div className="status-service">
            <span
              className={`status-dot ${
                snapshot
                  ? "status-ready"
                  : health?.state === "reachable"
                    ? "status-ready"
                    : health?.state === "unreachable"
                      ? "status-error"
                      : "status-idle"
              }`}
            />
            <span>
              Backend{" "}
              {health?.state === "reachable"
                ? "reachable"
                : health?.state === "unreachable"
                  ? "unavailable"
                  : "not checked"}
            </span>
          </div>
          <div className="status-item">
            <span>Compilation</span>
            <strong>
              {snapshot?.compile?.ok
                ? "Success"
                : snapshot?.compile?.returncode !== undefined
                  ? `Exit ${snapshot.compile.returncode}`
                  : "Not run"}
            </strong>
          </div>
          <div className="status-item">
            <span>Simulation</span>
            <strong style={{ textTransform: "capitalize" }}>
              {snapshot?.status ?? "Not started"}
            </strong>
          </div>
          <div className="status-item status-cycle">
            <span>Cycle</span>
            <strong>{snapshot?.playback?.cursor ?? snapshot?.metrics?.cycles ?? "—"}</strong>
          </div>
          <div className="status-version">
            <span className={`status-dot ${snapshot ? "status-ready" : "status-idle"}`} />
            {snapshot ? `Connected: ${snapshot.top}` : "Source not connected"}
          </div>
        </footer>
      </main>

      {inspectorOpen && (
        <StatusInspector
          health={health}
          snapshot={snapshot}
          wsState={wsState}
          onClose={() => setInspectorOpen(false)}
        />
      )}
    </div>
  );
}
