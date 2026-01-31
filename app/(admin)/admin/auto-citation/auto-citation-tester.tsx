'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Loader2, Wand2, Quote, FileText, Link } from 'lucide-react'

interface EnrichResult {
  response: string
  citations: {
    title: string
    url: string
    reason: string
  }[]
  entities: string[]
}

export function AutoCitationTester() {
  const [response, setResponse] = useState('')
  const [userInput, setUserInput] = useState('')
  const [includeSources, setIncludeSources] = useState(true)
  const [includeRelated, setIncludeRelated] = useState(true)
  const [result, setResult] = useState<EnrichResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleEnrich = () => {
    if (!response.trim()) return

    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/agi/enrich', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            response,
            userInput: userInput || response.substring(0, 50),
            includeSources,
            includeRelated,
          }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Erro ao enriquecer resposta')
        }

        setResult(data.enriched)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
        setResult(null)
      }
    })
  }

  const exampleResponse = `Para melhorar suas vendas, você precisa implementar um CRM eficiente e uma metodologia de vendas como o SPIN Selling.

O primeiro passo é qualificar melhor seus leads. Isso significa fazer discovery adequada e entender as dores do cliente antes de apresentar sua solução.

Automação de follow-up também é essencial - muitas vendas são perdidas simplesmente porque o vendedor não fez follow-up no tempo certo.`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-yellow-600" />
          Testar Auto-Citation
        </CardTitle>
        <CardDescription>
          Cole uma resposta do agente para ver como ela seria enriquecida com citações
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Pergunta do usuário (opcional)</Label>
            <Input
              placeholder="Ex: Como posso melhorar minhas vendas?"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Resposta do agente</Label>
            <Textarea
              placeholder="Cole aqui a resposta que deseja enriquecer com citações..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="min-h-[150px]"
            />
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-6 pt-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="sources"
                checked={includeSources}
                onCheckedChange={setIncludeSources}
              />
              <Label htmlFor="sources" className="text-sm">
                Incluir seção "Fontes"
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="related"
                checked={includeRelated}
                onCheckedChange={setIncludeRelated}
              />
              <Label htmlFor="related" className="text-sm">
                Incluir seção "Leia também"
              </Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleEnrich}
              disabled={isPending || !response.trim()}
              className="flex-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enriquecendo...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Enriquecer com Citações
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setResponse(exampleResponse)}
            >
              Usar Exemplo
            </Button>
          </div>
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
            {/* Enriched Response */}
            <div>
              <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Resposta Enriquecida
              </h4>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div
                  className="text-sm text-slate-700 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: result.response
                      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-indigo-600 hover:text-indigo-800 underline">$1</a>')
                      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>'),
                  }}
                />
              </div>
            </div>

            {/* Detected Entities */}
            <div>
              <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                <Quote className="h-4 w-4" />
                Entidades Detectadas ({result.entities.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.entities.length > 0 ? (
                  result.entities.map((entity, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="bg-indigo-50 text-indigo-700 border-indigo-200"
                    >
                      {entity}
                    </Badge>
                  ))
                ) : (
                  <span className="text-slate-500 text-sm">Nenhuma entidade detectada</span>
                )}
              </div>
            </div>

            {/* Citations */}
            <div>
              <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-2">
                <Link className="h-4 w-4" />
                Citações Adicionadas ({result.citations.length})
              </h4>
              <div className="space-y-2">
                {result.citations.length > 0 ? (
                  result.citations.map((citation, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="text-sm text-slate-900">{citation.title}</p>
                        <p className="text-xs text-slate-500">{citation.url}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {citation.reason}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <span className="text-slate-500 text-sm">Nenhuma citação adicionada</span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
