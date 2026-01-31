/**
 * AGI Generative UI Test Page
 *
 * Página de teste para o sistema de Generative UI.
 * Acessível em: /dashboard/agi-genui
 */

import { Suspense } from 'react'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ChatWithUIExample } from '@/components/generative-ui/examples/ChatWithUIExample'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles, Lightbulb, Info } from 'lucide-react'

export const metadata = {
  title: 'AGI Generative UI - Teste | Sirius CRM',
  description: 'Teste do sistema de Generative UI do AGI Sirius',
}

export default async function AgiGenUITestPage() {
  const session = await getSession()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AGI Sirius - Generative UI</h1>
        </div>
        <p className="text-muted-foreground">
          Sistema de interface fluida e adaptativa para vendas conversacionais
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-500" />
              Componentes Dinâmicos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">10</p>
            <p className="text-xs text-muted-foreground">
              ROI Calc, Deal Form, Pricing, etc.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-green-500" />
              AI-Powered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">SPIN</p>
            <p className="text-xs text-muted-foreground">
              Metodologia de vendas integrada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Info className="h-4 w-4 text-purple-500" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Fase 1</p>
            <p className="text-xs text-muted-foreground">
              Fundação completa ✅
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alert de Teste */}
      <Alert className="mb-6 border-blue-500/50 bg-blue-500/10">
        <Sparkles className="h-4 w-4 text-blue-500" />
        <AlertDescription>
          <strong>Modo de Teste Ativo</strong> - Componentes estão em modo placeholder (Fase 1).
          A estrutura completa está funcional, mas a UI dos componentes será implementada na Fase 2.
          <br />
          <br />
          <strong>Experimente perguntar:</strong>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>"Quanto eu economizo com o Sirius? Gasto R$ 15 mil/mês."</li>
            <li>"Quais são os planos disponíveis?"</li>
            <li>"Quero agendar uma demo"</li>
            <li>"Mostre uma calculadora de ROI"</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Chat Component */}
      <Suspense
        fallback={
          <Card className="h-[700px] flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 animate-pulse text-primary" />
              <p className="text-muted-foreground">Carregando chat...</p>
            </div>
          </Card>
        }
      >
        <ChatWithUIExample />
      </Suspense>

      {/* Footer Info */}
      <div className="mt-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Como Funciona?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>1. AI Analisa:</strong> O AGI Sirius analisa sua pergunta e o contexto da conversa.
            </p>
            <p>
              <strong>2. Decide Componente:</strong> Baseado em regras SPIN, decide qual componente visual melhor apoia a resposta.
            </p>
            <p>
              <strong>3. Renderiza Dinamicamente:</strong> O componente é renderizado inline no chat com dados extraídos da conversa.
            </p>
            <p>
              <strong>4. Você Interage:</strong> Componentes são interativos - calculadoras, formulários, agendadores, etc.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Status da Implementação</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span>✅ Fase 1: Fundação</span>
              <span className="text-green-600 font-medium">100%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>⏳ Fase 2: ROICalculator</span>
              <span className="text-yellow-600 font-medium">0%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>⏳ Fase 2: DealFormGenerator</span>
              <span className="text-yellow-600 font-medium">0%</span>
            </div>
            <div className="flex items-center justify-between">
              <span>⏳ Fase 2: DemoScheduler</span>
              <span className="text-yellow-600 font-medium">0%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
