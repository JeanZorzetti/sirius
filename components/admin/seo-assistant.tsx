'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Bot, Search } from 'lucide-react'
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
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
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: `👋 Olá! Sou o **SEO Specialist da Sirius CRM** com **acesso à web em tempo real**.

Analisei seus dados dos últimos ${metrics.history.length} dias:

📊 **Quick Stats:**
- ${metrics.totals.clicks.toLocaleString('pt-BR')} cliques | ${metrics.totals.impressions.toLocaleString('pt-BR')} impressões
- CTR médio: ${metrics.totals.ctr.toFixed(2)}%
- Custo de Visibilidade: **${forecast.efficiency.currentRatio}** (${forecast.efficiency.trend})

🔮 **Previsão 30 dias:**
- Tendência: ${forecast.trends.clicks} (${forecast.velocity.clicks > 0 ? '+' : ''}${forecast.velocity.clicks}/dia)
- Forecast: ${forecast.predictedTotal.clicks.toLocaleString('pt-BR')} → ${forecast.predictedTotal.clicksFromEfficiency.toLocaleString('pt-BR')} cliques

🌐 **Novo**: Posso pesquisar na web para analisar concorrentes e verificar a SERP!

**Como posso ajudar?**`,
      },
    ],
  })

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendStarterPrompt = (prompt: string) => {
    append({
      role: 'user',
      content: prompt,
    })
  }

  const renderToolInvocation = (toolInvocation: any) => {
    if (toolInvocation.toolName === 'searchWeb') {
      // Show search indicator
      if ('result' in toolInvocation) {
        const result = toolInvocation.result
        return (
          <div className="my-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700 font-medium text-sm mb-2">
              <Search className="h-4 w-4" />
              Pesquisei na web: "{toolInvocation.args.query}"
            </div>
            {result.answer && (
              <p className="text-xs text-blue-600 mb-2">{result.answer}</p>
            )}
            {result.results && result.results.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-blue-700">Encontrei {result.results.length} resultados:</p>
                {result.results.slice(0, 3).map((r: any, i: number) => (
                  <div key={i} className="text-xs">
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {r.title}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      } else {
        return (
          <div className="my-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Pesquisando na web: "{toolInvocation.args.query}"...
            </div>
          </div>
        )
      }
    }
    return null
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
            SEO AI Specialist + Web
          </SheetTitle>
          <SheetDescription>
            IA com contexto GSC + ML + pesquisa web em tempo real via Tavily
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-180px)] mt-6">
          {/* Messages Area */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
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
                      <>
                        <div className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-ul:text-slate-700">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                        {/* Show tool invocations */}
                        {message.toolInvocations && message.toolInvocations.map((toolInvocation: any) => (
                          <div key={toolInvocation.toolCallId}>
                            {renderToolInvocation(toolInvocation)}
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}

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
                    onClick={() => sendStarterPrompt(prompt)}
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
          <form onSubmit={handleSubmit} className="border-t pt-4 space-y-2">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Pergunte qualquer coisa sobre seus dados..."
                className="min-h-[60px] resize-none"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
              <Button
                type="submit"
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
          </form>
        </div>
      </SheetContent>
    </Sheet>
  )
}
