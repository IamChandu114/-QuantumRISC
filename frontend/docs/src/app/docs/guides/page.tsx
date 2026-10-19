import { Breadcrumb } from '@/components/breadcrumb'
import { Pagination } from '@/components/pagination'
import { Code2, Zap, BookOpen } from 'lucide-react'

export default function GuidesPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'Guides' },
        ]}
      />

      <article className="prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight mb-6">Developer Guides</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Available Guides</h2>
          <p>
            Comprehensive guides covering installation, development, usage, and API integration.
          </p>
        </section>

        <section className="mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Zap,
                title: 'Installation Guide',
                desc: 'Get QuantumRISC up and running in minutes',
                link: '/docs/guides/installation',
              },
              {
                icon: Code2,
                title: 'Developer Guide',
                desc: 'Extend and customize the simulator',
                link: '/docs/guides/developer',
              },
              {
                icon: BookOpen,
                title: 'API Documentation',
                desc: 'Complete API reference with examples',
                link: '/docs/guides/api',
              },
              {
                icon: Zap,
                title: 'WebSocket Guide',
                desc: 'Real-time communication protocol',
                link: '/docs/guides/websocket',
              },
            ].map((guide, i) => (
              <a
                key={i}
                href={guide.link}
                className="p-6 rounded-lg border border-border bg-card hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <guide.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-2">{guide.title}</h3>
                <p className="text-sm text-muted-foreground">{guide.desc}</p>
              </a>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Quick Start</h2>
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div>
              <h3 className="font-mono font-semibold mb-2 text-sm">Step 1: Clone Repository</h3>
              <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
                <code>{`git clone https://github.com/IamChandu114/-QuantumRISC.git
cd -QuantumRISC`}</code>
              </pre>
            </div>
            <div>
              <h3 className="font-mono font-semibold mb-2 text-sm">Step 2: Install Dependencies</h3>
              <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
                <code>{`npm install
# or yarn install`}</code>
              </pre>
            </div>
            <div>
              <h3 className="font-mono font-semibold mb-2 text-sm">Step 3: Run Simulator</h3>
              <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
                <code>{`npm run dev
# Visit http://localhost:3000`}</code>
              </pre>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Key Concepts</h2>
          <div className="space-y-4">
            {[
              {
                title: 'Simulation Cycle',
                desc: 'Each cycle updates all pipeline stages and commits results atomically',
              },
              {
                title: 'Instruction Stream',
                desc: 'Programs are loaded as RISC-V machine code and executed sequentially',
              },
              {
                title: 'State Inspection',
                desc: 'Full visibility into registers, memory, and internal state at each cycle',
              },
              {
                title: 'Performance Analysis',
                desc: 'Detailed metrics on IPC, cache behavior, and pipeline efficiency',
              },
            ].map((concept, i) => (
              <div key={i} className="p-4 rounded-lg border border-border">
                <h3 className="font-semibold text-foreground mb-1">{concept.title}</h3>
                <p className="text-sm text-muted-foreground">{concept.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </article>

      <Pagination
        next={{
          label: 'Installation Guide',
          href: '/docs/guides/installation',
        }}
      />
    </>
  )
}
