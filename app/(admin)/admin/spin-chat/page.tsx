/**
 * SPIN/Sandler Chat Tester
 *
 * Interactive testing interface for the SPIN Selling and Sandler Sales System
 * conversational AI layer.
 */

import { Metadata } from 'next'
import { SPINChatTester } from './spin-chat-tester'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MessageSquare, TrendingUp, Target, Zap } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'SPIN/Sandler Chat | Sirius Admin',
  description: 'Test SPIN Selling and Sandler Sales System conversational AI',
}

export default function SPINChatPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">SPIN/Sandler Chat</h2>
        <p className="text-slate-600">
          Teste o agente consultivo com metodologias SPIN Selling e Sandler Sales System
        </p>
      </div>

      {/* How it works */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Situation</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Perguntas abertas sobre contexto atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Problem</CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Identificação de dores e problemas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Implication</CardTitle>
            <Zap className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Amplificação da dor e urgência</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need-Payoff</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Apresentação de valor da solução</p>
          </CardContent>
        </Card>
      </div>

      {/* Sandler Principles */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            Princípios Sandler Ativos
          </CardTitle>
          <CardDescription>
            Técnicas de venda consultiva aplicadas pelo agente
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-2">
          <p><strong className="text-indigo-600">Pattern Interrupt:</strong> Quebra padrões típicos de bot, não dá respostas diretas prematuramente</p>
          <p><strong className="text-orange-600">Negative Reverse:</strong> "Quanto custa?" muito cedo → "Não tenho certeza se é adequado para você ainda"</p>
          <p><strong className="text-green-600">Upfront Contract:</strong> Estabelece expectativas no início da conversa</p>
          <p><strong className="text-blue-600">Qualification Scoring:</strong> Calcula score 0-100 baseado em engajamento e progressão SPIN</p>
        </CardContent>
      </Card>

      {/* Interactive Chat */}
      <SPINChatTester />
    </div>
  )
}
