'use client'

import { Search, Download, Moon, Sun, Github, ExternalLink } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function Header() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleDownloadPDF = () => {
    // Create a simple text-based download of the documentation
    const text = 'QuantumRISC - Professional CPU Engineering Platform\n\nFull documentation available at: ' + window.location.origin
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
    element.setAttribute('download', 'quantumrisc-docs.txt')
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase()
    if (query.trim()) {
      console.log('[v0] Searching for:', query)
      // Search functionality can be enhanced later
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between px-4 py-3 lg:pl-72">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documentation..."
            onChange={handleSearch}
            className="w-full bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/"
            className="hidden md:inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors"
          >
            <ExternalLink size={16} />
            <span>Website</span>
          </a>

          <a
            href="/studio"
            className="hidden md:inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors"
          >
            <ExternalLink size={16} />
            <span>Studio</span>
          </a>

          <a
            href="https://github.com/IamChandu114/-QuantumRISC"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors"
          >
            <Github size={16} />
            <span>GitHub</span>
          </a>

          <button
            onClick={handleDownloadPDF}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-colors"
            title="Download as PDF"
          >
            <Download size={16} />
            <span className="hidden md:inline">PDF</span>
          </button>

          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              title="Toggle dark mode"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
