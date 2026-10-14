from app.trackers.pipeline_tracker import PipelineTracker
tracker = PipelineTracker()
changed = {
    "pipeline_cpu_complete_tb.dut.pc_current [31:0]": "0101",
    "pipeline_cpu_complete_tb.dut.instruction [31:0]": "0011",
    "pipeline_cpu_complete_tb.dut.if_pc [31:0]": "0000",
    "pipeline_cpu_complete_tb.dut.if_instruction [31:0]": "1111"
}
timeline = [{"changed": changed}]
print(tracker.snapshot(timeline))
