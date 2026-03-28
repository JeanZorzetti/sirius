'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const suggestions = [
  'Qualifique todos os leads que entraram hoje',
  'Faça follow-up nos deals parados há mais de 5 dias',
  'Mostre o resumo de atividade dos agentes desta semana',
  'Agende reunião com os deals em fase de proposta',
]

export function IACommand() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    // Simulated response — will be connected to Sofia IA orchestration
    setTimeout(() => {
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Comando recebido: "${text.trim()}"\n\nEsta funcionalidade será conectada aos agentes Sofia IA na Fase 3. Por enquanto, os comandos são registrados para análise.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMsg])
      setIsLoading(false)
    }, 1200)
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Comando</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Interface de comandos para os agentes autônomos
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-zinc-800/50 flex items-center justify-center mb-6">
              <Sparkles className="h-7 w-7 text-cyan-400/60" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-400 mb-4">O que você deseja?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSubmit(s)}
                  className="text-left px-3 py-2.5 rounded-lg text-xs text-zinc-400 bg-zinc-900/60 border border-zinc-800/50 hover:bg-zinc-800/60 hover:text-zinc-300 hover:border-zinc-700/50 transition-all duration-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                'flex gap-3',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {msg.role === 'assistant' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
              )}

              <div className={cn(
                'max-w-[80%] rounded-xl px-4 py-3',
                msg.role === 'user'
                  ? 'bg-zinc-100 text-zinc-900'
                  : 'bg-zinc-900/80 border border-zinc-800/50 text-zinc-300'
              )}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                <span className="block mt-1 text-[10px] opacity-40 text-right">
                  {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {msg.role === 'user' && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700/50">
                  <User className="h-3.5 w-3.5 text-zinc-400" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-violet-500">
              <Bot className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-zinc-900/80 border border-zinc-800/50">
              <Loader2 className="h-3.5 w-3.5 text-cyan-400 animate-spin" />
              <span className="text-xs text-zinc-500">Processando...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit(input)}
          placeholder="Digite um comando para os agentes..."
          disabled={isLoading}
          className="w-full rounded-xl border border-zinc-800/50 bg-zinc-900/60 backdrop-blur-sm px-4 py-3 pr-12 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/30 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-200 disabled:opacity-50"
        />
        <button
          onClick={() => handleSubmit(input)}
          disabled={!input.trim() || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-zinc-500 hover:text-cyan-400 hover:bg-zinc-800/60 transition-all duration-200 disabled:opacity-30 disabled:hover:text-zinc-500"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
