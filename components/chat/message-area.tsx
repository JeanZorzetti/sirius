'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Send, Users, Loader2, Check, CheckCheck, SmilePlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Contact {
  id: string
  name: string | null
  phone: string | null
}

interface Connection {
  id: string
  instanceName: string
  phoneNumber: string | null
}

interface WhatsAppMessage {
  id: string
  text: string
  direction: string
  sentAt: Date
  deliveredAt: Date | null
  readAt: Date | null
  status: string
}

interface MessageAreaProps {
  contact: Contact
  connections: Connection[]
  organizationId: string
  userId: string
}

const MESSAGE_POLL_INTERVAL = 3000

function formatPhoneDisplay(phone: string | null): string {
  if (!phone) return ''
  if (phone.includes('@g.us') || phone.includes('@')) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('55') && cleaned.length === 13) {
    return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`
  }
  if (cleaned.startsWith('55') && cleaned.length === 12) {
    return `+55 (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 8)}-${cleaned.slice(8)}`
  }
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

function getDisplayName(contact: Contact): string {
  if (contact.name && !contact.name.includes('@g.us') && !contact.name.includes('@s.whatsapp.net')) {
    return contact.name
  }
  const formatted = formatPhoneDisplay(contact.phone)
  if (formatted) return formatted
  if (contact.phone) {
    return contact.phone.replace('@s.whatsapp.net', '').replace('@g.us', '')
  }
  return 'Sem nome'
}

function getSubtitle(contact: Contact): string {
  const isGroup = contact.phone?.includes('@g.us')
  if (isGroup) return 'Grupo'
  return formatPhoneDisplay(contact.phone) || ''
}

const avatarColors = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-teal-500',
]

function getAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

function formatMessageDate(date: Date): string {
  const now = new Date()
  const msgDate = new Date(date)
  const diff = now.getTime() - msgDate.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Hoje'
  if (days === 1) return 'Ontem'
  return msgDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function shouldShowDateSeparator(current: WhatsAppMessage, prev: WhatsAppMessage | null): boolean {
  if (!prev) return true
  const currentDate = new Date(current.sentAt).toDateString()
  const prevDate = new Date(prev.sentAt).toDateString()
  return currentDate !== prevDate
}

export function MessageArea({ contact, connections, organizationId, userId }: MessageAreaProps) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [messageText, setMessageText] = useState('')
  const [selectedConnection, setSelectedConnection] = useState(connections[0]?.id || '')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isFirstLoad = useRef(true)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true)
    try {
      const res = await fetch(`/api/contact/${contact.id}/interactions?type=WHATSAPP`)
      if (!res.ok) throw new Error('Erro ao carregar mensagens')

      const data = await res.json()
      setMessages(prev => {
        if (data.length > prev.length) {
          setTimeout(scrollToBottom, 100)
        }
        return data
      })
    } catch (error: any) {
      console.error('Erro ao carregar mensagens:', error)
      if (showLoading) toast.error('Erro ao carregar mensagens')
    } finally {
      setIsLoading(false)
    }
  }, [contact.id])

  useEffect(() => {
    isFirstLoad.current = true
    fetchMessages(true)
  }, [contact.id, fetchMessages])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages()
    }, MESSAGE_POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchMessages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [messageText])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim()) return
    if (!selectedConnection) {
      toast.error('Selecione uma conexão WhatsApp')
      return
    }

    setIsSending(true)
    try {
      const res = await fetch(`/api/whatsapp/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: selectedConnection,
          contactId: contact.id,
          message: messageText.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao enviar mensagem')
      }

      const newMessage = await res.json()
      setMessages(prev => [...prev, newMessage])
      setMessageText('')
      setTimeout(scrollToBottom, 100)
    } catch (error: any) {
      toast.error(error.message || 'Erro ao enviar mensagem')
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const displayName = getDisplayName(contact)
  const subtitle = getSubtitle(contact)
  const isGroup = contact.phone?.includes('@g.us') ?? false
  const avatarColor = getAvatarColor(displayName)

  const getInitials = () => {
    if (contact.name && !contact.name.includes('@')) {
      return contact.name
        .split(' ')
        .filter(n => n.length > 0)
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return '??'
  }

  return (
    <div className="flex-1 flex flex-col bg-[#efeae2] dark:bg-zinc-900">
      {/* Header */}
      <div className="px-4 py-2.5 border-b flex items-center justify-between bg-white dark:bg-zinc-950 shadow-sm">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className={cn('text-xs font-semibold text-white', avatarColor)}>
              {isGroup ? <Users className="h-4 w-4" /> : getInitials()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm leading-tight">{displayName}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {connections.length > 1 && (
          <Select value={selectedConnection} onValueChange={setSelectedConnection}>
            <SelectTrigger className="w-auto max-w-[200px] h-8 text-xs">
              <SelectValue placeholder="Conexão" />
            </SelectTrigger>
            <SelectContent>
              {connections.map((conn) => (
                <SelectItem key={conn.id} value={conn.id} className="text-xs">
                  {conn.phoneNumber || conn.instanceName.split('-').pop()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 md:px-16">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-white dark:bg-zinc-800 rounded-lg px-4 py-3 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur rounded-xl px-6 py-4 text-center shadow-sm max-w-xs">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Send className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium">Nenhuma mensagem</p>
              <p className="text-xs text-muted-foreground mt-1">
                Envie a primeira mensagem para iniciar a conversa
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 py-2">
            {messages.map((message, index) => {
              const isOutbound = message.direction === 'OUTBOUND'
              const prevMessage = index > 0 ? messages[index - 1] : null
              const showDate = shouldShowDateSeparator(message, prevMessage)

              return (
                <div key={message.id}>
                  {/* Date separator */}
                  {showDate && (
                    <div className="flex items-center justify-center my-3">
                      <span className="bg-white/90 dark:bg-zinc-800/90 backdrop-blur text-xs text-muted-foreground px-3 py-1 rounded-md shadow-sm">
                        {formatMessageDate(message.sentAt)}
                      </span>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div className={cn('flex mb-1', isOutbound ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[65%] rounded-lg px-3 py-1.5 shadow-sm relative',
                        isOutbound
                          ? 'bg-[#d9fdd3] dark:bg-emerald-900/60 text-zinc-900 dark:text-zinc-100'
                          : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                      )}
                    >
                      <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">
                        {message.text}
                      </p>
                      <div className={cn(
                        'flex items-center justify-end gap-1 -mb-0.5 mt-0.5',
                      )}>
                        <span className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-none">
                          {formatTime(message.sentAt)}
                        </span>
                        {isOutbound && (
                          <span className="leading-none">
                            {message.status === 'READ' ? (
                              <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                            ) : message.status === 'DELIVERED' ? (
                              <CheckCheck className="h-3.5 w-3.5 text-zinc-400" />
                            ) : (
                              <Check className="h-3.5 w-3.5 text-zinc-400" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-2 bg-white dark:bg-zinc-950 border-t">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              placeholder="Mensagem"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={isSending}
              rows={1}
              className={cn(
                'w-full resize-none rounded-lg border border-zinc-200 dark:border-zinc-700',
                'bg-white dark:bg-zinc-900 px-3 py-2 text-sm',
                'placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-1 focus:ring-primary/40',
                'disabled:opacity-50',
                'min-h-[40px] max-h-[120px]'
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e)
                }
              }}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={isSending || !messageText.trim()}
            className={cn(
              'h-10 w-10 rounded-full flex-shrink-0 transition-all',
              messageText.trim()
                ? 'bg-primary hover:bg-primary/90'
                : 'bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300'
            )}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
