'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Loader2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

interface D3Node extends d3.SimulationNodeDatum {
  id: string
  name: string
  type: string
  group: number
  size: number
  description?: string
  wikidataId?: string
  contentCount: number
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  source: string | D3Node
  target: string | D3Node
  type: string
  strength: number
  value: number
}

interface GraphData {
  nodes: D3Node[]
  links: D3Link[]
  stats: {
    totalNodes: number
    totalLinks: number
    maxDepth: number
  }
}

export function GraphVisualization() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<D3Node | null>(null)
  const [depth, setDepth] = useState(2)
  const [minStrength, setMinStrength] = useState(0.3)
  const [zoom, setZoom] = useState(1)

  // Load graph data
  useEffect(() => {
    loadGraphData()
  }, [])

  const loadGraphData = async (entityId?: string) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        depth: depth.toString(),
        minStrength: minStrength.toString(),
      })

      if (entityId) {
        params.append('entityId', entityId)
      }

      const response = await fetch(`/api/graph/visualization?${params}`)
      const result = await response.json()

      if (result.success) {
        setGraphData(result.data)
      } else {
        setError(result.error || 'Failed to load graph')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Render D3 graph
  useEffect(() => {
    if (!graphData || !svgRef.current) return

    // Clear previous graph
    d3.select(svgRef.current).selectAll('*').remove()

    const width = 1200
    const height = 800

    const svg = d3
      .select(svgRef.current)
      .attr('viewBox', [0, 0, width, height])
      .attr('width', '100%')
      .attr('height', '100%')

    // Create zoom behavior
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
        setZoom(event.transform.k)
      })

    svg.call(zoomBehavior)

    const g = svg.append('g')

    // Color scale by type group
    const color = d3.scaleOrdinal(d3.schemeCategory10)

    // Create simulation
    const simulation = d3
      .forceSimulation<D3Node>(graphData.nodes)
      .force(
        'link',
        d3
          .forceLink<D3Node, D3Link>(graphData.links)
          .id((d) => d.id)
          .distance((d) => 100 / d.strength)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.size + 10))

    // Create links
    const link = g
      .append('g')
      .selectAll('line')
      .data(graphData.links)
      .join('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d) => Math.sqrt(d.value))

    // Create link labels
    const linkLabel = g
      .append('g')
      .selectAll('text')
      .data(graphData.links)
      .join('text')
      .attr('font-size', 10)
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .text((d) => d.type)
      .style('opacity', 0) // Hidden by default

    // Create nodes
    const node = g
      .append('g')
      .selectAll('circle')
      .data(graphData.nodes)
      .join('circle')
      .attr('r', (d) => d.size)
      .attr('fill', (d) => color(d.group.toString()))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<SVGCircleElement, D3Node>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )
      .on('click', (event, d) => {
        setSelectedNode(d)
      })
      .on('mouseover', function (event, d) {
        // Highlight connected nodes
        d3.select(this).attr('stroke', '#ff6b6b').attr('stroke-width', 4)

        // Show link labels for this node
        linkLabel
          .style('opacity', (l) =>
            (l.source as D3Node).id === d.id || (l.target as D3Node).id === d.id
              ? 1
              : 0
          )
      })
      .on('mouseout', function () {
        d3.select(this).attr('stroke', '#fff').attr('stroke-width', 2)
        linkLabel.style('opacity', 0)
      })

    // Create labels
    const label = g
      .append('g')
      .selectAll('text')
      .data(graphData.nodes)
      .join('text')
      .attr('font-size', 12)
      .attr('dx', (d) => d.size + 5)
      .attr('dy', 4)
      .text((d) => d.name)
      .style('pointer-events', 'none')

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as D3Node).x!)
        .attr('y1', (d) => (d.source as D3Node).y!)
        .attr('x2', (d) => (d.target as D3Node).x!)
        .attr('y2', (d) => (d.target as D3Node).y!)

      linkLabel
        .attr('x', (d) => ((d.source as D3Node).x! + (d.target as D3Node).x!) / 2)
        .attr('y', (d) => ((d.source as D3Node).y! + (d.target as D3Node).y!) / 2)

      node.attr('cx', (d) => d.x!).attr('cy', (d) => d.y!)

      label.attr('x', (d) => d.x!).attr('y', (d) => d.y!)
    })

    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [graphData])

  const handleZoomIn = () => {
    if (svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.3)
    }
  }

  const handleZoomOut = () => {
    if (svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.7)
    }
  }

  const handleReset = () => {
    if (svgRef.current) {
      d3.select(svgRef.current)
        .transition()
        .call(
          d3.zoom<SVGSVGElement, unknown>().transform as any,
          d3.zoomIdentity
        )
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando grafo...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-red-600">Erro: {error}</p>
          <Button onClick={() => loadGraphData()} className="mt-4">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Controles de Visualização</CardTitle>
          <CardDescription>
            Ajuste profundidade e força mínima dos relacionamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Profundidade: {depth}</Label>
              <Slider
                value={[depth]}
                onValueChange={(v) => setDepth(v[0])}
                min={1}
                max={4}
                step={1}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Força Mínima: {minStrength.toFixed(2)}</Label>
              <Slider
                value={[minStrength * 100]}
                onValueChange={(v) => setMinStrength(v[0] / 100)}
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
            <div>
              <Button onClick={() => loadGraphData()} className="w-full">
                Atualizar Grafo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Graph Stats */}
      {graphData && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{graphData.stats.totalNodes}</div>
              <p className="text-sm text-muted-foreground">Entidades</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{graphData.stats.totalLinks}</div>
              <p className="text-sm text-muted-foreground">Relacionamentos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{zoom.toFixed(2)}x</div>
              <p className="text-sm text-muted-foreground">Zoom</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Graph Visualization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Visualização do Grafo de Conhecimento</CardTitle>
              <CardDescription>
                Clique e arraste os nós. Clique em um nó para ver detalhes.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleReset}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden bg-white">
            <svg ref={svgRef} style={{ width: '100%', height: '800px' }} />
          </div>
        </CardContent>
      </Card>

      {/* Selected Node Details */}
      {selectedNode && (
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Nó Selecionado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="font-semibold">Nome:</span> {selectedNode.name}
            </div>
            <div>
              <Badge>{selectedNode.type}</Badge>
            </div>
            {selectedNode.description && (
              <div>
                <span className="font-semibold">Descrição:</span>{' '}
                {selectedNode.description}
              </div>
            )}
            <div>
              <span className="font-semibold">Artigos Relacionados:</span>{' '}
              {selectedNode.contentCount}
            </div>
            {selectedNode.wikidataId && (
              <div>
                <span className="font-semibold">Wikidata:</span>{' '}
                <a
                  href={selectedNode.wikidataId}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {selectedNode.wikidataId}
                </a>
              </div>
            )}
            <div className="pt-2">
              <Button
                onClick={() => loadGraphData(selectedNode.id)}
                variant="outline"
                size="sm"
              >
                Explorar a partir deste nó
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
