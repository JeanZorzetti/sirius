'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Sparkles, X, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import ReactMarkdown from 'react-markdown'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface SeoAssistantProps {
  metrics: {
    history: Array<{
      date: string
      clicks: number
      impressions: number
    }>
    keywords: Array<{
      query: string
      clicks: number
      impressions: number
      ctr: number
      position: number
    }>
    totals: {
      clicks: number
      impressions: number
      ctr: number
    }
    dateRange: {
      startDate: string
      endDate: string
    }
  }
  forecast: {
    trends: {
      clicks: string
      impressions: string
    }
    velocity: {
      clicks: number
      impressions: number
    }
    predictedTotal: {
      clicks: number
      impressions: number
      clicksFromEfficiency: number
    }
    confidence: {
      clicks: number
      impressions: number
    }
    efficiency: {
      currentRatio: number
      trend: string
      forecastNext30d: number
    }
  }
}

const STARTER_PROMPTS = [
  'Analise meus dados e sugira 3 ações prioritárias',
  'Por que minhas impressões subiram mas cliques caíram?',
  'Quais keywords estão desperdiçando impressões?',
  'Como melhorar meu CTR nos próximos 30 dias?',
]

export function SeoAssistant({ metrics, forecast }: SeoAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-start with greeting when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: Message = {
        role: 'assistant',
        content: `👋 Olá! Sou o **SEO Specialist da Sirius CRM**.

Analisei seus dados dos últimos ${metrics.history.length} dias:

📊 **Quick Stats:**
- ${metrics.totals.clicks.toLocaleString('pt-BR')} cliques | ${metrics.totals.impressions.toLocaleString('pt-BR')} impressões
- CTR médio: ${metrics.totals.ctr.toFixed(2)}%
- Custo de Visibilidade: **${forecast.efficiency.currentRatio}** (${forecast.efficiency.trend})

🔮 **Previsão 30 dias:**
- Tendência: ${forecast.trends.clicks} (${forecast.velocity.clicks > 0 ? '+' : ''}${forecast.velocity.clicks}/dia)
- Forecast: ${forecast.predictedTotal.clicks.toLocaleString('pt-BR')} → ${forecast.predictedTotal.clicksFromEfficiency.toLocaleString('pt-BR')} cliques

**Como posso ajudar?** Pergunte qualquer coisa sobre seus dados!`,
        timestamp: new Date().toISOString(),
      }
      setMessages([greeting])
    }
  }, [isOpen])

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input
    if (!textToSend.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: textToSend,
          context: {
            history: metrics.history,
            keywords: metrics.keywords,
            forecast,
            totals: metrics.totals,
            dateRange: metrics.dateRange,
          },
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Erro ao enviar mensagem')
      }

      const data = await res.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('SEO Chat error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: `❌ ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
        >
          <Bot className="mr-2 h-5 w-5" />
          🤖 Analisar com IA
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600">
              <Bot className="h-5 w-5 text-white" />
            </div>
            SEO AI Specialist
          </SheetTitle>
          <SheetDescription>
            Converse com uma IA que analisou seus dados do Google Search Console e previsões ML
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-180px)] mt-6">
          {/* Messages Area */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-900 border border-slate-200'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-ul:text-slate-700">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-lg px-4 py-3 border border-slate-200">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-600" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Starter Prompts (only show when no user messages yet) */}
          {messages.filter((m) => m.role === 'user').length === 0 && (
            <div className="my-4 space-y-2">
              <p className="text-xs text-slate-500 font-medium">Perguntas rápidas:</p>
              <div className="grid grid-cols-1 gap-2">
                {STARTER_PROMPTS.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(prompt)}
                    disabled={isLoading}
                    className="text-left text-xs px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors disabled:opacity-50"
                  >
                    💡 {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Pergunte qualquer coisa sobre seus dados..."
                className="min-h-[60px] resize-none"
                disabled={isLoading}
              />
              <Button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-[60px] w-[60px] bg-gradient-to-r from-purple-600 to-blue-600"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Pressione Enter para enviar, Shift+Enter para nova linha
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
