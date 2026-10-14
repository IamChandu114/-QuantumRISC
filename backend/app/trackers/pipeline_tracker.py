from __future__ import annotations

from typing import Any


class PipelineTracker:
    def snapshot(self, timeline: list[dict[str, Any]]) -> dict[str, Any]:
        changed = timeline[-1].get("changed", {}) if timeline else {}
        
        # Pull signals for IF stage (before IF/ID register)
        if_pc = self._get_signal(changed, ["pc_current", "pc_if"])
        if_inst = self._get_signal(changed, ["instruction_if", "instruction", "imem.instruction"])
        
        # Pull signals for ID/EX stage (after IF/ID register)
        id_pc = self._get_signal(changed, ["if_pc", "pc_id"])
        id_inst = self._get_signal(changed, ["if_instruction", "instruction_id"])
        
        # Pull signals for EX stage (if fully pipelined)
        ex_pc = self._get_signal(changed, ["id_pc", "pc_ex"])
        ex_inst = self._get_signal(changed, ["id_instruction", "instruction_ex"])
        
        # Pull signals for MEM stage (if fully pipelined)
        mem_pc = self._get_signal(changed, ["ex_pc", "pc_mem"])
        mem_inst = self._get_signal(changed, ["ex_instruction", "instruction_mem"])
        
        # Pull signals for WB stage (if fully pipelined)
        wb_pc = self._get_signal(changed, ["mem_pc", "pc_wb"])
        wb_inst = self._get_signal(changed, ["mem_instruction", "instruction_wb"])

        pipeline = {}
        
        if if_pc is not None or if_inst is not None:
            pipeline["IF"] = {
                "pc": self._fmt(if_pc),
                "instruction": self._fmt(if_inst),
            }
            
        if id_pc is not None or id_inst is not None:
            pipeline["ID"] = {
                "pc": self._fmt(id_pc),
                "instruction": self._fmt(id_inst),
            }
            
        if ex_pc is not None or ex_inst is not None:
            pipeline["EX"] = {
                "pc": self._fmt(ex_pc),
                "instruction": self._fmt(ex_inst),
                "alu_result": self._fmt(self._get_signal(changed, ["alu_result", "result"])),
            }
            
        if mem_pc is not None or mem_inst is not None:
            pipeline["MEM"] = {
                "pc": self._fmt(mem_pc),
                "instruction": self._fmt(mem_inst),
            }
            
        if wb_pc is not None or wb_inst is not None:
            pipeline["WB"] = {
                "pc": self._fmt(wb_pc),
                "instruction": self._fmt(wb_inst),
                "writeback_data": self._fmt(self._get_signal(changed, ["writeback_data", "write_data"])),
            }
            
        # Fallback for completely single-cycle CPUs (like cpu_top.sv) without even an IF/ID reg
        if not pipeline and (self._get_signal(changed, ["pc", "pc_out", "pc_current"]) is not None):
            pipeline["EX"] = {
                "pc": self._fmt(self._get_signal(changed, ["pc", "pc_out", "pc_current"])),
                "instruction": self._fmt(self._get_signal(changed, ["instruction", "instruction_out"])),
                "alu_result": self._fmt(self._get_signal(changed, ["alu_result", "result"])),
                "writeback_data": self._fmt(self._get_signal(changed, ["writeback_data", "write_data"])),
            }

        return pipeline

    def _get_signal(self, changed: dict[str, Any], candidates: list[str]) -> Any:
        for cand in candidates:
            for key, val in changed.items():
                lower = key.lower()
                if lower.endswith(f".{cand}") or f".{cand} " in lower or lower.endswith(f".{cand} [") or key == cand:
                    return val
        return None

    def _fmt(self, value: Any) -> str:
        if value is None:
            return "0x0"
        text = str(value).strip()
        if text == "":
            return "0x0"
        if all(ch in "01" for ch in text):
            try:
                return f"0x{int(text, 2):X}"
            except ValueError:
                return text
        return text

