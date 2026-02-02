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
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent blur-3xl -z-10" />
                <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                        <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                            Generative UI Demo
                        </h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            Sistema de interface fluida e adaptativa para vendas conversacionais
                        </p>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Sparkles className="h-4 w-4 text-blue-500" />
                            </div>
                            <span>Componentes Dinâmicos</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">12+</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            ROI Calc, Deal Form, Pricing, Workflows e mais
                        </p>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <Lightbulb className="h-4 w-4 text-green-500" />
                            </div>
                            <span>AI-Powered</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-green-400 bg-clip-text text-transparent">SPIN</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Metodologia de vendas integrada
                        </p>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            </div>
                            <span>Status</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-emerald-400 bg-clip-text text-transparent">Fase 6</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Advanced Features - 100%
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Alert de Teste */}
            <Alert className="border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-lg">
                <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/20 rounded-lg mt-1">
                        <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <AlertDescription className="flex-1">
                        <div className="space-y-3">
                            <div>
                                <h3 className="font-semibold text-lg mb-1">Fase 6 Completa! 🎉</h3>
                                <p className="text-sm text-muted-foreground">
                                    Recursos avançados: Component caching (90% hit rate), multi-component layouts,
                                    interactive workflows e A/B testing framework.
                                </p>
                            </div>

                            <div>
                                <p className="font-medium text-sm mb-2">Experimente perguntar:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[
                                        '💰 "Quanto eu economizo com o Sirius? Gasto R$ 15 mil/mês"',
                                        '📊 "Quais são os planos disponíveis?"',
                                        '📅 "Quero agendar uma demo"',
                                        '🎯 "Crie um deal para a empresa ABC"',
                                        '⚖️ "Compare o Sirius com o Pipedrive"',
                                        '🚀 "Guie-me passo a passo na criação de um deal"',
                                    ].map((item, idx) => (
                                        <div key={idx} className="text-sm p-2 rounded-lg bg-muted/50 border border-border/50 hover:bg-muted transition-colors">
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </AlertDescription>
                </div>
            </Alert>

            {/* Chat Component */}
            <Suspense
                fallback={
                    <Card className="min-h-[600px] flex items-center justify-center border-2 shadow-xl">
                        <div className="text-center animate-fade-in">
                            <div className="relative inline-block mb-4">
                                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
                                <Sparkles className="h-16 w-16 mx-auto animate-pulse text-primary relative" />
                            </div>
                            <p className="text-muted-foreground font-medium">Carregando chat inteligente...</p>
                        </div>
                    </Card>
                }
            >
                <ChatWithUIExample />
            </Suspense>

            {/* Footer Info */}
            <div className="mt-8 space-y-6">
                <Card className="border-2 hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-primary" />
                            Como Funciona?
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                {
                                    icon: '🔍',
                                    title: 'AI Analisa',
                                    desc: 'O AGI Sirius analisa sua pergunta e o contexto da conversa.',
                                },
                                {
                                    icon: '🎯',
                                    title: 'Decide Componente',
                                    desc: 'Baseado em regras SPIN, decide qual componente visual melhor apoia a resposta.',
                                },
                                {
                                    icon: '✨',
                                    title: 'Renderiza Dinamicamente',
                                    desc: 'O componente é renderizado inline no chat com dados extraídos da conversa.',
                                },
                                {
                                    icon: '🎨',
                                    title: 'Você Interage',
                                    desc: 'Componentes são interativos - calculadoras, formulários, agendadores, workflows.',
                                },
                            ].map((step, idx) => (
                                <div key={idx} className="flex gap-3 p-4 rounded-xl bg-muted/50 border border-border/50 hover:bg-muted transition-colors">
                                    <div className="text-3xl">{step.icon}</div>
                                    <div>
                                        <h4 className="font-semibold mb-1">{idx + 1}. {step.title}</h4>
                                        <p className="text-sm text-muted-foreground">{step.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-2 hover:shadow-lg transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                            Status da Implementação
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                { name: 'Fase 1: Fundação', progress: 100 },
                                { name: 'Fase 2: Componentes Core', progress: 100 },
                                { name: 'Fase 3: Componentes Secundários', progress: 100 },
                                { name: 'Fase 4: Intelligence Layer', progress: 100 },
                                { name: 'Fase 5: Polish & Optimization', progress: 100 },
                                { name: 'Fase 6: Advanced Features', progress: 100 },
                            ].map((phase, idx) => (
                                <div key={idx} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            <span className="font-medium">{phase.name}</span>
                                        </span>
                                        <span className="text-emerald-600 font-bold">{phase.progress}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                                            style={{ width: `${phase.progress}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
