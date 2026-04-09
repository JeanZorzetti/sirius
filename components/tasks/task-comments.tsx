'use client'

import { useState, useEffect } from 'react'
import { Loader2, Send, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  user: { id: string; name: string | null; email: string }
}

interface TaskCommentsProps {
  taskId: string
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString('pt-BR')
}

function initials(name: string | null, email: string): string {
  const source = name || email
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || '')
    .join('')
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadComments()
  }, [taskId])

  const loadComments = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    const text = content.trim()
    if (!text || submitting) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      if (!res.ok) throw new Error('fail')
      setContent('')
      loadComments()
    } catch {
      toast.error('Erro ao comentar')
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Comentários</h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {comments.length}
        </span>
      </div>

      {/* Comment input */}
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Adicione um comentário... (⌘+Enter para enviar)"
          rows={2}
          className="resize-none text-sm"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            size="sm"
            className="h-7 gap-1"
          >
            {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Comentar
          </Button>
        </div>
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="text-xs text-muted-foreground">Carregando comentários...</div>
      ) : comments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/30 py-4 text-center text-xs text-muted-foreground">
          Nenhum comentário ainda
        </div>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] font-semibold text-white">
                {initials(c.user.name, c.user.email)}
              </div>
              <div className="flex-1 rounded-lg border border-border/30 bg-muted/20 p-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-foreground">
                    {c.user.name || c.user.email}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {relativeTime(c.createdAt)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-xs text-foreground/90 leading-relaxed">
                  {c.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
