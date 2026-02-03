/**
 * Chat with Generative UI - Complete Example
 *
 * This is a fully functional chat component that demonstrates
 * how to integrate all Generative UI components together.
 *
 * Usage:
 * ```tsx
 * import { ChatWithUIExample } from '@/components/generative-ui/examples/ChatWithUIExample'
 *
 * export default function Page() {
 *   return <ChatWithUIExample dealId="optional-deal-id" />
 * }
 * ```
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageRenderer, parseMessageChunks } from '../MessageRenderer'
import { ThinkingIndicator } from '../ThinkingIndicator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, Sparkles } from 'lucide-react'
import type { StreamChunk, ComponentInteraction } from '@/lib/generative-ui/types'

interface Message {
  id: string
  role: 'user' | 'assistant'
  chunks: StreamChunk[]
  timestamp: Date
}

interface ChatWithUIExampleProps {
  dealId?: string
  pipelineId?: string
  sessionId?: string
}

export function ChatWithUIExample({
  dealId,
  pipelineId,
  sessionId,
}: ChatWithUIExampleProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentThinkingState, setCurrentThinkingState] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      chunks: [{ type: 'text', content: input }],
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Call the chat-with-ui endpoint
      const response = await fetch('/api/agi/chat-with-ui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          messages: [
            ...messages.map((m) => ({
              role: m.role,
              content: m.chunks
                .filter((c) => c.type === 'text')
                .map((c) => (c as any).content)
                .join('\n'),
            })),
            { role: 'user', content: input },
          ],
          sessionId,
          context: {
            dealId,
            pipelineId,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Process streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No reader available')
      }

      const assistantChunks: StreamChunk[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n').filter((line) => line.trim())

        for (const line of lines) {
          try {
            const chunk = JSON.parse(line) as StreamChunk

            // Handle thinking states
            if (chunk.type === 'thinking') {
              setCurrentThinkingState(chunk.state)
              continue // Don't add to message chunks
            }

            // Add to chunks
            assistantChunks.push(chunk)

            // Update message in real-time
            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1]
              if (lastMessage?.role === 'assistant') {
                // Update existing assistant message
                return [
                  ...prev.slice(0, -1),
                  {
                    ...lastMessage,
                    chunks: [...assistantChunks],
                  },
                ]
              } else {
                // Create new assistant message
                return [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    role: 'assistant',
                    chunks: [...assistantChunks],
                    timestamp: new Date(),
                  },
                ]
              }
            })
          } catch (e) {
            console.error('Failed to parse chunk:', line, e)
          }
        }
      }

      setCurrentThinkingState(null)
    } catch (error) {
      console.error('Chat error:', error)

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          chunks: [
            {
              type: 'error',
              message:
                error instanceof Error
                  ? error.message
                  : 'Erro ao processar mensagem. Tente novamente.',
              recoverable: true,
            },
          ],
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleInteraction = (data: ComponentInteraction) => {
    console.log('[ChatWithUI] Component interaction:', data)

    // Track analytics (example)
    if (typeof window !== 'undefined' && (window as any).analytics) {
      ;(window as any).analytics.track('genui_interaction', {
        component: data.component,
        interaction_type: data.interaction_type,
        field: data.field,
        timestamp: data.timestamp,
      })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full min-h-[700px] max-h-[calc(100vh-200px)] border rounded-xl bg-card shadow-lg">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">AGI Sirius</h3>
            <p className="text-xs text-muted-foreground">Chat com Generative UI</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-8 py-6" ref={scrollRef}>
        <div className="space-y-8 w-full">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-16 animate-fade-in">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                <Sparkles className="h-16 w-16 mx-auto opacity-70 relative animate-pulse" />
              </div>
              <h4 className="text-lg font-semibold text-foreground mb-2">
                Comece uma conversa sobre vendas
              </h4>
              <p className="text-sm max-w-md mx-auto">
                Pergunte sobre ROI, planos, demonstrações ou qualquer dúvida sobre vendas.
                <br />
                <span className="text-primary font-medium">O AI renderiza componentes interativos em tempo real!</span>
              </p>
            </div>
          )}

          {messages.map((message, idx) => (
            <div
              key={message.id}
              className={`flex animate-fade-in-up ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div
                className={`${
                  message.role === 'user' ? 'max-w-[70%]' : 'flex-1 min-w-0'
                } rounded-xl p-5 shadow-sm transition-all hover:shadow-md ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground'
                    : 'bg-muted/80 backdrop-blur-sm border border-border/50'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="text-base leading-relaxed">
                    {message.chunks[0]?.type === 'text' ? message.chunks[0].content : ''}
                  </p>
                ) : (
                  <MessageRenderer
                    chunks={message.chunks}
                    onInteraction={handleInteraction}
                  />
                )}
              </div>
            </div>
          ))}

          {currentThinkingState && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-muted/80 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-sm">
                <ThinkingIndicator state={currentThinkingState as any} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-6 border-t bg-muted/20 backdrop-blur-sm">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem ou escolha um exemplo abaixo..."
              disabled={isLoading}
              className="pr-12 h-12 rounded-xl border-2 focus:border-primary transition-all"
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="h-12 w-12 rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        {/* Quick Action Chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { icon: '💰', text: 'Calcular ROI', prompt: 'Quanto eu economizo com o Sirius? Gasto R$ 15 mil/mês' },
            { icon: '📊', text: 'Ver Planos', prompt: 'Quais são os planos disponíveis?' },
            { icon: '📅', text: 'Agendar Demo', prompt: 'Quero agendar uma demonstração' },
            { icon: '🎯', text: 'Criar Deal', prompt: 'Crie um deal para a empresa ABC' },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => setInput(item.prompt)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/60 hover:bg-muted border border-border/50 text-sm text-foreground transition-all hover:scale-105 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
