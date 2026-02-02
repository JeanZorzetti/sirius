/**
 * Generative UI Analytics Dashboard Component
 * 
 * Displays comprehensive metrics and statistics about Generative UI usage
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    BarChart3,
    TrendingUp,
    MousePointerClick,
    CheckCircle2,
    AlertCircle,
    Clock,
    Zap,
} from 'lucide-react'
import type { GenUIAnalytics, ComponentMetrics } from '@/app/api/v1/analytics/genui/route'

export function GenUIAnalyticsDashboard() {
    const [analytics, setAnalytics] = useState<GenUIAnalytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchAnalytics()
    }, [])

    async function fetchAnalytics() {
        try {
            setLoading(true)
            const response = await fetch('/api/v1/analytics/genui')

            if (!response.ok) {
                throw new Error('Failed to fetch analytics')
            }

            const data = await response.json()
            setAnalytics(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Carregando analytics...</p>
                </div>
            </div>
        )
    }

    if (error || !analytics) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center text-destructive">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                        <p>{error || 'Falha ao carregar analytics'}</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <OverviewCard
                    title="Total de Renders"
                    value={analytics.totalRenders.toLocaleString()}
                    icon={<BarChart3 className="h-5 w-5" />}
                    trend="+12.5%"
                />
                <OverviewCard
                    title="Interações"
                    value={analytics.totalInteractions.toLocaleString()}
                    icon={<MousePointerClick className="h-5 w-5" />}
                    trend="+8.3%"
                />
                <OverviewCard
                    title="Conversões"
                    value={analytics.totalConversions.toLocaleString()}
                    icon={<CheckCircle2 className="h-5 w-5" />}
                    trend="+15.7%"
                    positive
                />
                <OverviewCard
                    title="Erros"
                    value={analytics.totalErrors.toLocaleString()}
                    icon={<AlertCircle className="h-5 w-5" />}
                    trend="-2.1%"
                    positive
                />
            </div>

            {/* Top Components */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <TopComponentsCard
                    title="Mais Renderizados"
                    components={analytics.topComponents.mostRendered}
                    metric="renderCount"
                    metricLabel="renders"
                />
                <TopComponentsCard
                    title="Mais Interagidos"
                    components={analytics.topComponents.mostInteracted}
                    metric="interactionCount"
                    metricLabel="interações"
                />
                <TopComponentsCard
                    title="Maior Conversão"
                    components={analytics.topComponents.highestConversion}
                    metric="conversionRate"
                    metricLabel="% conversão"
                    isPercentage
                />
            </div>

            {/* Detailed Metrics Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Métricas Detalhadas por Componente</CardTitle>
                    <CardDescription>
                        Desempenho de cada componente de Generative UI
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-3">Componente</th>
                                    <th className="text-right p-3">Renders</th>
                                    <th className="text-right p-3">Interações</th>
                                    <th className="text-right p-3">Conversões</th>
                                    <th className="text-right p-3">Taxa Conv.</th>
                                    <th className="text-right p-3">Tempo Render</th>
                                    <th className="text-right p-3">Erros</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analytics.componentMetrics.map((metric) => (
                                    <tr key={metric.componentName} className="border-b hover:bg-muted/50">
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <Zap className="h-4 w-4 text-primary" />
                                                <span className="font-medium">{metric.componentName}</span>
                                            </div>
                                        </td>
                                        <td className="text-right p-3 text-muted-foreground">
                                            {metric.renderCount.toLocaleString()}
                                        </td>
                                        <td className="text-right p-3 text-muted-foreground">
                                            {metric.interactionCount.toLocaleString()}
                                        </td>
                                        <td className="text-right p-3 text-muted-foreground">
                                            {metric.conversionCount.toLocaleString()}
                                        </td>
                                        <td className="text-right p-3">
                                            <Badge variant={metric.conversionRate > 30 ? 'default' : 'secondary'}>
                                                {metric.conversionRate.toFixed(1)}%
                                            </Badge>
                                        </td>
                                        <td className="text-right p-3 text-muted-foreground">
                                            <div className="flex items-center justify-end gap-1">
                                                <Clock className="h-3 w-3" />
                                                {metric.avgRenderTime.toFixed(0)}ms
                                            </div>
                                        </td>
                                        <td className="text-right p-3">
                                            {metric.errorCount > 0 ? (
                                                <Badge variant="destructive">{metric.errorCount}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">0</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Time Range */}
            <div className="text-sm text-muted-foreground text-center">
                Dados de {new Date(analytics.timeRange.start).toLocaleDateString('pt-BR')} até{' '}
                {new Date(analytics.timeRange.end).toLocaleDateString('pt-BR')}
            </div>
        </div>
    )
}

interface OverviewCardProps {
    title: string
    value: string
    icon: React.ReactNode
    trend?: string
    positive?: boolean
}

function OverviewCard({ title, value, icon, trend, positive }: OverviewCardProps) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <div className="text-muted-foreground">{icon}</div>
                </div>
                <div className="flex items-end justify-between">
                    <p className="text-3xl font-bold">{value}</p>
                    {trend && (
                        <div className={`flex items-center gap-1 text-sm ${positive ? 'text-green-600' : 'text-primary'
                            }`}>
                            <TrendingUp className="h-3 w-3" />
                            {trend}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

interface TopComponentsCardProps {
    title: string
    components: ComponentMetrics[]
    metric: keyof ComponentMetrics
    metricLabel: string
    isPercentage?: boolean
}

function TopComponentsCard({
    title,
    components,
    metric,
    metricLabel,
    isPercentage = false,
}: TopComponentsCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {components.map((component, index) => (
                        <div key={component.componentName} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge className="w-6 h-6 flex items-center justify-center p-0">
                                    {index + 1}
                                </Badge>
                                <span className="text-sm font-medium truncate max-w-[150px]">
                                    {component.componentName}
                                </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                                {isPercentage
                                    ? `${(component[metric] as number).toFixed(1)}%`
                                    : (component[metric] as number).toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
