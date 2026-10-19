import { Breadcrumb } from '@/components/breadcrumb'
import { Pagination } from '@/components/pagination'

export default function FAQPage() {
  const faqs = [
    {
      q: 'What is QuantumRISC?',
      a: 'QuantumRISC is a professional CPU architecture implementation showcasing RISC-V ISA design, 5-stage pipeline implementation, comprehensive verification, and full-stack engineering excellence.',
    },
    {
      q: 'What ISA does QuantumRISC implement?',
      a: 'QuantumRISC implements the RISC-V 32-bit instruction set architecture (RV32I base ISA) with support for standard extensions. This provides compatibility with existing RISC-V toolchains and educational resources.',
    },
    {
      q: 'Can I run real programs on QuantumRISC?',
      a: 'Yes! QuantumRISC can execute RISC-V binaries compiled with standard toolchains. You can run algorithms, benchmarks, and educational programs directly in the simulator.',
    },
    {
      q: 'What is the pipeline depth?',
      a: 'QuantumRISC uses a 5-stage in-order pipeline: Fetch → Decode → Execute → Memory → Write-back. This depth provides a good balance between educational clarity and real-world relevance.',
    },
    {
      q: 'How accurate is the simulation?',
      a: 'The simulation is cycle-accurate for the modeled architecture. It precisely tracks all pipeline behavior, hazards, forwarding, and cache interactions for accurate performance prediction.',
    },
    {
      q: 'Is the RTL available?',
      a: 'Yes, the complete SystemVerilog RTL is open-source and available. It includes synthesizable modules targeting both FPGA and ASIC design flows.',
    },
    {
      q: 'Can I modify the simulator?',
      a: 'Absolutely! QuantumRISC is designed for extensibility. The modular architecture allows you to add custom instructions, modify pipeline stages, or implement additional features.',
    },
    {
      q: 'What tools are required to use QuantumRISC?',
      a: 'For simulation, you only need Node.js and a web browser. For RTL simulation/synthesis, you&apos;ll want an HDL simulator like ModelSim or Vivado.',
    },
    {
      q: 'How do I report bugs or contribute?',
      a: 'Contributions are welcome! Please submit issues and pull requests on the GitHub repository following the contribution guidelines.',
    },
    {
      q: 'Is there documentation for the codebase?',
      a: 'Yes, comprehensive documentation covers architecture, RTL design, verification methodology, API reference, and developer guides.',
    },
  ]

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'Resources', href: '/docs/resources' },
          { label: 'FAQ' },
        ]}
      />

      <article className="prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight mb-6">Frequently Asked Questions</h1>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group p-4 rounded-lg border border-border bg-card/50 cursor-pointer hover:border-primary/30 transition-colors"
            >
              <summary className="font-semibold text-foreground cursor-pointer flex items-center justify-between">
                <span>{faq.q}</span>
                <span className="text-primary group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground">{faq.a}</p>
            </details>
          ))}
        </div>

        <section className="mt-12 p-6 rounded-lg border border-border bg-card">
          <h2 className="text-xl font-semibold mb-4">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-4">
            Check out the complete documentation or reach out to the community for help.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://github.com/IamChandu114/-QuantumRISC/discussions"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-md border border-border hover:border-primary hover:bg-primary/5 transition-all text-center font-medium"
            >
              GitHub Discussions
            </a>
            <a
              href="https://github.com/IamChandu114/-QuantumRISC/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-md border border-border hover:border-primary hover:bg-primary/5 transition-all text-center font-medium"
            >
              Report Issue
            </a>
          </div>
        </section>
      </article>

      <Pagination
        previous={{
          label: 'Resources',
          href: '/docs/resources',
        }}
      />
    </>
  )
}
