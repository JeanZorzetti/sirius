'use client'

import { useState } from 'react'
import { Play, RefreshCw, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  totalPosts: number
  processedPosts: number
}

export function KnowledgeGraphActions({ totalPosts, processedPosts }: Props) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const run = async (force: boolean) => {
    if (force && !confirm('Reprocessar TODOS os posts, mesmo os já processados? Isso pode levar vários minutos.')) return
    setIsProcessing(true)
    setResult(null)
    try {
      const res = await fetch('/api/nlp/process-blog-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({
          type: 'success',
          message: `${data.successful}/${data.total} posts processados com sucesso.`,
        })
        setTimeout(() => router.refresh(), 2000)
      } else {
        setResult({ type: 'error', message: data.error ?? 'Falha ao processar posts' })
      }
    } catch (e) {
      setResult({ type: 'error', message: e instanceof Error ? e.message : 'Erro desconhecido' })
    } finally {
      setIsProcessing(false)
    }
  }

  const pending = totalPosts - processedPosts

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => run(false)}
          disabled={isProcessing || pending === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium transition-colors"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {isProcessing ? 'Processando...' : `Processar pendentes (${pending})`}
        </button>

        <button
          onClick={() => run(true)}
          disabled={isProcessing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-500 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-sm font-medium transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Reprocessar tudo
        </button>

        <button
          onClick={() => router.refresh()}
          disabled={isProcessing}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-300 text-sm transition-colors disabled:opacity-40"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar stats
        </button>
      </div>

      {result && (
        <div
          className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
            result.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {result.type === 'success' ? (
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          {result.message}
        </div>
      )}
    </div>
  )
}
