'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Send, Loader2, Lock, Image as ImageIcon, File, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { AttachmentUpload } from './attachment-upload'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MessageAuthor {
  id: string
  name?: string | null
  email: string
  isRoiLabsStaff?: boolean
}

interface Attachment {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  signedUrl?: string
  storageKey: string
}

interface Message {
  id: string
  authorType: 'USER' | 'STAFF' | 'SYSTEM'
  authorId?: string | null
  author?: MessageAuthor | null
  content: string
  isInternal: boolean
  createdAt: Date | string
  attachments?: Attachment[]
}

interface TicketChatProps {
  ticketId: string
  initialMessages: Message[]
  currentUserId: string
  isStaff?: boolean
  ticketStatus: string
}

function MessageBubble({ message, currentUserId }: { message: Message; currentUserId: string }) {
  const isOwn = message.authorId === currentUserId
  const isSystem = message.authorType === 'SYSTEM'
  const isStaff = message.authorType === 'STAFF'
  const authorName = message.author?.name || message.author?.email || 'Sistema'
  const initial = authorName.charAt(0).toUpperCase()
  const timeAgo = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: ptBR })

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    )
  }

  return (
    <div className={cn('flex gap-2 mb-4', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar className="h-7 w-7 flex-shrink-0 mt-1">
        <AvatarFallback className={cn(
          'text-xs',
          isStaff ? 'bg-indigo-100 text-indigo-700' : 'bg-zinc-100 text-zinc-600'
        )}>
          {initial}
        </AvatarFallback>
      </Avatar>

      <div className={cn('flex flex-col max-w-[75%]', isOwn ? 'items-end' : 'items-start')}>
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-medium text-muted-foreground">{authorName}</span>
          {isStaff && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-indigo-50 text-indigo-600 border-indigo-200">
              Suporte
            </Badge>
          )}
          {message.isInternal && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-amber-50 text-amber-600 border-amber-200">
              <Lock className="h-2 w-2 mr-0.5" />
              Interna
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>

        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm',
            isOwn
              ? 'bg-indigo-600 text-white rounded-tr-sm'
              : 'bg-muted text-foreground rounded-tl-sm',
            message.isInternal && 'bg-amber-50 border border-amber-200 text-amber-900'
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>

          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-2">
                  {att.mimeType.startsWith('image/') ? (
                    <ImageIcon className="h-3.5 w-3.5" />
                  ) : (
                    <File className="h-3.5 w-3.5" />
                  )}
                  <a
                    href={att.signedUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs underline flex items-center gap-1"
                  >
                    {att.fileName}
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function TicketChat({ ticketId, initialMessages, currentUserId, isStaff, ticketStatus }: TicketChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [content, setContent] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isClosed = ticketStatus === 'CLOSED'

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // SSE real-time subscription
  useEffect(() => {
    const evtSource = new EventSource('/api/support/stream')

    evtSource.addEventListener('ticket:message', (e) => {
      const data = JSON.parse(e.data)
      if (data.ticketId === ticketId) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === data.message.id)) return prev
          return [...prev, data.message]
        })
      }
    })

    return () => evtSource.close()
  }, [ticketId])

  const handleSend = async () => {
    if (!content.trim()) return
    setSending(true)

    try {
      const res = await fetch(`/api/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          isInternal: isStaff ? isInternal : false,
          attachmentIds: attachments.map((a) => a.id),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Erro ao enviar mensagem')
        return
      }

      const { message } = await res.json()
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev
        return [...prev, message]
      })
      setContent('')
      setAttachments([])
      setIsInternal(false)
    } catch {
      toast.error('Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} currentUserId={currentUserId} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!isClosed && (
        <div className="border-t border-border p-4">
          {isStaff && (
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setIsInternal(!isInternal)}
                className={cn(
                  'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors',
                  isInternal
                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                    : 'bg-transparent border-border text-muted-foreground hover:border-amber-300'
                )}
              >
                <Lock className="h-3 w-3" />
                Nota interna
              </button>
            </div>
          )}

          <div className={cn(
            'rounded-xl border transition-colors',
            isInternal ? 'border-amber-300 bg-amber-50/30' : 'border-border bg-background'
          )}>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isInternal ? 'Nota interna (não visível ao cliente)...' : 'Escreva sua mensagem... (Ctrl+Enter para enviar)'}
              rows={3}
              className="border-0 resize-none focus-visible:ring-0 rounded-xl bg-transparent"
              disabled={sending}
            />
            <div className="flex items-center justify-between px-3 pb-2">
              <AttachmentUpload
                ticketId={ticketId}
                attachments={attachments as never}
                onAttachmentsChange={setAttachments as never}
                disabled={sending}
              />
              <Button
                size="sm"
                onClick={handleSend}
                disabled={sending || !content.trim()}
                className="gap-1.5"
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                Enviar
              </Button>
            </div>
          </div>
        </div>
      )}

      {isClosed && (
        <div className="border-t border-border p-4 text-center text-sm text-muted-foreground">
          Este ticket está fechado. Abra um novo ticket se precisar de mais ajuda.
        </div>
      )}
    </div>
  )
}
