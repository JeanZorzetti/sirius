'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, Brain, FileText, Link2 } from 'lucide-react'

interface RAGResult {
  userQuery: string
  extractedEntities: {
    id: string
    name: string
    type: string
    relevance: number
  }[]
  expandedEntities: {
    id: string
    name: string
    type: string
    relationshipType: string
    distance: number
  }[]
  relevantContent: {
    contentId: string
    contentType: string
    relevanceScore: number
    matchType: 'direct' | 'graph_expanded' | 'semantic'
  }[]
  contextSummary: string
}

export function GraphRAGTester() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<RAGResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleTest = () => {
    if (!query.trim()) return

    setError(null)
    startTransition(async () => {
      try {
        const response = await fetch('/api/graph/rag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao processar consulta')
        }

        setResult(data.context)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        setResult(null)
      }
    })
  }

  const matchTypeColors = {
    direct: 'bg-green-50 text-green-700 border-green-200',
    graph_expanded: 'bg-blue-50 text-blue-700 border-blue-200',
    semantic: 'bg-purple-50 text-purple-700 border-purple-200',
  }

  const matchTypeLabels = {
    direct: 'Match Direto',
    graph_expanded: 'Via Grafo',
    semantic: 'Semântico',
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-indigo-600" />
          Testar Graph-RAG
        </CardTitle>
        <CardDescription>
          Digite uma pergunta para ver como o sistema encontra contexto relevante
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Ex: Como melhorar a conversão de leads usando CRM?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[100px]"
          />
          <Button
            onClick={handleTest}
            disabled={isPending || !query.trim()}
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Testar Retrieval
              </>
            )}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            {/* Context Summary */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-700">{result.contextSummary}</p>
            </div>

            {/* Extracted Entities */}
            <div>
              <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Entidades Identificadas ({result.extractedEntities.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.extractedEntities.length > 0 ? (
                  result.extractedEntities.map((entity) => (
                    <Badge
                      key={entity.id}
                      variant="outline"
                      className="bg-indigo-50 text-indigo-700 border-indigo-200"
                    >
                      {entity.name}
                      <span className="ml-1 text-xs opacity-70">({entity.type})</span>
                    </Badge>
                  ))
                ) : (
                  <span className="text-slate-500 text-sm">Nenhuma entidade identificada</span>
                )}
              </div>
            </div>

            {/* Expanded Entities */}
            <div>
              <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Contexto Expandido via Grafo ({result.expandedEntities.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.expandedEntities.length > 0 ? (
                  result.expandedEntities.slice(0, 10).map((entity) => (
                    <Badge
                      key={entity.id}
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      {entity.name}
                      <span className="ml-1 text-xs opacity-70">via {entity.relationshipType}</span>
                    </Badge>
                  ))
                ) : (
                  <span className="text-slate-500 text-sm">Nenhuma expansão via grafo</span>
                )}
                {result.expandedEntities.length > 10 && (
                  <Badge variant="outline" className="bg-slate-100 text-slate-600">
                    +{result.expandedEntities.length - 10} mais
                  </Badge>
                )}
              </div>
            </div>

            {/* Relevant Content */}
            <div>
              <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Conteúdo Relevante ({result.relevantContent.length})
              </h4>
              <div className="space-y-2">
                {result.relevantContent.length > 0 ? (
                  result.relevantContent.map((content, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className={matchTypeColors[content.matchType]}
                        >
                          {matchTypeLabels[content.matchType]}
                        </Badge>
                        <span className="text-sm text-slate-700">
                          {content.contentType}: {content.contentId}
                        </span>
                      </div>
                      <span className="text-sm text-slate-500">
                        {(content.relevanceScore * 100).toFixed(0)}% relevante
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-500 text-sm">Nenhum conteúdo encontrado</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Example Queries */}
        {!result && !error && (
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-sm font-medium text-slate-600 mb-2">Exemplos de perguntas:</h4>
            <div className="flex flex-wrap gap-2">
              {[
                'Como melhorar a conversão de leads?',
                'O que é SPIN Selling?',
                'Técnicas de follow-up eficientes',
                'Como reduzir o churn de clientes?',
              ].map((example) => (
                <Button
                  key={example}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setQuery(example)}
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
