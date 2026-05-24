'use client'

import { useState, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { agents, type Agent } from '@/lib/agents'

type ViewMode = 'preview' | 'markdown'

export default function TechWriterApp() {
  const [activeAgent, setActiveAgent] = useState<Agent>(agents[0])
  const [prompt, setPrompt] = useState('')
  const [output, setOutput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [copied, setCopied] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const outputRef = useRef<HTMLDivElement>(null)

  const generate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return

    setIsGenerating(true)
    setOutput('')
    setError('')

    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: activeAgent.model, prompt: prompt.trim() }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        setError(data.error ?? `Request failed with status ${res.status}`)
        return
      }

      if (!res.body) {
        setError('No response body received.')
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setOutput((prev) => {
          const next = prev + chunk
          // auto-scroll on next paint
          requestAnimationFrame(() => {
            if (outputRef.current) {
              outputRef.current.scrollTop = outputRef.current.scrollHeight
            }
          })
          return next
        })
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message)
      }
    } finally {
      setIsGenerating(false)
      abortRef.current = null
    }
  }, [prompt, isGenerating, activeAgent])

  const stop = () => abortRef.current?.abort()

  const copy = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const selectAgent = (agent: Agent) => {
    if (isGenerating) return
    setActiveAgent(agent)
    setOutput('')
    setError('')
  }

  const wordCount = output.trim() ? output.trim().split(/\s+/).length : 0
  const hasOutput = output.length > 0

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* ── Sidebar ── */}
      <aside className="w-60 flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-slate-800">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
          >
            T
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">TechWriter AI</p>
            <p className="text-xs text-slate-500 leading-none mt-0.5">5 writing agents</p>
          </div>
        </div>

        {/* Agent list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 font-semibold px-2 mb-2">
            Agents
          </p>
          {agents.map((agent) => {
            const active = activeAgent.id === agent.id
            return (
              <button
                key={agent.id}
                onClick={() => selectAgent(agent)}
                disabled={isGenerating}
                className={`
                  w-full text-left px-3 py-2.5 rounded-lg transition-all duration-150
                  disabled:cursor-not-allowed
                  ${active
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }
                `}
              >
                <div className="flex items-center gap-2.5">
                  {/* Accent dot */}
                  <span
                    className="block w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: agent.color,
                      opacity: active ? 1 : 0.35,
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{agent.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{agent.tagline}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-800">
          <p className="text-[11px] text-slate-600">
            Ollama · llama3.1:8b
          </p>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex-shrink-0 px-6 py-4 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{activeAgent.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold">{activeAgent.name}</h1>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{
                    color: activeAgent.color,
                    backgroundColor: activeAgent.color + '1a',
                  }}
                >
                  {activeAgent.model}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{activeAgent.description}</p>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 flex flex-col min-h-0 p-6 gap-4">
          {/* Prompt */}
          <div className="flex-shrink-0">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') generate()
              }}
              placeholder={activeAgent.placeholder}
              disabled={isGenerating}
              rows={5}
              className="w-full resize-none px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 transition-colors disabled:opacity-60"
            />

            {/* Controls row */}
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-500">
                {isGenerating ? (
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: activeAgent.color }}
                    />
                    Generating…
                  </span>
                ) : (
                  <span>
                    {prompt.length > 0
                      ? `${prompt.trim().split(/\s+/).length} words · `
                      : ''}
                    ⌘↵ to generate
                  </span>
                )}
              </p>

              <div className="flex items-center gap-2">
                {isGenerating && (
                  <button
                    onClick={stop}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                  >
                    Stop
                  </button>
                )}
                <button
                  onClick={generate}
                  disabled={!prompt.trim() || isGenerating}
                  className="px-4 py-1.5 text-sm font-medium rounded-lg text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
                  style={{ backgroundColor: activeAgent.color }}
                >
                  Generate
                </button>
              </div>
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex-shrink-0 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-950/50 border border-red-900/60 text-sm text-red-300">
              <span className="mt-0.5 text-red-400">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Output panel */}
          {(hasOutput || isGenerating) && (
            <div className="flex-1 flex flex-col min-h-0 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
              {/* Output toolbar */}
              <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-slate-800">
                <div className="flex items-center gap-1">
                  {(['preview', 'markdown'] as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                        viewMode === mode
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  {hasOutput && (
                    <>
                      <span className="text-[11px] text-slate-600">
                        {wordCount} words
                      </span>
                      <button
                        onClick={copy}
                        className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        {copied ? '✓ Copied' : 'Copy'}
                      </button>
                      <button
                        onClick={() => setOutput('')}
                        className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
                      >
                        Clear
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Output content */}
              <div ref={outputRef} className="flex-1 overflow-y-auto p-5">
                {viewMode === 'preview' ? (
                  <div className="prose prose-sm prose-invert prose-slate max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {output + (isGenerating ? '▋' : '')}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <pre className="text-sm text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                    {output}
                    {isGenerating && (
                      <span className="inline-block w-2 h-[1em] bg-slate-300 align-middle ml-0.5 animate-pulse" />
                    )}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!hasOutput && !isGenerating && !error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-4 opacity-60">{activeAgent.icon}</div>
                <p className="text-slate-400 text-sm font-medium">{activeAgent.name}</p>
                <p className="text-slate-600 text-xs mt-1 max-w-xs">
                  {activeAgent.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
