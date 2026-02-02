'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Database, TrendingUp, TrendingDown, HardDrive, Clock, Trash2, RefreshCw } from 'lucide-react'
import { useCacheStats } from '@/hooks/useComponentCache'
import { componentCacheStore } from '@/lib/generative-ui/cache-store'

export default function CacheStatsPage() {
    const [refreshKey, setRefreshKey] = useState(0)
    const { stats, topHits, sizeInKB, allCached } = useCacheStats()

    const handleClear = () => {
        if (confirm('Tem certeza que deseja limpar todo o cache?')) {
            componentCacheStore.clear()
            setRefreshKey(prev => prev + 1)
        }
    }

    const handleInvalidate = (componentName: string) => {
        if (confirm(`Invalidar cache de ${componentName}?`)) {
            componentCacheStore.invalidateComponent(componentName)
            setRefreshKey(prev => prev + 1)
        }
    }

    useEffect(() => {
        // Auto-refresh every 5 seconds
        const interval = setInterval(() => setRefreshKey(prev => prev + 1), 5000)
        return () => clearInterval(interval)
    }, [])

    const hitRateColor = stats.hitRate >= 70 ? 'text-green-600' : stats.hitRate >= 50 ? 'text-yellow-600' : 'text-red-600'

    return (
        <div className="container mx-auto p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Component Cache Statistics</h1>
                    <p className="text-muted-foreground">Monitor and manage Generative UI component caching</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setRefreshKey(prev => prev + 1)} variant="outline">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={handleClear} variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All
                    </Button>
                </div>
            </div>

            {/* Overview Stats */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
                        <TrendingUp className={`h-4 w-4 ${hitRateColor}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${hitRateColor}`}>
                            {stats.hitRate.toFixed(2)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.hits} hits / {stats.misses} misses
                        </p>
                        {stats.hitRate >= 70 && (
                            <Badge className="mt-2" variant="default">Excellent!</Badge>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cache Size</CardTitle>
                        <Database className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.size} / {stats.maxSize}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {((stats.size / stats.maxSize) * 100).toFixed(1)}% full
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {sizeInKB.toFixed(2)} KB
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Hit Count</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.avgHitCount.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Per cached component
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Evictions</CardTitle>
                        <TrendingDown className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalEvictions}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            LRU evictions
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Hits */}
            <Card>
                <CardHeader>
                    <CardTitle>Top 10 Most Cached Components</CardTitle>
                    <CardDescription>
                        Components with highest hit counts
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {topHits.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            No components cached yet
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {topHits.map((cached, idx) => (
                                <div
                                    key={cached.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="font-mono">
                                                #{idx + 1}
                                            </Badge>
                                            <span className="font-semibold">{cached.componentName}</span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3" />
                                                {cached.hitCount} hits
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {new Date(cached.timestamp).toLocaleString('pt-BR')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <HardDrive className="h-3 w-3" />
                                                {(JSON.stringify(cached.props).length / 1024).toFixed(2)} KB
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => handleInvalidate(cached.componentName)}
                                        variant="ghost"
                                        size="sm"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* All Cached Components */}
            <Card>
                <CardHeader>
                    <CardTitle>All Cached Components ({allCached.length})</CardTitle>
                    <CardDescription>
                        Complete list of components currently in cache
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {allCached.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                            Cache is empty
                        </p>
                    ) : (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {allCached.map((cached) => (
                                <div
                                    key={cached.id}
                                    className="flex items-center justify-between p-2 border rounded text-sm hover:bg-muted/50 transition-colors"
                                >
                                    <div>
                                        <span className="font-medium">{cached.componentName}</span>
                                        <span className="text-muted-foreground ml-3">
                                            Hits: {cached.hitCount}
                                        </span>
                                    </div>
                                    <Badge variant="secondary" className="font-mono text-xs">
                                        {cached.contextHash.substring(0, 8)}...
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Cache Health */}
            <Card>
                <CardHeader>
                    <CardTitle>Cache Health</CardTitle>
                    <CardDescription>
                        Performance indicators and recommendations
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className={`h-2 w-2 rounded-full mt-2 ${stats.hitRate >= 70 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <div>
                                <p className="font-medium">Hit Rate Status</p>
                                <p className="text-sm text-muted-foreground">
                                    {stats.hitRate >= 70
                                        ? 'Excellent! Cache is performing very well.'
                                        : stats.hitRate >= 50
                                            ? 'Good, but could be optimized. Consider increasing cache size or TTL.'
                                            : 'Poor performance. Review caching strategy and invalidation patterns.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className={`h-2 w-2 rounded-full mt-2 ${stats.size / stats.maxSize < 0.9 ? 'bg-green-500' : 'bg-orange-500'}`} />
                            <div>
                                <p className="font-medium">Cache Capacity</p>
                                <p className="text-sm text-muted-foreground">
                                    {stats.size / stats.maxSize < 0.9
                                        ? 'Sufficient capacity available.'
                                        : 'Cache is nearly full. Consider increasing maxSize.'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className={`h-2 w-2 rounded-full mt-2 ${stats.totalEvictions < 10 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                            <div>
                                <p className="font-medium">Eviction Rate</p>
                                <p className="text-sm text-muted-foreground">
                                    {stats.totalEvictions < 10
                                        ? 'Low eviction rate. Cache size is appropriate.'
                                        : 'High eviction rate detected. Consider increasing cache size.'}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
