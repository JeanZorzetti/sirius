'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  ReactFlowProvider,
  Panel,
} from 'reactflow'
import dagre from '@dagrejs/dagre'
import 'reactflow/dist/style.css'
import { Badge } from '@/components/ui/badge'
import {
  Network,
  Filter,
  X,
  ChevronRight,
  RefreshCw,
  Search,
  Info,
  Download,
  Sparkles,
  Lightbulb,
} from 'lucide-react'
import { Input } from '@/components/ui/input'

// ── Color palette ────────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  methodology: '#a78bfa',
  technology:  '#38bdf8',
  industry:    '#34d399',
  persona:     '#fbbf24',
  metric:      '#f87171',
  process:     '#818cf8',
  tool:        '#22d3ee',
  concept:     '#94a3b8',
  geography:   '#fb923c',
  other:       '#64748b',
}

const RELATION_COLORS: Record<string, string> = {
  relates_to:   '#94a3b8',
  part_of:      '#38bdf8',
  used_in:      '#34d399',
  enables:      '#a78bfa',
  requires:     '#f87171',
  produced_by:  '#fbbf24',
  synonymous:   '#64748b',
}

function typeColor(t: string) {
  return TYPE_COLORS[t] ?? TYPE_COLORS.other
}

// ── Dagre layout ─────────────────────────────────────────────────────────────
function applyDagreLayout(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', ranksep: 90, nodesep: 45 })
  nodes.forEach((n) => g.setNode(n.id, { width: 160, height: 40 }))
  edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)
  return {
    nodes: nodes.map((n) => {
      const p = g.node(n.id)
      return { ...n, position: { x: (p?.x ?? 0) - 80, y: (p?.y ?? 0) - 20 } }
    }),
    edges,
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface D3Node {
  id: string
  name: string
  type: string
  group: number
  size: number
  description?: string
  wikidataId?: string
  contentCount: number
}
interface D3Link {
  source: string | D3Node
  target: string | D3Node
  type: string
  strength: number
  value: number
}
interface GraphData {
  nodes: D3Node[]
  links: D3Link[]
  stats: { totalNodes: number; totalLinks: number; maxDepth: number }
}

function nodeId(n: string | D3Node): string {
  return typeof n === 'string' ? n : n.id
}

function convertToFlow(nodes: D3Node[], links: D3Link[], search: string): { nodes: Node[]; edges: Edge[] } {
  const q = search.toLowerCase()
  const matched = q
    ? new Set(nodes.filter((n) => n.name.toLowerCase().includes(q)).map((n) => n.id))
    : null

  const flowNodes: Node[] = nodes.map((n) => {
    const color = typeColor(n.type)
    const dim = matched && !matched.has(n.id)
    return {
      id: n.id,
      data: { label: n.name, node: n },
      position: { x: 0, y: 0 },
      style: {
        background: color + (dim ? '11' : '1a'),
        border: `1.5px solid ${color}${dim ? '33' : ''}`,
        color: dim ? '#475569' : color,
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 500,
        padding: '5px 12px',
        minWidth: 110,
        maxWidth: 170,
        textAlign: 'center' as const,
        opacity: dim ? 0.4 : 1,
        transition: 'opacity 0.2s',
      },
    }
  })

  const flowEdges: Edge[] = links.map((l, i) => {
    const color = RELATION_COLORS[l.type] ?? '#475569'
    const srcId = nodeId(l.source)
    const dim = matched && !matched.has(srcId) && !matched.has(nodeId(l.target))
    return {
      id: `e-${i}`,
      source: srcId,
      target: nodeId(l.target),
      label: l.type,
      animated: l.type === 'enables',
      style: { stroke: color, strokeWidth: Math.max(1, l.value), opacity: dim ? 0.15 : 0.75 },
      markerEnd: { type: MarkerType.ArrowClosed, color },
      labelStyle: { fill: '#94a3b8', fontSize: 9 },
      labelBgStyle: { fill: '#0f172a', fillOpacity: 0.85 },
    }
  })

  return applyDagreLayout(flowNodes, flowEdges)
}

// ── Export button ─────────────────────────────────────────────────────────────
function ExportButton({ typeFilter, minStrength }: { typeFilter: string; minStrength: number }) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams({ typeFilter, minStrength: String(minStrength) })
      const res = await fetch(`/api/graph/export-md?${params}`)
      if (!res.ok) throw new Error('Falha ao gerar relatório')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const filename = res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1]
        ?? `knowledge-graph-${new Date().toISOString().slice(0, 10)}.md`
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      title="Exportar relatório .md"
      className="flex items-center gap-1.5 h-8 px-3 rounded border border-slate-700 hover:border-slate-500 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-xs font-medium transition-colors"
    >
      <Download className={`h-3.5 w-3.5 ${exporting ? 'animate-pulse' : ''}`} />
      {exporting ? 'Gerando...' : 'Exportar .md'}
    </button>
  )
}

// ── AI Panel ──────────────────────────────────────────────────────────────────
function AIPanel({
  typeFilter,
  minStrength,
  onClose,
  mode,
}: {
  typeFilter: string
  minStrength: number
  onClose: () => void
  mode: 'analyze' | 'suggest'
}) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setText('')
      setDone(false)
      try {
        const res = await fetch('/api/graph/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode, typeFilter, minStrength }),
        })
        if (!res.ok || !res.body) {
          setText('Erro ao chamar a IA. Tente novamente.')
          return
        }
        const reader = res.body.getReader()
        const dec = new TextDecoder()
        while (true) {
          const { value, done: d } = await reader.read()
          if (cancelled) break
          if (d) { setDone(true); break }
          setText((prev) => prev + dec.decode(value))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [mode, typeFilter, minStrength])

  const title = mode === 'analyze' ? 'Análise do Grafo' : 'Sugestões de Conteúdo'
  const Icon = mode === 'analyze' ? Sparkles : Lightbulb

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/90 backdrop-blur p-5 relative">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-violet-400" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {loading && (
          <span className="ml-1 flex items-center gap-1 text-[10px] text-violet-400">
            <RefreshCw className="h-2.5 w-2.5 animate-spin" /> gerando...
          </span>
        )}
        {done && (
          <span className="ml-1 text-[10px] text-slate-500">concluído</span>
        )}
      </div>
      <button
        onClick={onClose}
        className="absolute right-3 top-3 text-slate-600 hover:text-white transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      <div
        className="text-xs text-slate-300 leading-relaxed overflow-y-auto whitespace-pre-wrap"
        style={{ maxHeight: 480, fontFamily: 'inherit' }}
      >
        {text || (loading ? <span className="text-slate-600">Aguardando resposta...</span> : null)}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
function GraphInner() {
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [selectedNode, setSelectedNode] = useState<D3Node | null>(null)
  const [typeFilter, setTypeFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [depth, setDepth] = useState(2)
  const [minStrength, setMinStrength] = useState(0.3)
  const [aiPanel, setAiPanel] = useState<'analyze' | 'suggest' | null>(null)

  const rebuild = useCallback(
    (data: GraphData, filter: string, q: string) => {
      const filtered =
        filter === 'all' ? data.nodes : data.nodes.filter((n) => n.type === filter)
      const ids = new Set(filtered.map((n) => n.id))
      const filteredLinks = data.links.filter(
        (l) => ids.has(nodeId(l.source)) && ids.has(nodeId(l.target))
      )
      const { nodes: fn, edges: fe } = convertToFlow(filtered, filteredLinks, q)
      setNodes(fn)
      setEdges(fe)
    },
    [setNodes, setEdges]
  )

  const loadGraph = useCallback(
    async (entityId?: string) => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          depth: String(depth),
          minStrength: String(minStrength),
        })
        if (entityId) params.set('entityId', entityId)
        const res = await fetch(`/api/graph/visualization?${params}`)
        const json = await res.json()
        if (json.success) {
          setGraphData(json.data)
          rebuild(json.data, typeFilter, search)
        } else {
          setError(json.error ?? 'Erro ao carregar grafo')
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    },
    [depth, minStrength, typeFilter, search, rebuild]
  )

  useEffect(() => { loadGraph() }, [])

  useEffect(() => {
    if (graphData) rebuild(graphData, typeFilter, search)
  }, [typeFilter, search, graphData, rebuild])

  const allTypes = graphData
    ? ['all', ...Array.from(new Set(graphData.nodes.map((n) => n.type))).sort()]
    : ['all']

  // Node click → show detail panel + expand subgraph option
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const raw = graphData?.nodes.find((n) => n.id === node.id) ?? null
      setSelectedNode(raw)
    },
    [graphData]
  )

  return (
    <div className="flex flex-col gap-4" style={{ minHeight: 0 }}>
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar entidades..."
            className="pl-8 h-8 text-xs w-48 bg-slate-900 border-slate-700 text-slate-200 placeholder:text-slate-600"
          />
        </div>

        {/* Depth */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Profundidade:</span>
          {[1, 2, 3, 4].map((d) => (
            <button
              key={d}
              onClick={() => setDepth(d)}
              className={`h-6 w-6 rounded text-xs font-mono transition-colors ${
                depth === d
                  ? 'bg-violet-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        {/* Min strength */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Min. força:</span>
          {[0.1, 0.3, 0.5, 0.7].map((s) => (
            <button
              key={s}
              onClick={() => setMinStrength(s)}
              className={`h-6 px-2 rounded text-xs font-mono transition-colors ${
                minStrength === s
                  ? 'bg-violet-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <button
          onClick={() => loadGraph()}
          disabled={loading}
          className="flex items-center gap-1.5 h-8 px-3 rounded bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>

        <ExportButton typeFilter={typeFilter} minStrength={minStrength} />

        <button
          onClick={() => setAiPanel(aiPanel === 'analyze' ? null : 'analyze')}
          className={`flex items-center gap-1.5 h-8 px-3 rounded border text-xs font-medium transition-colors ${
            aiPanel === 'analyze'
              ? 'border-violet-500 bg-violet-500/10 text-violet-300'
              : 'border-slate-700 hover:border-violet-500 bg-slate-900 hover:bg-violet-500/10 text-slate-300 hover:text-violet-300'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Analisar com IA
        </button>

        <button
          onClick={() => setAiPanel(aiPanel === 'suggest' ? null : 'suggest')}
          className={`flex items-center gap-1.5 h-8 px-3 rounded border text-xs font-medium transition-colors ${
            aiPanel === 'suggest'
              ? 'border-sky-500 bg-sky-500/10 text-sky-300'
              : 'border-slate-700 hover:border-sky-500 bg-slate-900 hover:bg-sky-500/10 text-slate-300 hover:text-sky-300'
          }`}
        >
          <Lightbulb className="h-3.5 w-3.5" />
          Sugerir Conteúdo
        </button>
      </div>

      {/* Type filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-slate-600 shrink-0" />
        {allTypes.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`rounded-full px-3 py-0.5 text-xs font-medium border transition-colors capitalize ${
              typeFilter === t
                ? 'border-violet-400 bg-violet-400/10 text-violet-300'
                : 'border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300'
            }`}
            style={
              t !== 'all' && typeFilter !== t
                ? { borderColor: typeColor(t) + '55', color: typeColor(t) + 'cc' }
                : {}
            }
          >
            {t === 'all' ? 'Todos' : t}
          </button>
        ))}
      </div>

      {/* Stats mini row */}
      {graphData && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Entidades', value: graphData.stats.totalNodes },
            { label: 'Relacionamentos', value: graphData.stats.totalLinks },
            { label: 'Nós visíveis', value: nodes.length },
            { label: 'Arestas visíveis', value: edges.length },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-center"
            >
              <div className="text-lg font-mono font-bold text-white">{s.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Graph canvas */}
      <div
        className="rounded-xl border border-slate-800 overflow-hidden"
        style={{ height: 560 }}
      >
        {loading ? (
          <div className="h-full flex items-center justify-center bg-slate-950">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-violet-400 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Carregando grafo...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center bg-slate-950">
            <div className="text-center">
              <p className="text-sm text-red-400 mb-3">{error}</p>
              <button
                onClick={() => loadGraph()}
                className="px-4 py-2 rounded bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : nodes.length === 0 ? (
          <div className="h-full flex items-center justify-center bg-slate-950 text-slate-600 text-sm">
            Nenhuma entidade encontrada. Processe os blog posts primeiro.
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={3}
            style={{ background: '#0a0f1a' }}
          >
            <Background color="#1e293b" gap={20} />
            <Controls style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
            <MiniMap
              nodeColor={(n) => typeColor((n.data as any)?.node?.type ?? 'other')}
              style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              maskColor="#0a0f1a88"
            />

            {/* Legend panel */}
            <Panel position="top-right">
              <div className="rounded-lg border border-slate-800 bg-slate-950/90 backdrop-blur p-3 text-xs space-y-1 min-w-[130px]">
                <p className="text-slate-500 font-medium mb-2 flex items-center gap-1">
                  <Info className="h-3 w-3" /> Legenda
                </p>
                {Object.entries(TYPE_COLORS).map(([t, c]) => (
                  <div key={t} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: c }} />
                    <span className="text-slate-400 capitalize">{t}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </ReactFlow>
        )}
      </div>

      {/* AI Panel */}
      {aiPanel && (
        <AIPanel
          mode={aiPanel}
          typeFilter={typeFilter}
          minStrength={minStrength}
          onClose={() => setAiPanel(null)}
        />
      )}

      {/* Selected node panel */}
      {selectedNode && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/80 backdrop-blur p-5 relative">
          <button
            onClick={() => setSelectedNode(null)}
            className="absolute right-3 top-3 text-slate-600 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 mb-3">
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ background: typeColor(selectedNode.type) }}
            />
            <h3 className="font-semibold text-white text-sm">{selectedNode.name}</h3>
            <span
              className="text-xs px-2 py-0.5 rounded-full border capitalize"
              style={{
                borderColor: typeColor(selectedNode.type) + '55',
                color: typeColor(selectedNode.type),
                background: typeColor(selectedNode.type) + '11',
              }}
            >
              {selectedNode.type}
            </span>
          </div>

          {selectedNode.description && (
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">{selectedNode.description}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
            <span>{selectedNode.contentCount} artigos</span>
            {selectedNode.wikidataId && (
              <a
                href={`https://www.wikidata.org/wiki/${selectedNode.wikidataId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300 transition-colors"
              >
                Wikidata ↗
              </a>
            )}
          </div>

          {/* Connected nodes */}
          {graphData && (() => {
            const outgoing = graphData.links.filter((l) => nodeId(l.source) === selectedNode.id)
            const incoming = graphData.links.filter((l) => nodeId(l.target) === selectedNode.id)
            return (
              <div className="grid grid-cols-2 gap-4">
                {outgoing.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-2">
                      Aponta para ({outgoing.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {outgoing.slice(0, 6).map((l, i) => {
                        const tgt = graphData.nodes.find((n) => n.id === nodeId(l.target))
                        return (
                          <button
                            key={i}
                            onClick={() => tgt && setSelectedNode(tgt)}
                            className="flex items-center gap-1 text-[10px] rounded border border-slate-700 bg-slate-800 px-2 py-1 hover:bg-slate-700 text-slate-300 transition-colors"
                          >
                            <span className="text-slate-500">{l.type}</span>
                            <ChevronRight className="h-2.5 w-2.5 text-slate-600" />
                            {tgt?.name ?? nodeId(l.target)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
                {incoming.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-2">
                      Recebe de ({incoming.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {incoming.slice(0, 6).map((l, i) => {
                        const src = graphData.nodes.find((n) => n.id === nodeId(l.source))
                        return (
                          <button
                            key={i}
                            onClick={() => src && setSelectedNode(src)}
                            className="flex items-center gap-1 text-[10px] rounded border border-slate-700 bg-slate-800 px-2 py-1 hover:bg-slate-700 text-slate-300 transition-colors"
                          >
                            {src?.name ?? nodeId(l.source)}
                            <ChevronRight className="h-2.5 w-2.5 text-slate-600" />
                            <span className="text-slate-500">{l.type}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => loadGraph(selectedNode.id)}
              className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <Network className="h-3.5 w-3.5" />
              Explorar subgrafo a partir deste nó
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function GraphVisualization() {
  return (
    <ReactFlowProvider>
      <GraphInner />
    </ReactFlowProvider>
  )
}
