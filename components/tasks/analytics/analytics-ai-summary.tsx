'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  kpis: {
    total: number
    completed: number
    inProgress: number
    overdue: number
    completionRate: number
    avgCompletionHours: number
    velocity: number
    created: number
  }
  comparison?: {
    completed: { delta: number | null }
    overdue: { delta: number | null }
    created: { delta: number | null }
    avgCompletionHours: { delta: number | null }
    velocity: { delta: number | null }
  }
  rangeDays: number
  projectName?: string
}

export function AnalyticsAISummary({ kpis, comparison, rangeDays, projectName }: Props) {
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)

  async function generateSummary() {
    setLoading(true)
    setError(null)
    setSummary(null)
    setCollapsed(false)

    try {
      const res = await fetch('/api/tasks/analytics/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kpis, comparison, rangeDays, projectName }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro ao gerar resumo')
      setSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
      className={cn(
        'relative overflow-hidden rounded-2xl border',
        summary
          ? 'border-violet-500/20 bg-gradient-to-br from-violet-500/5 via-card/60 to-transparent'
          : 'border-border/50 bg-card/40',
        'backdrop-blur-xl'
      )}
    >
      {/* Glow quando tem conteúdo */}
      {summary && (
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-violet-500/10 blur-2xl" />
      )}

      <div className="relative p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset',
              summary
                ? 'bg-violet-500/10 ring-violet-500/20'
                : 'bg-muted/60 ring-border/50'
            )}>
              <Sparkles className={cn('h-3.5 w-3.5', summary ? 'text-violet-500' : 'text-muted-foreground')} />
            </div>
            <div>
              <h3 className="font-display text-base font-semibold tracking-tight text-foreground">
                Diagnóstico com IA
              </h3>
              <p className="text-xs text-muted-foreground">
                Análise gerada por Groq Llama 3.3
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {summary && (
              <button
                onClick={() => setCollapsed((c) => !c)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </button>
            )}
            <Button
              size="sm"
              variant={summary ? 'outline' : 'default'}
              onClick={generateSummary}
              disabled={loading}
              className={cn(
                'gap-2 rounded-xl text-xs',
                !summary && 'bg-violet-600 hover:bg-violet-700 text-white border-violet-600'
              )}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : summary ? (
                <RefreshCw className="h-3.5 w-3.5" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              {loading ? 'Analisando…' : summary ? 'Regenerar' : 'Gerar diagnóstico'}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
            >
              {/* Loading skeleton */}
              {loading && (
                <div className="mt-4 space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-muted/60" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-muted/60" />
                  <div className="h-4 w-4/6 animate-pulse rounded bg-muted/60" />
                </div>
              )}

              {/* Erro */}
              {error && !loading && (
                <p className="mt-4 text-sm text-rose-500">{error}</p>
              )}

              {/* Resumo */}
              {summary && !loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="mt-4"
                >
                  {/* Typewriter-style com border-left accent */}
                  <div className="border-l-2 border-violet-500/40 pl-4">
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {summary}
                    </p>
                  </div>
                  <p className="mt-3 text-[10px] text-muted-foreground/50">
                    Gerado com base nos dados do período · Não substitui análise humana
                  </p>
                </motion.div>
              )}

              {/* Estado inicial: dica */}
              {!summary && !loading && !error && (
                <p className="mt-3 text-xs text-muted-foreground/70">
                  Clique em "Gerar diagnóstico" para obter uma análise em linguagem natural dos dados acima.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
