'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react'
import { analytics } from '@/lib/posthog'
import { detectAiReferrer, storeAiDetection } from '@/lib/analytics/ai-tracker'
import { sendCriticalEvent, sendAnalyticsBeacon } from '@/lib/analytics/beacon'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message: string
}

export default function TestAnalyticsPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'AI Referrer Detection', status: 'pending', message: 'Aguardando teste...' },
    { name: 'Tool Interaction Event', status: 'pending', message: 'Aguardando teste...' },
    { name: 'LocalStorage Persistence', status: 'pending', message: 'Aguardando teste...' },
    { name: 'PostHog Connection', status: 'pending', message: 'Aguardando teste...' },
    { name: 'Beacon API (Critical Events)', status: 'pending', message: 'Aguardando teste...' },
  ])

  const [running, setRunning] = useState(false)

  const updateTestStatus = (index: number, status: 'success' | 'error', message: string) => {
    setTests((prev) =>
      prev.map((test, i) => (i === index ? { ...test, status, message } : test))
    )
  }

  const runTests = async () => {
    setRunning(true)

    // TEST 1: AI Referrer Detection
    try {
      // Simular referrer do ChatGPT
      const mockReferrer = 'https://chatgpt.com/c/abc123'
      const aiData = detectAiReferrer(mockReferrer)

      if (aiData && aiData.engine === 'chatgpt') {
        updateTestStatus(0, 'success', `✅ ChatGPT detectado: ${aiData.engine}`)
      } else {
        updateTestStatus(0, 'error', '❌ Falha ao detectar AI referrer simulado')
      }
    } catch (error) {
      updateTestStatus(0, 'error', `❌ Erro: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    await new Promise((resolve) => setTimeout(resolve, 500))

    // TEST 2: Tool Interaction Event
    try {
      // Simular evento de interação com calculadora
      analytics.toolInteraction({
        tool_type: 'roi_calculator',
        action: 'calculate',
        metadata: {
          test: true,
          timestamp: new Date().toISOString(),
        },
      })

      updateTestStatus(1, 'success', '✅ Evento toolInteraction disparado')
    } catch (error) {
      updateTestStatus(1, 'error', `❌ Erro: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    await new Promise((resolve) => setTimeout(resolve, 500))

    // TEST 3: LocalStorage Persistence
    try {
      const testData = {
        engine: 'chatgpt' as const,
        referrerUrl: 'https://chatgpt.com/test',
        detectedAt: new Date().toISOString(),
      }

      storeAiDetection(testData)

      const stored = localStorage.getItem('sirius_ai_referrer')
      const expiry = localStorage.getItem('sirius_ai_referrer_expiry')

      if (stored && expiry) {
        const parsed = JSON.parse(stored)
        const expiryTime = parseInt(expiry)
        const now = Date.now()
        const hoursUntilExpiry = Math.round((expiryTime - now) / (1000 * 60 * 60))

        updateTestStatus(
          2,
          'success',
          `✅ Dados persistidos. TTL: ${hoursUntilExpiry}h`
        )
      } else {
        updateTestStatus(2, 'error', '❌ Falha ao persistir no localStorage')
      }
    } catch (error) {
      updateTestStatus(2, 'error', `❌ Erro: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    await new Promise((resolve) => setTimeout(resolve, 500))

    // TEST 4: PostHog Connection
    try {
      // Verificar se PostHog está carregado
      if (typeof window !== 'undefined' && (window as any).posthog) {
        const posthog = (window as any).posthog
        const isLoaded = posthog.__loaded

        if (isLoaded) {
          updateTestStatus(3, 'success', '✅ PostHog SDK carregado e inicializado')
        } else {
          updateTestStatus(3, 'error', '⚠️ PostHog SDK presente mas não inicializado')
        }
      } else {
        updateTestStatus(3, 'error', '❌ PostHog SDK não encontrado')
      }
    } catch (error) {
      updateTestStatus(3, 'error', `❌ Erro: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    await new Promise((resolve) => setTimeout(resolve, 500))

    // TEST 5: Beacon API (Critical Events)
    try {
      // Verificar se Beacon API está disponível
      const hasBeacon = typeof navigator !== 'undefined' && 'sendBeacon' in navigator

      if (hasBeacon) {
        // Enviar evento de teste via Beacon
        const sent = await sendAnalyticsBeacon('/api/analytics/ingest', {
          event: 'test_beacon_api',
          properties: {
            test: true,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        })

        if (sent) {
          updateTestStatus(4, 'success', '✅ Beacon API disponível e funcional')
        } else {
          updateTestStatus(4, 'error', '⚠️ Beacon disponível mas falhou ao enviar')
        }
      } else {
        // Fallback para fetch keepalive
        updateTestStatus(4, 'success', '⚠️ Beacon indisponível, usando fetch keepalive')
      }
    } catch (error) {
      updateTestStatus(4, 'error', `❌ Erro: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    setRunning(false)
  }

  const clearTests = () => {
    setTests((prev) =>
      prev.map((test) => ({ ...test, status: 'pending', message: 'Aguardando teste...' }))
    )
    // Limpar localStorage
    localStorage.removeItem('sirius_ai_referrer')
    localStorage.removeItem('sirius_ai_referrer_expiry')
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'pending':
        return <div className="h-5 w-5 rounded-full border-2 border-muted" />
    }
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <Badge variant="outline" className="mb-4">
            🧪 Development Mode
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Analytics Test Suite
          </h1>
          <p className="text-muted-foreground">
            Validação da infraestrutura de telemetria: AI Traffic Detection + PostHog Events
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Suite: Invisible Funnel Validation</CardTitle>
            <CardDescription>
              Simula eventos reais do usuário e valida se a telemetria está capturando corretamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tests.map((test, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 rounded-lg border bg-card"
              >
                <div className="flex-shrink-0 mt-1">{getStatusIcon(test.status)}</div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{test.name}</h3>
                  <p className="text-sm text-muted-foreground">{test.message}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button onClick={runTests} disabled={running} size="lg">
            {running ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executando Testes...
              </>
            ) : (
              '🚀 Executar Testes'
            )}
          </Button>
          <Button onClick={clearTests} disabled={running} variant="outline" size="lg">
            🔄 Limpar e Resetar
          </Button>
        </div>

        <Card className="mt-8 border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <CardTitle className="text-yellow-600 dark:text-yellow-400">
                Instruções de Uso
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>1. Execução:</strong> Clique em "Executar Testes" para simular eventos reais
            </p>
            <p>
              <strong>2. Validação PostHog:</strong> Abra o console do navegador (F12) e verifique
              se os eventos estão sendo logados
            </p>
            <p>
              <strong>3. PostHog Dashboard:</strong> Acesse seu dashboard PostHog e verifique se os
              eventos aparecem em tempo real
            </p>
            <p>
              <strong>4. Cleanup:</strong> Use "Limpar e Resetar" para limpar localStorage e repetir
              testes
            </p>
            <p className="pt-2 border-t">
              <strong>Ambiente:</strong> {process.env.NODE_ENV === 'production' ? '🟢 Production' : '🟡 Development'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
