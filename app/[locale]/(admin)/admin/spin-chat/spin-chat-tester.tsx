'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2, Send, RotateCcw, AlertTriangle, MessageSquare } from 'lucide-react'
import { DiagnosticModeSelector, DiagnosticMode } from './diagnostic-mode-selector'

type SPINState = 'Situation' | 'Problem' | 'Implication' | 'NeedPayoff'

interface Message {
  role: 'user' | 'assistant'
  content: string
  spinState?: SPINState
  qualificationScore?: number
  isSandlerDeflection?: boolean
}

interface ChatResponse {
  message: string
  model: string
  spinState: SPINState
  sessionId: string
  qualificationScore: number
}

export function SPINChatTester() {
  const [diagnosticMode, setDiagnosticMode] = useState<DiagnosticMode | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string>(() => `test-${Date.now()}`)
  const [currentState, setCurrentState] = useState<SPINState>('Situation')
  const [qualScore, setQualScore] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    if (!input.trim() || isPending) return

    const userMessage = input.trim()
    setInput('')
    setError(null)

    // Add user message immediately
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])

    startTransition(async () => {
      try {
        const res = await fetch('/api/agi/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userMessage,
            sessionId,
            diagnosticMode,
          }),
        })

        const data: ChatResponse = await res.json()

        if (!res.ok) {
          throw new Error(data.message || 'Erro ao processar mensagem')
        }

        // Update state
        setCurrentState(data.spinState)
        setQualScore(data.qualificationScore)

        // Add assistant response
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.message,
            spinState: data.spinState,
            qualificationScore: data.qualificationScore,
            isSandlerDeflection: data.model === 'sandler-deflection',
          },
        ])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      }
    })
  }

  const handleReset = () => {
    setMessages([])
    setSessionId(`test-${Date.now()}`)
    setCurrentState('Situation')
    setQualScore(0)
    setError(null)
    setDiagnosticMode(null) // Volta para tela de seleção
  }

  const handleSelectMode = (mode: DiagnosticMode) => {
    setDiagnosticMode(mode)
    setSessionId(`test-${mode}-${Date.now()}`)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getStateColor = (state: SPINState) => {
    const colors = {
      Situation: 'bg-blue-100 text-blue-700 border-blue-200',
      Problem: 'bg-orange-100 text-orange-700 border-orange-200',
      Implication: 'bg-red-100 text-red-700 border-red-200',
      NeedPayoff: 'bg-green-100 text-green-700 border-green-200',
    }
    return colors[state]
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-slate-600'
  }

  // Se ainda não selecionou o modo, mostra selector
  if (!diagnosticMode) {
    return <DiagnosticModeSelector onSelectMode={handleSelectMode} />
  }

  // Mapeamento de nomes dos modos
  const modeNames: Record<DiagnosticMode, string> = {
    express: 'Express',
    complete: 'Completo',
    deep: 'Profundo',
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Chat Area - 2/3 width */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Conversa</span>
              <Badge variant="outline" className="text-xs">
                Modo {modeNames[diagnosticMode]}
              </Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Trocar Modo
            </Button>
          </CardTitle>
          <CardDescription>
            Diagnóstico {modeNames[diagnosticMode].toLowerCase()} - responda naturalmente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages */}
          <ScrollArea ref={scrollRef} className="h-[500px] pr-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-sm text-slate-500 py-12">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>Inicie uma conversa para testar o SPIN/Sandler</p>
                  <p className="text-xs mt-2">
                    Tente: "Quanto custa?" ou "Como melhorar conversão?"
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : msg.isSandlerDeflection
                        ? 'bg-yellow-50 border border-yellow-200'
                        : 'bg-slate-100'
                    }`}
                  >
                    {msg.isSandlerDeflection && (
                      <div className="flex items-center gap-2 mb-2 text-xs text-yellow-700">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="font-semibold">Sandler Deflection</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.spinState && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs ${getStateColor(msg.spinState)}`}>
                          {msg.spinState}
                        </Badge>
                        {msg.qualificationScore !== undefined && (
                          <span className={`text-xs font-medium ${getScoreColor(msg.qualificationScore)}`}>
                            Score: {msg.qualificationScore}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isPending && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 rounded-lg px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isPending}
            />
            <Button onClick={handleSend} disabled={isPending || !input.trim()}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Panel - 1/3 width */}
      <div className="space-y-4">
        {/* Current State */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Estado SPIN Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={`${getStateColor(currentState)} text-base px-4 py-2`}>
              {currentState}
            </Badge>
            <p className="text-xs text-muted-foreground mt-3">
              {currentState === 'Situation' && 'Descobrindo contexto atual'}
              {currentState === 'Problem' && 'Identificando problemas e dores'}
              {currentState === 'Implication' && 'Amplificando impacto e urgência'}
              {currentState === 'NeedPayoff' && 'Apresentando valor da solução'}
            </p>
          </CardContent>
        </Card>

        {/* Qualification Score */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Lead Qualification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-4xl font-bold ${getScoreColor(qualScore)}`}>
              {qualScore}
              <span className="text-lg text-slate-500">/100</span>
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p>• Engajamento: {Math.min(20, messages.filter((m) => m.role === 'user').length * 4)}/20</p>
              <p>• Progressão SPIN: {currentState === 'Situation' ? 5 : currentState === 'Problem' ? 15 : currentState === 'Implication' ? 25 : 30}/30</p>
              <p>
                • Status:{' '}
                {qualScore >= 70 ? (
                  <span className="text-green-600 font-semibold">Altamente qualificado</span>
                ) : qualScore >= 40 ? (
                  <span className="text-orange-600">Moderadamente qualificado</span>
                ) : (
                  <span className="text-slate-600">Baixa qualificação</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Session Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Sessão</CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div>
              <span className="text-muted-foreground">ID:</span>
              <p className="font-mono text-[10px] break-all">{sessionId}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Mensagens:</span>
              <p>{messages.length}</p>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-indigo-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-sm text-indigo-900">💡 Dicas de Teste</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-indigo-800 space-y-2">
            <p><strong>Sandler Deflection:</strong> Pergunte "Quanto custa?" logo no início</p>
            <p><strong>Progressão SPIN:</strong> Descreva sua situação → mencione problemas → fale sobre impacto</p>
            <p><strong>High Score:</strong> Engaje com múltiplas mensagens detalhadas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
