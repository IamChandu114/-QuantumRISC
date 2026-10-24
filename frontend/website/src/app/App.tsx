import { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  Cpu, Terminal, GitBranch, Zap, Database, Activity,
  ChevronRight, Github, Play, Pause, Check, X,
  AlertTriangle, Code2, Layers, Binary, CircuitBoard,
  ArrowRight, Eye, Shield, FileCode, Folder, FolderOpen,
  SkipForward, RefreshCw, Monitor, BarChart2, ChevronDown,
  Settings, ExternalLink, Radio, Lock, Unlock, Boxes,
} from "lucide-react";

// ─── CSS ANIMATIONS ─────────────────────────────────────────
const CSS = `
  :root { font-family: 'Inter', system-ui, sans-serif; }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { background: #080809; overflow-x: hidden; }
  code, .mono { font-family: 'JetBrains Mono', monospace; }

  @keyframes floatY {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-14px); }
  }
  @keyframes floatSlow {
    0%, 100% { transform: translateY(0px) rotate(0.5deg); }
    50% { transform: translateY(-8px) rotate(-0.5deg); }
  }
  @keyframes signalPath {
    0% { stroke-dashoffset: 220; opacity: 0; }
    8% { opacity: 1; }
    88% { opacity: 1; }
    100% { stroke-dashoffset: 0; opacity: 0; }
  }
  @keyframes signalPath2 {
    0% { stroke-dashoffset: 300; opacity: 0; }
    10% { opacity: 0.8; }
    85% { opacity: 0.8; }
    100% { stroke-dashoffset: 0; opacity: 0; }
  }
  @keyframes blockGlow {
    0%, 100% { filter: drop-shadow(0 0 3px rgba(0,212,255,0.3)); }
    50% { filter: drop-shadow(0 0 10px rgba(0,212,255,0.7)); }
  }
  @keyframes greenGlow {
    0%, 100% { filter: drop-shadow(0 0 3px rgba(0,255,136,0.3)); }
    50% { filter: drop-shadow(0 0 10px rgba(0,255,136,0.7)); }
  }
  @keyframes pulseDot {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.4); }
  }
  @keyframes clockTick {
    0%, 49% { background: #00d4ff; box-shadow: 0 0 8px #00d4ff80; }
    50%, 100% { background: #00d4ff20; box-shadow: none; }
  }
  @keyframes scanDown {
    0% { top: 0%; opacity: 0; }
    5% { opacity: 1; }
    90% { opacity: 0.6; }
    100% { top: 100%; opacity: 0; }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes particleDrift {
    0% { transform: translate(0, 0); opacity: 0; }
    15% { opacity: 0.7; }
    85% { opacity: 0.7; }
    100% { transform: translate(var(--tx, 40px), var(--ty, -60px)); opacity: 0; }
  }
  @keyframes gridScroll {
    from { background-position: 0 0; }
    to { background-position: 60px 60px; }
  }
  @keyframes borderCycle {
    0%, 100% { border-color: rgba(0,212,255,0.3); }
    33% { border-color: rgba(0,255,136,0.3); }
    66% { border-color: rgba(200,121,65,0.3); }
  }
  @keyframes ledBlink {
    0%, 49% { background: #00ff88; box-shadow: 0 0 6px #00ff88; }
    50%, 100% { background: #00ff8830; box-shadow: none; }
  }
  @keyframes waveformDraw {
    from { stroke-dashoffset: 1000; }
    to { stroke-dashoffset: 0; }
  }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  @keyframes rippleOut {
    0% { transform: scale(1); opacity: 0.55; }
    100% { transform: scale(3.4); opacity: 0; }
  }
  @keyframes rippleOut2 {
    0% { transform: scale(1); opacity: 0.3; }
    100% { transform: scale(5); opacity: 0; }
  }
  @keyframes modalBackdropIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes modalPanelIn {
    from { opacity: 0; transform: scale(0.93) translateY(28px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes scanlineMove {
    0% { top: -4px; }
    100% { top: 100%; }
  }
  @keyframes progressAnim {
    from { width: 0%; }
    to { width: 62%; }
  }
  @keyframes chapterIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .play-ripple-1 {
    position: absolute; inset: 0; border-radius: 50%;
    border: 1.5px solid rgba(0,212,255,0.55);
    animation: rippleOut 2.4s ease-out infinite;
    pointer-events: none;
  }
  .play-ripple-2 {
    position: absolute; inset: 0; border-radius: 50%;
    border: 1px solid rgba(0,212,255,0.3);
    animation: rippleOut2 2.4s ease-out infinite 0.9s;
    pointer-events: none;
  }
  .modal-backdrop { animation: modalBackdropIn 0.3s ease forwards; }
  .modal-panel { animation: modalPanelIn 0.45s cubic-bezier(0.16,1,0.3,1) forwards; }
  .demo-scanline {
    position: absolute; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.25) 50%, transparent 100%);
    animation: scanlineMove 5s linear infinite;
    pointer-events: none; z-index: 3;
  }
  .play-btn-wrap {
    transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1);
  }
  .demo-card:hover .play-btn-wrap { transform: scale(1.08); }
  .demo-card:hover .demo-card-overlay { opacity: 1; }
  .demo-card-overlay { opacity: 0.75; transition: opacity 0.4s ease; }
  .chapter-row {
    transition: background 0.18s ease, border-color 0.18s ease, padding-left 0.18s ease;
    cursor: pointer;
  }
  .chapter-row:hover { background: rgba(0,212,255,0.04); border-color: rgba(0,212,255,0.18) !important; padding-left: 18px; }
  .chapter-row.ch-active { background: rgba(0,212,255,0.07); border-color: rgba(0,212,255,0.28) !important; }
  .video-frame-glow {
    box-shadow: 0 0 0 1px rgba(0,212,255,0.12), 0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(0,212,255,0.06);
    transition: box-shadow 0.4s ease;
  }
  .video-frame-glow:hover {
    box-shadow: 0 0 0 1px rgba(0,212,255,0.22), 0 32px 100px rgba(0,0,0,0.75), 0 0 100px rgba(0,212,255,0.1);
  }

  .anim-float { animation: floatY 4s ease-in-out infinite; }
  .anim-float-slow { animation: floatSlow 6s ease-in-out infinite; }
  .anim-signal { animation: signalPath 2.8s linear infinite; }
  .anim-signal2 { animation: signalPath2 3.5s linear infinite; }
  .anim-signal3 { animation: signalPath 4.2s linear infinite 1.4s; }
  .anim-block-glow { animation: blockGlow 3s ease-in-out infinite; }
  .anim-green-glow { animation: greenGlow 3s ease-in-out infinite 1s; }
  .anim-pulse { animation: pulseDot 2s ease-in-out infinite; }
  .anim-clock { animation: clockTick 1s steps(1) infinite; }
  .anim-scan { animation: scanDown 5s linear infinite; }
  .anim-fade-up { animation: fadeInUp 0.7s ease-out both; }
  .anim-fade { animation: fadeIn 0.5s ease-out both; }
  .anim-grid { animation: gridScroll 8s linear infinite; }
  .anim-spin { animation: spin 2s linear infinite; }
  .anim-led { animation: ledBlink 1.2s steps(1) infinite; }
  .anim-wave { animation: waveformDraw 2s ease-out forwards; stroke-dasharray: 1000; }

  .particle { position: absolute; pointer-events: none; animation: particleDrift var(--dur, 4s) ease-in-out infinite var(--delay, 0s); }

  .pipeline-cell { transition: all 0.3s ease; }
  .stage-IF  { background: rgba(0,212,255,0.12); border-color: rgba(0,212,255,0.5); color: #00d4ff; }
  .stage-ID  { background: rgba(0,255,136,0.12); border-color: rgba(0,255,136,0.5); color: #00ff88; }
  .stage-EX  { background: rgba(255,153,0,0.12); border-color: rgba(255,153,0,0.5); color: #ff9900; }
  .stage-ME  { background: rgba(255,51,102,0.12); border-color: rgba(255,51,102,0.5); color: #ff3366; }
  .stage-WB  { background: rgba(200,121,65,0.12); border-color: rgba(200,121,65,0.5); color: #c87941; }
  .stage-stall { background: rgba(60,60,70,0.3); border-color: rgba(100,100,120,0.4); color: #555565; }
  .stage-freeze { background: rgba(30,30,40,0.3); border-color: rgba(60,60,80,0.3); color: #3a3a4a; }

  .rtl-line:hover { background: rgba(0,212,255,0.06); }
  .file-item:hover { background: rgba(255,255,255,0.05); cursor: pointer; }
  .file-item.active { background: rgba(0,212,255,0.08); border-left: 2px solid #00d4ff; }

  .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.07); }
  .glass-cyan { background: rgba(0,212,255,0.04); backdrop-filter: blur(12px); border: 1px solid rgba(0,212,255,0.15); }
  .glass-green { background: rgba(0,255,136,0.04); backdrop-filter: blur(12px); border: 1px solid rgba(0,255,136,0.15); }

  .eng-grid {
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .eng-grid-move {
    background-image:
      linear-gradient(rgba(0,212,255,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,212,255,0.05) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  .glow-text-cyan { text-shadow: 0 0 20px rgba(0,212,255,0.6); }
  .glow-text-green { text-shadow: 0 0 20px rgba(0,255,136,0.6); }
  .glow-box-cyan { box-shadow: 0 0 20px rgba(0,212,255,0.2), 0 0 60px rgba(0,212,255,0.08); }
  .glow-box-green { box-shadow: 0 0 20px rgba(0,255,136,0.2), 0 0 60px rgba(0,255,136,0.08); }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0,212,255,0.4); }

  .nav-link { position: relative; }
  .nav-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1px; background: #00d4ff; transition: width 0.3s ease; }
  .nav-link:hover::after { width: 100%; }
  .nav-link.active::after { width: 100%; }

  .btn-primary {
    background: linear-gradient(135deg, #00d4ff, #0090b8);
    color: #000;
    border: none;
    font-weight: 600;
    letter-spacing: 0.05em;
    transition: all 0.3s ease;
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,212,255,0.35); }
  .btn-outline {
    background: transparent;
    color: #00d4ff;
    border: 1px solid rgba(0,212,255,0.4);
    font-weight: 500;
    letter-spacing: 0.05em;
    transition: all 0.3s ease;
  }
  .btn-outline:hover { background: rgba(0,212,255,0.08); border-color: #00d4ff; transform: translateY(-1px); }
  .btn-ghost {
    background: transparent;
    color: #606070;
    border: 1px solid rgba(255,255,255,0.08);
    transition: all 0.3s ease;
  }
  .btn-ghost:hover { color: #f0f0f2; border-color: rgba(255,255,255,0.2); }

  .section-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #00d4ff;
    opacity: 0.8;
  }
  .section-label-green { color: #00ff88; }
  .section-label-gold { color: #c87941; }

  .accuracy-bar { transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
  .cache-cell { transition: all 0.4s ease; }
  .cache-cell.hit { background: rgba(0,255,136,0.2); border-color: rgba(0,255,136,0.6); }
  .cache-cell.miss { background: rgba(255,51,102,0.2); border-color: rgba(255,51,102,0.6); }
  .cache-cell.evict { background: rgba(200,121,65,0.2); border-color: rgba(200,121,65,0.6); }
`;

// ─── DATA ────────────────────────────────────────────────────
const TIMING_FWD: (string | null)[][] = [
  ["IF","ID","EX","ME","WB",null,null,null,null,null],
  [null,"IF","ID","EX","ME","WB",null,null,null,null],
  [null,null,"IF","ID","EX","ME","WB",null,null,null],
  [null,null,null,"IF","ID","EX","ME","WB",null,null],
  [null,null,null,null,"IF","ID","EX","ME","WB",null],
  [null,null,null,null,null,"IF","ID","EX","ME","WB"],
];

const TIMING_NOFWD: (string | null)[][] = [
  ["IF","ID","EX","ME","WB",null,null,null,null,null,null,null,null,null],
  [null,"IF","ID","EX","ME","WB",null,null,null,null,null,null,null,null],
  [null,null,"IF","**","**","ID","EX","ME","WB",null,null,null,null,null],
  [null,null,null,"IF","IF","IF","ID","**","**","EX","ME","WB",null,null],
  [null,null,null,null,null,null,"IF","IF","IF","ID","EX","ME","WB",null],
  [null,null,null,null,null,null,null,null,null,"IF","ID","EX","ME","WB"],
];

const INSTRS = [
  { id:0, asm:"ADD  x1, x2, x3",  type:"R", color:"#00d4ff", note:"Produces x1 → hazard source" },
  { id:1, asm:"ADD  x4, x5, x6",  type:"R", color:"#00ff88", note:"Produces x4 → hazard source" },
  { id:2, asm:"AND  x7, x1, x4",  type:"R", color:"#ff9900", note:"RAW: reads x1↑ x4↑" },
  { id:3, asm:"LW   x8, 0(x1)",   type:"I", color:"#00d4ff", note:"RAW: reads x1↑, load" },
  { id:4, asm:"ADD  x9, x12, x13",type:"R", color:"#00ff88", note:"Independent (no hazard)" },
  { id:5, asm:"XOR  x10, x7, x8", type:"R", color:"#c87941", note:"RAW: reads x7↑ x8↑" },
];

const RTL_TREE = [
  { type:"file", name:"cpu_top.v", path:"cpu_top.v", size:"4.2 KB" },
  { type:"folder", name:"pipeline", children:[
    { type:"file", name:"if_stage.v",  path:"pipeline/if_stage.v",  size:"2.1 KB" },
    { type:"file", name:"id_stage.v",  path:"pipeline/id_stage.v",  size:"3.4 KB" },
    { type:"file", name:"ex_stage.v",  path:"pipeline/ex_stage.v",  size:"2.8 KB" },
    { type:"file", name:"mem_stage.v", path:"pipeline/mem_stage.v", size:"2.0 KB" },
    { type:"file", name:"wb_stage.v",  path:"pipeline/wb_stage.v",  size:"1.3 KB" },
  ]},
  { type:"folder", name:"units", children:[
    { type:"file", name:"alu.v",         path:"units/alu.v",         size:"3.7 KB" },
    { type:"file", name:"regfile.v",     path:"units/regfile.v",     size:"1.9 KB" },
    { type:"file", name:"branch_pred.v", path:"units/branch_pred.v", size:"2.3 KB" },
    { type:"file", name:"multiplier.v",  path:"units/multiplier.v",  size:"4.1 KB" },
  ]},
  { type:"folder", name:"control", children:[
    { type:"file", name:"hazard_unit.v", path:"control/hazard_unit.v", size:"1.8 KB" },
    { type:"file", name:"fwd_unit.v",    path:"control/fwd_unit.v",    size:"1.6 KB" },
    { type:"file", name:"ctrl_unit.v",   path:"control/ctrl_unit.v",   size:"2.9 KB" },
  ]},
  { type:"folder", name:"memory", children:[
    { type:"file", name:"icache.v", path:"memory/icache.v", size:"5.2 KB" },
    { type:"file", name:"dcache.v", path:"memory/dcache.v", size:"5.8 KB" },
  ]},
];

const RTL_CODE: Record<string, { desc: string; deps: string[]; code: string }> = {
  "cpu_top.v": {
    desc: "Top-level integration. Connects all five pipeline stages, hazard detection, forwarding unit, and cache subsystem.",
    deps: ["if_stage.v", "id_stage.v", "ex_stage.v", "mem_stage.v", "wb_stage.v", "hazard_unit.v", "fwd_unit.v"],
    code: `module cpu_top #(
  parameter XLEN    = 32,
  parameter HART_ID = 0
) (
  input  logic        clk,
  input  logic        rst_n,
  // Instruction memory
  output logic [31:0] imem_addr,
  input  logic [31:0] imem_rdata,
  output logic        imem_req,
  // Data memory
  output logic [31:0] dmem_addr,
  output logic [31:0] dmem_wdata,
  input  logic [31:0] dmem_rdata,
  output logic  [3:0] dmem_we,
  output logic        dmem_req,
  input  logic        dmem_ack
);
  // Pipeline interconnect
  logic [31:0] pc_if, pc_id, pc_ex;
  logic [31:0] instr_if, instr_id;
  logic  [4:0] rs1_id, rs2_id;
  logic  [4:0] rd_ex, rd_mem, rd_wb;
  logic [31:0] rs1_data, rs2_data;
  logic [31:0] alu_out_ex, alu_out_mem;
  logic        stall_if, flush_ex;
  logic  [1:0] fwd_a, fwd_b;

  if_stage   u_if  (.clk, .rst_n, .stall(stall_if), .*);
  id_stage   u_id  (.clk, .rst_n, .*);
  ex_stage   u_ex  (.clk, .rst_n, .fwd_a, .fwd_b, .*);
  mem_stage  u_mem (.clk, .rst_n, .*);
  wb_stage   u_wb  (.clk, .rst_n, .*);

  hazard_unit u_haz (
    .rs1_id, .rs2_id,
    .rd_ex,  .rd_mem,
    .mem_read_ex(mem_read_ex),
    .stall_if, .flush_ex
  );
  fwd_unit u_fwd (
    .rs1_ex, .rs2_ex,
    .rd_mem, .rd_wb,
    .reg_write_mem, .reg_write_wb,
    .fwd_a, .fwd_b
  );
endmodule`,
  },
  "pipeline/if_stage.v": {
    desc: "Instruction Fetch stage. Manages PC increment, branch target mux, stall logic, and I-cache interface.",
    deps: ["icache.v", "ctrl_unit.v"],
    code: `module if_stage (
  input  logic        clk, rst_n,
  input  logic        stall,
  input  logic        flush,
  input  logic [31:0] branch_target,
  input  logic        take_branch,
  output logic [31:0] pc_if,
  output logic [31:0] instr_if,
  // I-cache interface
  output logic [31:0] imem_addr,
  input  logic [31:0] imem_rdata,
  output logic        imem_req,
  input  logic        imem_ack
);
  logic [31:0] pc_reg, pc_next;

  always_comb begin
    if (take_branch) pc_next = branch_target;
    else             pc_next = pc_reg + 32'd4;
  end

  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n)      pc_reg <= 32'h0000_0000;
    else if (!stall) pc_reg <= pc_next;
  end

  assign imem_addr = pc_reg;
  assign imem_req  = 1'b1;
  assign pc_if     = pc_reg;
  assign instr_if  = imem_ack ? imem_rdata : 32'h0000_0013; // NOP

  // IF/ID pipeline register
  always_ff @(posedge clk) begin
    if (!rst_n || flush) begin
      pc_id    <= '0;
      instr_id <= 32'h0000_0013;
    end else if (!stall) begin
      pc_id    <= pc_if;
      instr_id <= instr_if;
    end
  end
endmodule`,
  },
  "units/alu.v": {
    desc: "32-bit ALU supporting all RV32I arithmetic, logic, shift, and comparison operations. Zero-latency combinational.",
    deps: [],
    code: `module alu #(
  parameter XLEN = 32
) (
  input  logic [XLEN-1:0] a, b,
  input  logic      [3:0] op,
  output logic [XLEN-1:0] result,
  output logic             zero,
  output logic             overflow
);
  // ALU operations (matches RV32I encoding)
  localparam ADD  = 4'b0000;
  localparam SUB  = 4'b1000;
  localparam SLL  = 4'b0001;
  localparam SLT  = 4'b0010;
  localparam SLTU = 4'b0011;
  localparam XOR  = 4'b0100;
  localparam SRL  = 4'b0101;
  localparam SRA  = 4'b1101;
  localparam OR   = 4'b0110;
  localparam AND  = 4'b0111;

  logic [XLEN:0] add_result;
  assign add_result = {1'b0, a} + {1'b0, (op[3] ? ~b + 1'b1 : b)};

  always_comb begin
    unique case (op)
      ADD, SUB: result = add_result[XLEN-1:0];
      SLL:      result = a << b[4:0];
      SLT:      result = {31'd0, $signed(a) < $signed(b)};
      SLTU:     result = {31'd0, a < b};
      XOR:      result = a ^ b;
      SRL:      result = a >> b[4:0];
      SRA:      result = $signed(a) >>> b[4:0];
      OR:       result = a | b;
      AND:      result = a & b;
      default:  result = '0;
    endcase
  end

  assign zero     = (result == '0);
  assign overflow = (op == ADD) ? (~a[XLEN-1] & ~b[XLEN-1] &  result[XLEN-1])
                                | ( a[XLEN-1] &  b[XLEN-1] & ~result[XLEN-1])
                  : 1'b0;
endmodule`,
  },
  "control/hazard_unit.v": {
    desc: "Pipeline hazard detection. Generates stall and flush signals for RAW, load-use, and branch hazards.",
    deps: [],
    code: `module hazard_unit (
  // Instruction being decoded
  input  logic [4:0] rs1_id, rs2_id,
  // Destination regs in later stages
  input  logic [4:0] rd_ex, rd_mem,
  input  logic       mem_read_ex,
  input  logic       branch_id,
  input  logic       branch_taken_ex,
  // Hazard outputs
  output logic       stall_if,
  output logic       stall_id,
  output logic       flush_ex,
  output logic       flush_if_id
);
  logic load_use_hazard;
  logic branch_hazard;

  // Load-use hazard: EX stage has a load targeting a reg
  // that ID stage needs this cycle
  always_comb begin
    load_use_hazard = mem_read_ex &&
      ((rd_ex == rs1_id) || (rd_ex == rs2_id)) &&
      (rd_ex != 5'b0);
  end

  // Branch misprediction flush
  assign branch_hazard = branch_taken_ex;

  assign stall_if  = load_use_hazard;
  assign stall_id  = load_use_hazard;
  assign flush_ex  = load_use_hazard | branch_hazard;
  assign flush_if_id = branch_hazard;
endmodule`,
  },
  "control/fwd_unit.v": {
    desc: "Forwarding (bypassing) unit. Resolves RAW hazards by routing values from MEM/WB stages back to EX inputs.",
    deps: [],
    code: `module fwd_unit (
  // Source registers of instruction in EX
  input  logic [4:0] rs1_ex, rs2_ex,
  // Destination registers in MEM and WB
  input  logic [4:0] rd_mem, rd_wb,
  input  logic       reg_write_mem,
  input  logic       reg_write_wb,
  // 2-bit mux selects: 00=RegFile, 01=MEM fwd, 10=WB fwd
  output logic [1:0] fwd_a,
  output logic [1:0] fwd_b
);
  // Forward A (rs1)
  always_comb begin
    if (reg_write_mem && (rd_mem != 5'b0) && (rd_mem == rs1_ex))
      fwd_a = 2'b10;  // MEM→EX forward (highest priority)
    else if (reg_write_wb && (rd_wb != 5'b0) && (rd_wb == rs1_ex))
      fwd_a = 2'b01;  // WB→EX forward
    else
      fwd_a = 2'b00;  // No forwarding – use register file
  end

  // Forward B (rs2)
  always_comb begin
    if (reg_write_mem && (rd_mem != 5'b0) && (rd_mem == rs2_ex))
      fwd_b = 2'b10;
    else if (reg_write_wb && (rd_wb != 5'b0) && (rd_wb == rs2_ex))
      fwd_b = 2'b01;
    else
      fwd_b = 2'b00;
  end
endmodule`,
  },
  "units/branch_pred.v": {
    desc: "2-bit saturating counter branch predictor. Per-entry history table with 256 entries, indexed by PC[9:2].",
    deps: [],
    code: `module branch_pred #(
  parameter ENTRIES  = 256,
  parameter IDX_BITS = $clog2(ENTRIES)   // 8
) (
  input  logic        clk, rst_n,
  // Prediction query (IF stage)
  input  logic [31:0] pc_if,
  output logic        predict_taken,
  // Update (EX/MEM stage)
  input  logic [31:0] pc_ex,
  input  logic        branch_ex,
  input  logic        actual_taken,
  output logic        mispredicted
);
  // 2-bit saturating counters: 00=SN, 01=WN, 10=WT, 11=ST
  logic [1:0] bht [0:ENTRIES-1];
  logic [IDX_BITS-1:0] idx_if, idx_ex;

  assign idx_if = pc_if[IDX_BITS+1:2];
  assign idx_ex = pc_ex[IDX_BITS+1:2];

  // Predict: taken if MSB of counter is 1
  assign predict_taken = bht[idx_if][1];

  // Update counter on branch resolution
  always_ff @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      foreach (bht[i]) bht[i] <= 2'b01; // Weakly Not Taken
    end else if (branch_ex) begin
      if (actual_taken)
        bht[idx_ex] <= (bht[idx_ex] == 2'b11) ? 2'b11 : bht[idx_ex] + 1;
      else
        bht[idx_ex] <= (bht[idx_ex] == 2'b00) ? 2'b00 : bht[idx_ex] - 1;
    end
  end

  assign mispredicted = branch_ex && (predict_taken != actual_taken);
endmodule`,
  },
};

const PREDICTOR_DATA: Record<string, { accuracy: number; miss: number; penalty: number; desc: string; color: string }> = {
  "always-taken":     { accuracy:64, miss:36, penalty:108, desc:"Assumes all branches are taken. Ideal for backward loop branches. High miss rate on forward conditionals.", color:"#ff3366" },
  "always-not-taken": { accuracy:36, miss:64, penalty:192, desc:"Assumes sequential flow. Fails badly on loops. Simple hardware — no state required.", color:"#ff9900" },
  "1bit":             { accuracy:82, miss:18, penalty:54,  desc:"Single saturating bit per entry. Remembers last outcome. Mispredicts loop exits and entries.", color:"#00d4ff" },
  "2bit":             { accuracy:94, miss:6,  penalty:18,  desc:"Two-bit saturating counter. Requires two consecutive mispredictions to flip prediction. Industry standard.", color:"#00ff88" },
};

const IPC_DATA = [
  { config:"Baseline", ipc:0.42, util:52 },
  { config:"+Fwding",  ipc:0.78, util:71 },
  { config:"+BPred",   ipc:1.05, util:82 },
  { config:"+Cache",   ipc:1.34, util:87 },
  { config:"Full CPU", ipc:1.87, util:94 },
];

const STAGE_UTIL = [
  { stage:"IF",  util:94, stalls:6 },
  { stage:"ID",  util:87, stalls:13 },
  { stage:"EX",  util:91, stalls:9 },
  { stage:"MEM", util:78, stalls:22 },
  { stage:"WB",  util:88, stalls:12 },
];

const BENCH_DATA = [
  { bench:"Dhrystone",  ipc:1.92, freq:200, score:384 },
  { bench:"Coremark",   ipc:1.74, freq:200, score:348 },
  { bench:"Whetstone",  ipc:1.51, freq:200, score:302 },
  { bench:"Linpack",    ipc:1.83, freq:200, score:366 },
  { bench:"EEMBC",      ipc:1.68, freq:200, score:336 },
];

const VERIFY_TESTS = [
  { name:"ALU Ops",          total:247, pass:247, fail:0,  cov:98 },
  { name:"Load / Store",     total:184, pass:184, fail:0,  cov:96 },
  { name:"Branch & Jump",    total:312, pass:311, fail:1,  cov:94 },
  { name:"Hazard Detection", total:156, pass:156, fail:0,  cov:99 },
  { name:"Forwarding Paths", total:203, pass:203, fail:0,  cov:97 },
  { name:"Pipeline Control", total:89,  pass:88,  fail:1,  cov:91 },
  { name:"CSR Operations",   total:67,  pass:67,  fail:0,  cov:88 },
  { name:"Interrupt Ctrl",   total:45,  pass:45,  fail:0,  cov:85 },
];

const PERF_FREQ = [
  { mhz:50,  ipc:1.91 }, { mhz:100, ipc:1.89 }, { mhz:150, ipc:1.87 },
  { mhz:200, ipc:1.83 }, { mhz:250, ipc:1.76 }, { mhz:300, ipc:1.65 },
  { mhz:350, ipc:1.48 },
];

// ─── UTILITY HOOK ───────────────────────────────────────────
function useVisible(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
}

// ─── SUB-COMPONENTS ─────────────────────────────────────────
function SectionLabel({ text, color = "cyan" }: { text: string; color?: "cyan" | "green" | "gold" }) {
  const cls = color === "green" ? "section-label section-label-green" : color === "gold" ? "section-label section-label-gold" : "section-label";
  return <span className={cls}>{text}</span>;
}

function StageCell({ val }: { val: string | null }) {
  if (!val) return <div className="w-12 h-7 rounded" />;
  const cls = val === "**" ? "stage-stall" : val === "IF" ? "stage-IF" : val === "ID" ? "stage-ID" : val === "EX" ? "stage-EX" : val === "ME" ? "stage-ME" : val === "WB" ? "stage-WB" : "stage-freeze";
  return (
    <div className={`w-12 h-7 rounded border pipeline-cell flex items-center justify-center ${cls}`}>
      <span className="mono text-[10px] font-bold tracking-wider">{val === "**" ? "───" : val}</span>
    </div>
  );
}

// ─── PROCESSOR SVG ───────────────────────────────────────────
function ProcessorDie() {
  return (
    <svg viewBox="0 0 440 440" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* Die package border */}
      <rect x="4" y="4" width="432" height="432" rx="8" fill="none" stroke="rgba(200,121,65,0.4)" strokeWidth="1.5" strokeDasharray="8 4" />
      <rect x="12" y="12" width="416" height="416" rx="6" fill="#0a0a0c" stroke="rgba(0,212,255,0.25)" strokeWidth="1" />

      {/* Engineering grid background */}
      <defs>
        <pattern id="dieGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
        </pattern>
        {/* Signal path gradients */}
        <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00d4ff" stopOpacity="0" />
          <stop offset="50%" stopColor="#00d4ff" stopOpacity="1" />
          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00ff88" stopOpacity="0" />
          <stop offset="50%" stopColor="#00ff88" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <rect x="12" y="12" width="416" height="416" rx="6" fill="url(#dieGrid)" />

      {/* Corner registration marks */}
      {[[22,22],[418,22],[22,418],[418,418]].map(([x,y],i) => (
        <g key={i}>
          <line x1={x-6} y1={y} x2={x+6} y2={y} stroke="rgba(200,121,65,0.5)" strokeWidth="1" />
          <line x1={x} y1={y-6} x2={x} y2={y+6} stroke="rgba(200,121,65,0.5)" strokeWidth="1" />
        </g>
      ))}

      {/* ── Functional Units ── */}

      {/* Fetch Unit — IF Stage */}
      <rect x="22" y="22" width="130" height="70" rx="3" fill="rgba(0,212,255,0.05)" stroke="rgba(0,212,255,0.35)" strokeWidth="1" className="anim-block-glow" />
      <text x="87" y="44" textAnchor="middle" fill="#00d4ff" fontSize="8" fontFamily="JetBrains Mono" fontWeight="600" letterSpacing="1">FETCH UNIT</text>
      <text x="87" y="56" textAnchor="middle" fill="rgba(0,212,255,0.5)" fontSize="7" fontFamily="JetBrains Mono">IF Stage · PC+4</text>
      <text x="87" y="68" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="6" fontFamily="JetBrains Mono">32-bit RISC-V ISA</text>
      <rect x="30" y="78" width="8" height="8" rx="1" fill="rgba(0,212,255,0.3)" />
      <rect x="42" y="78" width="8" height="8" rx="1" fill="rgba(0,212,255,0.3)" />
      <rect x="54" y="78" width="8" height="8" rx="1" fill="rgba(0,212,255,0.2)" />

      {/* Branch Predictor */}
      <rect x="162" y="22" width="130" height="70" rx="3" fill="rgba(0,255,136,0.05)" stroke="rgba(0,255,136,0.3)" strokeWidth="1" className="anim-green-glow" />
      <text x="227" y="44" textAnchor="middle" fill="#00ff88" fontSize="8" fontFamily="JetBrains Mono" fontWeight="600" letterSpacing="1">BRANCH PRED</text>
      <text x="227" y="56" textAnchor="middle" fill="rgba(0,255,136,0.5)" fontSize="7" fontFamily="JetBrains Mono">2-bit Saturating BHT</text>
      <text x="227" y="68" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="6" fontFamily="JetBrains Mono">256-entry · 94% accuracy</text>
      {[0,1,2,3].map(i => (
        <rect key={i} x={172 + i*22} y="78" width="16" height="8" rx="1"
          fill={i < 3 ? "rgba(0,255,136,0.4)" : "rgba(0,255,136,0.15)"} />
      ))}

      {/* L1 I-Cache */}
      <rect x="302" y="22" width="126" height="70" rx="3" fill="rgba(200,121,65,0.05)" stroke="rgba(200,121,65,0.3)" strokeWidth="1" />
      <text x="365" y="44" textAnchor="middle" fill="#c87941" fontSize="8" fontFamily="JetBrains Mono" fontWeight="600" letterSpacing="1">L1 I-CACHE</text>
      <text x="365" y="56" textAnchor="middle" fill="rgba(200,121,65,0.5)" fontSize="7" fontFamily="JetBrains Mono">16KB · 4-way SA</text>
      <text x="365" y="68" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="6" fontFamily="JetBrains Mono">1-cycle hit · VIPT</text>

      {/* Decode + Register File */}
      <rect x="22" y="104" width="200" height="80" rx="3" fill="rgba(0,212,255,0.04)" stroke="rgba(0,212,255,0.2)" strokeWidth="1" />
      <text x="122" y="124" textAnchor="middle" fill="rgba(0,212,255,0.8)" fontSize="8" fontFamily="JetBrains Mono" fontWeight="600" letterSpacing="1">DECODE UNIT</text>
      <text x="122" y="136" textAnchor="middle" fill="rgba(0,212,255,0.4)" fontSize="7" fontFamily="JetBrains Mono">ID Stage · RV32I/M/C</text>
      <text x="122" y="148" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="6" fontFamily="JetBrains Mono">Imm-gen · ctrl decode</text>
      {/* Opcode field illustration */}
      {["[6:0]","[11:7]","[14:12]","[19:15]","[24:20]"].map((f, i) => (
        <rect key={i} x={28 + i * 38} y="158" width="32" height="16" rx="1"
          fill={i===0?"rgba(0,212,255,0.2)":i===2?"rgba(0,255,136,0.15)":"rgba(255,255,255,0.05)"}
          stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      ))}

      {/* Register File */}
      <rect x="232" y="104" width="196" height="80" rx="3" fill="rgba(200,121,65,0.04)" stroke="rgba(200,121,65,0.25)" strokeWidth="1" />
      <text x="330" y="124" textAnchor="middle" fill="rgba(200,121,65,0.8)" fontSize="8" fontFamily="JetBrains Mono" fontWeight="600" letterSpacing="1">REGISTER FILE</text>
      <text x="330" y="136" textAnchor="middle" fill="rgba(200,121,65,0.4)" fontSize="7" fontFamily="JetBrains Mono">x0–x31 · 32×32-bit</text>
      {/* Register grid */}
      {Array.from({length:16}).map((_,i) => (
        <rect key={i} x={238 + (i%8)*23} y={148 + Math.floor(i/8)*12} width="18" height="9" rx="1"
          fill={i===0?"rgba(255,255,255,0.05)":i===1||i===4?"rgba(0,212,255,0.15)":"rgba(255,255,255,0.03)"}
          stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />
      ))}

      {/* ALU */}
      <rect x="22" y="196" width="120" height="90" rx="3" fill="rgba(255,153,0,0.05)" stroke="rgba(255,153,0,0.3)" strokeWidth="1" />
      <text x="82" y="218" textAnchor="middle" fill="#ff9900" fontSize="8" fontFamily="JetBrains Mono" fontWeight="600" letterSpacing="1">ALU · EX STAGE</text>
      <text x="82" y="230" textAnchor="middle" fill="rgba(255,153,0,0.5)" fontSize="7" fontFamily="JetBrains Mono">Add·Sub·And·Or</text>
      <text x="82" y="242" textAnchor="middle" fill="rgba(255,153,0,0.5)" fontSize="7" fontFamily="JetBrains Mono">Xor·Sll·Srl·Sra</text>
      <text x="82" y="254" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="6" fontFamily="JetBrains Mono">Slt·Sltu·32-bit</text>
      <path d="M 40 268 L 55 278 L 55 280 L 40 280 Z" fill="rgba(255,153,0,0.2)" stroke="rgba(255,153,0,0.4)" strokeWidth="0.8" />
      <path d="M 120 268 L 105 278 L 105 280 L 120 280 Z" fill="rgba(255,153,0,0.2)" stroke="rgba(255,153,0,0.4)" strokeWidth="0.8" />
      <rect x="50" y="268" width="60" height="12" rx="2" fill="rgba(255,153,0,0.3)" stroke="rgba(255,153,0,0.5)" strokeWidth="0.8" />

      {/* Forwarding Unit */}
      <rect x="152" y="196" width="120" height="90" rx="3" fill="rgba(0,212,255,0.04)" stroke="rgba(0,212,255,0.2)" strokeWidth="1" />
      <text x="212" y="216" textAnchor="middle" fill="rgba(0,212,255,0.7)" fontSize="7.5" fontFamily="JetBrains Mono" fontWeight="600" letterSpacing="1">FORWARD UNIT</text>
      <text x="212" y="228" textAnchor="middle" fill="rgba(0,212,255,0.4)" fontSize="7" fontFamily="JetBrains Mono">EX-EX · MEM-EX</text>
      <text x="212" y="240" textAnchor="middle" fill="rgba(0,212,255,0.4)" fontSize="7" fontFamily="JetBrains Mono">WB-EX bypass</text>
      {/* Forwarding path visualization */}
      <path d="M 160 260 C 160 270, 260 270, 260 260" fill="none" stroke="rgba(0,212,255,0.3)" strokeWidth="1" strokeDasharray="3 2" />
      <circle cx="212" cy="270" r="3" fill="rgba(0,212,255,0.5)" className="anim-pulse" />

      {/* Memory Stage / D-Cache */}
      <rect x="282" y="196" width="146" height="90" rx="3" fill="rgba(255,51,102,0.05)" stroke="rgba(255,51,102,0.3)" strokeWidth="1" />
      <text x="355" y="218" textAnchor="middle" fill="#ff3366" fontSize="8" fontFamily="JetBrains Mono" fontWeight="600" letterSpacing="1">MEM STAGE</text>
      <text x="355" y="230" textAnchor="middle" fill="rgba(255,51,102,0.5)" fontSize="7" fontFamily="JetBrains Mono">L1 D-Cache · 16KB</text>
      <text x="355" y="242" textAnchor="middle" fill="rgba(255,51,102,0.5)" fontSize="7" fontFamily="JetBrains Mono">4-way SA · LRU</text>
      <text x="355" y="254" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="6" fontFamily="JetBrains Mono">Load·Store·AMO</text>
      {/* Cache way visualization */}
      {[0,1,2,3].map(i => (
        <rect key={i} x={290 + i*32} y="262" width="26" height="18" rx="1"
          fill={i<3?"rgba(255,51,102,0.15)":"rgba(255,51,102,0.05)"}
          stroke="rgba(255,51,102,0.25)" strokeWidth="0.5" />
      ))}

      {/* Hazard Detection */}
      <rect x="22" y="298" width="180" height="60" rx="3" fill="rgba(255,51,102,0.04)" stroke="rgba(255,51,102,0.2)" strokeWidth="1" />
      <text x="112" y="318" textAnchor="middle" fill="rgba(255,51,102,0.7)" fontSize="8" fontFamily="JetBrains Mono" fontWeight="600" letterSpacing="1">HAZARD DETECT</text>
      <text x="112" y="330" textAnchor="middle" fill="rgba(255,51,102,0.4)" fontSize="7" fontFamily="JetBrains Mono">RAW · WAR · WAW</text>
      <text x="112" y="342" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="6" fontFamily="JetBrains Mono">Load-use · Branch flush</text>

      {/* Writeback */}
      <rect x="212" y="298" width="216" height="60" rx="3" fill="rgba(200,121,65,0.04)" stroke="rgba(200,121,65,0.2)" strokeWidth="1" />
      <text x="320" y="318" textAnchor="middle" fill="rgba(200,121,65,0.7)" fontSize="8" fontFamily="JetBrains Mono" fontWeight="600" letterSpacing="1">WRITEBACK · WB STAGE</text>
      <text x="320" y="330" textAnchor="middle" fill="rgba(200,121,65,0.4)" fontSize="7" fontFamily="JetBrains Mono">Reg-write · CSR · MUX</text>
      <text x="320" y="342" textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="6" fontFamily="JetBrains Mono">1 CPI target · zero-stall</text>

      {/* L2 Unified Cache */}
      <rect x="22" y="370" width="406" height="58" rx="3" fill="rgba(200,121,65,0.04)" stroke="rgba(200,121,65,0.2)" strokeWidth="1" />
      <text x="225" y="392" textAnchor="middle" fill="rgba(200,121,65,0.6)" fontSize="8" fontFamily="JetBrains Mono" fontWeight="600" letterSpacing="1">L2 UNIFIED CACHE · 256KB · 8-WAY SET-ASSOCIATIVE · MESI COHERENCY</text>
      <text x="225" y="404" textAnchor="middle" fill="rgba(200,121,65,0.3)" fontSize="7" fontFamily="JetBrains Mono">4-cycle hit · 64-byte cache lines · Write-back · Write-allocate</text>
      <text x="225" y="416" textAnchor="middle" fill="rgba(255,255,255,0.15)" fontSize="6" fontFamily="JetBrains Mono">Pseudo-LRU replacement · Critical-word-first fill</text>

      {/* ── Pipeline Register Lines ── */}
      {/* IF→ID */}
      <line x1="152" y1="22" x2="152" y2="193" stroke="rgba(0,212,255,0.15)" strokeWidth="1" strokeDasharray="4 4" />
      {/* ID→EX */}
      <line x1="22" y1="193" x2="428" y2="193" stroke="rgba(0,212,255,0.12)" strokeWidth="0.8" />
      {/* EX→MEM */}
      <line x1="280" y1="196" x2="280" y2="360" stroke="rgba(0,212,255,0.12)" strokeWidth="0.8" strokeDasharray="4 4" />
      {/* MEM→WB */}
      <line x1="22" y1="360" x2="428" y2="360" stroke="rgba(0,212,255,0.1)" strokeWidth="0.8" />

      {/* ── Animated Signal Paths ── */}
      {/* Instruction flow: Fetch → Decode */}
      <path d="M 87 92 L 87 104" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="80 80" className="anim-signal"
        filter="url(#glow)" />
      {/* Data path: Decode → ALU */}
      <path d="M 82 184 L 82 196" stroke="#ff9900" strokeWidth="1.5" strokeDasharray="60 60" className="anim-signal2"
        filter="url(#glow)" />
      {/* Forwarding feedback */}
      <path d="M 355 286 C 355 320, 200 320, 200 286" stroke="#00d4ff" strokeWidth="1" strokeDasharray="120 120"
        className="anim-signal3" filter="url(#glow)" fill="none" />
      {/* Memory → L2 */}
      <path d="M 355 286 L 355 370" stroke="#ff3366" strokeWidth="1.2" strokeDasharray="80 80" className="anim-signal2"
        filter="url(#glow)" />
      {/* WB → RegFile */}
      <path d="M 280 358 C 280 280, 350 280, 350 184" stroke="#c87941" strokeWidth="1" strokeDasharray="200 200"
        className="anim-signal3" fill="none" filter="url(#glow)" />

      {/* Moving signal dots */}
      <circle r="3" fill="#00d4ff" filter="url(#glow)" className="anim-signal">
        <animateMotion dur="2.8s" repeatCount="indefinite" path="M 87 92 L 87 104" />
      </circle>
      <circle r="2.5" fill="#ff9900" filter="url(#glow)" className="anim-signal2">
        <animateMotion dur="3.5s" repeatCount="indefinite" path="M 82 184 L 82 196" />
      </circle>
      <circle r="2" fill="#c87941" filter="url(#glow)">
        <animateMotion dur="4s" repeatCount="indefinite"
          path="M 280 358 C 280 280, 350 280, 350 184" />
      </circle>

      {/* Active clock domain indicators */}
      <circle cx="87" cy="16" r="3" fill="#00d4ff" className="anim-pulse" />
      <circle cx="227" cy="16" r="3" fill="#00ff88" className="anim-pulse" style={{animationDelay:"0.7s"}} />
      <circle cx="355" cy="16" r="3" fill="#c87941" className="anim-pulse" style={{animationDelay:"1.4s"}} />
    </svg>
  );
}

// ─── NAVBAR ──────────────────────────────────────────────────
const NAV_LINKS = [
  { label:"Architecture", href:"#overview" },
  { label:"Pipeline",     href:"#pipeline" },
  { label:"RTL Explorer", href:"#rtl" },
  { label:"Hazard Lab",   href:"#hazard" },
  { label:"Performance",  href:"#perf" },
  { label:"Verification", href:"#verify" },
  { label:"Demo Video",   href:"#demo" },
];

function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-[#080809]/90 backdrop-blur-xl border-b border-white/5" : ""}`}>
      <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded border border-[#00d4ff]/40 flex items-center justify-center">
            <Cpu size={14} className="text-[#00d4ff]" />
          </div>
          <span className="mono text-sm font-semibold text-white tracking-wide">QuantumRISC</span>
          <span className="mono text-[10px] text-[#00d4ff]/50 ml-1">STUDIO</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} className="nav-link text-[13px] text-[#606070] hover:text-[#f0f0f2] transition-colors duration-200">
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <a href="https://github.com/IamChandu114/-QuantumRISC" target="_blank" rel="noreferrer"
            className="btn-ghost px-3 py-1.5 rounded text-xs flex items-center gap-2">
            <Github size={13} /> GitHub
          </a>
          <a
            href="https://quantum-risc-fzm5.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="btn-primary px-4 py-1.5 rounded text-xs inline-flex items-center"
          >
            Launch Studio
          </a>
        </div>
      </div>
    </nav>
  );
}

// ─── HERO SECTION ────────────────────────────────────────────
function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16" id="hero">
      {/* Background layers */}
      <div className="absolute inset-0 eng-grid-move anim-grid opacity-100" />
      <div className="absolute inset-0 bg-radial-[at_50%_30%] from-[#00d4ff]/5 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-radial-[at_70%_70%] from-[#00ff88]/3 via-transparent to-transparent" />

      {/* Floating particles */}
      {Array.from({length:20}).map((_,i) => (
        <div key={i} className="particle w-1 h-1 rounded-full bg-[#00d4ff]"
          style={{
            left:`${10 + (i*37)%80}%`,
            top:`${20 + (i*53)%60}%`,
            "--tx":`${((i%5)-2)*30}px`,
            "--ty":`${-40 - (i%4)*20}px`,
            "--dur":`${3 + (i%4)}s`,
            "--delay":`${(i * 0.4)%4}s`,
            opacity:0.4,
            width:"2px",
            height:"2px",
          } as React.CSSProperties}
        />
      ))}

      {/* Main content */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-8 grid lg:grid-cols-2 gap-16 items-center w-full">
        {/* Left: Text */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-px w-8 bg-[#00d4ff]" />
            <SectionLabel text="RISC-V · RV32IMAC · 5-STAGE PIPELINE" />
          </div>
          <div>
            <h1 className="text-[72px] font-black leading-[0.9] tracking-tight text-white" style={{fontFamily:"'Inter', sans-serif"}}>
              Quantum<span className="text-[#00d4ff] glow-text-cyan">RISC</span>
            </h1>
            <h1 className="text-[72px] font-black leading-[0.9] tracking-tight text-white mb-4">
              Studio
            </h1>
            <p className="text-[16px] text-[#606070] leading-relaxed max-w-lg font-light">
              A professional-grade, fully-verified RISC-V processor implementation featuring
              a 5-stage in-order pipeline, comprehensive hazard detection, two-bit branch
              prediction, and multi-level cache hierarchy.
            </p>
          </div>

          {/* Specs bar */}
          <div className="flex flex-wrap gap-4">
            {[
              ["RV32IMAC","ISA"],["5-Stage","Pipeline"],["200 MHz","Synthesis"],
              ["1.87 IPC","Peak"],["256KB","L2 Cache"],["94%","Branch Acc"],
            ].map(([val,label]) => (
              <div key={label} className="glass px-4 py-2 rounded">
                <div className="mono text-[13px] font-bold text-[#00d4ff]">{val}</div>
                <div className="mono text-[9px] text-[#404050] mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <a href="#overview" className="btn-primary px-6 py-3 rounded flex items-center gap-2 text-sm">
              <Cpu size={15} /> Explore Architecture
            </a>
            <a href="#pipeline" className="btn-outline px-6 py-3 rounded flex items-center gap-2 text-sm">
              <Activity size={15} /> Pipeline Visualizer
            </a>
            <a href="#rtl" className="btn-ghost px-6 py-3 rounded flex items-center gap-2 text-sm">
              <Code2 size={15} /> RTL Explorer
            </a>
            <a href="https://github.com/IamChandu114/-QuantumRISC" target="_blank" rel="noreferrer"
              className="btn-ghost px-6 py-3 rounded flex items-center gap-2 text-sm">
              <Github size={15} /> Source
            </a>
          </div>
        </div>

        {/* Right: Processor Die */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-radial-[at_50%_50%] from-[#00d4ff]/10 via-transparent to-transparent rounded-full" />
          <div className="relative w-full max-w-[460px] anim-float-slow" style={{filter:"drop-shadow(0 0 40px rgba(0,212,255,0.15))"}}>
            <ProcessorDie />
          </div>
          {/* Corner labels */}
          <div className="absolute top-2 left-2 mono text-[9px] text-[#c87941]/40">QuantumRISC v2.1</div>
          <div className="absolute top-2 right-2 mono text-[9px] text-[#c87941]/40">RV32IMAC</div>
          <div className="absolute bottom-2 left-2 mono text-[9px] text-[#606070]/40">TSMC 28nm</div>
          <div className="absolute bottom-2 right-2 mono text-[9px] text-[#606070]/40">1.2V CORE</div>
        </div>
      </div>

      {/* Bottom scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
        <span className="mono text-[10px] text-[#606070] tracking-widest">SCROLL TO EXPLORE</span>
        <ChevronDown size={14} className="text-[#00d4ff] animate-bounce" />
      </div>
    </section>
  );
}

// ─── CPU OVERVIEW ────────────────────────────────────────────
function CPUOverviewSection() {
  const { ref, visible } = useVisible();
  const stages = [
    { name:"IF", full:"Instruction Fetch",  color:"#00d4ff", desc:"PC register, I-cache interface, branch target mux, stall/flush control." },
    { name:"ID", full:"Decode & Reg-Read",  color:"#00ff88", desc:"Instruction decode, immediate generation, register file read (2 ports)." },
    { name:"EX", full:"Execute",            color:"#ff9900", desc:"ALU, MUX for forwarded operands, branch condition evaluation, PC adder." },
    { name:"MEM","full":"Memory Access",    color:"#ff3366", desc:"L1 D-cache read/write, sign-extension for loads, AMO operation support." },
    { name:"WB", full:"Write-Back",         color:"#c87941", desc:"Result mux (ALU/MEM/PC+4/CSR), register file write-port, CSR update." },
  ];
  return (
    <section id="overview" className="relative py-40 px-8" ref={ref}>
      <div className="max-w-[1200px] mx-auto">
        <div className={`mb-20 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <SectionLabel text="01 · CPU ARCHITECTURE" />
          <h2 className="text-5xl font-black text-white mt-4 mb-6 leading-tight">
            Five-stage in-order<br />scalar pipeline.
          </h2>
          <p className="text-[#606070] text-lg max-w-2xl leading-relaxed">
            Implements the RV32IMAC instruction set architecture with full pipeline
            interlocking, data forwarding paths, and precise exception handling.
          </p>
        </div>

        {/* Pipeline stage flow */}
        <div className="flex flex-col md:flex-row gap-0 mb-20">
          {stages.map((s, i) => (
            <div key={s.name} className="flex-1 flex flex-col md:flex-row items-stretch">
              <div className={`flex-1 p-6 border rounded-sm glass transition-all duration-700 hover:scale-[1.02]
                ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ borderColor:`${s.color}25`, transitionDelay:`${i*100}ms`,
                  background:`${s.color}06`, boxShadow:`0 0 30px ${s.color}08` }}>
                <div className="mono text-[28px] font-black mb-1" style={{color:s.color}}>{s.name}</div>
                <div className="text-[11px] text-[#606070] mono mb-3">{s.full}</div>
                <p className="text-[13px] text-[#808090] leading-relaxed">{s.desc}</p>
              </div>
              {i < stages.length - 1 && (
                <div className="hidden md:flex items-center px-2 text-[#303040]">
                  <ArrowRight size={16} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { val:"200 MHz", label:"Max Clock Frequency", sub:"Post-synthesis · Xilinx Artix-7", color:"#00d4ff" },
            { val:"1.87",    label:"Peak IPC",            sub:"SPEC benchmark · full config",    color:"#00ff88" },
            { val:"2,847",   label:"Logic Cells (LUTs)",  sub:"FPGA resource utilization",       color:"#c87941" },
            { val:"<0.8 W",  label:"Power Estimate",      sub:"1.2V · 200 MHz · typical load",  color:"#ff3366" },
          ].map(m => (
            <div key={m.label} className="glass p-6 rounded-sm" style={{borderColor:`${m.color}20`}}>
              <div className="mono text-3xl font-black mb-1" style={{color:m.color}}>{m.val}</div>
              <div className="text-[12px] text-[#e0e0e8] font-medium mb-1">{m.label}</div>
              <div className="mono text-[10px] text-[#404050]">{m.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── INSTRUCTION LIFECYCLE ───────────────────────────────────
function InstructionLifecycleSection() {
  const { ref, visible } = useVisible(0.1);
  const steps = [
    { n:"01", title:"Instruction Fetch",   icon:<Binary size={20}/>, color:"#00d4ff",
      desc:"PC drives the I-cache. On a hit, the 32-bit instruction word is latched into the IF/ID pipeline register. PC increments by 4. Branch predictor provides speculative next-PC." },
    { n:"02", title:"Decode & Register Read", icon:<Layers size={20}/>, color:"#00ff88",
      desc:"Control unit decodes opcode, funct3, funct7 fields. Immediate generator sign-extends the encoded immediate. Register file provides rs1 and rs2 values in a single cycle." },
    { n:"03", title:"Execute",             icon:<Zap size={20}/>,    color:"#ff9900",
      desc:"ALU computes result or effective address. Forwarding MUXes select between register-file output and forwarded values from MEM/WB stages. Branch condition is evaluated here." },
    { n:"04", title:"Memory Access",       icon:<Database size={20}/>,color:"#ff3366",
      desc:"Load instructions read from D-cache. Store instructions write to D-cache. On cache miss, the pipeline stalls until the fill completes. AMO ops use atomic primitives." },
    { n:"05", title:"Write-Back",          icon:<Check size={20}/>,  color:"#c87941",
      desc:"Result (ALU, load data, or PC+4 for JAL/JALR) is written to the destination register in the register file. CSR instructions update the control-status register file." },
  ];
  return (
    <section className="relative py-32 px-8 eng-grid" ref={ref}>
      <div className="max-w-[900px] mx-auto">
        <div className={`mb-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <SectionLabel text="02 · INSTRUCTION LIFECYCLE" />
          <h2 className="text-4xl font-black text-white mt-4 leading-tight">
            How every instruction travels<br />through the machine.
          </h2>
        </div>
        <div className="space-y-0">
          {steps.map((s, i) => (
            <div key={s.n}
              className={`flex gap-8 transition-all duration-700 ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}
              style={{transitionDelay:`${i*120}ms`}}>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0"
                  style={{background:`${s.color}15`,border:`1px solid ${s.color}30`,color:s.color}}>
                  {s.icon}
                </div>
                {i < steps.length - 1 && <div className="w-px flex-1 my-2" style={{background:`${s.color}20`}} />}
              </div>
              <div className="pb-10 pt-1 flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="mono text-[10px]" style={{color:s.color}}>{s.n}</span>
                  <h3 className="text-[16px] font-bold text-white">{s.title}</h3>
                  <div className="h-px flex-1" style={{background:`${s.color}15`}} />
                </div>
                <p className="text-[14px] text-[#606070] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── PIPELINE VISUALIZER ─────────────────────────────────────
function PipelineSection() {
  const { ref, visible } = useVisible();
  const [fwd, setFwd] = useState(true);
  const [cycle, setCycle] = useState(0);
  const [running, setRunning] = useState(false);
  const timing = fwd ? TIMING_FWD : TIMING_NOFWD;
  const totalCycles = timing[0].length;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setCycle(c => { if (c >= totalCycles - 1) { setRunning(false); return c; } return c + 1; });
    }, 700);
    return () => clearInterval(t);
  }, [running, totalCycles]);

  const stalls = timing.flat().filter(c => c === "**").length;
  const freezes = timing.flat().filter(c => c === "IF" && timing.flat().indexOf(c) > 5).length;

  return (
    <section id="pipeline" className="relative py-32 px-8" ref={ref}>
      <div className="max-w-[1200px] mx-auto">
        <div className={`mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <SectionLabel text="03 · PIPELINE TIMING DIAGRAM" />
          <div className="flex flex-col md:flex-row md:items-end gap-6 mt-4">
            <div className="flex-1">
              <h2 className="text-4xl font-black text-white mb-3 leading-tight">
                Interactive pipeline<br />timing analysis.
              </h2>
              <p className="text-[#606070] text-[14px] leading-relaxed max-w-xl">
                Observe how instructions flow through all five pipeline stages. Toggle data
                forwarding to see how stall cycles are eliminated by EX-EX and MEM-EX bypass paths.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Forwarding toggle */}
              <button onClick={() => { setFwd(!fwd); setCycle(0); setRunning(false); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded border text-sm mono transition-all duration-300
                  ${fwd ? "bg-[#00ff88]/10 border-[#00ff88]/40 text-[#00ff88]" : "bg-[#ff3366]/10 border-[#ff3366]/40 text-[#ff3366]"}`}>
                {fwd ? <Unlock size={13}/> : <Lock size={13}/>}
                {fwd ? "Forwarding ON" : "Forwarding OFF"}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass p-4 rounded-sm border-l-2 border-[#00d4ff]">
            <div className="mono text-2xl font-black text-[#00d4ff]">{totalCycles}</div>
            <div className="mono text-[10px] text-[#606070] mt-0.5">TOTAL CYCLES</div>
          </div>
          <div className={`glass p-4 rounded-sm border-l-2 ${stalls > 0 ? "border-[#ff3366]" : "border-[#00ff88]"}`}>
            <div className={`mono text-2xl font-black ${stalls > 0 ? "text-[#ff3366]" : "text-[#00ff88]"}`}>
              {fwd ? 0 : stalls}
            </div>
            <div className="mono text-[10px] text-[#606070] mt-0.5">STALL CYCLES</div>
          </div>
          <div className="glass p-4 rounded-sm border-l-2 border-[#c87941]">
            <div className="mono text-2xl font-black text-[#c87941]">
              {(INSTRS.length / totalCycles).toFixed(2)}
            </div>
            <div className="mono text-[10px] text-[#606070] mt-0.5">IPC (THIS TRACE)</div>
          </div>
        </div>

        {/* Main diagram */}
        <div className="glass rounded-sm overflow-hidden">
          {/* Header row */}
          <div className="border-b border-white/5 p-4 flex items-center gap-4">
            {/* Controls */}
            <div className="flex items-center gap-2">
              <button onClick={() => setCycle(Math.max(0, cycle-1))}
                className="w-7 h-7 rounded border border-white/10 flex items-center justify-center text-[#606070] hover:text-white hover:border-[#00d4ff]/40 transition-colors">
                <ChevronRight size={12} className="rotate-180" />
              </button>
              <button onClick={() => setRunning(!running)}
                className={`w-7 h-7 rounded border flex items-center justify-center transition-all duration-200
                  ${running ? "border-[#ff3366]/40 text-[#ff3366]" : "border-[#00d4ff]/40 text-[#00d4ff]"}`}>
                {running ? <Pause size={12}/> : <Play size={12}/>}
              </button>
              <button onClick={() => setCycle(Math.min(totalCycles-1, cycle+1))}
                className="w-7 h-7 rounded border border-white/10 flex items-center justify-center text-[#606070] hover:text-white hover:border-[#00d4ff]/40 transition-colors">
                <SkipForward size={12}/>
              </button>
              <button onClick={() => { setCycle(0); setRunning(false); }}
                className="w-7 h-7 rounded border border-white/10 flex items-center justify-center text-[#606070] hover:text-white transition-colors">
                <RefreshCw size={12}/>
              </button>
            </div>
            <div className="h-5 w-px bg-white/5" />
            <span className="mono text-[11px] text-[#606070]">CYCLE</span>
            <div className="anim-clock w-3 h-3 rounded-sm" />
            <span className="mono text-[13px] font-bold text-[#00d4ff]">{cycle + 1}</span>
            <span className="mono text-[11px] text-[#404050]">/ {totalCycles}</span>
            <div className="flex-1" />
            {/* Stage legend */}
            {[["IF","#00d4ff"],["ID","#00ff88"],["EX","#ff9900"],["ME","#ff3366"],["WB","#c87941"],["───","#555565"]].map(([s,c]) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm" style={{background:c+"40",border:`1px solid ${c}80`}} />
                <span className="mono text-[9px]" style={{color:c}}>{s}</span>
              </div>
            ))}
          </div>

          {/* Cycle column headers */}
          <div className="overflow-x-auto">
            <div className="min-w-fit">
              <div className="flex border-b border-white/5">
                <div className="w-72 flex-shrink-0 px-4 py-2 mono text-[10px] text-[#303040]">INSTRUCTION</div>
                {Array.from({length:totalCycles}).map((_,i) => (
                  <div key={i} className={`w-14 flex-shrink-0 flex items-center justify-center py-2 mono text-[10px] transition-all duration-300
                    ${i === cycle ? "text-[#00d4ff] bg-[#00d4ff]/5" : "text-[#303040]"}`}>
                    C{i+1}
                  </div>
                ))}
              </div>

              {/* Instruction rows */}
              {INSTRS.map((instr, ii) => (
                <div key={instr.id} className="flex items-center border-b border-white/3 hover:bg-white/[0.01] transition-colors group">
                  <div className="w-72 flex-shrink-0 px-4 py-2.5 flex items-center gap-3">
                    <div className="w-1.5 h-7 rounded-sm flex-shrink-0" style={{background:instr.color+"60"}} />
                    <div>
                      <div className="mono text-[12px] text-[#c0c0d0] font-medium">{instr.asm}</div>
                      <div className="mono text-[10px] text-[#404050] mt-0.5">{instr.note}</div>
                    </div>
                  </div>
                  {timing[ii].map((val, ci) => (
                    <div key={ci} className={`w-14 flex-shrink-0 flex items-center justify-center py-2 transition-all duration-300
                      ${ci === cycle ? "bg-[#00d4ff]/5" : ""}`}>
                      <div className={ci === cycle && val && val !== "**" && val !== "IF" && timing[ii][ci-1] === "IF" ? "scale-110" : ""}>
                        <StageCell val={val} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Current stage activity summary */}
          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="mono text-[10px] text-[#404050]">CYCLE {cycle+1} ACTIVITY:</span>
              {INSTRS.map((instr, ii) => {
                const stage = timing[ii][cycle];
                if (!stage) return null;
                const cls = stage === "**" ? "text-[#555565]" : stage === "IF" ? "text-[#00d4ff]" : stage === "ID" ? "text-[#00ff88]" : stage === "EX" ? "text-[#ff9900]" : stage === "ME" ? "text-[#ff3366]" : "text-[#c87941]";
                return (
                  <span key={ii} className={`mono text-[10px] ${cls} flex items-center gap-1`}>
                    <span className="opacity-40">I{ii}</span> {stage === "**" ? "STALL" : stage}
                  </span>
                );
              })}
              {!fwd && stalls > 0 && (
                <span className="mono text-[10px] text-[#ff3366] ml-2 flex items-center gap-1">
                  <AlertTriangle size={10} /> {stalls} stall cycles inserted (no forwarding)
                </span>
              )}
              {fwd && (
                <span className="mono text-[10px] text-[#00ff88] ml-2 flex items-center gap-1">
                  <Zap size={10} /> Forwarding active — zero RAW stalls
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── RTL EXPLORER ────────────────────────────────────────────
function RTLExplorerSection() {
  const { ref, visible } = useVisible();
  const [selectedFile, setSelectedFile] = useState("cpu_top.v");
  const [expanded, setExpanded] = useState(new Set(["pipeline","units","control","memory"]));

  const toggleFolder = (name: string) => {
    setExpanded(prev => {
      const n = new Set(prev);
      n.has(name) ? n.delete(name) : n.add(name);
      return n;
    });
  };

  const fileData = RTL_CODE[selectedFile];

  const renderTree = (nodes: typeof RTL_TREE, depth = 0) =>
    nodes.map(node => {
      if (node.type === "folder") {
        const open = expanded.has(node.name);
        return (
          <div key={node.name}>
            <div className="file-item flex items-center gap-2 px-3 py-1.5 rounded-sm cursor-pointer"
              onClick={() => toggleFolder(node.name)}
              style={{paddingLeft:`${12 + depth*12}px`}}>
              {open ? <FolderOpen size={12} className="text-[#c87941]"/> : <Folder size={12} className="text-[#c87941]/60"/>}
              <span className="mono text-[11px] text-[#808080]">{node.name}/</span>
              <ChevronRight size={10} className={`text-[#404040] ml-auto transition-transform ${open?"rotate-90":""}`}/>
            </div>
            {open && node.children && renderTree(node.children, depth+1)}
          </div>
        );
      }
      const isActive = selectedFile === node.path;
      return (
        <div key={node.path}
          className={`file-item flex items-center gap-2 px-3 py-1.5 rounded-sm ${isActive?"active":""}`}
          onClick={() => setSelectedFile(node.path!)}
          style={{paddingLeft:`${12 + depth*12}px`}}>
          <FileCode size={11} className={isActive?"text-[#00d4ff]":"text-[#404050]"}/>
          <span className={`mono text-[11px] ${isActive?"text-[#00d4ff]":"text-[#606070]"}`}>{node.name}</span>
          <span className="mono text-[9px] text-[#303040] ml-auto">{node.size}</span>
        </div>
      );
    });

  return (
    <section id="rtl" className="relative py-32 px-8 eng-grid" ref={ref}>
      <div className="max-w-[1400px] mx-auto">
        <div className={`mb-12 transition-all duration-700 ${visible?"opacity-100 translate-y-0":"opacity-0 translate-y-8"}`}>
          <SectionLabel text="04 · RTL SOURCE EXPLORER" />
          <h2 className="text-4xl font-black text-white mt-4 mb-3 leading-tight">
            Explore the SystemVerilog<br />source hierarchy.
          </h2>
          <p className="text-[#606070] text-[14px] max-w-xl">
            Browse the complete RTL source tree. Click any module to inspect its implementation,
            interface declarations, and inter-module dependencies.
          </p>
        </div>

        <div className={`glass rounded-sm overflow-hidden transition-all duration-700 ${visible?"opacity-100 translate-y-0":"opacity-0 translate-y-8"}`}
          style={{transitionDelay:"200ms"}}>
          {/* Window chrome */}
          <div className="border-b border-white/5 px-4 py-3 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff3366]/60" />
              <div className="w-3 h-3 rounded-full bg-[#ff9900]/60" />
              <div className="w-3 h-3 rounded-full bg-[#00ff88]/60" />
            </div>
            <div className="flex-1 mx-4 glass px-3 py-1 rounded-sm flex items-center gap-2">
              <span className="mono text-[10px] text-[#404050]">~/quantumrisc-studio/rtl/</span>
              <span className="mono text-[11px] text-[#00d4ff]">{selectedFile}</span>
            </div>
            <div className="flex items-center gap-4 mono text-[10px] text-[#404050]">
              <span className="flex items-center gap-1"><span className="text-[#00d4ff]">●</span> SystemVerilog</span>
              <span>UTF-8</span>
              <span>LF</span>
            </div>
          </div>

          <div className="flex" style={{height:"520px"}}>
            {/* Sidebar */}
            <div className="w-56 border-r border-white/5 flex-shrink-0 overflow-y-auto py-2">
              <div className="px-3 py-1.5 mono text-[9px] text-[#303040] uppercase tracking-widest">Explorer</div>
              <div className="px-3 py-1 mono text-[9px] text-[#404050] uppercase tracking-widest mb-1">QuantumRISC Studio</div>
              {renderTree(RTL_TREE)}
            </div>

            {/* Code view */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* File description */}
              {fileData && (
                <div className="border-b border-white/5 px-5 py-3 bg-[#00d4ff]/3">
                  <div className="mono text-[11px] text-[#00d4ff] font-semibold mb-1">{selectedFile}</div>
                  <div className="text-[12px] text-[#606070] leading-snug mb-2">{fileData.desc}</div>
                  {fileData.deps.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="mono text-[9px] text-[#404050]">DEPENDS ON:</span>
                      {fileData.deps.map(d => (
                        <button key={d} onClick={() => setSelectedFile(d)}
                          className="mono text-[9px] px-2 py-0.5 rounded bg-[#00d4ff]/8 text-[#00d4ff]/70 border border-[#00d4ff]/15 hover:text-[#00d4ff] hover:border-[#00d4ff]/40 transition-colors">
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Code area */}
              <div className="flex-1 overflow-auto p-0">
                <div className="flex">
                  {/* Line numbers */}
                  <div className="py-4 px-2 text-right select-none flex-shrink-0 border-r border-white/5">
                    {(fileData?.code || "").split("\n").map((_, i) => (
                      <div key={i} className="mono text-[11px] text-[#303040] h-5 leading-5 px-2">{i+1}</div>
                    ))}
                  </div>
                  {/* Code */}
                  <pre className="py-4 px-4 flex-1 overflow-x-auto">
                    <code className="mono text-[12px] leading-5 block whitespace-pre" style={{color:"#c0c0d0"}}>
                      {fileData ? fileData.code.split("\n").map((line, i) => {
                        const colored = line
                          .replace(/\b(module|endmodule|input|output|logic|always_ff|always_comb|if|else|begin|end|assign|parameter|localparam|unique|case|endcase|posedge|negedge|default|foreach)\b/g,
                            m => `<span style="color:#00d4ff;font-weight:600">${m}</span>`)
                          .replace(/\b(wire|reg|integer|genvar|generate|endgenerate)\b/g,
                            m => `<span style="color:#00ff88">${m}</span>`)
                          .replace(/(\/\/[^\n]*)/g,
                            m => `<span style="color:#404060;font-style:italic">${m}</span>`)
                          .replace(/('b[01]+|'h[0-9a-fA-F]+|\b[0-9]+\b)/g,
                            m => `<span style="color:#c87941">${m}</span>`);
                        return <div key={i} className="rtl-line h-5 leading-5 block px-2 rounded-sm" dangerouslySetInnerHTML={{__html:colored}} />;
                      }) : null}
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Status bar */}
          <div className="border-t border-white/5 px-4 py-1.5 flex items-center gap-6 bg-[#090909]">
            {[
              ["Ln "+(fileData?.code.split("\n").length||0)+", Col 1",""],
              ["Spaces: 2",""],
              ["SystemVerilog 2017","text-[#00d4ff]"],
              ["RV32IMAC Pipeline Module",""],
            ].map(([t,c],i) => (
              <span key={i} className={`mono text-[9px] ${c||"text-[#303040]"}`}>{t}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── HAZARD LAB ──────────────────────────────────────────────
function HazardLabSection() {
  const { ref, visible } = useVisible();
  const [hazardType, setHazardType] = useState<"RAW"|"WAR"|"WAW">("RAW");
  const [forwarding, setForwarding] = useState(true);

  const HAZARD_INFO = {
    RAW: {
      label:"Read After Write", color:"#ff3366",
      desc:"Consumer instruction reads a register before the producer writes to it. Most common hazard in RISC-V pipelines. Eliminated by data forwarding.",
      seq:["ADD x1, x2, x3","AND x4, x1, x5"],
      stalls: forwarding ? 0 : 2,
      fwdPath: "MEM→EX forwarding (cycle 3→4)",
    },
    WAR: {
      label:"Write After Read", color:"#ff9900",
      desc:"Producer writes a register that a preceding instruction reads. Also known as anti-dependence. Does not cause stalls in in-order pipelines — only relevant for out-of-order execution.",
      seq:["LW x1, 0(x2)","ADD x1, x3, x4"],
      stalls: 0,
      fwdPath: "No stall — structural order preserved",
    },
    WAW: {
      label:"Write After Write", color:"#c87941",
      desc:"Two instructions both write the same destination register. Also called output dependence. In-order pipelines resolve this structurally. Critical for out-of-order and SIMD pipelines.",
      seq:["ADD x1, x2, x3","LW  x1, 0(x4)"],
      stalls: 0,
      fwdPath: "No stall — later write always wins",
    },
  };

  const info = HAZARD_INFO[hazardType];

  return (
    <section id="hazard" className="relative py-32 px-8" ref={ref}>
      <div className="max-w-[1200px] mx-auto">
        <div className={`mb-12 transition-all duration-700 ${visible?"opacity-100 translate-y-0":"opacity-0 translate-y-8"}`}>
          <SectionLabel text="05 · HAZARD LABORATORY" color="green" />
          <h2 className="text-4xl font-black text-white mt-4 mb-3 leading-tight">
            Pipeline hazards<br />visualized and solved.
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Controls + Info */}
          <div className={`space-y-6 transition-all duration-700 ${visible?"opacity-100 translate-x-0":"opacity-0 -translate-x-8"}`}
            style={{transitionDelay:"100ms"}}>
            {/* Hazard type selector */}
            <div className="glass rounded-sm p-6">
              <div className="mono text-[10px] text-[#404050] mb-3 tracking-widest">HAZARD TYPE</div>
              <div className="flex gap-2 mb-6">
                {(["RAW","WAR","WAW"] as const).map(t => (
                  <button key={t} onClick={() => setHazardType(t)}
                    className={`flex-1 py-2 rounded-sm mono text-sm font-bold transition-all duration-200 border
                      ${hazardType===t ? "text-black" : "text-[#606070] border-white/5 hover:border-white/15"}`}
                    style={hazardType===t ? {background:HAZARD_INFO[t].color, borderColor:HAZARD_INFO[t].color} : {}}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="text-[13px] font-semibold mb-2" style={{color:info.color}}>{info.label}</div>
              <p className="text-[13px] text-[#606070] leading-relaxed">{info.desc}</p>
            </div>

            {/* Instruction sequence */}
            <div className="glass rounded-sm p-6">
              <div className="mono text-[10px] text-[#404050] mb-3 tracking-widest">INSTRUCTION SEQUENCE</div>
              {info.seq.map((s, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-sm mb-2 border ${i===0?"border-white/5":"border-dashed"}`}
                  style={{borderColor:i===1?`${info.color}30`:"rgba(255,255,255,0.05)", background:i===1?`${info.color}08`:"transparent"}}>
                  <span className="mono text-[10px] text-[#404050]">I{i}</span>
                  <span className="mono text-[12px] text-[#d0d0e0] font-medium">{s}</span>
                  {i===1 && <span className="mono text-[9px] ml-auto" style={{color:info.color}}>← depends</span>}
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="mono text-[10px] text-[#404050]">STALLS INSERTED</span>
                <span className={`mono text-xl font-black ${info.stalls===0?"text-[#00ff88]":"text-[#ff3366]"}`}>
                  {info.stalls}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="mono text-[10px] text-[#404050]">RESOLUTION</span>
                <span className="mono text-[11px] text-[#00d4ff]">{info.fwdPath}</span>
              </div>
            </div>

            {/* Forwarding toggle */}
            <div className="glass rounded-sm p-4 flex items-center justify-between">
              <div>
                <div className="text-[13px] font-semibold text-white mb-0.5">Data Forwarding</div>
                <div className="mono text-[10px] text-[#404050]">EX-EX · MEM-EX · WB-EX bypass paths</div>
              </div>
              <button onClick={() => setForwarding(!forwarding)}
                className={`w-12 h-6 rounded-full transition-all duration-300 relative ${forwarding?"bg-[#00ff88]":"bg-[#303040]"}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow ${forwarding?"left-6":"left-0.5"}`}/>
              </button>
            </div>
          </div>

          {/* Right: Visual pipeline diagram */}
          <div className={`transition-all duration-700 ${visible?"opacity-100 translate-x-0":"opacity-0 translate-x-8"}`}
            style={{transitionDelay:"200ms"}}>
            <div className="glass rounded-sm p-6 h-full">
              <div className="mono text-[10px] text-[#404050] mb-6 tracking-widest">PIPELINE EXECUTION TRACE</div>

              {/* Simplified timing for the 2 instructions */}
              {[0,1].map(ii => {
                const stages = ["IF","ID","EX","ME","WB"];
                const stalls = ii === 1 && hazardType === "RAW" && !forwarding ? ["**","**"] : [];
                const cells = ii === 0 ? stages : [...Array(ii).fill(null), ...stalls, ...stages].slice(0, 8);
                return (
                  <div key={ii} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="mono text-[10px] text-[#404050]">I{ii}</span>
                      <span className="mono text-[11px] text-[#c0c0d0]">{info.seq[ii]}</span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({length:8}).map((_,ci) => {
                        const v = cells[ci] || null;
                        return <StageCell key={ci} val={v} />;
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Forwarding arrow visualization */}
              {hazardType === "RAW" && forwarding && (
                <div className="mt-6 p-4 rounded-sm bg-[#00ff88]/5 border border-[#00ff88]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={13} className="text-[#00ff88]"/>
                    <span className="mono text-[11px] text-[#00ff88] font-semibold">FORWARDING PATH ACTIVE</span>
                  </div>
                  <div className="mono text-[11px] text-[#606070]">
                    I0 EX result → I1 EX input (MEM-EX bypass)<br/>
                    I0 MEM result → I1 EX input (WB-EX bypass)<br/>
                    <span className="text-[#00ff88]">Zero stall cycles consumed.</span>
                  </div>
                </div>
              )}
              {hazardType === "RAW" && !forwarding && (
                <div className="mt-6 p-4 rounded-sm bg-[#ff3366]/5 border border-[#ff3366]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={13} className="text-[#ff3366]"/>
                    <span className="mono text-[11px] text-[#ff3366] font-semibold">2 STALL CYCLES INSERTED</span>
                  </div>
                  <div className="mono text-[11px] text-[#606070]">
                    Hazard unit detects RAW on x1 between I0→I1.<br/>
                    Pipeline frozen for 2 cycles until I0 reaches WB.<br/>
                    <span className="text-[#ff3366]">Performance penalty: 2 CPI (this trace).</span>
                  </div>
                </div>
              )}

              {/* Dependency graph */}
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="mono text-[9px] text-[#303040] mb-3 tracking-widest">DEPENDENCY GRAPH</div>
                <svg viewBox="0 0 300 80" className="w-full">
                  <rect x="10" y="10" width="80" height="30" rx="3" fill={`${info.color}15`} stroke={`${info.color}40`} strokeWidth="1"/>
                  <text x="50" y="20" textAnchor="middle" fill={info.color} fontSize="7" fontFamily="JetBrains Mono" fontWeight="600">INSTRUCTION 0</text>
                  <text x="50" y="32" textAnchor="middle" fill="rgba(200,200,220,0.5)" fontSize="6" fontFamily="JetBrains Mono">{info.seq[0]}</text>

                  <rect x="210" y="10" width="80" height="30" rx="3" fill={`${info.color}15`} stroke={`${info.color}40`} strokeWidth="1"/>
                  <text x="250" y="20" textAnchor="middle" fill={info.color} fontSize="7" fontFamily="JetBrains Mono" fontWeight="600">INSTRUCTION 1</text>
                  <text x="250" y="32" textAnchor="middle" fill="rgba(200,200,220,0.5)" fontSize="6" fontFamily="JetBrains Mono">{info.seq[1]}</text>

                  <path d="M 90 25 L 210 25" stroke={info.color} strokeWidth="1.5" fill="none" markerEnd="url(#arr)" />
                  <defs>
                    <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                      <path d="M 0 0 L 6 3 L 0 6 Z" fill={info.color} />
                    </marker>
                  </defs>
                  <text x="150" y="20" textAnchor="middle" fill={info.color} fontSize="6" fontFamily="JetBrains Mono">{hazardType}</text>

                  <text x="150" y="60" textAnchor="middle" fill="rgba(100,100,120,0.8)" fontSize="7" fontFamily="JetBrains Mono">
                    {forwarding || hazardType !== "RAW" ? "✓ Resolved by forwarding / structural order" : "⚠ Requires pipeline stall"}
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── BRANCH PREDICTION ───────────────────────────────────────
function BranchPredSection() {
  const { ref, visible } = useVisible();
  const [pred, setPred] = useState<keyof typeof PREDICTOR_DATA>("2bit");
  const info = PREDICTOR_DATA[pred];

  const chartData = Object.entries(PREDICTOR_DATA).map(([k,v]) => ({
    name: k === "always-taken" ? "Taken" : k === "always-not-taken" ? "Not-Taken" : k === "1bit" ? "1-bit" : "2-bit",
    accuracy: v.accuracy, miss: v.miss,
  }));

  return (
    <section className="relative py-32 px-8 eng-grid" ref={ref}>
      <div className="max-w-[1200px] mx-auto">
        <div className={`mb-12 transition-all duration-700 ${visible?"opacity-100 translate-y-0":"opacity-0 translate-y-8"}`}>
          <SectionLabel text="06 · BRANCH PREDICTION CENTER" color="gold" />
          <h2 className="text-4xl font-black text-white mt-4 mb-3 leading-tight">
            Predict. Speculate.<br />Recover.
          </h2>
          <p className="text-[#606070] text-[14px] max-w-xl">
            Compare four branch prediction strategies on a real instruction trace.
            The 2-bit saturating counter achieves 94% accuracy, reducing misprediction
            penalty to an average of 0.18 cycles per branch.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className={`space-y-4 transition-all duration-700 ${visible?"opacity-100":"opacity-0"}`} style={{transitionDelay:"100ms"}}>
            {(Object.keys(PREDICTOR_DATA) as Array<keyof typeof PREDICTOR_DATA>).map(k => {
              const d = PREDICTOR_DATA[k];
              const labels: Record<string,string> = {"always-taken":"Always Taken","always-not-taken":"Always Not-Taken","1bit":"1-bit Predictor","2bit":"2-bit Saturating"};
              const active = pred === k;
              return (
                <button key={k} onClick={() => setPred(k)}
                  className={`w-full text-left glass rounded-sm p-5 transition-all duration-300 border ${active?"glow-box-cyan":"hover:border-white/10"}`}
                  style={{borderColor:active?`${d.color}40`:"rgba(255,255,255,0.06)"}}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-white text-[14px]">{labels[k]}</span>
                    <span className="mono text-xl font-black" style={{color:d.color}}>{d.accuracy}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full accuracy-bar transition-all duration-700"
                      style={{width:`${d.accuracy}%`, background:d.color}}/>
                  </div>
                  {active && <p className="mono text-[11px] text-[#606070] leading-relaxed">{d.desc}</p>}
                </button>
              );
            })}
          </div>

          <div className={`space-y-6 transition-all duration-700 ${visible?"opacity-100":"opacity-0"}`} style={{transitionDelay:"200ms"}}>
            {/* Accuracy bar chart */}
            <div className="glass rounded-sm p-6">
              <div className="mono text-[10px] text-[#404050] mb-4 tracking-widest">PREDICTION ACCURACY COMPARISON</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} margin={{top:0,right:0,bottom:0,left:-20}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{fill:"#505060",fontSize:10,fontFamily:"JetBrains Mono"}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fill:"#505060",fontSize:10,fontFamily:"JetBrains Mono"}} domain={[0,100]} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{background:"#0e0e10",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"4px",color:"#c0c0d0",fontFamily:"JetBrains Mono",fontSize:"11px"}} />
                  <Bar dataKey="accuracy" name="Accuracy %" fill={info.color} radius={[2,2,0,0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Current predictor stats */}
            <div className="glass rounded-sm p-6">
              <div className="mono text-[10px] text-[#404050] mb-4 tracking-widest">SELECTED PREDICTOR · {pred.toUpperCase()}</div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  {label:"Accuracy", val:`${info.accuracy}%`, color:info.color},
                  {label:"Mispredictions", val:`${info.miss}%`, color:"#ff3366"},
                  {label:"Penalty Cycles", val:info.penalty, color:"#ff9900"},
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <div className="mono text-2xl font-black mb-1" style={{color:m.color}}>{m.val}</div>
                    <div className="mono text-[9px] text-[#404050]">{m.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="mono text-[10px] text-[#404050] mb-2">HARDWARE COST vs ACCURACY</div>
                {[
                  {k:"always-taken",hw:"0 bits / entry"},
                  {k:"always-not-taken",hw:"0 bits / entry"},
                  {k:"1bit",hw:"1 bit / entry"},
                  {k:"2bit",hw:"2 bits / entry"},
                ].map(({k,hw}) => (
                  <div key={k} className={`flex items-center justify-between mono text-[11px] py-1 ${k===pred?"text-white":"text-[#404050]"}`}>
                    <span>{k === "always-taken" ? "Always Taken" : k === "always-not-taken" ? "Always Not-Taken" : k === "1bit" ? "1-bit" : "2-bit Saturating"}</span>
                    <span className={k===pred?`font-bold`:""}>{hw}</span>
                    <span style={{color:PREDICTOR_DATA[k as keyof typeof PREDICTOR_DATA].color}}>{PREDICTOR_DATA[k as keyof typeof PREDICTOR_DATA].accuracy}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── CACHE SIMULATOR ─────────────────────────────────────────
function CacheSimSection() {
  const { ref, visible } = useVisible();
  const [lines, setLines] = useState<Array<{tag:number|null,valid:boolean,dirty:boolean,lru:number}>>(() =>
    Array.from({length:8}, () => ({tag:null,valid:false,dirty:false,lru:0}))
  );
  const [history, setHistory] = useState<Array<{addr:string,tag:number,idx:number,result:"hit"|"miss"|"evict"}>>([]);
  const [input, setInput] = useState("0x00000020");
  const [lruClock, setLruClock] = useState(0);

  const accessCache = useCallback(() => {
    const addr = parseInt(input, 16);
    if (isNaN(addr)) return;
    const idx = (addr >> 6) & 0x7;
    const tag = addr >> 9;
    setLruClock(c => {
      const nc = c + 1;
      setLines(prev => {
        const next = [...prev.map(l => ({...l}))];
        let result: "hit"|"miss"|"evict" = "miss";
        if (next[idx].valid && next[idx].tag === tag) {
          result = "hit";
          next[idx].lru = nc;
        } else {
          if (next[idx].valid) result = "evict";
          next[idx] = {tag, valid:true, dirty:false, lru:nc};
        }
        setHistory(h => [{addr:input, tag, idx, result}, ...h.slice(0,9)]);
        return next;
      });
      return nc;
    });
    const presets = ["0x00000040","0x00000060","0x00000020","0x00000100","0x000001c0","0x00000040"];
    const next = presets[Math.floor(Math.random()*presets.length)];
    setInput(next);
  }, [input]);

  const hits = history.filter(h => h.result === "hit").length;
  const hitRate = history.length > 0 ? Math.round((hits/history.length)*100) : 0;

  return (
    <section className="relative py-32 px-8" ref={ref}>
      <div className="max-w-[1200px] mx-auto">
        <div className={`mb-12 transition-all duration-700 ${visible?"opacity-100 translate-y-0":"opacity-0 translate-y-8"}`}>
          <SectionLabel text="07 · CACHE SIMULATOR" />
          <h2 className="text-4xl font-black text-white mt-4 mb-3 leading-tight">
            Direct-mapped L1<br />cache simulation.
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Cache state visualization */}
          <div className={`transition-all duration-700 ${visible?"opacity-100":"opacity-0"}`}>
            <div className="glass rounded-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="mono text-[10px] text-[#404050] tracking-widest">CACHE STATE · 8 LINES · DIRECT-MAPPED</div>
                <div className="mono text-[11px] text-[#00d4ff]">Hit Rate: {hitRate}%</div>
              </div>

              {/* Cache header */}
              <div className="grid grid-cols-5 gap-1 mb-2 mono text-[9px] text-[#303040] text-center">
                <div>IDX</div><div>VALID</div><div>TAG[31:9]</div><div>DATA</div><div>LRU</div>
              </div>

              {/* Cache lines */}
              {lines.map((l, i) => {
                const state = history[0]?.idx === i ? history[0].result : null;
                return (
                  <div key={i}
                    className={`cache-cell grid grid-cols-5 gap-1 mb-1 rounded-sm py-1.5 px-2 border text-center
                      ${state==="hit"?"hit":state==="evict"?"evict":l.valid?"border-white/8 bg-white/[0.02]":"border-white/3"}`}>
                    <span className="mono text-[11px] text-[#404050]">{i}</span>
                    <span className={`mono text-[11px] ${l.valid?"text-[#00ff88]":"text-[#303040]"}`}>{l.valid?"1":"0"}</span>
                    <span className="mono text-[11px] text-[#808090]">{l.valid?`0x${l.tag.toString(16).padStart(5,"0")}`:"───"}</span>
                    <span className="mono text-[10px] text-[#606070]">{l.valid?"[64B]":"empty"}</span>
                    <span className="mono text-[10px] text-[#404050]">{l.valid?l.lru:"─"}</span>
                  </div>
                );
              })}

              {/* Access form */}
              <div className="mt-6 flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)}
                  className="flex-1 glass px-3 py-2 rounded-sm mono text-[12px] text-[#c0c0d0] border border-white/10 focus:border-[#00d4ff]/40 outline-none bg-transparent"
                  placeholder="0x00000000" />
                <button onClick={accessCache}
                  className="btn-primary px-4 py-2 rounded-sm mono text-[12px] flex items-center gap-2">
                  <Database size={12}/> Access
                </button>
              </div>
            </div>
          </div>

          {/* History */}
          <div className={`space-y-4 transition-all duration-700 ${visible?"opacity-100":"opacity-0"}`} style={{transitionDelay:"150ms"}}>
            <div className="glass rounded-sm p-6">
              <div className="mono text-[10px] text-[#404050] mb-4 tracking-widest">ACCESS HISTORY</div>
              {history.length === 0 && (
                <div className="mono text-[12px] text-[#303040] text-center py-8">
                  Click "Access" to simulate cache accesses
                </div>
              )}
              {history.map((h, i) => (
                <div key={i} className={`flex items-center gap-3 py-2 border-b border-white/3 ${i===0?"opacity-100":"opacity-60"}`}>
                  <div className={`w-12 flex-shrink-0 mono text-[10px] font-bold text-center py-0.5 rounded-sm
                    ${h.result==="hit"?"bg-[#00ff88]/15 text-[#00ff88]":h.result==="evict"?"bg-[#c87941]/15 text-[#c87941]":"bg-[#ff3366]/15 text-[#ff3366]"}`}>
                    {h.result.toUpperCase()}
                  </div>
                  <span className="mono text-[11px] text-[#c0c0d0]">{h.addr}</span>
                  <span className="mono text-[10px] text-[#404050]">→ set[{h.idx}]</span>
                  <span className="mono text-[10px] text-[#303040]">tag=0x{h.tag.toString(16)}</span>
                </div>
              ))}
            </div>

            {/* Latency comparison */}
            <div className="glass rounded-sm p-6">
              <div className="mono text-[10px] text-[#404050] mb-4 tracking-widest">MEMORY HIERARCHY LATENCY</div>
              {[
                {label:"L1 I-Cache Hit",  cycles:1,   color:"#00ff88"},
                {label:"L1 D-Cache Hit",  cycles:1,   color:"#00ff88"},
                {label:"L2 Cache Hit",    cycles:4,   color:"#00d4ff"},
                {label:"DRAM (est.)",     cycles:120, color:"#ff3366"},
              ].map(m => (
                <div key={m.label} className="flex items-center gap-3 mb-3">
                  <div className="w-32 mono text-[11px] text-[#606070] flex-shrink-0">{m.label}</div>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{width:`${Math.min((m.cycles/120)*100,100)}%`,background:m.color}}/>
                  </div>
                  <div className="mono text-[11px] w-16 text-right flex-shrink-0" style={{color:m.color}}>
                    {m.cycles} {m.cycles===1?"cycle":"cycles"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── PERFORMANCE ANALYTICS ───────────────────────────────────
function PerformanceSection() {
  const { ref, visible } = useVisible();
  return (
    <section id="perf" className="relative py-32 px-8 eng-grid" ref={ref}>
      <div className="max-w-[1200px] mx-auto">
        <div className={`mb-16 transition-all duration-700 ${visible?"opacity-100 translate-y-0":"opacity-0 translate-y-8"}`}>
          <SectionLabel text="08 · PERFORMANCE ANALYTICS" color="green" />
          <h2 className="text-4xl font-black text-white mt-4 mb-3 leading-tight">
            End-to-end benchmark<br />characterization.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* IPC chart */}
          <div className={`glass rounded-sm p-6 transition-all duration-700 ${visible?"opacity-100":"opacity-0"}`} style={{transitionDelay:"100ms"}}>
            <div className="mono text-[10px] text-[#404050] mb-4 tracking-widest">IPC SCALING BY FEATURE</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={IPC_DATA} margin={{top:0,right:0,bottom:0,left:-20}}>
                <defs>
                  <linearGradient id="ipcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="config" tick={{fill:"#505060",fontSize:9,fontFamily:"JetBrains Mono"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#505060",fontSize:9,fontFamily:"JetBrains Mono"}} domain={[0,2.2]} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:"#0e0e10",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"4px",color:"#c0c0d0",fontFamily:"JetBrains Mono",fontSize:"11px"}}/>
                <Area type="monotone" dataKey="ipc" name="IPC" stroke="#00d4ff" strokeWidth={2} fill="url(#ipcGrad)" dot={{fill:"#00d4ff",r:3}}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stage utilization */}
          <div className={`glass rounded-sm p-6 transition-all duration-700 ${visible?"opacity-100":"opacity-0"}`} style={{transitionDelay:"200ms"}}>
            <div className="mono text-[10px] text-[#404050] mb-4 tracking-widest">PIPELINE STAGE UTILIZATION</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={STAGE_UTIL} margin={{top:0,right:0,bottom:0,left:-20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="stage" tick={{fill:"#505060",fontSize:10,fontFamily:"JetBrains Mono"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:"#505060",fontSize:9,fontFamily:"JetBrains Mono"}} domain={[0,100]} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:"#0e0e10",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"4px",color:"#c0c0d0",fontFamily:"JetBrains Mono",fontSize:"11px"}}/>
                <Bar dataKey="util" name="Utilization %" fill="#00ff88" radius={[2,2,0,0]} maxBarSize={48} />
                <Bar dataKey="stalls" name="Stall %" fill="#ff3366" radius={[2,2,0,0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Frequency vs IPC */}
          <div className={`glass rounded-sm p-6 transition-all duration-700 ${visible?"opacity-100":"opacity-0"}`} style={{transitionDelay:"300ms"}}>
            <div className="mono text-[10px] text-[#404050] mb-4 tracking-widest">IPC vs CLOCK FREQUENCY (FPGA)</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={PERF_FREQ} margin={{top:0,right:0,bottom:0,left:-20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="mhz" tick={{fill:"#505060",fontSize:9,fontFamily:"JetBrains Mono"}} axisLine={false} tickLine={false} unit=" MHz"/>
                <YAxis tick={{fill:"#505060",fontSize:9,fontFamily:"JetBrains Mono"}} domain={[1.3,2.0]} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:"#0e0e10",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"4px",color:"#c0c0d0",fontFamily:"JetBrains Mono",fontSize:"11px"}}/>
                <Line type="monotone" dataKey="ipc" name="IPC" stroke="#c87941" strokeWidth={2} dot={{fill:"#c87941",r:3}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Benchmarks */}
          <div className={`glass rounded-sm p-6 transition-all duration-700 ${visible?"opacity-100":"opacity-0"}`} style={{transitionDelay:"400ms"}}>
            <div className="mono text-[10px] text-[#404050] mb-4 tracking-widest">BENCHMARK SCORES (200 MHz)</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={BENCH_DATA} layout="vertical" margin={{top:0,right:20,bottom:0,left:60}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{fill:"#505060",fontSize:9,fontFamily:"JetBrains Mono"}} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="bench" tick={{fill:"#808090",fontSize:10,fontFamily:"JetBrains Mono"}} axisLine={false} tickLine={false} width={60}/>
                <Tooltip contentStyle={{background:"#0e0e10",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"4px",color:"#c0c0d0",fontFamily:"JetBrains Mono",fontSize:"11px"}}/>
                <Bar dataKey="score" name="Score" fill="#00d4ff" radius={[0,2,2,0]} maxBarSize={20}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── VERIFICATION CENTER ─────────────────────────────────────
function VerificationSection() {
  const { ref, visible } = useVisible();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const runSuite = () => {
    setRunning(true); setProgress(0); setDone(false);
    const iv = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(iv); setRunning(false); setDone(true); return 100; }
        return p + 2;
      });
    }, 50);
  };

  const totalPass = VERIFY_TESTS.reduce((a,t) => a+t.pass, 0);
  const totalFail = VERIFY_TESTS.reduce((a,t) => a+t.fail, 0);
  const totalTests = totalPass + totalFail;

  return (
    <section id="verify" className="relative py-32 px-8" ref={ref}>
      <div className="max-w-[1200px] mx-auto">
        <div className={`mb-12 transition-all duration-700 ${visible?"opacity-100 translate-y-0":"opacity-0 translate-y-8"}`}>
          <SectionLabel text="09 · VERIFICATION CENTER" color="gold" />
          <h2 className="text-4xl font-black text-white mt-4 mb-3 leading-tight">
            {totalTests} tests. {totalPass} passing.<br />Formal verification ready.
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Test suite table */}
          <div className={`lg:col-span-2 glass rounded-sm overflow-hidden transition-all duration-700 ${visible?"opacity-100":"opacity-0"}`}>
            {/* Toolbar */}
            <div className="border-b border-white/5 px-5 py-3 flex items-center gap-4">
              <span className="mono text-[10px] text-[#404050] tracking-widest">TEST SUITE RESULTS</span>
              <div className="flex-1" />
              <button onClick={runSuite} disabled={running}
                className={`btn-primary px-4 py-1.5 rounded-sm mono text-[11px] flex items-center gap-2 ${running?"opacity-50 cursor-not-allowed":""}`}>
                {running ? <><RefreshCw size={11} className="anim-spin"/> Running…</> : <><Play size={11}/> Run All</>}
              </button>
            </div>

            {/* Progress bar */}
            {(running || done) && (
              <div className="border-b border-white/5">
                <div className="h-0.5 w-full bg-white/5">
                  <div className="h-full bg-[#00d4ff] transition-all duration-100" style={{width:`${progress}%`}}/>
                </div>
              </div>
            )}

            {/* Test rows */}
            <div className="divide-y divide-white/3">
              {VERIFY_TESTS.map((t, i) => (
                <div key={t.name}
                  className={`flex items-center gap-4 px-5 py-3 hover:bg-white/[0.01] transition-all duration-500 ${visible?"opacity-100":"opacity-0"}`}
                  style={{transitionDelay:`${100+i*60}ms`}}>
                  <div className={`w-4 h-4 rounded-sm flex items-center justify-center flex-shrink-0
                    ${t.fail===0?"bg-[#00ff88]/10":"bg-[#ff3366]/10"}`}>
                    {t.fail===0 ? <Check size={9} className="text-[#00ff88]"/> : <X size={9} className="text-[#ff3366]"/>}
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] text-[#c0c0d0] font-medium">{t.name}</div>
                  </div>
                  <div className="mono text-[11px] text-[#00ff88]">{t.pass} PASS</div>
                  {t.fail > 0 && <div className="mono text-[11px] text-[#ff3366]">{t.fail} FAIL</div>}
                  <div className="w-24">
                    <div className="flex items-center justify-between mono text-[9px] text-[#404050] mb-1">
                      <span>COV</span><span>{t.cov}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{width:`${t.cov}%`,background:t.cov>=95?"#00ff88":t.cov>=85?"#ff9900":"#ff3366"}}/>
                    </div>
                  </div>
                  <div className="mono text-[10px] text-[#303040] w-16 text-right">{t.total} tests</div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary panel */}
          <div className={`space-y-4 transition-all duration-700 ${visible?"opacity-100":"opacity-0"}`} style={{transitionDelay:"200ms"}}>
            <div className="glass rounded-sm p-6">
              <div className="mono text-[10px] text-[#404050] mb-4 tracking-widest">OVERALL COVERAGE</div>
              <div className="text-5xl font-black text-[#00ff88] mb-1">
                {Math.round(VERIFY_TESTS.reduce((a,t)=>a+t.cov,0)/VERIFY_TESTS.length)}%
              </div>
              <div className="mono text-[11px] text-[#404050]">Average functional coverage</div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between mono text-[11px]">
                  <span className="text-[#606070]">Passing</span>
                  <span className="text-[#00ff88]">{totalPass}</span>
                </div>
                <div className="flex justify-between mono text-[11px]">
                  <span className="text-[#606070]">Failing</span>
                  <span className="text-[#ff3366]">{totalFail}</span>
                </div>
                <div className="flex justify-between mono text-[11px]">
                  <span className="text-[#606070]">Total</span>
                  <span className="text-[#c0c0d0]">{totalTests}</span>
                </div>
              </div>
            </div>

            {/* Waveform preview */}
            <div className="glass rounded-sm p-5">
              <div className="mono text-[10px] text-[#404050] mb-3 tracking-widest">SIMULATION WAVEFORM</div>
              <svg viewBox="0 0 220 100" className="w-full">
                {/* CLK */}
                <text x="2" y="12" fontSize="6" fill="#404050" fontFamily="JetBrains Mono">CLK</text>
                <path d="M 30 14 L 30 6 L 50 6 L 50 14 L 70 14 L 70 6 L 90 6 L 90 14 L 110 14 L 110 6 L 130 6 L 130 14 L 150 14 L 150 6 L 170 6 L 170 14 L 190 14"
                  stroke="#00d4ff" strokeWidth="1" fill="none" className="anim-wave"/>
                {/* PC */}
                <text x="2" y="32" fontSize="6" fill="#404050" fontFamily="JetBrains Mono">PC</text>
                {[30,70,110,150].map((x,i) => (
                  <g key={i}>
                    <path d={`M ${x} 28 L ${x+2} 24 L ${x+38} 24 L ${x+40} 28`} stroke="#00ff88" strokeWidth="1" fill="rgba(0,255,136,0.1)" />
                    <text x={x+20} y="28" textAnchor="middle" fontSize="5" fill="rgba(0,255,136,0.6)" fontFamily="JetBrains Mono">{(i*4).toString(16).padStart(4,"0")}</text>
                  </g>
                ))}
                {/* INSTR */}
                <text x="2" y="52" fontSize="6" fill="#404050" fontFamily="JetBrains Mono">INSTR</text>
                {[30,70,110,150].map((x,i) => {
                  const instrs = ["0033_0033","0062_5293","00a0_8333","0008_2483"];
                  return (
                    <g key={i}>
                      <path d={`M ${x} 48 L ${x+2} 44 L ${x+38} 44 L ${x+40} 48`} stroke="#c87941" strokeWidth="1" fill="rgba(200,121,65,0.1)" />
                      <text x={x+20} y="48" textAnchor="middle" fontSize="5" fill="rgba(200,121,65,0.6)" fontFamily="JetBrains Mono">{instrs[i]}</text>
                    </g>
                  );
                })}
                {/* WB_VALID */}
                <text x="2" y="70" fontSize="6" fill="#404050" fontFamily="JetBrains Mono">WB_EN</text>
                <path d="M 30 68 L 90 68 L 90 62 L 130 62 L 130 68 L 170 68 L 170 62 L 210 62"
                  stroke="#ff9900" strokeWidth="1" fill="none"/>

                {/* STALL */}
                <text x="2" y="88" fontSize="6" fill="#404050" fontFamily="JetBrains Mono">STALL</text>
                <path d="M 30 86 L 100 86 L 100 80 L 120 80 L 120 86 L 210 86"
                  stroke="#ff3366" strokeWidth="1" fill="none"/>

                {/* Time markers */}
                {[30,70,110,150,190].map((x,i) => (
                  <g key={i}>
                    <line x1={x} y1="94" x2={x} y2="96" stroke="#303040" strokeWidth="0.5"/>
                    <text x={x} y="100" textAnchor="middle" fontSize="5" fill="#303040" fontFamily="JetBrains Mono">{i*5}ns</text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── FPGA SECTION ────────────────────────────────────────────
function FPGASection() {
  const { ref, visible } = useVisible();
  const [step, setStep] = useState(0);
  const steps = [
    { label:"Synthesis",      time:"12.4s",  color:"#00d4ff", desc:"Yosys synthesizes RTL to gate-level netlist. 2,847 LUTs, 1,204 FFs." },
    { label:"Place & Route",  time:"34.1s",  color:"#00ff88", desc:"Vivado places and routes design. Critical path: 4.97 ns (200 MHz)." },
    { label:"Bitstream Gen",  time:"8.7s",   color:"#ff9900", desc:"Bitstream generated. 3.2 MB binary for Artix-7 XC7A35T device." },
    { label:"Programming",    time:"2.1s",   color:"#c87941", desc:"JTAG download complete. Device programmed and running at 200 MHz." },
    { label:"Execution",      time:"live",   color:"#00ff88", desc:"QuantumRISC executing Coremark. IPC=1.74, Frequency=200 MHz." },
  ];

  return (
    <section className="relative py-32 px-8 eng-grid" ref={ref}>
      <div className="max-w-[1200px] mx-auto">
        <div className={`mb-12 transition-all duration-700 ${visible?"opacity-100 translate-y-0":"opacity-0 translate-y-8"}`}>
          <SectionLabel text="10 · FPGA DEPLOYMENT" color="gold" />
          <h2 className="text-4xl font-black text-white mt-4 mb-3 leading-tight">
            From RTL to silicon<br />in minutes.
          </h2>
          <p className="text-[#606070] text-[14px] max-w-xl">
            QuantumRISC targets the Xilinx Artix-7 FPGA. Complete synthesis, place-and-route,
            and bitstream generation pipeline runs in under 60 seconds.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* FPGA board visualization */}
          <div className={`glass rounded-sm p-8 flex flex-col items-center transition-all duration-700 ${visible?"opacity-100":"opacity-0"}`}>
            <div className="w-full max-w-sm">
              {/* PCB outline */}
              <svg viewBox="0 0 300 220" className="w-full">
                {/* PCB substrate */}
                <rect x="5" y="5" width="290" height="210" rx="8" fill="#0a2010" stroke="#1a3020" strokeWidth="2"/>
                {/* PCB traces */}
                {Array.from({length:12}).map((_,i) => (
                  <line key={i} x1={20} y1={20+i*16} x2={280} y2={20+i*16} stroke="rgba(0,255,136,0.06)" strokeWidth="0.5" />
                ))}
                {/* FPGA chip */}
                <rect x="80" y="50" width="140" height="120" rx="4" fill="#111820" stroke="rgba(0,212,255,0.4)" strokeWidth="1.5"/>
                <text x="150" y="102" textAnchor="middle" fill="rgba(0,212,255,0.7)" fontSize="9" fontFamily="JetBrains Mono" fontWeight="600">XILINX</text>
                <text x="150" y="114" textAnchor="middle" fill="rgba(0,212,255,0.5)" fontSize="8" fontFamily="JetBrains Mono">ARTIX-7</text>
                <text x="150" y="126" textAnchor="middle" fill="rgba(0,212,255,0.3)" fontSize="6" fontFamily="JetBrains Mono">XC7A35T-1CPG236C</text>
                {/* BGA pads */}
                {Array.from({length:36}).map((_,i) => (
                  <circle key={i} cx={88 + (i%6)*24} cy={58 + Math.floor(i/6)*16} r="2"
                    fill={step>=3?"rgba(0,212,255,0.4)":"rgba(0,212,255,0.1)"} />
                ))}
                {/* Status LEDs */}
                {[0,1,2,3].map(i => (
                  <circle key={i} cx={20+i*12} cy={190} r="4"
                    fill={i < step ? "#00ff88" : "#1a2a1a"}
                    style={i < step ? {filter:"drop-shadow(0 0 4px #00ff88)"} : {}}
                    className={i < step ? "anim-pulse" : ""} />
                ))}
                {/* 7-segment display */}
                <rect x="230" y="170" width="55" height="35" rx="2" fill="#050d05" stroke="#1a3020" strokeWidth="1"/>
                <text x="257" y="192" textAnchor="middle" fill={step>=4?"#ff3300":"#0a1a0a"} fontSize="18" fontFamily="JetBrains Mono" fontWeight="bold">
                  {step>=4?"AB":"──"}
                </text>
                {/* USB connector */}
                <rect x="10" y="85" width="20" height="30" rx="2" fill="#1a1a1a" stroke="#333" strokeWidth="1"/>
                <text x="20" y="104" textAnchor="middle" fill="#333" fontSize="5" fontFamily="JetBrains Mono">USB</text>
                {/* JTAG header */}
                {[0,1,2,3,4,5].map(i => (
                  <rect key={i} x={270} y={60+i*12} width="8" height="8" rx="1" fill="#222" stroke="#333" strokeWidth="0.5"/>
                ))}
                <text x="274" y="155" textAnchor="middle" fill="#333" fontSize="5" fontFamily="JetBrains Mono" transform="rotate(90,274,155)">JTAG</text>
                {/* Oscillator */}
                <rect x="20" y="20" width="40" height="25" rx="2" fill="#111" stroke="rgba(0,212,255,0.2)" strokeWidth="0.5"/>
                <text x="40" y="33" textAnchor="middle" fill="rgba(0,212,255,0.4)" fontSize="5" fontFamily="JetBrains Mono">200MHz</text>
                <text x="40" y="40" textAnchor="middle" fill="rgba(0,212,255,0.25)" fontSize="5" fontFamily="JetBrains Mono">XTAL</text>
              </svg>
            </div>
            <div className="mt-4 flex items-center gap-3">
              {step >= 4 && (
                <span className="flex items-center gap-2 mono text-[11px] text-[#00ff88]">
                  <div className="w-2 h-2 rounded-full bg-[#00ff88] anim-pulse"/> RUNNING · 200 MHz · 1.74 IPC
                </span>
              )}
            </div>
          </div>

          {/* Build flow */}
          <div className={`transition-all duration-700 ${visible?"opacity-100":"opacity-0"}`} style={{transitionDelay:"150ms"}}>
            <div className="glass rounded-sm overflow-hidden">
              {/* Terminal header */}
              <div className="border-b border-white/5 px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff3366]/50"/>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff9900]/50"/>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00ff88]/50"/>
                </div>
                <span className="mono text-[10px] text-[#404050] ml-2">vivado_build.sh</span>
              </div>
              <div className="p-4 space-y-2 min-h-[300px]">
                {steps.map((s, i) => (
                  <div key={s.label}
                    className={`flex items-start gap-3 p-3 rounded-sm transition-all duration-500 cursor-pointer
                      ${step > i ? "opacity-100" : step === i ? "opacity-80" : "opacity-30"}
                      ${step === i ? "bg-white/3" : ""}`}
                    onClick={() => setStep(i)}>
                    <div className={`w-4 h-4 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5
                      ${step > i ? "bg-[#00ff88]/20" : step === i ? "" : "bg-white/5"}`}
                      style={step === i ? {background:`${s.color}20`,border:`1px solid ${s.color}60`} : {}}>
                      {step > i
                        ? <Check size={9} className="text-[#00ff88]"/>
                        : <span className="mono text-[8px]" style={{color:s.color}}>{i+1}</span>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="mono text-[12px] font-semibold" style={{color:step>=i?s.color:"#404050"}}>{s.label}</span>
                        <span className="mono text-[10px] text-[#303040]">{s.time}</span>
                      </div>
                      {step >= i && <p className="mono text-[11px] text-[#606070] mt-1 leading-snug">{s.desc}</p>}
                    </div>
                  </div>
                ))}
                {/* Advance button */}
                <div className="pt-2">
                  <button
                    onClick={() => setStep(s => Math.min(s+1, steps.length-1))}
                    className="btn-primary px-4 py-2 rounded-sm mono text-[11px] flex items-center gap-2 w-full justify-center">
                    <Play size={11}/>
                    {step < steps.length - 1 ? `Run ${steps[step+1]?.label || ""}` : "✓ Deployment Complete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── DEMO VIDEO ──────────────────────────────────────────────
const VIDEO_CHAPTERS = [
  { time:"0:00",  label:"00:00", title:"Project Overview & Architecture",       sub:"Introduction to QuantumRISC Studio",     dur:"2:14" },
  { time:"2:14",  label:"02:14", title:"RISC-V ISA Deep Dive",                  sub:"RV32IMAC instruction set walkthrough",   dur:"4:32" },
  { time:"6:46",  label:"06:46", title:"Pipeline Simulation — Live",            sub:"Five-stage pipeline animation demo",     dur:"5:18" },
  { time:"12:04", label:"12:04", title:"RTL Source Walkthrough",                sub:"SystemVerilog module hierarchy",         dur:"6:45" },
  { time:"18:49", label:"18:49", title:"Hazard Detection & Forwarding",         sub:"RAW hazards, stalls, bypass paths",      dur:"3:27" },
  { time:"22:16", label:"22:16", title:"Branch Prediction Analysis",            sub:"2-bit saturating counter, 94% accuracy", dur:"2:53" },
  { time:"25:09", label:"25:09", title:"Cache Hierarchy Simulation",            sub:"L1/L2 hit-miss, LRU replacement",        dur:"3:11" },
  { time:"28:20", label:"28:20", title:"FPGA Synthesis & Deployment",           sub:"Xilinx Artix-7 · 200 MHz · live exec",  dur:"4:38" },
  { time:"32:58", label:"32:58", title:"Verification & Formal Proof",           sub:"1,358 tests · assertion coverage",      dur:"3:22" },
  { time:"36:20", label:"36:20", title:"Performance Benchmarks",                sub:"Coremark / Dhrystone / Linpack",         dur:"2:47" },
];

function VideoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activeChapter, setActiveChapter] = useState(0);
  const [closing, setClosing] = useState(false);

  const close = () => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 280);
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const totalDuration = "39:07";
  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 ${closing ? "opacity-0" : "modal-backdrop"}`}
      style={{background:"rgba(4,4,6,0.96)", backdropFilter:"blur(24px)", transition: closing ? "opacity 0.28s ease" : "none"}}
      onClick={close}>

      {/* Modal panel */}
      <div
        className={`relative w-full max-w-[1100px] ${closing ? "opacity-0 scale-95" : "modal-panel"}`}
        style={{transition: closing ? "opacity 0.28s ease, transform 0.28s ease" : "none"}}
        onClick={e => e.stopPropagation()}>

        {/* Top bar */}
        <div className="flex items-center justify-between mb-5 px-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded border border-[#00d4ff]/40 flex items-center justify-center">
                <Cpu size={10} className="text-[#00d4ff]"/>
              </div>
              <span className="mono text-[11px] font-semibold text-white tracking-wide">QuantumRISC Studio</span>
            </div>
            <div className="h-3 w-px bg-white/10"/>
            <span className="mono text-[10px] text-[#404050]">FULL PROJECT DEMO</span>
            <div className="glass-cyan px-2 py-0.5 rounded mono text-[9px] text-[#00d4ff]">{totalDuration}</div>
          </div>
          <button onClick={close}
            className="w-9 h-9 rounded-sm border border-white/10 flex items-center justify-center text-[#606070] hover:text-white hover:border-[#ff3366]/40 hover:bg-[#ff3366]/8 transition-all duration-200 flex-shrink-0">
            <X size={15}/>
          </button>
        </div>

        {/* Main layout */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-5">

          {/* Video player */}
          <div>
            <div className="relative rounded-sm overflow-hidden video-frame-glow" style={{paddingTop:"56.25%", background:"#000"}}>
              <iframe
                src="https://drive.google.com/file/d/1cLVUcNctoUcaaNzLdwd95bf4Qlg0RsVB/preview"
                title="QuantumRISC Demo Video"
                className="absolute inset-0 w-full h-full border-0"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            </div>

            {/* Now playing */}
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <div className="mono text-[9px] text-[#00d4ff] tracking-widest mb-1">NOW PLAYING</div>
                <h4 className="text-[15px] font-bold text-white leading-snug">{VIDEO_CHAPTERS[activeChapter].title}</h4>
                <p className="mono text-[11px] text-[#505060] mt-0.5">{VIDEO_CHAPTERS[activeChapter].sub}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 mt-0.5">
                <div className="glass px-3 py-1.5 rounded-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff3366] anim-pulse"/>
                  <span className="mono text-[10px] text-[#c0c0d0]">{VIDEO_CHAPTERS[activeChapter].dur}</span>
                </div>
                <div className="glass px-3 py-1.5 rounded-sm">
                  <span className="mono text-[10px] text-[#606070]">{activeChapter+1} / {VIDEO_CHAPTERS.length}</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88] rounded-full"
                style={{width:`${((activeChapter)/VIDEO_CHAPTERS.length)*100+6}%`, transition:"width 0.5s ease"}}/>
            </div>
            <div className="flex justify-between mono text-[9px] text-[#303040] mt-1">
              <span>{VIDEO_CHAPTERS[activeChapter].label}</span>
              <span>{totalDuration}</span>
            </div>
          </div>

          {/* Chapters panel */}
          <div className="glass rounded-sm overflow-hidden flex flex-col" style={{maxHeight:"460px"}}>
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <span className="mono text-[9px] text-[#404050] tracking-widest">CHAPTERS</span>
              <span className="mono text-[9px] text-[#303040]">{VIDEO_CHAPTERS.length} sections</span>
            </div>
            <div className="overflow-y-auto flex-1">
              {VIDEO_CHAPTERS.map((ch, i) => (
                <div key={i}
                  onClick={() => setActiveChapter(i)}
                  className={`chapter-row border-l-2 px-4 py-3 ${activeChapter===i ? "ch-active border-[#00d4ff]" : "border-transparent"}`}
                  style={{animationDelay:`${i*40}ms`, borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="mono text-[9px] text-[#404050] w-10 flex-shrink-0">{ch.label}</span>
                    <span className={`mono text-[11px] font-semibold leading-tight ${activeChapter===i?"text-[#00d4ff]":"text-[#b0b0c0]"}`}>
                      {ch.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pl-12">
                    <span className="mono text-[10px] text-[#404050] leading-snug">{ch.sub}</span>
                    <span className="mono text-[9px] text-[#303040] flex-shrink-0 ml-2">{ch.dur}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom meta bar */}
        <div className="mt-5 flex items-center gap-6 px-1 flex-wrap">
          {[
            ["Total Runtime", totalDuration],
            ["Resolution",   "1080p 60fps"],
            ["Format",       "H.264 · AAC"],
            ["Chapters",     `${VIDEO_CHAPTERS.length} sections`],
            ["Project",      "QuantumRISC Studio · RV32IMAC"],
          ].map(([l,v]) => (
            <div key={l} className="flex items-center gap-2">
              <span className="mono text-[9px] text-[#303040]">{l}</span>
              <span className="mono text-[10px] text-[#505060]">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DemoVideoSection() {
  const { ref, visible } = useVisible();
  const [open, setOpen] = useState(false);
  const [hovering, setHovering] = useState(false);

  return (
    <>
      <VideoModal open={open} onClose={() => setOpen(false)} />

      <section id="demo" className="relative py-40 px-8 overflow-hidden" ref={ref}>
        {/* Background atmosphere */}
        <div className="absolute inset-0 eng-grid opacity-60"/>
        <div className="absolute inset-0"
          style={{background:"radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,212,255,0.04) 0%, transparent 70%)"}}/>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/20 to-transparent"/>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/15 to-transparent"/>

        <div className="max-w-[1100px] mx-auto">
          {/* Section heading */}
          <div className={`text-center mb-16 transition-all duration-700 ${visible?"opacity-100 translate-y-0":"opacity-0 translate-y-8"}`}>
            <SectionLabel text="11 · PROJECT DEMO" color="cyan" />
            <h2 className="text-5xl md:text-6xl font-black text-white mt-5 mb-5 leading-[0.95] tracking-tight">
              Watch the full<br />
              <span className="text-[#00d4ff] glow-text-cyan">engineering demo.</span>
            </h2>
            <p className="text-[#505060] text-[16px] max-w-xl mx-auto leading-relaxed">
              A complete walkthrough of QuantumRISC Studio — from architectural decisions
              to live FPGA execution. Ten chapters. Every system demonstrated.
            </p>
          </div>

          {/* Cinema card */}
          <div
            className={`demo-card relative rounded-sm overflow-hidden cursor-pointer video-frame-glow transition-all duration-700
              ${visible?"opacity-100 translate-y-0":"opacity-0 translate-y-10"}`}
            style={{transitionDelay:"150ms", paddingTop:"51%"}}
            onClick={() => setOpen(true)}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}>

            {/* Thumbnail background — cinematic dark SVG */}
            <div className="absolute inset-0" style={{background:"linear-gradient(135deg, #06080e 0%, #0a0f18 40%, #08090d 100%)"}}>
              {/* Engineering grid */}
              <div className="absolute inset-0 eng-grid opacity-40"/>

              {/* Scan line effect */}
              <div className="demo-scanline"/>

              {/* Dramatic processor visualization */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1100 560" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <radialGradient id="demoGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.07"/>
                    <stop offset="100%" stopColor="#00d4ff" stopOpacity="0"/>
                  </radialGradient>
                  <filter id="demoBlur"><feGaussianBlur stdDeviation="3" /></filter>
                </defs>
                <ellipse cx="550" cy="280" rx="480" ry="240" fill="url(#demoGlow)"/>

                {/* Large die outline */}
                <rect x="180" y="60" width="420" height="380" rx="8" fill="none" stroke="rgba(0,212,255,0.18)" strokeWidth="1.5" strokeDasharray="10 5"/>
                <rect x="190" y="70" width="400" height="360" rx="6" fill="rgba(0,10,20,0.5)" stroke="rgba(0,212,255,0.08)" strokeWidth="1"/>

                {/* Functional blocks */}
                {[
                  [200,80,120,60,"#00d4ff","FETCH"],
                  [340,80,120,60,"#00ff88","BRANCH PRED"],
                  [480,80,110,60,"#c87941","L1 I$"],
                  [200,160,90,90,"#ff9900","ALU"],
                  [310,160,100,90,"#00d4ff","DECODE"],
                  [430,160,110,90,"#ff3366","D-CACHE"],
                  [200,270,180,70,"#00d4ff","REGISTER FILE"],
                  [200,360,390,60,"#c87941","L2 UNIFIED CACHE · 256KB"],
                ].map(([x,y,w,h,color,label],i)=>(
                  <g key={i}>
                    <rect x={x} y={y} width={w} height={h} rx="3"
                      fill={`${color}08`} stroke={`${color}30`} strokeWidth="1"/>
                    <text x={Number(x)+Number(w)/2} y={Number(y)+Number(h)/2+3}
                      textAnchor="middle" fill={color} fontSize="8" fontFamily="JetBrains Mono" fontWeight="600"
                      opacity={0.7}>{label}</text>
                  </g>
                ))}

                {/* Animated signal paths */}
                <path d="M 260 140 L 260 160" stroke="#00d4ff" strokeWidth="1.5" strokeDasharray="60 60" className="anim-signal"/>
                <path d="M 355 140 C 355 200, 360 200, 360 160" stroke="#00ff88" strokeWidth="1" strokeDasharray="40 40" className="anim-signal2" fill="none"/>
                <path d="M 245 250 L 245 270" stroke="#00d4ff" strokeWidth="1" strokeDasharray="30 30" className="anim-signal3"/>

                {/* Pipeline timing diagram — right side */}
                {["IF","ID","EX","ME","WB"].map((s,si)=>(
                  <g key={s}>
                    <rect x={660+si*76} y={100} width={68} height={32} rx="3"
                      fill={["#00d4ff","#00ff88","#ff9900","#ff3366","#c87941"][si]+"18"}
                      stroke={["#00d4ff","#00ff88","#ff9900","#ff3366","#c87941"][si]+"50"} strokeWidth="1"/>
                    <text x={694+si*76} y={121} textAnchor="middle"
                      fill={["#00d4ff","#00ff88","#ff9900","#ff3366","#c87941"][si]} fontSize="10"
                      fontFamily="JetBrains Mono" fontWeight="700">{s}</text>
                  </g>
                ))}
                {[0,1,2,3,4].map(ii=>(
                  ["IF","ID","EX","ME","WB"].map((s,si)=>(
                    <rect key={`${ii}-${si}`} x={660+si*76} y={148+ii*38} width={68} height={30} rx="2"
                      fill={["#00d4ff","#00ff88","#ff9900","#ff3366","#c87941"][si]+(ii===si?"30":"10")}
                      stroke={["#00d4ff","#00ff88","#ff9900","#ff3366","#c87941"][si]+(ii===si?"60":"20")} strokeWidth="0.8"/>
                  ))
                ))}

                {/* Code panel */}
                {[
                  "module cpu_top #(",
                  "  parameter XLEN = 32",
                  ") (",
                  "  input  logic clk,",
                  "  input  logic rst_n,",
                  "  output logic [31:0] pc",
                  ");",
                  "  if_stage u_if (.*);",
                  "  id_stage u_id (.*);",
                ].map((line,i)=>(
                  <text key={i} x={660} y={400+i*16} fill={i===0||i===7||i===8?"rgba(0,212,255,0.4)":"rgba(255,255,255,0.15)"}
                    fontSize="8" fontFamily="JetBrains Mono">{line}</text>
                ))}

                {/* Waveform strip at bottom */}
                <rect x="660" y="540" width="390" height="1" fill="rgba(0,212,255,0.15)"/>
                <path d="M 660 528 L 680 528 L 680 518 L 720 518 L 720 528 L 760 528 L 760 518 L 800 518 L 800 528 L 840 528 L 840 518 L 880 518 L 880 528"
                  stroke="#00d4ff" strokeWidth="1" fill="none" opacity="0.4"/>
                <text x="660" y="514" fill="rgba(0,212,255,0.3)" fontSize="6" fontFamily="JetBrains Mono">CLK</text>
              </svg>

              {/* Dark gradient overlay on the card */}
              <div className="demo-card-overlay absolute inset-0"
                style={{background:"linear-gradient(to right, rgba(6,8,14,0.6) 0%, rgba(6,8,14,0.3) 50%, rgba(6,8,14,0.55) 100%)"}}/>

              {/* Corner decoration lines */}
              {[["top-4 left-4","border-t border-l","rounded-tl-sm"],
                ["top-4 right-4","border-t border-r","rounded-tr-sm"],
                ["bottom-4 left-4","border-b border-l","rounded-bl-sm"],
                ["bottom-4 right-4","border-b border-r","rounded-br-sm"]].map(([pos,cls,r],i)=>(
                <div key={i} className={`absolute ${pos} w-8 h-8 ${cls} ${r} border-[#00d4ff]/25`}/>
              ))}
            </div>

            {/* Centered play button */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
              <div className="play-btn-wrap relative flex items-center justify-center mb-8">
                {/* Ripple rings */}
                <div className="play-ripple-1"/>
                <div className="play-ripple-2"/>
                {/* Core button */}
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center"
                  style={{
                    background:"rgba(0,212,255,0.12)",
                    border:"1.5px solid rgba(0,212,255,0.5)",
                    backdropFilter:"blur(12px)",
                    boxShadow: hovering
                      ? "0 0 50px rgba(0,212,255,0.5), 0 0 100px rgba(0,212,255,0.2), inset 0 0 30px rgba(0,212,255,0.1)"
                      : "0 0 30px rgba(0,212,255,0.2), inset 0 0 20px rgba(0,212,255,0.06)",
                    transition:"box-shadow 0.4s ease",
                  }}>
                  <Play size={28} className="text-[#00d4ff] ml-1.5" fill="rgba(0,212,255,0.7)"/>
                </div>
              </div>
              {/* Play label */}
              <div className="text-center">
                <div className="mono text-[11px] font-bold tracking-[0.25em] text-[#00d4ff] uppercase mb-1.5">
                  Watch Demo
                </div>
                <div className="mono text-[10px] text-[#404050]">39:07 · Full Walkthrough · 10 Chapters</div>
              </div>
            </div>

            {/* Bottom metadata strip */}
            <div className="absolute bottom-0 left-0 right-0 z-10 px-6 py-4"
              style={{background:"linear-gradient(to top, rgba(6,8,14,0.95) 0%, transparent 100%)"}}>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="mono text-[9px] text-[#00d4ff]/60 tracking-widest mb-1">FEATURED DEMO</div>
                  <div className="text-[15px] font-bold text-white">QuantumRISC Studio — Complete Project Walkthrough</div>
                  <div className="mono text-[11px] text-[#505060] mt-0.5">
                    Pipeline · RTL · Hazards · Branch Pred · Cache · FPGA · Verification
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="glass-cyan px-3 py-1.5 rounded-sm">
                    <span className="mono text-[10px] text-[#00d4ff] font-semibold">1080p 60fps</span>
                  </div>
                  <div className="glass px-3 py-1.5 rounded-sm">
                    <span className="mono text-[10px] text-[#606070]">39:07</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chapter preview strip below card */}
          <div className={`mt-6 grid grid-cols-2 md:grid-cols-5 gap-2 transition-all duration-700 ${visible?"opacity-100 translate-y-0":"opacity-0 translate-y-6"}`}
            style={{transitionDelay:"300ms"}}>
            {VIDEO_CHAPTERS.slice(0,5).map((ch, i) => (
              <button key={i} onClick={() => { setOpen(true); }}
                className="glass rounded-sm px-3 py-3 text-left hover:border-[#00d4ff]/25 transition-all duration-200 group"
                style={{animationDelay:`${i*60}ms`}}>
                <div className="mono text-[9px] text-[#00d4ff]/50 mb-1 group-hover:text-[#00d4ff]/80 transition-colors">{ch.label}</div>
                <div className="mono text-[10px] text-[#808090] leading-snug group-hover:text-[#c0c0d0] transition-colors line-clamp-2">{ch.title}</div>
                <div className="mono text-[9px] text-[#303040] mt-1.5">{ch.dur}</div>
              </button>
            ))}
          </div>

          {/* CTA row */}
          <div className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700
            ${visible?"opacity-100 translate-y-0":"opacity-0 translate-y-6"}`} style={{transitionDelay:"450ms"}}>
            <button onClick={() => setOpen(true)}
              className="btn-primary px-8 py-3.5 rounded flex items-center gap-3 text-sm font-semibold">
              <Play size={16} fill="currentColor"/> Watch Full Demo
            </button>
            <a href="https://github.com/IamChandu114/-QuantumRISC" target="_blank" rel="noreferrer"
              className="btn-outline px-8 py-3.5 rounded flex items-center gap-3 text-sm">
              <Github size={16}/> View Source on GitHub
            </a>
            <a href="#overview"
              className="btn-ghost px-8 py-3.5 rounded flex items-center gap-3 text-sm">
              <Cpu size={16}/> Explore Architecture
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────
function FooterSection() {
  return (
    <footer className="relative border-t border-white/5 py-20 px-8">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded border border-[#00d4ff]/40 flex items-center justify-center">
                <Cpu size={16} className="text-[#00d4ff]"/>
              </div>
              <div>
                <div className="mono text-sm font-bold text-white">QuantumRISC Studio</div>
                <div className="mono text-[10px] text-[#404050]">Professional RISC-V Engineering Platform</div>
              </div>
            </div>
            <p className="text-[13px] text-[#505060] leading-relaxed max-w-sm">
              A fully-verified, FPGA-validated RV32IMAC processor implementation with
              complete toolchain support, interactive visualization, and professional
              documentation.
            </p>
            <div className="flex gap-3 mt-6">
              <a href="https://github.com/IamChandu114/-QuantumRISC" target="_blank" rel="noreferrer" className="btn-outline px-4 py-2 rounded text-xs flex items-center gap-2">
                <Github size={12}/> Source Code
              </a>
              <a href="/docs" target="_blank" rel="noreferrer" className="btn-ghost px-4 py-2 rounded text-xs flex items-center gap-2">
                <ExternalLink size={12}/> Documentation
              </a>
            </div>
          </div>
          {[
            { title:"ARCHITECTURE", links:["RV32I Base ISA","M Extension (MUL/DIV)","A Extension (AMO)","C Extension (16-bit)","Zicsr (CSR ops)"] },
            { title:"FEATURES",     links:["5-Stage Pipeline","Data Forwarding","2-bit Branch Pred","L1/L2 Cache","Hazard Detection"] },
          ].map(col => (
            <div key={col.title}>
              <div className="section-label mb-4">{col.title}</div>
              <ul className="space-y-2">
                {col.links.map(l => (
                  <li key={l}>
                    <span className="mono text-[12px] text-[#505060] hover:text-[#c0c0d0] cursor-pointer transition-colors">{l}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="mono text-[11px] text-[#303040]">
            QuantumRISC Studio · RV32IMAC · 5-Stage Pipeline · Verified 2024
          </div>
          <div className="flex items-center gap-6 mono text-[11px] text-[#303040]">
            <span>RTL: SystemVerilog 2017</span>
            <span>EDA: Vivado 2023.2</span>
            <span>Target: Xilinx Artix-7</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#00ff88] anim-pulse"/>
            <span className="mono text-[10px] text-[#00ff88]">All systems nominal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── APP ─────────────────────────────────────────────────────
export default function App() {
  return (
    <div className="bg-[#080809] text-[#f0f0f2] min-h-screen overflow-x-hidden" style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
      <style>{CSS}</style>
      <NavBar />
      <HeroSection />
      <CPUOverviewSection />
      <InstructionLifecycleSection />
      <PipelineSection />
      <RTLExplorerSection />
      <HazardLabSection />
      <BranchPredSection />
      <CacheSimSection />
      <PerformanceSection />
      <VerificationSection />
      <FPGASection />
      <DemoVideoSection />
      <FooterSection />
    </div>
  );
}
