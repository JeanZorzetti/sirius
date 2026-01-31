/**
 * Auto-Citation Admin Interface
 *
 * Test and explore the automatic citation system that
 * enriches agent responses with relevant content links.
 */

import { Metadata } from 'next'
import { AutoCitationTester } from './auto-citation-tester'
import { getGraphStats } from '@/lib/nlp/pipeline'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Quote, Link2, FileText, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Auto-Citation | Sirius Admin',
  description: 'Test automatic citation enrichment system',
}

export default async function AutoCitationPage() {
  const stats = await getGraphStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Auto-Citation</h2>
        <p className="text-slate-600">
          Enriqueça respostas do agente com citações automáticas de artigos relevantes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entidades Conhecidas</CardTitle>
            <Quote className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEntities}</div>
            <p className="text-xs text-muted-foreground">termos que podem ser citados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conteúdos Linkáveis</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalExtractions}</div>
            <p className="text-xs text-muted-foreground">artigos processados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conexões</CardTitle>
            <Link2 className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRelationships}</div>
            <p className="text-xs text-muted-foreground">relacionamentos semânticos</p>
          </CardContent>
        </Card>
      </div>

      {/* How it works */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-600" />
            Como funciona a Auto-Citation
          </CardTitle>
          <CardDescription>
            Enriquecimento automático de respostas com links relevantes
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-2">
          <p><strong className="text-indigo-600">1. Análise de Texto:</strong> Identifica menções a conceitos conhecidos (CRM, SPIN, etc.)</p>
          <p><strong className="text-green-600">2. Busca no Grafo:</strong> Encontra artigos relacionados aos conceitos mencionados</p>
          <p><strong className="text-yellow-600">3. Inserção de Links:</strong> Adiciona hyperlinks inline na primeira menção de cada termo</p>
          <p><strong className="text-blue-600">4. Seção "Leia também":</strong> Sugere artigos adicionais para aprofundamento</p>
        </CardContent>
      </Card>

      {/* Interactive Tester */}
      <AutoCitationTester />
    </div>
  )
}
