/**
 * Graph-Augmented RAG Admin Interface
 *
 * Test and explore the Graph-RAG system that combines
 * graph traversal with semantic retrieval.
 */

import { Metadata } from 'next'
import { GraphRAGTester } from './graph-rag-tester'
import { getGraphStats } from '@/lib/nlp/pipeline'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Database, Network, Zap, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Graph-RAG | Sirius Admin',
  description: 'Test Graph-Augmented Retrieval system',
}

export default async function GraphRAGPage() {
  const stats = await getGraphStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Graph-Augmented RAG</h2>
        <p className="text-slate-600">
          Teste o sistema de retrieval que combina traversal de grafo com busca semântica
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entidades</CardTitle>
            <Database className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEntities}</div>
            <p className="text-xs text-muted-foreground">no grafo de conhecimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relacionamentos</CardTitle>
            <Network className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRelationships}</div>
            <p className="text-xs text-muted-foreground">conexões semânticas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Densidade</CardTitle>
            <Zap className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRelationshipsPerEntity}</div>
            <p className="text-xs text-muted-foreground">rel. por entidade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Extrações</CardTitle>
            <Search className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExtractions}</div>
            <p className="text-xs text-muted-foreground">processamentos NLP</p>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle>Como funciona o Graph-RAG</CardTitle>
          <CardDescription>
            Retrieval-Augmented Generation com expansão de contexto via grafo
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-2">
          <p><strong className="text-indigo-600">1. Extração de Entidades:</strong> Identifica conceitos na pergunta do usuário</p>
          <p><strong className="text-green-600">2. Expansão via Grafo:</strong> Traversa relacionamentos para encontrar conceitos conectados</p>
          <p><strong className="text-yellow-600">3. Retrieval de Conteúdo:</strong> Busca artigos que mencionam entidades (diretas + expandidas)</p>
          <p><strong className="text-blue-600">4. Ranking por Relevância:</strong> Prioriza matches diretos sobre matches via grafo</p>
        </CardContent>
      </Card>

      {/* Interactive Tester */}
      <GraphRAGTester />
    </div>
  )
}
