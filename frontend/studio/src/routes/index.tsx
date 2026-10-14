import { createFileRoute } from "@tanstack/react-router";
import { StudioWithBackend } from "@/components/quantum/studio-connected";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "QuantumRISC Studio — Processor Engineering Workstation" },
    { name: "description", content: "Investigate processor execution through synchronized pipeline traces, register state, waveforms, and contextual engineering inspectors." },
    { property: "og:title", content: "QuantumRISC Studio — Processor Engineering Workstation" },
    { property: "og:description", content: "A precise engineering workspace for real execution captures, time-travel inspection, and hardware debugging." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: StudioWithBackend,
});
