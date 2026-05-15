'use client'

import { useState } from 'react'
import { Sparkles, Send, X, Pencil, RefreshCw, Loader2, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface AIDraftCardProps {
  draft: string
  agentName: string
  usedRag?: boolean
  loading?: boolean
  onSend: (finalText: string) => void
  onRegenerate: () => void
  onDismiss: () => void
}

export function AIDraftCard({
  draft,
  agentName,
  usedRag,
  loading,
  onSend,
  onRegenerate,
  onDismiss,
}: AIDraftCardProps) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(draft)

  // Sync external draft updates when not editing
  if (!editing && text !== draft) {
    setText(draft)
  }

  return (
    <div className="border-t border-violet-200 dark:border-violet-900/40 bg-gradient-to-br from-violet-50 via-fuchsia-50/40 to-violet-50 dark:from-violet-950/30 dark:via-fuchsia-950/20 dark:to-violet-950/30">
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-[12px] font-semibold text-violet-700 dark:text-violet-300">
            Rascunho da IA
          </span>
          <span className="text-[11px] text-violet-500 dark:text-violet-400/80 font-mono">
            · {agentName}
          </span>
          {usedRag && (
            <span
              className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400"
              title="Resposta usou base de conhecimento"
            >
              <BookOpen className="h-3 w-3" />
              RAG
            </span>
          )}
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-violet-200/50 dark:hover:bg-violet-900/40 text-violet-600 dark:text-violet-400 transition-colors"
          title="Descartar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="px-4 pb-3">
        {editing ? (
          <Textarea
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
            rows={3}
            className="bg-white dark:bg-zinc-900 border-violet-300 dark:border-violet-800 focus-visible:ring-violet-500 text-sm resize-none"
            placeholder="Edite o rascunho..."
          />
        ) : (
          <div className={cn(
            'rounded-lg bg-white/70 dark:bg-zinc-900/50 border border-violet-200/60 dark:border-violet-900/40 px-3 py-2',
            loading && 'opacity-60'
          )}>
            <p className="text-[13.5px] leading-relaxed text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">
              {loading ? 'Gerando rascunho...' : text}
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 mt-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onRegenerate}
            disabled={loading}
            className="h-7 text-xs text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 gap-1.5"
          >
            {loading
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <RefreshCw className="h-3 w-3" />}
            Refazer
          </Button>
          {editing ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing(false)}
              disabled={loading}
              className="h-7 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 gap-1.5"
            >
              Pronto
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setEditing(true)}
              disabled={loading}
              className="h-7 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 gap-1.5"
            >
              <Pencil className="h-3 w-3" />
              Editar
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => onSend(text)}
            disabled={loading || !text.trim()}
            className="h-7 text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold gap-1.5"
          >
            <Send className="h-3 w-3" />
            Enviar
          </Button>
        </div>
      </div>
    </div>
  )
}
