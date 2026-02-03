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
    <div className="flex flex-col h-[600px] border rounded-lg bg-card">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AGI Sirius - Chat com Generative UI</h3>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Pergunte sobre vendas e veja componentes interativos
        </p>
      </div>

      {/* Messages - usando div simples com overflow-y-auto (igual AgiChatSidebar) */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4">
        <div className="space-y-4 py-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Comece uma conversa sobre vendas</p>
              <p className="text-xs mt-2">
                O AI pode renderizar calculadoras, formulários e muito mais!
              </p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap">
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
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3">
                <ThinkingIndicator state={currentThinkingState as any} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t space-y-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
          />
          <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Quick Action Chips */}
        <div className="flex flex-wrap gap-2">
          {[
            { text: 'Quanto eu economizo?', prompt: 'Quanto eu economizo com o Sirius? Gasto R$ 15 mil/mês' },
            { text: 'Mostre os planos', prompt: 'Quais são os planos disponíveis?' },
            { text: 'Agendar demo', prompt: 'Quero agendar uma demonstração' },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => setInput(item.prompt)}
              disabled={isLoading}
              className="text-xs px-3 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-colors disabled:opacity-50"
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
