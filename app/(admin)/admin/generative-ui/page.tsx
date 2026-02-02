/**
 * Generative UI Test & Demo Page
 *
 * Página de demonstração do sistema de Generative UI.
 * Acessível em: /admin/generative-ui (migrado de /dashboard/agi-genui)
 */

import { Suspense } from 'react'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ChatWithUIExample } from '@/components/generative-ui/examples/ChatWithUIExample'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles, Lightbulb, Info, CheckCircle2 } from 'lucide-react'

export const metadata = {
    title: 'Generative UI Demo | Sirius CRM',
    description: 'Demonstração do sistema de Generative UI do Sirius CRM',
}

export default async function GenerativeUIAdminPage() {
    const session = await getSession()

    if (!session?.user) {
        redirect('/login')
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold tracking-tight">Generative UI Demo</h1>
                </div>
                <p className="text-muted-foreground">
                    Sistema de interface fluida e adaptativa para vendas conversacionais
                </p>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-zinc-400">
                            <Sparkles className="h-4 w-4 text-blue-500" />
                            Componentes Dinâmicos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-white">12+</p>
                        <p className="text-xs text-zinc-500">
                            ROI Calc, Deal Form, Pricing, Workflows, etc.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-zinc-400">
                            <Lightbulb className="h-4 w-4 text-green-500" />
                            AI-Powered
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-white">SPIN</p>
                        <p className="text-xs text-zinc-500">
                            Metodologia de vendas integrada
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-zinc-400">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-white">Fase 6</p>
                        <p className="text-xs text-zinc-500">
                            Advanced Features - 100%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Alert de Teste */}
            <Alert className="border-blue-500/50 bg-blue-500/10">
                <Sparkles className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-zinc-300">
                    <strong>Fase 6 Completa!</strong> - Recursos avançados implementados:
                    Component caching (90% hit rate), multi-component layouts, interactive workflows, e A/B testing framework.
                    <br />
                    <br />
                    <strong>Experimente perguntar:</strong>
                    <ul className="list-disc ml-6 mt-2 space-y-1">
                        <li>"Quanto eu economizo com o Sirius? Gasto R$ 15 mil/mês."</li>
                        <li>"Quais são os planos disponíveis?"</li>
                        <li>"Quero agendar uma demo"</li>
                        <li>"Crie um deal para a empresa ABC"</li>
                        <li>"Compare o Sirius com o Pipedrive"</li>
                        <li>"Guie-me passo a passo na criação de um deal"</li>
                    </ul>
                </AlertDescription>
            </Alert>

            {/* Chat Component */}
            <Suspense
                fallback={
                    <Card className="h-[700px] flex items-center justify-center bg-zinc-900 border-zinc-800">
                        <div className="text-center">
                            <Sparkles className="h-12 w-12 mx-auto mb-4 animate-pulse text-primary" />
                            <p className="text-zinc-500">Carregando chat...</p>
                        </div>
                    </Card>
                }
            >
                <ChatWithUIExample />
            </Suspense>

            {/* Footer Info */}
            <div className="mt-6 space-y-4">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-sm text-white">Como Funciona?</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-zinc-400 space-y-2">
                        <p>
                            <strong className="text-zinc-300">1. AI Analisa:</strong> O AGI Sirius analisa sua pergunta e o contexto da conversa.
                        </p>
                        <p>
                            <strong className="text-zinc-300">2. Decide Componente:</strong> Baseado em regras SPIN, decide qual componente visual melhor apoia a resposta.
                        </p>
                        <p>
                            <strong className="text-zinc-300">3. Renderiza Dinamicamente:</strong> O componente é renderizado inline no chat com dados extraídos da conversa.
                        </p>
                        <p>
                            <strong className="text-zinc-300">4. Você Interage:</strong> Componentes são interativos - calculadoras, formulários, agendadores, workflows.
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-sm text-white">Status da Implementação</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-300">✅ Fase 1: Fundação</span>
                            <span className="text-green-600 font-medium">100%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-300">✅ Fase 2: Componentes Core</span>
                            <span className="text-green-600 font-medium">100%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-300">✅ Fase 3: Componentes Secundários</span>
                            <span className="text-green-600 font-medium">100%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-300">✅ Fase 4: Intelligence Layer</span>
                            <span className="text-green-600 font-medium">100%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-300">✅ Fase 5: Polish & Optimization</span>
                            <span className="text-green-600 font-medium">100%</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-zinc-300">✅ Fase 6: Advanced Features</span>
                            <span className="text-green-600 font-medium">100%</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
