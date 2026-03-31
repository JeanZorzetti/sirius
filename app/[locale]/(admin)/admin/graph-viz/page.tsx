'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const GraphVisualization = dynamic(
  () => import('@/components/admin/graph-visualization').then(m => ({ default: m.GraphVisualization })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 border rounded-lg bg-muted/20">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando visualização do grafo...</p>
        </div>
      </div>
    ),
  }
)

export default function GraphVizPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Knowledge Graph Visualization</h1>
        <p className="text-muted-foreground mt-2">
          Explore the knowledge graph interactively. Click and drag nodes, zoom with mouse wheel.
        </p>
      </div>

      <GraphVisualization />
    </div>
  )
}
