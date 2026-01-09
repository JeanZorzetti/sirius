import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import Link from 'next/link'
import { Workflow, MessageCircle, Calendar, ArrowLeft, CheckCircle2, XCircle, Activity, TrendingUp, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function IntegrationsPage() {
    const session = await getSession()
    if (!session || !session.user || !session.user.email) {
        return <div>Não autorizado. Faça login novamente.</div>
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            organization: {
                select: {
                    id: true,
                    plan: true,
                    n8nEnabled: true,
                    n8nBaseUrl: true,
                    evolutionEnabled: true,
                    evolutionBaseUrl: true,
                    googleCalendarEnabled: true,
                    googleCalendarEmail: true
                }
            }
        }
    })

    if (!user || !user.organization) {
        return <div>Usuário não encontrado.</div>
    }

    const isPro = user.organization.plan === 'PRO'

    // Get metrics from IntegrationLog
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
        totalLogs24h,
        successLogs24h,
        recentLogs,
        n8nLogs,
        whatsappLogs,
        calendarLogs
    ] = await Promise.all([
        prisma.integrationLog.count({
            where: {
                organizationId: user.organization.id,
                createdAt: { gte: last24Hours }
            }
        }),
        prisma.integrationLog.count({
            where: {
                organizationId: user.organization.id,
                createdAt: { gte: last24Hours },
                status: 'SUCCESS'
            }
        }),
        prisma.integrationLog.findMany({
            where: { organizationId: user.organization.id },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                type: true,
                action: true,
                status: true,
                createdAt: true,
                errorMessage: true
            }
        }),
        prisma.integrationLog.count({
            where: {
                organizationId: user.organization.id,
                type: 'N8N',
                createdAt: { gte: last7Days }
            }
        }),
        prisma.integrationLog.count({
            where: {
                organizationId: user.organization.id,
                type: 'WHATSAPP',
                createdAt: { gte: last7Days }
            }
        }),
        prisma.integrationLog.count({
            where: {
                organizationId: user.organization.id,
                type: 'GOOGLE_CALENDAR',
                createdAt: { gte: last7Days }
            }
        })
    ])

    const successRate = totalLogs24h > 0 ? Math.round((successLogs24h / totalLogs24h) * 100) : 100

    const integrations = [
        {
            id: 'n8n',
            name: 'N8N',
            description: 'Automação de workflows com N8N',
            icon: Workflow,
            iconColor: 'text-blue-500',
            iconBg: 'bg-blue-500/10',
            iconShadow: 'shadow-[0_0_10px_rgba(59,130,246,0.2)]',
            enabled: user.organization.n8nEnabled,
            configured: !!user.organization.n8nBaseUrl,
            href: '/dashboard/settings/integrations/n8n',
            requiresPro: true,
            eventsLast7Days: n8nLogs
        },
        {
            id: 'whatsapp',
            name: 'WhatsApp',
            description: 'Envie e receba mensagens via Evolution API',
            icon: MessageCircle,
            iconColor: 'text-green-500',
            iconBg: 'bg-green-500/10',
            iconShadow: 'shadow-[0_0_10px_rgba(34,197,94,0.2)]',
            enabled: user.organization.evolutionEnabled,
            configured: !!user.organization.evolutionBaseUrl,
            href: '/dashboard/settings/integrations/whatsapp',
            requiresPro: true,
            eventsLast7Days: whatsappLogs
        },
        {
            id: 'google-calendar',
            name: 'Google Calendar',
            description: 'Sincronize eventos e reuniões automaticamente',
            icon: Calendar,
            iconColor: 'text-red-500',
            iconBg: 'bg-red-500/10',
            iconShadow: 'shadow-[0_0_10px_rgba(239,68,68,0.2)]',
            enabled: user.organization.googleCalendarEnabled,
            configured: !!user.organization.googleCalendarEmail,
            href: '/dashboard/settings/integrations/google-calendar',
            requiresPro: false,
            eventsLast7Days: calendarLogs
        }
    ]

    const activeIntegrations = integrations.filter(i => i.enabled).length
    const configuredIntegrations = integrations.filter(i => i.configured).length

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/settings">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Button>
                </Link>
            </div>

            <div className="flex items-center justify-between space-y-2">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        INTEGRAÇÕES
                    </h2>
                    <p className="text-sm text-zinc-500">
                        Conecte seu CRM com ferramentas externas
                    </p>
                </div>
                <Link href="/dashboard/settings/integrations/logs">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Activity className="h-4 w-4" />
                        Ver Logs
                    </Button>
                </Link>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-4 max-w-5xl">
                <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            Integrações Ativas
                        </CardTitle>
                        <Activity className="h-4 w-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{activeIntegrations}/{integrations.length}</div>
                        <p className="text-xs text-zinc-500 mt-1">
                            {configuredIntegrations} configuradas
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            Eventos (24h)
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{totalLogs24h}</div>
                        <p className="text-xs text-zinc-500 mt-1">
                            {successLogs24h} bem-sucedidos
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            Taxa de Sucesso
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{successRate}%</div>
                        <p className="text-xs text-zinc-500 mt-1">
                            Últimas 24 horas
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                            Health Status
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-zinc-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {successRate >= 95 ? 'Ótimo' : successRate >= 80 ? 'Bom' : 'Atenção'}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            Sistema operacional
                        </p>
                    </CardContent>
                </Card>
            </div>

            {!isPro && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 max-w-5xl">
                    <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <span className="text-purple-600 dark:text-purple-400 text-xs font-bold">PRO</span>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-sm text-zinc-900 dark:text-white mb-1">
                                Upgrade para PRO
                            </h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                A maioria das integrações está disponível apenas no plano PRO.
                                Faça upgrade para desbloquear N8N e WhatsApp.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Integrations Cards */}
            <div className="grid gap-6 max-w-5xl">
                {integrations.map((integration) => {
                    const Icon = integration.icon
                    const isLocked = integration.requiresPro && !isPro

                    return (
                        <Link
                            key={integration.id}
                            href={isLocked ? '#' : integration.href}
                            className={isLocked ? 'cursor-not-allowed opacity-60' : ''}
                        >
                            <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5 backdrop-blur-xl shadow-sm hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors">
                                <CardHeader className="flex flex-row items-center gap-4 relative overflow-hidden">
                                    <div className={`h-12 w-12 rounded-lg ${integration.iconBg} flex items-center justify-center ${integration.iconColor} ring-1 ring-white/5 ${integration.iconShadow}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CardTitle className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                                                {integration.name}
                                            </CardTitle>
                                            {integration.requiresPro && (
                                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20">
                                                    PRO
                                                </span>
                                            )}
                                            {integration.configured && (
                                                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    <span>Configurado</span>
                                                </div>
                                            )}
                                            {!integration.configured && !isLocked && (
                                                <div className="flex items-center gap-1 text-xs text-zinc-400">
                                                    <XCircle className="h-3 w-3" />
                                                    <span>Não configurado</span>
                                                </div>
                                            )}
                                        </div>
                                        <CardDescription className="text-zinc-500 text-xs">
                                            {integration.description}
                                        </CardDescription>
                                        {integration.eventsLast7Days > 0 && (
                                            <div className="text-xs text-zinc-400 mt-1">
                                                {integration.eventsLast7Days} eventos nos últimos 7 dias
                                            </div>
                                        )}
                                    </div>
                                    {integration.enabled && (
                                        <div className="px-2 py-1 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
                                            Ativo
                                        </div>
                                    )}
                                </CardHeader>
                            </Card>
                        </Link>
                    )
                })}
            </div>

            {/* Recent Activity */}
            {recentLogs.length > 0 && (
                <div className="max-w-5xl">
                    <Card className="bg-white dark:bg-white/[0.02] border-zinc-200 dark:border-white/5">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium text-zinc-900 dark:text-white">
                                    Atividades Recentes
                                </CardTitle>
                                <Link href="/dashboard/settings/integrations/logs">
                                    <Button variant="ghost" size="sm" className="text-xs">
                                        Ver todas
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recentLogs.map((log) => (
                                    <div key={log.id} className="flex items-center gap-3 text-sm">
                                        <div className={`h-2 w-2 rounded-full ${
                                            log.status === 'SUCCESS' ? 'bg-green-500' :
                                            log.status === 'FAILED' ? 'bg-red-500' :
                                            log.status === 'RETRYING' ? 'bg-yellow-500' :
                                            'bg-zinc-400'
                                        }`} />
                                        <Badge variant="outline" className="text-xs">
                                            {log.type}
                                        </Badge>
                                        <span className="text-zinc-600 dark:text-zinc-400 text-xs flex-1">
                                            {log.action}
                                        </span>
                                        <span className="text-zinc-400 text-xs">
                                            {new Date(log.createdAt).toLocaleTimeString('pt-BR', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Info Card */}
            <div className="max-w-5xl">
                <Card className="bg-zinc-50 dark:bg-white/[0.02] border-zinc-200 dark:border-white/5">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            ℹ️ Sobre as Integrações
                        </CardTitle>
                        <CardDescription className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
                            <p>
                                <strong>N8N:</strong> Envie eventos do CRM para seus workflows automatizados.
                                Configure webhooks e gerencie workflows via API.
                            </p>
                            <p>
                                <strong>WhatsApp:</strong> Envie mensagens manuais ou automatizadas via Evolution API.
                                Receba mensagens e crie deals automaticamente.
                            </p>
                            <p>
                                <strong>Google Calendar:</strong> Sincronize eventos do calendário com deals.
                                Crie eventos automaticamente quando fechar negócios.
                            </p>
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    )
}
