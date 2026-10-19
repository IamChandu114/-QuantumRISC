import { Breadcrumb } from '@/components/breadcrumb'
import { Pagination } from '@/components/pagination'

export default function InstallationPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Docs', href: '/docs' },
          { label: 'Guides', href: '/docs/guides' },
          { label: 'Installation' },
        ]}
      />

      <article className="prose prose-sm dark:prose-invert max-w-none">
        <h1 className="text-4xl font-bold tracking-tight mb-6">Installation Guide</h1>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Prerequisites</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Node.js 18.0 or higher</li>
            <li>npm, yarn, or pnpm package manager</li>
            <li>Git for version control</li>
            <li>A modern web browser (Chrome, Firefox, Safari, or Edge)</li>
            <li>At least 2GB free disk space</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Quick Start (5 minutes)</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-mono font-semibold mb-3 text-sm">Step 1: Clone Repository</h3>
              <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
                <code>{`git clone https://github.com/IamChandu114/-QuantumRISC.git
cd -QuantumRISC`}</code>
              </pre>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-mono font-semibold mb-3 text-sm">Step 2: Install Dependencies</h3>
              <p className="text-xs text-muted-foreground mb-2">Using pnpm (recommended):</p>
              <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
                <code>{`pnpm install`}</code>
              </pre>
              <p className="text-xs text-muted-foreground mt-3">Or using npm:</p>
              <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
                <code>{`npm install`}</code>
              </pre>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-mono font-semibold mb-3 text-sm">Step 3: Start Development Server</h3>
              <pre className="bg-background p-3 rounded text-xs overflow-x-auto">
                <code>{`pnpm dev
# Server runs at http://localhost:3000`}</code>
              </pre>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-mono font-semibold mb-3 text-sm">Step 4: Open in Browser</h3>
              <p className="text-xs text-muted-foreground">Navigate to http://localhost:3000</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Detailed Installation</h2>

          <div className="mb-6">
            <h3 className="font-semibold mb-3">1. System Requirements</h3>
            <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
              <thead className="bg-card border-b border-border">
                <tr>
                  <th className="px-3 py-2 text-left">Component</th>
                  <th className="px-3 py-2 text-left">Minimum</th>
                  <th className="px-3 py-2 text-left">Recommended</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { component: 'RAM', min: '2GB', rec: '8GB+' },
                  { component: 'Storage', min: '500MB', rec: '2GB SSD' },
                  { component: 'CPU', min: 'Dual-core', rec: 'Quad-core 2GHz+' },
                  { component: 'Node.js', min: '18.0.0', rec: '20.0.0+' },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border hover:bg-card/50">
                    <td className="px-3 py-2">{row.component}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.min}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.rec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-3">2. Environment Setup</h3>
            <pre className="bg-card border border-border p-3 rounded text-xs overflow-x-auto">
              <code>{`# Verify Node.js installation
node --version
npm --version

# Create .env.local file
cp .env.example .env.local

# Optional: Configure backend URL if running separately
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" >> .env.local`}</code>
            </pre>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-3">3. Build for Production</h3>
            <pre className="bg-card border border-border p-3 rounded text-xs overflow-x-auto">
              <code>{`# Build optimized production bundle
pnpm build

# Start production server
pnpm start

# Server runs at http://localhost:3000`}</code>
            </pre>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Troubleshooting</h2>
          <div className="space-y-4">
            {[
              {
                issue: 'Port 3000 already in use',
                solution: 'PORT=3001 pnpm dev',
              },
              {
                issue: 'Dependencies installation fails',
                solution: 'rm -rf node_modules pnpm-lock.yaml && pnpm install',
              },
              {
                issue: 'WebSocket connection fails',
                solution: 'Check backend is running. Ensure NEXT_PUBLIC_API_URL is correct.',
              },
              {
                issue: 'Build errors or type errors',
                solution: 'Clear Next.js cache: rm -rf .next && pnpm build',
              },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-lg border border-border bg-card/30">
                <h3 className="font-semibold text-sm text-foreground mb-1">❌ {item.issue}</h3>
                <p className="text-xs text-muted-foreground">✓ {item.solution}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Docker Installation</h2>
          <pre className="bg-card border border-border p-4 rounded-lg text-xs overflow-x-auto">
            <code>{`# Build Docker image
docker build -t quantumrisc .

# Run container
docker run -p 3000:3000 quantumrisc

# Access at http://localhost:3000`}</code>
          </pre>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Verify Installation</h2>
          <pre className="bg-card border border-border p-4 rounded-lg text-xs overflow-x-auto">
            <code>{`# Run tests to verify installation
pnpm test

# Check simulator initialization
curl http://localhost:3000/api/simulator/status

# Expected response:
# { "status": "ready", "version": "1.0.0" }`}</code>
          </pre>
        </section>

        <section className="mb-8 p-6 rounded-lg border border-border bg-card">
          <h2 className="text-lg font-semibold mb-2">Next Steps</h2>
          <p className="text-sm text-muted-foreground mb-4">
            After successful installation, check out these resources:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              <a href="/docs/guides/developer" className="text-primary hover:underline">
                Developer Guide
              </a>{' '}
              - Learn how to extend the simulator
            </li>
            <li>
              <a href="/docs/architecture" className="text-primary hover:underline">
                Architecture Documentation
              </a>{' '}
              - Understand the CPU design
            </li>
            <li>
              <a href="/docs/guides/api" className="text-primary hover:underline">
                API Documentation
              </a>{' '}
              - Integrate with your tools
            </li>
          </ul>
        </section>
      </article>

      <Pagination
        previous={{
          label: 'Guides',
          href: '/docs/guides',
        }}
        next={{
          label: 'API Documentation',
          href: '/docs/guides/api',
        }}
      />
    </>
  )
}
