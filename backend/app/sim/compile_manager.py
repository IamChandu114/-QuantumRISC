from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import asyncio
import shutil
import subprocess


@dataclass
class CompileResult:
    ok: bool
    returncode: int
    stdout: str
    stderr: str
    executable: Path | None = None


class CompileManager:
    def __init__(self, iverilog_path: str):
        self.iverilog_path = iverilog_path

    async def compile(self, source_files: list[Path], top: str, out_file: Path, workdir: Path) -> CompileResult:
        out_file.parent.mkdir(parents=True, exist_ok=True)
        compiler = shutil.which(self.iverilog_path) or (self.iverilog_path if Path(self.iverilog_path).is_file() else None)
        if not compiler:
            return CompileResult(False, -1, "", "IVERILOG_UNAVAILABLE: Icarus Verilog compiler unavailable.")
        if not source_files:
            return CompileResult(False, -1, "", "BACKEND_CONFIGURATION_ERROR: No RTL or verification source files were discovered.")
        repo_root = workdir.parent.parent if workdir.parent.name == "runs" else workdir
        include_dirs = [
            repo_root / "rtl",
            repo_root / "rtl" / "common",
            repo_root / "rtl" / "cpu",
            repo_root / "rtl" / "memory",
            repo_root / "rtl" / "pipeline",
            repo_root / "verification",
        ]
        inc_args = []
        for inc in include_dirs:
            if inc.exists():
                inc_args.extend(["-I", str(inc)])

        cmd = [
            compiler,
            "-g2012",
            "-Wall",
            *inc_args,
            "-s", top,
            "-o", str(out_file),
            *[str(p) for p in source_files],
        ]
        try:
            completed = await asyncio.to_thread(self._run_subprocess, cmd, workdir)
        except subprocess.TimeoutExpired as exc:
            return CompileResult(False, -1, exc.stdout or "", "COMPILATION_FAILED: Icarus Verilog compilation timed out.")
        except OSError as exc:
            return CompileResult(False, -1, "", f"COMPILATION_FAILED: Unable to start Icarus Verilog: {exc}")
        has_executable = out_file.is_file() and out_file.stat().st_size > 0
        has_error = completed.returncode != 0 or not has_executable
        ok = not has_error
        return CompileResult(
            ok=ok,
            returncode=completed.returncode if completed.returncode is not None else (0 if ok else -1),
            stdout=completed.stdout or "",
            stderr=completed.stderr or "",
            executable=out_file if ok else None,
        )

    def _run_subprocess(self, cmd: list[str], workdir: Path) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            cmd,
            cwd=str(workdir),
            capture_output=True,
            text=True,
            check=False,
            timeout=60,
        )
