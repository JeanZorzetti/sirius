/**
 * Knowledge Graph Admin Dashboard
 *
 * View and curate entities extracted from blog posts via NLP pipeline
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { getBlogProcessingStats, getPostEntities } from '@/lib/nlp/blog-processor'
import { getGraphStats } from '@/lib/nlp/pipeline'
import { blogPosts } from '@/lib/blog-data'
import Link from 'next/link'
import {
  Network,
  Database,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  Eye,
} from 'lucide-react'
import { KnowledgeGraphActions } from './actions-client'

export const dynamic = 'force-dynamic'

export default async function KnowledgeGraphPage() {
  // Get statistics
  const [graphStats, blogStats] = await Promise.all([
    getGraphStats(),
    getBlogProcessingStats(),
  ])

  // Get recent entities
  const recentEntities = await prisma.entity.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    take: 10,
    include: {
      _count: {
        select: {
          subjectRelationships: true,
          objectRelationships: true,
          contentLinks: true,
        },
      },
    },
  })

  // Get all processed blog posts with entity counts
  const processedPosts = await Promise.all(
    blogPosts.map(async (post) => {
      const entities = await getPostEntities(post.slug)
      const extraction = await prisma.entityExtraction.findFirst({
        where: {
          contentType: 'blog_post',
          contentId: post.slug,
          status: 'completed',
        },
        orderBy: {
          completedAt: 'desc',
        },
      })

      return {
        ...post,
        processed: extraction !== null,
        entitiesCount: entities.length,
        processingTime: extraction?.processingTimeMs,
        tokensUsed: extraction?.tokensUsed,
        completedAt: extraction?.completedAt,
      }
    })
  )

  const entityTypeColors: Record<string, string> = {
    methodology: 'bg-purple-100 text-purple-800 border-purple-200',
    technology: 'bg-blue-100 text-blue-800 border-blue-200',
    industry: 'bg-green-100 text-green-800 border-green-200',
    persona: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    metric: 'bg-red-100 text-red-800 border-red-200',
    process: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    tool: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    concept: 'bg-pink-100 text-pink-800 border-pink-200',
    geography: 'bg-orange-100 text-orange-800 border-orange-200',
    other: 'bg-gray-100 text-gray-800 border-gray-200',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Knowledge Graph</h1>
          <p className="text-slate-600 mt-2">
            Semantic entity extraction and relationship mapping via NLP pipeline
          </p>
        </div>
        <Link href="/admin/graph-viz">
          <Button className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Visualizar Grafo
          </Button>
        </Link>
      </div>

      {/* Actions */}
      <KnowledgeGraphActions
        totalPosts={blogPosts.length}
        processedPosts={blogStats.processedPosts}
      />

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{graphStats.totalEntities}</div>
            <p className="text-xs text-muted-foreground">
              Across {graphStats.totalRelationships} relationships
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blog Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blogStats.processedPosts}/{blogStats.totalPosts}
            </div>
            <p className="text-xs text-muted-foreground">
              {blogStats.pendingPosts} pending processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Density</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {graphStats.avgRelationshipsPerEntity}
            </div>
            <p className="text-xs text-muted-foreground">Relationships per entity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Extractions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{graphStats.totalExtractions}</div>
            <p className="text-xs text-muted-foreground">Total NLP runs</p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Entities */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Entities</CardTitle>
            <CardDescription>Latest entities extracted from content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEntities.map((entity) => {
                const totalRelationships =
                  entity._count.subjectRelationships + entity._count.objectRelationships

                return (
                  <div
                    key={entity.id}
                    className="flex items-start justify-between border-b pb-3 last:border-0"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{entity.name}</p>
                        {entity.wikidataId && (
                          <a
                            href={`https://www.wikidata.org/wiki/${entity.wikidataId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {entity.description && (
                        <p className="text-xs text-slate-600 line-clamp-1">
                          {entity.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant="outline"
                          className={`text-xs ${entityTypeColors[entity.type] || entityTypeColors.other}`}
                        >
                          {entity.type}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {totalRelationships} rel · {entity._count.contentLinks} posts
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4 pt-4 border-t">
              <Link href="/api/nlp/entities?q=&limit=100">
                <Button variant="outline" size="sm" className="w-full">
                  View All Entities (API)
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Blog Posts Status */}
        <Card>
          <CardHeader>
            <CardTitle>Blog Posts Status</CardTitle>
            <CardDescription>NLP processing status per article</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedPosts.map((post) => (
                <div
                  key={post.slug}
                  className="flex items-start justify-between border-b pb-3 last:border-0"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      {post.processed ? (
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                      )}
                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-sm font-medium hover:text-blue-600 line-clamp-1"
                      >
                        {post.title}
                      </Link>
                    </div>

                    {post.processed && (
                      <div className="flex items-center gap-3 text-xs text-slate-500 ml-6">
                        <span>{post.entitiesCount} entities</span>
                        {post.processingTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {(post.processingTime / 1000).toFixed(1)}s
                          </span>
                        )}
                        {post.tokensUsed && <span>{post.tokensUsed} tokens</span>}
                      </div>
                    )}
                  </div>

                  <div>
                    {post.processed ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Processed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documentation */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-lg">📚 Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>
            <strong>NLP Pipeline Guide:</strong>{' '}
            <code className="bg-white px-2 py-0.5 rounded text-xs">
              docs/NLP_PIPELINE_GUIDE.md
            </code>
          </p>
          <p>
            <strong>Process Posts:</strong>{' '}
            <code className="bg-white px-2 py-0.5 rounded text-xs">
              npx tsx scripts/process-blog-posts.ts
            </code>
          </p>
          <p>
            <strong>Test Extraction:</strong>{' '}
            <code className="bg-white px-2 py-0.5 rounded text-xs">
              npx tsx scripts/test-nlp-pipeline.ts
            </code>
          </p>
          <p>
            <strong>View Stats API:</strong>{' '}
            <code className="bg-white px-2 py-0.5 rounded text-xs">
              GET /api/nlp/stats
            </code>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
