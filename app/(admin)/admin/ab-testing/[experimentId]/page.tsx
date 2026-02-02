import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, TrendingUp, TrendingDown, Minus, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { calculateResults } from '@/lib/generative-ui/ab-testing'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ExperimentDetailPage({
    params,
}: {
    params: { experimentId: string }
}) {
    // Get experiment
    const experiment = await prisma.experiment.findUnique({
        where: { id: params.experimentId },
        include: {
            variants: true,
        },
    })

    if (!experiment) {
        notFound()
    }

    // Calculate results
    const results = await calculateResults(params.experimentId)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <Link
                    href="/admin/ab-testing"
                    className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 mb-4"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to experiments
                </Link>

                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-3xl font-bold tracking-tight">{experiment.name}</h1>
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
                            <p className="text-zinc-500">{experiment.description}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Overall Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Total Events</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {results.variants.reduce((sum, v) => sum + v.impressions, 0)}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">impressions tracked</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Total Conversions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-white">
                            {results.variants.reduce((sum, v) => sum + v.conversions, 0)}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">goal completions</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-400">Statistical Significance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            {results.isSignificant ? (
                                <>
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    <span className="text-2xl font-bold text-green-500">YES</span>
                                </>
                            ) : (
                                <>
                                    <Minus className="h-5 w-5 text-zinc-500" />
                                    <span className="text-2xl font-bold text-zinc-500">NO</span>
                                </>
                            )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            p-value: {results.pValue.toFixed(3)}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Variants Comparison */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Variant Performance</h2>

                <div className="space-y-4">
                    {results.variants.map((variantResult) => {
                        const variant = experiment.variants.find((v) => v.id === variantResult.variantId)
                        const isWinner = results.winner === variantResult.variantId
                        const isControl = variantResult.variantName === 'control'

                        // Calculate improvement vs control
                        let improvement: number | null = null
                        if (!isControl && results.variants.length >= 2) {
                            const control = results.variants.find((v) => v.variantName === 'control')
                            if (control) {
                                improvement = ((variantResult.conversionRate - control.conversionRate) / control.conversionRate) * 100
                            }
                        }

                        return (
                            <Card
                                key={variantResult.variantId}
                                className={`bg-zinc-900 ${isWinner
                                        ? 'border-green-500'
                                        : isControl
                                            ? 'border-blue-500'
                                            : 'border-zinc-800'
                                    }`}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-semibold text-white">
                                                    {variantResult.variantName}
                                                </h3>
                                                {isWinner && (
                                                    <Badge className="bg-green-500/20 text-green-500 border-green-500">
                                                        Winner
                                                    </Badge>
                                                )}
                                                {isControl && (
                                                    <Badge variant="outline" className="border-blue-500 text-blue-500">
                                                        Control
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-zinc-500">Component: {variant?.componentName}</p>
                                        </div>

                                        {improvement !== null && (
                                            <div className="flex items-center gap-2">
                                                {improvement > 0 ? (
                                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                                ) : improvement < 0 ? (
                                                    <TrendingDown className="h-5 w-5 text-red-500" />
                                                ) : (
                                                    <Minus className="h-5 w-5 text-zinc-500" />
                                                )}
                                                <span
                                                    className={`text-lg font-bold ${improvement > 0
                                                            ? 'text-green-500'
                                                            : improvement < 0
                                                                ? 'text-red-500'
                                                                : 'text-zinc-500'
                                                        }`}
                                                >
                                                    {improvement > 0 ? '+' : ''}
                                                    {improvement.toFixed(1)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-4 gap-6 mb-4">
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-1">Impressions</p>
                                            <p className="text-xl font-bold text-white">{variantResult.impressions}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-1">Interactions</p>
                                            <p className="text-xl font-bold text-white">{variantResult.interactions}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-1">Conversions</p>
                                            <p className="text-xl font-bold text-white">{variantResult.conversions}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500 mb-1">Conversion Rate</p>
                                            <p className="text-xl font-bold text-white">
                                                {(variantResult.conversionRate * 100).toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>

                                    {/* Confidence Interval */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-zinc-500">
                                            <span>95% Confidence Interval</span>
                                            <span>
                                                {(variantResult.confidenceInterval.lower * 100).toFixed(1)}% -{' '}
                                                {(variantResult.confidenceInterval.upper * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={variantResult.conversionRate * 100}
                                            className="h-2 bg-zinc-800"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            </div>

            {/* Statistical Details */}
            {results.isSignificant && results.winner && (
                <Card className="bg-green-500/10 border-green-500/30">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-6 w-6 text-green-500 mt-1" />
                            <div>
                                <h3 className="text-lg font-semibold text-green-500 mb-1">
                                    Statistically Significant Result
                                </h3>
                                <p className="text-sm text-zinc-400">
                                    The winner variant shows a statistically significant improvement over the control
                                    (p {"<"} 0.05). You can confidently roll out this variant to all users.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
