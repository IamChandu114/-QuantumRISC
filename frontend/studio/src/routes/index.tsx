import { createFileRoute } from "@tanstack/react-router";
import { QuantumRiscStudio } from "@/components/quantumrisc/QuantumRiscStudio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuantumRISC Studio — CPU Engineering Workstation" },
      {
        name: "description",
        content:
          "An evidence-based engineering workstation for inspecting CPU architecture, simulation state, verification, and performance.",
      },
      { property: "og:title", content: "QuantumRISC Studio — CPU Engineering Workstation" },
      {
        property: "og:description",
        content:
          "Inspect processor architecture and simulation evidence in the QuantumRISC engineering workstation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <QuantumRiscStudio />;
}
