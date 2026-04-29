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
  Eye,
  Cpu,
  GitBranch,
  Layers,
  ArrowUpRight,
} from 'lucide-react'
import { KnowledgeGraphActions } from './actions-client'

export const dynamic = 'force-dynamic'

const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  methodology: { bg: 'bg-violet-500/10', text: 'text-violet-300', border: 'border-violet-500/30' },
  technology:  { bg: 'bg-sky-500/10',    text: 'text-sky-300',    border: 'border-sky-500/30' },
  industry:    { bg: 'bg-emerald-500/10', text: 'text-emerald-300',border: 'border-emerald-500/30' },
  persona:     { bg: 'bg-amber-500/10',  text: 'text-amber-300',  border: 'border-amber-500/30' },
  metric:      { bg: 'bg-red-500/10',    text: 'text-red-300',    border: 'border-red-500/30' },
  process:     { bg: 'bg-indigo-500/10', text: 'text-indigo-300', border: 'border-indigo-500/30' },
  tool:        { bg: 'bg-cyan-500/10',   text: 'text-cyan-300',   border: 'border-cyan-500/30' },
  concept:     { bg: 'bg-slate-500/10',  text: 'text-slate-300',  border: 'border-slate-500/30' },
  geography:   { bg: 'bg-orange-500/10', text: 'text-orange-300', border: 'border-orange-500/30' },
  other:       { bg: 'bg-zinc-500/10',   text: 'text-zinc-400',   border: 'border-zinc-500/30' },
}

function typeStyle(t: string) {
  return TYPE_COLORS[t] ?? TYPE_COLORS.other
}

export default async function KnowledgeGraphPage() {
  const [graphStats, blogStats] = await Promise.all([
    getGraphStats(),
    getBlogProcessingStats(),
  ])

  const recentEntities = await prisma.entity.findMany({
    orderBy: { createdAt: 'desc' },
    take: 12,
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

  const processedPosts = await Promise.all(
    blogPosts.map(async (post) => {
      const entities = await getPostEntities(post.slug)
      const extraction = await prisma.entityExtraction.findFirst({
        where: { contentType: 'blog_post', contentId: post.slug, status: 'completed' },
        orderBy: { completedAt: 'desc' },
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

  const pendingCount = processedPosts.filter((p) => !p.processed).length
  const processedCount = processedPosts.filter((p) => p.processed).length
  const processPct = blogStats.totalPosts > 0
    ? Math.round((blogStats.processedPosts / blogStats.totalPosts) * 100)
    : 0

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Network className="h-6 w-6 text-violet-400" />
            <h1 className="text-2xl font-bold tracking-tight">Knowledge Graph</h1>
          </div>
          <p className="text-slate-400 text-sm">
            Pipeline NLP de extração semântica e mapeamento de relacionamentos entre entidades.
          </p>
        </div>
        <Link
          href="/admin/graph-viz"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
        >
          <Eye className="h-4 w-4" />
          Visualizar Grafo
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Actions */}
      <KnowledgeGraphActions
        totalPosts={blogPosts.length}
        processedPosts={blogStats.processedPosts}
      />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            icon: <Database className="h-5 w-5 text-violet-400" />,
            label: 'Entidades',
            value: graphStats.totalEntities,
            sub: `${graphStats.totalRelationships} relacionamentos`,
          },
          {
            icon: <GitBranch className="h-5 w-5 text-sky-400" />,
            label: 'Densidade média',
            value: graphStats.avgRelationshipsPerEntity,
            sub: 'rel. por entidade',
          },
          {
            icon: <FileText className="h-5 w-5 text-emerald-400" />,
            label: 'Posts processados',
            value: `${processedCount}/${blogStats.totalPosts}`,
            sub: `${pendingCount} pendentes`,
          },
          {
            icon: <Cpu className="h-5 w-5 text-amber-400" />,
            label: 'Extrações NLP',
            value: graphStats.totalExtractions,
            sub: 'total de execuções',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 font-medium">{s.label}</span>
              {s.icon}
            </div>
            <div className="text-2xl font-mono font-bold text-white">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">
            Cobertura do blog
          </span>
          <span className="text-sm font-mono font-bold text-violet-400">{processPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-sky-500 transition-all duration-700"
            style={{ width: `${processPct}%` }}
          />
        </div>
        <p className="text-xs text-slate-600 mt-2">
          {processedCount} de {blogStats.totalPosts} artigos com entidades extraídas
        </p>
      </div>

      {/* Two columns */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent entities */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Entidades Recentes</h2>
              <p className="text-xs text-slate-500 mt-0.5">Últimas extraídas pelo pipeline</p>
            </div>
            <Layers className="h-4 w-4 text-slate-600" />
          </div>
          <div className="divide-y divide-slate-800/60">
            {recentEntities.map((entity) => {
              const totalRel = entity._count.subjectRelationships + entity._count.objectRelationships
              const style = typeStyle(entity.type)
              return (
                <div key={entity.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{entity.name}</p>
                      {entity.wikidataId && (
                        <a
                          href={`https://www.wikidata.org/wiki/${entity.wikidataId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-600 hover:text-violet-400 transition-colors shrink-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    {entity.description && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{entity.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-600">{totalRel}↔ · {entity._count.contentLinks}p</span>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${style.bg} ${style.text} ${style.border}`}
                    >
                      {entity.type}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="px-5 py-3 border-t border-slate-800">
            <a
              href="/api/nlp/entities?q=&limit=100"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
            >
              Ver todas via API
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Blog post status */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Status dos Artigos</h2>
              <p className="text-xs text-slate-500 mt-0.5">Processamento NLP por post</p>
            </div>
            <FileText className="h-4 w-4 text-slate-600" />
          </div>
          <div className="divide-y divide-slate-800/60 max-h-[460px] overflow-y-auto">
            {processedPosts.map((post) => (
              <div key={post.slug} className="px-5 py-3 flex items-start justify-between gap-3 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start gap-2 min-w-0">
                  {post.processed ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-slate-200 truncate">{post.title}</p>
                    {post.processed && (
                      <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-600">
                        <span>{post.entitiesCount} entidades</span>
                        {post.processingTime && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {(post.processingTime / 1000).toFixed(1)}s
                          </span>
                        )}
                        {post.tokensUsed && <span>{post.tokensUsed} tokens</span>}
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                    post.processed
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {post.processed ? 'Processado' : 'Pendente'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick reference */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Referência rápida</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-slate-500">
          {[
            { label: 'Processar pendentes', code: 'POST /api/nlp/process-blog-posts' },
            { label: 'Buscar entidades', code: 'GET /api/nlp/entities?q=crm' },
            { label: 'Stats do grafo', code: 'GET /api/nlp/stats' },
            { label: 'Graph-RAG query', code: 'POST /api/graph/rag' },
          ].map((r) => (
            <div key={r.label} className="rounded-lg bg-slate-900 border border-slate-800 p-3">
              <p className="text-slate-600 mb-1">{r.label}</p>
              <code className="text-violet-400 font-mono text-[10px] break-all">{r.code}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
