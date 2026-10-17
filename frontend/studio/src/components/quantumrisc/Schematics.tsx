// Structural reference wireframes. These draw layout only and never display
// simulated or live values — every value slot renders as an em dash.

const ABI = [
  "zero",
  "ra",
  "sp",
  "gp",
  "tp",
  "t0",
  "t1",
  "t2",
  "s0",
  "s1",
  "a0",
  "a1",
  "a2",
  "a3",
  "a4",
  "a5",
  "a6",
  "a7",
  "s2",
  "s3",
  "s4",
  "s5",
  "s6",
  "s7",
  "s8",
  "s9",
  "s10",
  "s11",
  "t3",
  "t4",
  "t5",
  "t6",
];

function Tag({ children = "Reference schematic · not live" }: { children?: string }) {
  return <span className="schematic-tag">{children}</span>;
}

export function LiveGate({ what }: { what: string }) {
  return (
    <p className="live-gate">
      <span className="status-dot status-idle" />
      {what} activates after <code>GET /api/health</code> succeeds and a session returns data.
    </p>
  );
}

export function DatapathSchematic() {
  const stages = [
    { x: 20, label: "IF", sub: "PC · I-MEM" },
    { x: 180, label: "ID", sub: "DECODE · REGFILE" },
    { x: 340, label: "EX", sub: "ALU · BRANCH" },
    { x: 500, label: "MEM", sub: "D-MEM · LSU" },
    { x: 660, label: "WB", sub: "RESULT MUX" },
  ];
  return (
    <div className="schematic">
      <Tag />
      <svg
        className="datapath"
        viewBox="0 0 800 220"
        role="img"
        aria-label="Generic five-stage RISC datapath wireframe"
      >
        {stages.map((s, i) => (
          <g key={s.label}>
            <rect className="block" x={s.x} y={50} width={110} height={90} rx={4} />
            <text x={s.x + 12} y={80}>
              {s.label}
            </text>
            <text className="sub" x={s.x + 12} y={98}>
              {s.sub}
            </text>
            <text className="sub" x={s.x + 12} y={128}>
              value —
            </text>
            {i < stages.length - 1 && (
              <>
                <rect className="latch" x={s.x + 125} y={40} width={10} height={110} rx={2} />
                <path
                  className="wire"
                  d={`M${s.x + 110} 95 H${s.x + 125} M${s.x + 135} 95 H${s.x + 160}`}
                />
              </>
            )}
          </g>
        ))}
        <path className="wire" d="M715 140 V180 H235 V140" />
        <text className="sub" x={400} y={195}>
          writeback → register file
        </text>
        <path className="wire" d="M395 140 V165 H75 V140" />
        <text className="sub" x={110} y={160}>
          branch target → PC
        </text>
        <rect className="block block-arch" x={300} y={4} width={200} height={26} rx={4} />
        <text x={316} y={21}>
          CONTROL / HAZARD UNIT
        </text>
        <path className="wire-ctrl" d="M300 17 H235 V50 M500 17 H555 V50 M400 30 V50" />
      </svg>
    </div>
  );
}

export function RegisterBankGrid({ values }: { values?: Record<number, string> | undefined } = {}) {
  return (
    <div className="schematic">
      <Tag>{values ? "Architectural register bank · live" : "Layout · values unavailable"}</Tag>
      <div className="reg-grid" style={{ marginTop: 20 }}>
        {ABI.map((alias, i) => (
          <div className={`reg-cell ${i === 0 ? "reg-cell-hardwired" : ""}`} key={alias}>
            <b>x{i}</b>
            <i>
              {alias}
              {i === 0 ? " · hardwired" : ""}
            </i>
            <span>{values?.[i] ?? "0x————————"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MemoryMapWireframe() {
  const rows = [
    ["0x????_????", "Instruction memory", "text / ROM"],
    ["0x????_????", "Data memory", "data / RAM"],
    ["0x????_????", "Stack region", "grows ↓"],
    ["0x????_????", "Memory-mapped I/O", "peripherals"],
  ];
  return (
    <div className="schematic">
      <Tag />
      <div className="mem-map" style={{ marginTop: 20 }}>
        {rows.map(([addr, name, kind]) => (
          <div className="mem-row" key={name}>
            <span>{addr}</span>
            <strong>{name}</strong>
            <em>{kind} · size —</em>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CacheHierarchyWireframe() {
  const nodes = [
    ["CPU core", "LSU"],
    ["L1-I / L1-D", "if present"],
    ["L2", "if present"],
    ["Main memory", "backing store"],
  ];
  return (
    <div className="schematic">
      <Tag />
      <div className="cache-chain" style={{ marginTop: 20 }}>
        {nodes.map(([n, s], i) => (
          <div key={n} style={{ display: "contents" }}>
            <div className="cache-node">
              {n}
              <small>{s} · hit rate —</small>
            </div>
            {i < nodes.length - 1 && <span className="cache-link" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ForwardingWireframe() {
  return (
    <div className="schematic">
      <Tag />
      <svg
        className="datapath"
        viewBox="0 0 800 150"
        role="img"
        aria-label="Forwarding and stall path wireframe"
      >
        {["IF", "ID", "EX", "MEM", "WB"].map((s, i) => (
          <g key={s}>
            <rect className="block" x={20 + i * 160} y={40} width={120} height={50} rx={4} />
            <text x={34 + i * 160} y={70}>
              {s}
            </text>
          </g>
        ))}
        <path className="wire" d="M560 90 V120 H400 V90" />
        <text className="sub" x={420} y={138}>
          EX/MEM → EX forward
        </text>
        <path className="wire" d="M720 90 V135 H380 V90" />
        <path className="wire-ctrl" d="M240 40 V20 H80 V40" />
        <text className="sub" x={110} y={15}>
          load-use stall / bubble insert
        </text>
        <path className="wire-ctrl" d="M400 40 V12 H560" />
        <text className="sub" x={570} y={15}>
          branch resolve → flush IF/ID
        </text>
      </svg>
    </div>
  );
}

export function WaveformLanes() {
  const signals = ["clk", "rst_n", "pc[31:0]", "instr[31:0]", "alu_result", "mem_we", "stall"];
  return (
    <div className="wave-lanes" aria-label="Empty waveform lanes">
      {signals.map((s) => (
        <div className="wave-lane" key={s}>
          <span>{s}</span>
          <div />
        </div>
      ))}
    </div>
  );
}
