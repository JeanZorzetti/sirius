'use client'

import dynamic from 'next/dynamic'
import { Network, ArrowLeft, RefreshCw } from 'lucide-react'
import Link from 'next/link'

const GraphVisualization = dynamic(
  () => import('@/components/admin/graph-visualization').then((m) => ({ default: m.GraphVisualization })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[560px] rounded-xl border border-slate-800 bg-slate-950">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-violet-400 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Carregando visualização do grafo...</p>
        </div>
      </div>
    ),
  }
)

export default function GraphVizPage() {
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
            Entidades e relacionamentos extraídos via NLP. Clique nos nós para explorar conexões.
          </p>
        </div>
        <Link
          href="/admin/knowledge-graph"
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors border border-slate-800 rounded-lg px-3 py-2 hover:border-slate-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard NLP
        </Link>
      </div>

      {/* Graph */}
      <GraphVisualization />
    </div>
  )
}
