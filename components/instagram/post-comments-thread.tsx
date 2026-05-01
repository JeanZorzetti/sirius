'use client'
import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { Loader2, MessageSquare, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Comment {
  id: string
  content: string
  resolved: boolean
  createdAt: string
  user: { id: string; name: string | null }
}

export function PostCommentsThread({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/instagram/posts/${postId}/comments`)
      .then(r => r.json())
      .then(data => setComments(Array.isArray(data) ? data : []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false))
  }, [postId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  async function send() {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/instagram/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) return
      const created = await res.json()
      setComments(prev => [...prev, created])
      setText('')
    } finally {
      setSending(false)
    }
  }

  async function resolve(commentId: string) {
    await fetch(`/api/instagram/posts/${postId}/comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolved: true }),
    })
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, resolved: true } : c))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      send()
    }
  }

  const initials = (name: string | null) =>
    (name ?? 'U').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-1.5 mb-3">
        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">
          Comentários {comments.length > 0 && `(${comments.length})`}
        </span>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-0 pr-1">
        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && comments.length === 0 && (
          <p className="text-xs text-muted-foreground/60 text-center py-6">
            Nenhum comentário ainda
          </p>
        )}

        {comments.map(c => (
          <div key={c.id} className={`flex gap-2 ${c.resolved ? 'opacity-50' : ''}`}>
            <div className="shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-[9px] font-bold flex items-center justify-center">
              {initials(c.user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-medium text-foreground/80">{c.user.name ?? 'Usuário'}</span>
                <span className="text-[10px] text-muted-foreground/50">
                  {new Date(c.createdAt).toLocaleString('pt-BR', {
                    day: '2-digit', month: '2-digit',
                    hour: '2-digit', minute: '2-digit',
                    timeZone: 'America/Sao_Paulo',
                  })}
                </span>
                {c.resolved && (
                  <span className="text-[10px] text-green-500 flex items-center gap-0.5">
                    <CheckCheck className="h-2.5 w-2.5" /> resolvido
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground/70 mt-0.5 whitespace-pre-wrap break-words">{c.content}</p>
              {!c.resolved && (
                <button
                  onClick={() => resolve(c.id)}
                  className="text-[10px] text-muted-foreground/50 hover:text-green-400 transition-colors mt-0.5"
                >
                  Resolver
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex flex-col gap-1.5 shrink-0">
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escreva um comentário… (Ctrl+Enter para enviar)"
          rows={2}
          className="resize-none text-xs"
        />
        <Button
          size="sm"
          onClick={send}
          disabled={sending || !text.trim()}
          className="self-end h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white"
        >
          {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Enviar'}
        </Button>
      </div>
    </div>
  )
}
