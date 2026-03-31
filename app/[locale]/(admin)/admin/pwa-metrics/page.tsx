import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { Smartphone, Bell, Download, Zap, TrendingUp, TrendingDown } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function PWAMetricsPage() {
    // Get last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get all metrics
    const allMetrics = await prisma.pWAMetric.findMany({
        where: {
            createdAt: { gte: thirtyDaysAgo },
        },
        orderBy: { createdAt: 'desc' },
        take: 1000, // Limit for performance
    })

    // Calculate statistics
    const stats = {
        installPromptShown: allMetrics.filter(m => m.type === 'INSTALL_PROMPT_SHOWN').length,
        installPromptAccepted: allMetrics.filter(m => m.type === 'INSTALL_PROMPT_ACCEPTED').length,
        installPromptDismissed: allMetrics.filter(m => m.type === 'INSTALL_PROMPT_DISMISSED').length,
        appInstalled: allMetrics.filter(m => m.type === 'APP_INSTALLED').length,
        pushPermissionGranted: allMetrics.filter(m => m.type === 'PUSH_PERMISSION_GRANTED').length,
        pushPermissionDenied: allMetrics.filter(m => m.type === 'PUSH_PERMISSION_DENIED').length,
        offlineSyncSuccess: allMetrics.filter(m => m.type === 'OFFLINE_SYNC_SUCCESS').length,
        offlineSyncFailure: allMetrics.filter(m => m.type === 'OFFLINE_SYNC_FAILURE').length,
        serviceWorkerUpdated: allMetrics.filter(m => m.type === 'SERVICE_WORKER_UPDATED').length,
    }

    // Calculate conversion rates
    const installConversionRate = stats.installPromptShown > 0
        ? Math.round((stats.installPromptAccepted / stats.installPromptShown) * 100)
        : 0

    const pushConversionRate = (stats.pushPermissionGranted + stats.pushPermissionDenied) > 0
        ? Math.round((stats.pushPermissionGranted / (stats.pushPermissionGranted + stats.pushPermissionDenied)) * 100)
        : 0

    const offlineSuccessRate = (stats.offlineSyncSuccess + stats.offlineSyncFailure) > 0
        ? Math.round((stats.offlineSyncSuccess / (stats.offlineSyncSuccess + stats.offlineSyncFailure)) * 100)
        : 0

    // Get device breakdown
    const deviceBreakdown = {
        mobile: allMetrics.filter(m => m.deviceType === 'mobile').length,
        desktop: allMetrics.filter(m => m.deviceType === 'desktop').length,
        tablet: allMetrics.filter(m => m.deviceType === 'tablet').length,
    }

    // Get unique users (non-anonymous)
    const uniqueUsers = new Set(allMetrics.filter(m => m.userId).map(m => m.userId)).size

    // Get recent events for display
    const recentEvents = allMetrics.slice(0, 50)

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">PWA Metrics</h1>
                <p className="text-zinc-500">Progressive Web App adoption and usage metrics (last 30 days)</p>
            </div>

            {/* Conversion Rates */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            Install Conversion
                        </CardTitle>
                        <Download className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{installConversionRate}%</div>
                        <p className="text-xs text-zinc-500 mt-1">
                            {stats.installPromptAccepted} of {stats.installPromptShown} prompts accepted
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            Push Permission Rate
                        </CardTitle>
                        <Bell className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{pushConversionRate}%</div>
                        <p className="text-xs text-zinc-500 mt-1">
                            {stats.pushPermissionGranted} granted, {stats.pushPermissionDenied} denied
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            Offline Sync Success
                        </CardTitle>
                        <Zap className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{offlineSuccessRate}%</div>
                        <p className="text-xs text-zinc-500 mt-1">
                            {stats.offlineSyncSuccess} successful syncs
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Installation Stats */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">Installation Funnel</CardTitle>
                        <CardDescription className="text-zinc-400">Track user journey to app installation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-400">Prompt Shown</span>
                            <span className="text-sm font-medium text-white">{stats.installPromptShown}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-400">Prompt Accepted</span>
                            <span className="text-sm font-medium text-emerald-500">{stats.installPromptAccepted}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-400">Prompt Dismissed</span>
                            <span className="text-sm font-medium text-red-500">{stats.installPromptDismissed}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-zinc-400">App Installed</span>
                            <span className="text-sm font-medium text-blue-500">{stats.appInstalled}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">Device Breakdown</CardTitle>
                        <CardDescription className="text-zinc-400">PWA usage by device type</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4 text-blue-500" />
                                <span className="text-sm text-zinc-400">Mobile</span>
                            </div>
                            <span className="text-sm font-medium text-white">{deviceBreakdown.mobile}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4 text-purple-500" />
                                <span className="text-sm text-zinc-400">Desktop</span>
                            </div>
                            <span className="text-sm font-medium text-white">{deviceBreakdown.desktop}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4 text-emerald-500" />
                                <span className="text-sm text-zinc-400">Tablet</span>
                            </div>
                            <span className="text-sm font-medium text-white">{deviceBreakdown.tablet}</span>
                        </div>
                        <div className="pt-2 mt-2 border-t border-zinc-800">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-zinc-400">Unique Users</span>
                                <span className="text-sm font-medium text-white">{uniqueUsers}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Events */}
            <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-white">Recent Events</CardTitle>
                    <CardDescription className="text-zinc-400">Last 50 PWA events tracked</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {recentEvents.length === 0 ? (
                            <p className="text-zinc-500 text-sm">No events tracked yet</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-zinc-800">
                                            <th className="text-left py-2 px-2 text-zinc-400 font-medium">Type</th>
                                            <th className="text-left py-2 px-2 text-zinc-400 font-medium">Device</th>
                                            <th className="text-left py-2 px-2 text-zinc-400 font-medium">Organization</th>
                                            <th className="text-left py-2 px-2 text-zinc-400 font-medium">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentEvents.map((event) => (
                                            <tr key={event.id} className="border-b border-zinc-800/50">
                                                <td className="py-2 px-2">
                                                    <span className={`inline-flex items-center gap-1 text-xs ${getEventColor(event.type)}`}>
                                                        {getEventIcon(event.type)}
                                                        {formatEventType(event.type)}
                                                    </span>
                                                </td>
                                                <td className="py-2 px-2 text-zinc-400">{event.deviceType || 'unknown'}</td>
                                                <td className="py-2 px-2 text-zinc-400">
                                                    {event.organizationId === 'anonymous' ? 'Anonymous' : event.organizationId.slice(0, 8)}
                                                </td>
                                                <td className="py-2 px-2 text-zinc-400">
                                                    {new Date(event.createdAt).toLocaleString('pt-BR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function formatEventType(type: string): string {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
}

function getEventColor(type: string): string {
    const colors: Record<string, string> = {
        'INSTALL_PROMPT_SHOWN': 'text-blue-400',
        'INSTALL_PROMPT_ACCEPTED': 'text-emerald-400',
        'INSTALL_PROMPT_DISMISSED': 'text-red-400',
        'APP_INSTALLED': 'text-purple-400',
        'PUSH_PERMISSION_GRANTED': 'text-emerald-400',
        'PUSH_PERMISSION_DENIED': 'text-red-400',
        'OFFLINE_SYNC_SUCCESS': 'text-emerald-400',
        'OFFLINE_SYNC_FAILURE': 'text-red-400',
        'SERVICE_WORKER_UPDATED': 'text-blue-400',
    }
    return colors[type] || 'text-zinc-400'
}

function getEventIcon(type: string): React.ReactNode {
    const isSuccess = type.includes('ACCEPTED') || type.includes('GRANTED') || type.includes('SUCCESS') || type.includes('INSTALLED')
    const isFailure = type.includes('DISMISSED') || type.includes('DENIED') || type.includes('FAILURE')

    if (isSuccess) return <TrendingUp className="h-3 w-3" />
    if (isFailure) return <TrendingDown className="h-3 w-3" />
    return null
}
