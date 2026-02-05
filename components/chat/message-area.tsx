'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Phone, User, Loader2, RefreshCw } from 'lucide-react'
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
  phone: string
  whatsappPhone: string | null
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

export function MessageArea({ contact, connections, organizationId, userId }: MessageAreaProps) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [messageText, setMessageText] = useState('')
  const [selectedConnection, setSelectedConnection] = useState(connections[0]?.id || '')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/contact/${contact.id}/interactions?type=WHATSAPP`)
      if (!res.ok) throw new Error('Erro ao carregar mensagens')

      const data = await res.json()
      setMessages(data)
      setTimeout(scrollToBottom, 100)
    } catch (error: any) {
      console.error('Erro ao carregar mensagens:', error)
      toast.error('Erro ao carregar mensagens')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [contact.id])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!messageText.trim()) return
    if (!selectedConnection) {
      toast.error('Selecione uma conexão WhatsApp')
      return
    }

    setIsSending(true)
    try {
      // TODO: Criar endpoint para enviar mensagem
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

      // Adicionar mensagem à lista
      setMessages(prev => [...prev, newMessage])
      setMessageText('')
      setTimeout(scrollToBottom, 100)

      toast.success('Mensagem enviada!')
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

  const getInitials = (name: string | null, phone: string) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return phone.slice(-2)
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-white dark:bg-zinc-950">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>
              {getInitials(contact.name, contact.phone)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{contact.name || contact.phone}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {contact.phone}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchMessages}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-900">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma mensagem ainda</p>
              <p className="text-sm">Envie a primeira mensagem para iniciar a conversa</p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isOutbound = message.direction === 'OUTBOUND'

              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex',
                    isOutbound ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[70%] rounded-lg px-4 py-2',
                      isOutbound
                        ? 'bg-green-500 text-white'
                        : 'bg-white dark:bg-zinc-800'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.text}
                    </p>
                    <p
                      className={cn(
                        'text-xs mt-1',
                        isOutbound ? 'text-green-100' : 'text-muted-foreground'
                      )}
                    >
                      {formatTime(message.sentAt)}
                      {isOutbound && message.status && (
                        <span className="ml-2">
                          {message.status === 'READ' ? '✓✓' : message.status === 'DELIVERED' ? '✓✓' : '✓'}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white dark:bg-zinc-950">
        {connections.length > 1 && (
          <div className="mb-2">
            <Select value={selectedConnection} onValueChange={setSelectedConnection}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma conexão" />
              </SelectTrigger>
              <SelectContent>
                {connections.map((conn) => (
                  <SelectItem key={conn.id} value={conn.id}>
                    {conn.phoneNumber || conn.instanceName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-2">
          <Textarea
            placeholder="Digite sua mensagem..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={isSending}
            className="resize-none"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend(e)
              }
            }}
          />
          <Button
            type="submit"
            disabled={isSending || !messageText.trim()}
            className="self-end"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Pressione Enter para enviar, Shift+Enter para nova linha
        </p>
      </div>
    </div>
  )
}
