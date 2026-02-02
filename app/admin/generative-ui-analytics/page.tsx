/**
 * Generative UI Analytics Dashboard Page
 * 
 * Admin page for viewing Generative UI component usage analytics
 */

import { Metadata } from 'next'
import { GenUIAnalyticsDashboard } from '@/components/admin/GenUIAnalyticsDashboard'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BarChart3 } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Generative UI Analytics | Sirius CRM',
    description: 'Métricas e estatísticas de uso dos componentes de Generative UI',
}

export default function GenUIAnalyticsPage() {
    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Generative UI Analytics</h1>
                        <p className="text-muted-foreground">
                            Métricas detalhadas de uso e performance dos componentes de IA
                        </p>
                    </div>
                </div>
            </div>

            {/* Info Card */}
            <Card className="mb-6 border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle className="text-base">Sobre este Dashboard</CardTitle>
                    <CardDescription>
                        Este dashboard mostra métricas em tempo real sobre como os componentes de Generative UI
                        são utilizados no seu CRM. As estatísticas incluem:
                    </CardDescription>
                </CardHeader>
                <div className="px-6 pb-6">
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span><strong>Renders:</strong> Quantas vezes cada componente foi exibido</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span><strong>Interações:</strong> Ações do usuário (cliques, preenchimento de forms, etc.)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span><strong>Conversões:</strong> Ações completadas com sucesso (deals criados, demos agendados, etc.)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span><strong>Performance:</strong> Tempo médio de renderização e erros</span>
                        </li>
                    </ul>
                </div>
            </Card>

            {/* Main Dashboard */}
            <GenUIAnalyticsDashboard />
        </div>
    )
}
