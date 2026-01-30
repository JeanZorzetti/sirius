import { Metadata } from 'next'
import { GraphVisualization } from '@/components/admin/graph-visualization'

export const metadata: Metadata = {
  title: 'Graph Visualization | Sirius Admin',
  description: 'Interactive knowledge graph visualization',
}

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
