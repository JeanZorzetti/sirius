import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FlaskConical, TrendingUp, Users, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export default async function ABTestingDashboard() {
    // Get all experiments with basic stats
    const experiments = await prisma.experiment.findMany({
        include: {
            variants: {
                include: {
                    _count: {
                        select: {
                            events: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    events: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    })

    // Calculate overall stats
    const totalExperiments = experiments.length
    const runningExperiments = experiments.filter((e) => e.status === 'RUNNING').length
    const totalEvents = experiments.reduce((sum, exp) => sum + exp._count.events, 0)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">A/B Testing</h1>
                <p className="text-zinc-500">Manage and analyze UI/UX experiments</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            Total Experiments
                        </CardTitle>
                        <FlaskConical className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{totalExperiments}</div>
                        <p className="text-xs text-zinc-500 mt-1">{runningExperiments} running</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            Total Events
                        </CardTitle>
                        <BarChart3 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{totalEvents}</div>
                        <p className="text-xs text-zinc-500 mt-1">impressions + interactions + conversions</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">
                            Running Tests
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">{runningExperiments}</div>
                        <p className="text-xs text-zinc-500 mt-1">active experiments</p>
                    </CardContent>
                </Card>
            </div>

            {/* Experiments List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between" >
                    <h2 className="text-xl font-bold text-white">Experiments</h2>
                </div>

                <div className="space-y-3">
                    {experiments.length === 0 ? (
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardContent className="py-12 text-center">
                                <FlaskConical className="mx-auto h-12 w-12 text-zinc-700 mb-4" />
                                <h3 className="text-lg font-medium text-zinc-300 mb-2">No experiments yet</h3>
                                <p className="text-sm text-zinc-500">
                                    Create your first A/B test to start optimizing your UI
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        experiments.map((experiment) => {
                            const totalImpressions = experiment.variants.reduce(
                                (sum, v) => sum + v._count.events,
                                0
                            )

                            return (
                                <Link key={experiment.id} href={`/admin/ab-testing/${experiment.id}`}>
                                    <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer">
                                        <CardContent className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-semibold text-white">
                                                            {experiment.name}
                                                        </h3>
                                                        <Badge
                                                            variant="outline"
                                                            className={
                                                                experiment.status === 'RUNNING'
                                                                    ? 'border-green-500 text-green-500'
                                                                    : experiment.status === 'COMPLETED'
                                                                        ? 'border-blue-500 text-blue-500'
                                                                        : 'border-zinc-700 text-zinc-400'
                                                            }
                                                        >
                                                            {experiment.status}
                                                        </Badge>
                                                    </div>

                                                    {experiment.description && (
                                                        <p className="text-sm text-zinc-500 mb-3">{experiment.description}</p>
                                                    )}

                                                    <div className="flex items-center gap-6 text-sm text-zinc-400">
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4" />
                                                            <span>{experiment.variants.length} variants</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <BarChart3 className="h-4 w-4" />
                                                            <span>{totalImpressions} events</span>
                                                        </div>
                                                        <div>
                                                            Created {format(experiment.createdAt, "dd MMM yyyy", { locale: ptBR })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
