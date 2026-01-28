'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot } from 'lucide-react'
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
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

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
  'Pesquise na web quem está rankeando para "CRM" e compare comigo',
  'Quais keywords estão desperdiçando impressões?',
]

export function SeoAssistant({ metrics, forecast }: SeoAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat/seo',
      body: {
        context: {
          history: metrics.history,
          keywords: metrics.keywords,
          forecast,
          totals: metrics.totals,
          dateRange: metrics.dateRange,
        },
      },
    }),
  })

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && status === 'ready') {
      sendMessage({ text: input })
      setInput('')
    }
  }

  const sendStarterPrompt = (prompt: string) => {
    if (status === 'ready') {
      sendMessage({ text: prompt })
    }
  }

  const isProcessing = status === 'submitted' || status === 'streaming'

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Bot className="h-4 w-4 mr-2" />
          SEO Assistant (IA)
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[600px] sm:w-[700px] p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>SEO AI Assistant</SheetTitle>
          <SheetDescription>
            Chat com IA especialista em SEO + Web Browsing
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 py-4">
            {/* Welcome message */}
            {messages.length === 0 && (
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-start gap-3">
                  <Bot className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 mb-2">👋 Olá! Sou o SEO Specialist da Sirius CRM</p>
                    <div className="text-sm text-blue-800 space-y-2">
                      <p>Analisei seus dados dos últimos {metrics.history.length} dias:</p>
                      <div className="font-mono text-xs bg-blue-100 p-2 rounded">
                        <p>📊 {metrics.totals.clicks.toLocaleString('pt-BR')} cliques | {metrics.totals.impressions.toLocaleString('pt-BR')} impressões</p>
                        <p>📈 CTR: {metrics.totals.ctr.toFixed(2)}% | Eficiência: {forecast.efficiency.currentRatio} ({forecast.efficiency.trend})</p>
                        <p>🔮 Forecast: {forecast.trends.clicks} ({forecast.velocity.clicks > 0 ? '+' : ''}{forecast.velocity.clicks}/dia)</p>
                      </div>
                      <p className="font-medium">🌐 Posso pesquisar na web para analisar concorrentes!</p>
                    </div>
                  </div>
                </div>

                {/* Starter prompts */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {STARTER_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => sendStarterPrompt(prompt)}
                      disabled={status !== 'ready'}
                      className="text-left text-xs p-2 rounded bg-white hover:bg-blue-100 border border-blue-300 transition-colors disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Bot className="h-8 w-8 p-1.5 rounded-full bg-blue-100 text-blue-600 flex-shrink-0" />
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.parts.map((part, idx) =>
                    part.type === 'text' ? (
                      <div key={idx} className="prose prose-sm max-w-none">
                        <ReactMarkdown>{part.text}</ReactMarkdown>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {status === 'submitted' && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 p-1.5 rounded-full bg-blue-100 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                </div>
                <div className="text-sm text-gray-500">Pensando...</div>
              </div>
            )}

            {status === 'streaming' && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 p-1.5 rounded-full bg-blue-100 flex items-center justify-center">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                </div>
                <div className="text-sm text-gray-500">Escrevendo...</div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input form */}
        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua pergunta sobre SEO..."
              className="flex-1 min-h-[60px] max-h-[120px] resize-none"
              disabled={status !== 'ready'}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || status !== 'ready'}
              className="self-end"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            Shift + Enter para nova linha
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
