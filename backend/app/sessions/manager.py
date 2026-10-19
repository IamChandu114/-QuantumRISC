from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
import asyncio
import logging
import re
import uuid
from typing import Any

from fastapi.encoders import jsonable_encoder

from app.analyzers.forwarding_analyzer import ForwardingAnalyzer
from app.analyzers.hazard_analyzer import HazardAnalyzer
from app.analyzers.metrics_engine import MetricsEngine
from app.config.settings import Settings
from app.models.schemas import SessionSnapshot
from app.sim.compile_manager import CompileManager
from app.sim.discovery import DiscoveryService
from app.sim.run_manager import RunManager
from app.sim.vcd_parser import VCDParser
from app.trackers.memory_tracker import MemoryTracker
from app.trackers.pipeline_tracker import PipelineTracker
from app.trackers.register_tracker import RegisterTracker
from app.sessions.db import init_db, load_session, save_session, load_sessions


logger = logging.getLogger("quantumrisc")


@dataclass
class SessionRecord:
    id: str
    top: str
    testbench: str
    created_at: datetime
    updated_at: datetime
    status: str = "created"
    compile: dict[str, Any] = field(default_factory=dict)
    run: dict[str, Any] = field(default_factory=dict)
    parsed: dict[str, Any] = field(default_factory=dict)
    timeline: list[dict[str, Any]] = field(default_factory=list)
    cursor: int = 0
    paused: bool = True
    playback_mode: str = "idle"
    vcd_path: Path | None = None
    build_path: Path | None = None
    workdir: Path | None = None
    output_path: Path | None = None


class SessionManager:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.discovery = DiscoveryService(settings.repo_root)
        self.compile_manager = CompileManager(settings.iverilog_path)
        self.run_manager = RunManager(settings.vvp_path)
        self.vcd_parser = VCDParser()
        self.register_tracker = RegisterTracker()
        self.memory_tracker = MemoryTracker()
        self.pipeline_tracker = PipelineTracker()
        self.hazard_analyzer = HazardAnalyzer()
        self.forwarding_analyzer = ForwardingAnalyzer()
        self.metrics_engine = MetricsEngine()
        self.compile_locks: dict[str, asyncio.Lock] = {}
        self.run_locks: dict[str, asyncio.Lock] = {}
        
        # SQLite persistence initialization
        init_db(settings.sqlite_db_path)
        self.sessions: dict[str, SessionRecord] = load_sessions(settings.sqlite_db_path)
        for session_id, session in list(self.sessions.items()):
            try:
                self._restore_session_paths(session)
            except ValueError:
                logger.warning("Ignoring persisted session with an invalid identifier")
                self.sessions.pop(session_id)
        
        self.subscribers: dict[str, list[asyncio.Queue]] = {}
        self.playback_tasks: dict[str, asyncio.Task] = {}

    def _restore_session_paths(self, session: SessionRecord) -> None:
        """Rebuild ephemeral artifact paths after a service restart or host move."""
        if not re.fullmatch(r"[0-9a-f]{12}", session.id):
            raise ValueError("Invalid persisted session identifier")
        session.workdir = self.settings.runs_root / session.id
        session.build_path = session.workdir / "build" / f"{session.id}.vvp"
        session.output_path = session.workdir
        if session.vcd_path and not session.vcd_path.exists():
            session.vcd_path = None
            session.run = {}
            session.compile = {}
            session.status = "created"

    def create_session(self, top: str, testbench: str) -> SessionRecord:
        session_id = uuid.uuid4().hex[:12]
        now = datetime.now(timezone.utc)
        record = SessionRecord(id=session_id, top=top, testbench=testbench, created_at=now, updated_at=now)
        self._restore_session_paths(record)
        record.workdir.mkdir(parents=True, exist_ok=True)
        self.sessions[session_id] = record
        self.subscribers[session_id] = []
        save_session(self.settings.sqlite_db_path, record)
        return record

    def get(self, session_id: str) -> SessionRecord:
        session = self.sessions.get(session_id)
        if session is not None:
            return session
        loaded = load_session(self.settings.sqlite_db_path, session_id)
        if loaded is None:
            raise KeyError(session_id)
        self.sessions[session_id] = loaded
        return loaded

    def add_subscriber(self, session_id: str, queue: asyncio.Queue) -> None:
        self.subscribers.setdefault(session_id, []).append(queue)

    def remove_subscriber(self, session_id: str, queue: asyncio.Queue) -> None:
        queues = self.subscribers.get(session_id, [])
        if queue in queues:
            queues.remove(queue)

    async def broadcast(self, session_id: str, event: dict[str, Any]) -> None:
        encoded = jsonable_encoder(event)
        for queue in list(self.subscribers.get(session_id, [])):
            await queue.put(encoded)

    def _compile_lock(self, session_id: str) -> asyncio.Lock:
        lock = self.compile_locks.get(session_id)
        if lock is None:
            lock = asyncio.Lock()
            self.compile_locks[session_id] = lock
        return lock

    def _run_lock(self, session_id: str) -> asyncio.Lock:
        lock = self.run_locks.get(session_id)
        if lock is None:
            lock = asyncio.Lock()
            self.run_locks[session_id] = lock
        return lock

    async def bootstrap(self, session_id: str) -> None:
        session = self.get(session_id)
        if session.status in {"running", "finished"} and session.run.get("ok") and session.vcd_path and session.vcd_path.exists():
            return
        try:
            resolved_top, resolved_testbench = self.resolve_execution_profile(session.top, session.testbench)
            if resolved_top != session.top or resolved_testbench != session.testbench:
                session.top = resolved_top
                session.testbench = resolved_testbench
                session.updated_at = datetime.now(timezone.utc)
                save_session(self.settings.sqlite_db_path, session)
                await self._broadcast_state(session_id)
            await self.compile(session_id)
            session = self.get(session_id)
            if session.compile.get("ok"):
                await self.run(session_id)
        except KeyError:
            return
        except Exception as exc:
            logger.error(f"Auto bootstrap failed for session {session_id}: {exc}")
            session = self.get(session_id)
            if session.status == "compiling":
                session.status = "compile_error"
            elif session.status == "running":
                session.status = "run_error"
            session.updated_at = datetime.now(timezone.utc)
            save_session(self.settings.sqlite_db_path, session)

    def _source_files(self, testbench_module: str | None = None) -> list[Path]:
        rtl_dir = self.settings.repo_root / "rtl"
        if not rtl_dir.exists() and (self.settings.backend_root / "rtl").exists():
            rtl_dir = self.settings.backend_root / "rtl"

        verif_dir = self.settings.repo_root / "verification"
        if not verif_dir.exists() and (self.settings.backend_root / "verification").exists():
            verif_dir = self.settings.backend_root / "verification"

        rtl_sv = sorted(rtl_dir.glob("**/*.sv"))
        valid_rtl = [
            p for p in rtl_sv
            if "runs" not in p.parts and ".git" not in p.parts and "node_modules" not in p.parts
        ]
        tb_files = sorted(verif_dir.glob("**/*.sv"))
        if not testbench_module:
            return valid_rtl + [p for p in tb_files if "runs" not in p.parts and ".git" not in p.parts and "node_modules" not in p.parts]

        matching_tb = [
            p for p in tb_files
            if (p.stem == testbench_module or p.name == f"{testbench_module}.sv")
            and "runs" not in p.parts and ".git" not in p.parts and "node_modules" not in p.parts
        ]
        return valid_rtl + matching_tb

    def _current_timeline(self, session: SessionRecord) -> list[dict[str, Any]]:
        if not session.timeline:
            return []
        cursor = max(0, min(session.cursor, len(session.timeline) - 1))
        return session.timeline[: cursor + 1]

    def _discovery_payload(self) -> dict[str, Any]:
        discovery = self.discovery.discover()
        return {
            "tops": discovery.tops,
            "smoke_tops": discovery.smoke_tops,
            "testbenches": discovery.testbenches,
            "rtl_files": [
                {
                    "path": str(f.path.relative_to(self.settings.repo_root)),
                    "kind": "rtl",
                    "module_names": f.module_names,
                }
                for f in discovery.rtl_files
            ],
            "verification_files": [
                {
                    "path": str(f.path.relative_to(self.settings.repo_root)),
                    "kind": "verification",
                    "module_names": f.module_names,
                }
                for f in discovery.verification_files
            ],
            "default_top": discovery.default_top,
            "default_testbench": discovery.default_testbench,
        }

    def resolve_execution_profile(self, top: str | None = None, testbench: str | None = None) -> tuple[str, str]:
        discovery = self.discovery.discover()
        available_tops = set(discovery.tops)
        available_testbenches = set(discovery.testbenches)

        resolved_testbench = testbench if testbench in available_testbenches else (discovery.default_testbench or "pipeline_cpu_complete_tb")
        if not resolved_testbench and available_testbenches:
            resolved_testbench = sorted(available_testbenches)[0]
        if not resolved_testbench:
            resolved_testbench = "pipeline_cpu_complete_tb"

        resolved_top = top if top in available_tops else (discovery.default_top or "pipeline_cpu_complete")
        if resolved_testbench.endswith("_tb"):
            derived_top = resolved_testbench[:-3]
            if derived_top in available_tops and top not in available_tops:
                resolved_top = derived_top
        if not resolved_top and available_tops:
            resolved_top = sorted(available_tops)[0]
        if not resolved_top:
            resolved_top = "pipeline_cpu_complete"
        return resolved_top, resolved_testbench

    @staticmethod
    def _topic_signals(signals: list[str], keywords: tuple[str, ...]) -> list[str]:
        lowered = tuple(keyword.lower() for keyword in keywords)
        matched = [signal for signal in signals if any(keyword in signal.lower() for keyword in lowered)]
        return sorted(dict.fromkeys(matched))

    @staticmethod
    def _topic_values(current_sample: dict[str, Any], signals: list[str]) -> dict[str, Any]:
        return {signal: current_sample[signal] for signal in signals if signal in current_sample}

    async def _broadcast_state(self, session_id: str) -> None:
        await self.broadcast(session_id, {"type": "state.snapshot", "payload": jsonable_encoder(self.snapshot(session_id))})

    async def _playback_loop(self, session_id: str) -> None:
        try:
            while True:
                session = self.get(session_id)
                if session.paused:
                    break
                total_len = len(session.timeline)
                if total_len <= 1:
                    break
                session.cursor = (session.cursor + 1) % total_len
                session.updated_at = datetime.now(timezone.utc)
                await self._broadcast_state(session_id)
                await self.broadcast(session_id, {
                    "type": "state.delta",
                    "payload": {
                        "session_id": session_id,
                        "cursor": session.cursor,
                        "updated_at": session.updated_at.isoformat(),
                    },
                })
                await asyncio.sleep(0.08)
        finally:
            self.playback_tasks.pop(session_id, None)

    async def pause(self, session_id: str) -> dict[str, Any]:
        session = self.get(session_id)
        session.paused = True
        session.playback_mode = "paused"
        task = self.playback_tasks.pop(session_id, None)
        if task:
            task.cancel()
        session.updated_at = datetime.now(timezone.utc)
        await self.broadcast(session_id, {"type": "session.paused", "payload": {"session_id": session_id, "cursor": session.cursor}})
        await self._broadcast_state(session_id)
        save_session(self.settings.sqlite_db_path, session)
        return self.snapshot(session_id).model_dump()

    async def resume(self, session_id: str) -> dict[str, Any]:
        session = self.get(session_id)
        if not session.timeline:
            return self.snapshot(session_id).model_dump()
        session.paused = False
        session.playback_mode = "playing"
        if session_id not in self.playback_tasks:
            self.playback_tasks[session_id] = asyncio.create_task(self._playback_loop(session_id))
        session.updated_at = datetime.now(timezone.utc)
        await self.broadcast(session_id, {"type": "session.resumed", "payload": {"session_id": session_id, "cursor": session.cursor}})
        await self._broadcast_state(session_id)
        save_session(self.settings.sqlite_db_path, session)
        return self.snapshot(session_id).model_dump()

    async def reset(self, session_id: str) -> dict[str, Any]:
        session = self.get(session_id)
        session.paused = True
        session.playback_mode = "idle"
        task = self.playback_tasks.pop(session_id, None)
        if task:
            task.cancel()
        session.cursor = 0
        session.updated_at = datetime.now(timezone.utc)
        await self.broadcast(session_id, {"type": "session.reset", "payload": {"session_id": session_id, "cursor": session.cursor}})
        await self._broadcast_state(session_id)
        save_session(self.settings.sqlite_db_path, session)
        return self.snapshot(session_id).model_dump()

    async def step(self, session_id: str) -> dict[str, Any]:
        session = self.get(session_id)
        session.paused = True
        session.playback_mode = "stepping"
        task = self.playback_tasks.pop(session_id, None)
        if task:
            task.cancel()
        session.cursor = min(session.cursor + 1, max(0, len(session.timeline) - 1))
        session.updated_at = datetime.now(timezone.utc)
        await self.broadcast(session_id, {"type": "session.step", "payload": {"session_id": session_id, "cursor": session.cursor}})
        await self._broadcast_state(session_id)
        save_session(self.settings.sqlite_db_path, session)
        return self.snapshot(session_id).model_dump()

    async def compile(self, session_id: str) -> dict[str, Any]:
        async with self._compile_lock(session_id):
            session = self.get(session_id)
            resolved_top, resolved_testbench = self.resolve_execution_profile(session.top, session.testbench)
            if resolved_top != session.top or resolved_testbench != session.testbench:
                session.top = resolved_top
                session.testbench = resolved_testbench
                session.updated_at = datetime.now(timezone.utc)
                save_session(self.settings.sqlite_db_path, session)
                await self._broadcast_state(session_id)
            if session.compile.get("ok") and session.build_path and session.build_path.exists() and session.status in {"compiled", "running", "finished"}:
                return session.compile
            await self.broadcast(session_id, {"type": "compile.started", "session_id": session_id})
            session.status = "compiling"
            session.updated_at = datetime.now(timezone.utc)
            save_session(self.settings.sqlite_db_path, session)
            await self._broadcast_state(session_id)
            sources = self._source_files(session.testbench)
            result = await self.compile_manager.compile(sources, session.testbench, session.build_path, session.workdir)
            stderr = result.stderr
            if not result.ok and not stderr.startswith(("IVERILOG_UNAVAILABLE", "BACKEND_CONFIGURATION_ERROR", "COMPILATION_FAILED")):
                stderr = f"COMPILATION_FAILED: {stderr}" if stderr else "COMPILATION_FAILED: Compilation did not produce an executable."
            session.compile = {
                "ok": result.ok,
                "returncode": result.returncode,
                "stdout": result.stdout,
                "stderr": stderr,
                "executable": str(result.executable) if result.executable else None,
            }
            session.updated_at = datetime.now(timezone.utc)
            session.status = "compiled" if result.ok else "compile_error"
            save_session(self.settings.sqlite_db_path, session)
            await self.broadcast(session_id, {"type": "compile.finished" if result.ok else "compile.error", "payload": session.compile})
            await self._broadcast_state(session_id)
            return session.compile

    async def run(self, session_id: str) -> dict[str, Any]:
        async with self._run_lock(session_id):
            session = self.get(session_id)
            if session.run.get("ok") and session.vcd_path and session.vcd_path.exists() and session.status in {"running", "finished"}:
                return session.run
            if not session.build_path or not session.build_path.exists():
                await self.compile(session_id)
            if not session.build_path or not session.build_path.exists():
                session.run = {
                    "ok": False,
                    "returncode": -1,
                    "stdout": session.compile.get("stdout", ""),
                    "stderr": session.compile.get("stderr") or "Compilation failed or executable build path does not exist.",
                    "vcd_path": None,
                }
                session.status = "run_error"
                session.updated_at = datetime.now(timezone.utc)
                save_session(self.settings.sqlite_db_path, session)
                await self.broadcast(session_id, {"type": "run.error", "payload": session.run})
                await self._broadcast_state(session_id)
                return session.run
            await self.broadcast(session_id, {"type": "run.started", "session_id": session_id})
            session.status = "running"
            session.updated_at = datetime.now(timezone.utc)
            save_session(self.settings.sqlite_db_path, session)
            await self._broadcast_state(session_id)
            result = await self.run_manager.run(session.build_path, session.workdir)
            stderr = result.stderr
            if not result.ok and not stderr.startswith(("VVP_UNAVAILABLE", "SIMULATION_FAILED", "VCD_NOT_GENERATED")):
                stderr = f"SIMULATION_FAILED: {stderr}"
            session.run = {
                "ok": result.ok,
                "returncode": result.returncode,
                "stdout": result.stdout,
                "stderr": stderr,
                "vcd_path": str(result.vcd_path) if result.vcd_path else None,
            }
            session.vcd_path = result.vcd_path
            session.status = "running" if result.ok else "run_error"
            await self.broadcast(session_id, {"type": "run.stdout", "payload": result.stdout})
            if result.stderr:
                await self.broadcast(session_id, {"type": "run.stderr", "payload": result.stderr})
            if result.ok and result.vcd_path:
                parsed = self.vcd_parser.parse(result.vcd_path)
                registers = self.register_tracker.snapshot(parsed.timeline)
                memory = self.memory_tracker.snapshot(parsed.timeline)
                pipeline = self.pipeline_tracker.snapshot(parsed.timeline)
                hazards = self.hazard_analyzer.analyze(parsed.timeline)
                forwarding = self.forwarding_analyzer.analyze(hazards)
                metrics = self.metrics_engine.analyze(parsed.timeline, hazards)
                session.timeline = parsed.timeline
                session.cursor = 0
                session.paused = False
                session.playback_mode = "playing"
                session.parsed = {
                    "signals": list(parsed.signals.keys()),
                    "timeline": parsed.timeline,
                    "samples": parsed.samples,
                }
                session.status = "running"
                session.updated_at = datetime.now(timezone.utc)
                save_session(self.settings.sqlite_db_path, session)
                await self._broadcast_state(session_id)
                await self.broadcast(session_id, {"type": "run.finished", "payload": session.run})
                for event_name, value in (
                    ("registers.update", registers),
                    ("memory.update", memory),
                    ("pipeline.update", pipeline),
                    ("hazard.update", hazards),
                    ("forwarding.update", forwarding),
                    ("metrics.update", metrics),
                    ("state.delta", {"session_id": session_id, "updated_at": session.updated_at.isoformat()}),
                ):
                    await self.broadcast(session_id, {"type": event_name, "payload": value})
                    await asyncio.sleep(0)
                await self.resume(session_id)
            elif not result.ok:
                session.status = "run_error"
                save_session(self.settings.sqlite_db_path, session)
                await self.broadcast(session_id, {"type": "run.error", "payload": session.run})
            return session.run

    def snapshot(self, session_id: str) -> SessionSnapshot:
        session = self.get(session_id)
        timeline = self._current_timeline(session)
        full_timeline = session.timeline if session.timeline else timeline
        registers = self.register_tracker.snapshot(timeline)
        memory = self.memory_tracker.snapshot(timeline)
        pipeline = self.pipeline_tracker.snapshot(timeline)
        hazards = self.hazard_analyzer.analyze(full_timeline)
        forwarding = self.forwarding_analyzer.analyze(hazards)
        metrics = self.metrics_engine.analyze(full_timeline, hazards)
        current_sample = timeline[-1]["changed"] if timeline else {}
        discovery = self._discovery_payload()
        signal_names = list(session.parsed.get("signals", []))
        # Cache: only match signals from dedicated cache module hierarchy names.
        # The current RTL (rtl/cache/) contains NO cache implementation.
        # We use exact module-path matching rather than loose keywords to avoid
        # falsely classifying ALU/control signals as cache telemetry.
        CACHE_MODULE_PREFIXES = ("l1i", "l1d", "icache", "dcache", "cache", "victim", "mshr")
        rtl_cache_dir = self.settings.repo_root / "rtl" / "cache"
        rtl_cache_exists = rtl_cache_dir.is_dir() and any(rtl_cache_dir.glob("*.sv"))
        if rtl_cache_exists:
            cache_signals = self._topic_signals(signal_names, CACHE_MODULE_PREFIXES)
        else:
            cache_signals = []  # No cache module in RTL — do not match generic signals
        branch_signals = self._topic_signals(signal_names, ("branch", "jump", "flush", "predict", "ghr", "pht", "btb", "pc", "zero", "stall"))
        verification_signals = self._topic_signals(signal_names, ("assert", "cover", "coverage", "scoreboard", "fail", "pass", "check"))
        fpga_signals = self._topic_signals(signal_names, ("lut", "ff", "bram", "dsp", "timing", "slack", "fmax", "critical"))
        return SessionSnapshot(
            session_id=session.id,
            status=session.status,
            top=session.top,
            testbench=session.testbench,
            created_at=session.created_at,
            updated_at=session.updated_at,
            discovery=discovery,
            playback={
                "cursor": session.cursor,
                "total": len(session.timeline),
                "paused": session.paused,
                "mode": session.playback_mode,
            },
            compile=session.compile,
            run=session.run,
            architecture={"signals": session.parsed.get("signals", [])},
            registers=registers,
            memory=memory,
            pipeline=pipeline,
            hazards=hazards,
            forwarding=forwarding,
            metrics=metrics,
            waveforms={"timeline": session.timeline, "signals": session.parsed.get("signals", []), "cursor": session.cursor, "current": current_sample},
            vcd={"path": str(session.vcd_path) if session.vcd_path else None, "name": session.vcd_path.name if session.vcd_path else None},
            cache={
                "signals": cache_signals,
                "current": self._topic_values(current_sample, cache_signals),
                "available": rtl_cache_exists and bool(cache_signals),
                "reason": "No cache implementation exists in current RTL" if not rtl_cache_exists else ("" if cache_signals else "Cache module present but emits no signals."),
            },
            branch={
                "signals": branch_signals,
                "current": self._topic_values(current_sample, branch_signals),
                "available": bool(branch_signals),
                "reason": "" if branch_signals else "The current backend snapshot does not emit dedicated branch predictor signals.",
                "hazards": hazards,
                "forwarding": forwarding,
            },
            verification={
                "files": discovery["verification_files"],
                "compile": session.compile,
                "run": session.run,
                "vcd": {"path": str(session.vcd_path) if session.vcd_path else None, "name": session.vcd_path.name if session.vcd_path else None},
                "signals": verification_signals,
                "current": self._topic_values(current_sample, verification_signals),
                "logs": {
                    "compile_stdout": session.compile.get("stdout", ""),
                    "compile_stderr": session.compile.get("stderr", ""),
                    "run_stdout": session.run.get("stdout", ""),
                    "run_stderr": session.run.get("stderr", ""),
                },
            },
            fpga={
                "rtl_files": discovery["rtl_files"],
                "verification_files": discovery["verification_files"],
                "compile": session.compile,
                "run": session.run,
                "signals": fpga_signals,
                "available": False,
                "reason": "The current backend flow does not emit synthesis resource or timing reports.",
            },
        )
