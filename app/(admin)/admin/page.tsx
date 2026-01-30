import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { Users, Building2, DollarSign, Network, Database, TrendingUp } from "lucide-react"
import { getGraphStats } from "@/lib/nlp/pipeline"
import { getBlogProcessingStats } from "@/lib/nlp/blog-processor"
import { KnowledgeGraphQuickActions } from "./knowledge-graph-quick-actions"

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
    const usersCount = await prisma.user.count()
    const orgsCount = await prisma.organization.count()
    const dealsCount = await prisma.deal.count()

    // Knowledge Graph stats
    const [graphStats, blogStats] = await Promise.all([
        getGraphStats(),
        getBlogProcessingStats(),
    ])

    // Simple stats cards
    const stats = [
        {
            title: "Total Users",
            value: usersCount,
            icon: Users,
            color: "text-blue-500",
        },
        {
            title: "Organizations",
            value: orgsCount,
            icon: Building2,
            color: "text-purple-500",
        },
        {
            title: "Total Deals",
            value: dealsCount,
            icon: DollarSign,
            color: "text-emerald-500",
        },
    ]

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
                <p className="text-zinc-500">Monitor system health and growth.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {stats.map((stat) => (
                    <Card key={stat.title} className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
                <p className="text-zinc-500 text-sm">Feature coming soon (Audit Logs).</p>
            </div>

            {/* Knowledge Graph Widget */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Knowledge Graph</h2>
                        <p className="text-zinc-400 text-sm">NLP-powered semantic entity extraction from blog content</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">
                                Entities Extracted
                            </CardTitle>
                            <Database className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">{graphStats.totalEntities}</div>
                            <p className="text-xs text-zinc-500 mt-1">
                                {graphStats.totalRelationships} relationships
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">
                                Blog Posts Processed
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">
                                {blogStats.processedPosts}/{blogStats.totalPosts}
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">
                                {blogStats.pendingPosts} pending
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">
                                Graph Density
                            </CardTitle>
                            <Network className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">
                                {graphStats.avgRelationshipsPerEntity}
                            </div>
                            <p className="text-xs text-zinc-500 mt-1">
                                avg rel/entity
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <KnowledgeGraphQuickActions
                    pendingPosts={blogStats.pendingPosts}
                    totalEntities={graphStats.totalEntities}
                />
            </div>
        </div>
    )
}
