import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Groq from 'groq-sdk'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export const runtime = 'nodejs'

let _groq: Groq | null = null
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })
  return _groq
}

// POST /api/graph/analyze
// body: { mode: 'analyze' | 'suggest', typeFilter: string, minStrength: number }
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) return await apiError(ERR.UNAUTHORIZED, 401, { req: request })

  const { mode, typeFilter, minStrength = 0.3 } = await request.json()

  // ── Fetch data ────────────────────────────────────────────────────────────
  const allEntities = await prisma.entity.findMany({
    include: {
      _count: { select: { subjectRelationships: true, objectRelationships: true, contentLinks: true } },
    },
  })

  const entities = typeFilter === 'all' ? allEntities : allEntities.filter((e) => e.type === typeFilter)
  const entityIds = new Set(entities.map((e) => e.id))

  const rels = await prisma.relationship.findMany({
    where: { confidence: { gte: minStrength } },
    include: {
      subject: { select: { id: true, name: true, type: true } },
      object: { select: { id: true, name: true, type: true } },
    },
    orderBy: { confidence: 'desc' },
  })

  const filteredRels = rels.filter((r) => entityIds.has(r.subjectId) && entityIds.has(r.objectId))

  // ── Build connectivity map ────────────────────────────────────────────────
  const connMap = new Map<string, number>()
  for (const r of filteredRels) {
    connMap.set(r.subjectId, (connMap.get(r.subjectId) ?? 0) + 1)
    connMap.set(r.objectId, (connMap.get(r.objectId) ?? 0) + 1)
  }

  const isolated = entities.filter((e) => (connMap.get(e.id) ?? 0) === 0)
  const hubs = [...entities]
    .sort((a, b) => (connMap.get(b.id) ?? 0) - (connMap.get(a.id) ?? 0))
    .slice(0, 10)

  // Type distribution
  const byType: Record<string, number> = {}
  for (const e of entities) byType[e.type] = (byType[e.type] ?? 0) + 1

  // Relation type distribution
  const byRel: Record<string, number> = {}
  for (const r of filteredRels) byRel[r.predicate] = (byRel[r.predicate] ?? 0) + 1

  // ── Build context string ──────────────────────────────────────────────────
  const ctx = [
    `KNOWLEDGE GRAPH — SIRIUS CRM`,
    `Entidades: ${entities.length} | Relacionamentos: ${filteredRels.length} | Filtro: ${typeFilter} | Confiança mínima: ${minStrength}`,
    ``,
    `DISTRIBUIÇÃO POR TIPO:`,
    Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([t, n]) => `  ${t}: ${n}`).join('\n'),
    ``,
    `TIPOS DE RELACIONAMENTO:`,
    Object.entries(byRel).sort((a, b) => b[1] - a[1]).map(([r, n]) => `  ${r}: ${n}`).join('\n'),
    ``,
    `TOP 10 ENTIDADES (por conectividade):`,
    hubs.map((e, i) => `  ${i + 1}. ${e.name} (${e.type}) — ${connMap.get(e.id) ?? 0} conexões, ${e._count.contentLinks} artigos`).join('\n'),
    ``,
    `ENTIDADES ISOLADAS (sem conexões): ${isolated.length}`,
    isolated.slice(0, 30).map((e) => `  - ${e.name} (${e.type}, ${e._count.contentLinks} artigos)`).join('\n'),
    ``,
    `AMOSTRA DE RELACIONAMENTOS (top 40 por confiança):`,
    filteredRels.slice(0, 40).map((r) => `  ${r.subject.name} | ${r.predicate} | ${r.object.name} [${r.confidence.toFixed(2)}]`).join('\n'),
  ].join('\n')

  // ── Prompts ───────────────────────────────────────────────────────────────
  const systemPrompt = `Você é um especialista em SEO, knowledge graphs e estratégia de conteúdo para SaaS B2B.
Analise dados de knowledge graph e forneça insights acionáveis, diretos e sem rodeios.
Responda sempre em português. Use markdown com tabelas e listas quando útil. Seja específico.`

  const analyzePrompt = `Analise este knowledge graph do blog do Sirius CRM (SaaS de vendas B2B) e produza uma síntese executiva com:

1. **Visão geral**: escala, densidade (rel/entidade), saúde geral do grafo
2. **Hubs principais**: quais entidades estruturam o grafo e o que isso revela sobre o posicionamento
3. **Clusters temáticos**: grupos de entidades fortemente conectadas (identifique 3-5)
4. **Qualidade dos relacionamentos**: distribuição de predicados, quais são semanticamente fracos
5. **Lacunas críticas**: entidades isoladas relevantes, tipos sub-representados
6. **Score de maturidade**: avalie de 0-100 e justifique

Dados do grafo:
${ctx}`

  const suggestPrompt = `Com base neste knowledge graph do blog do Sirius CRM (SaaS de vendas B2B), sugira artigos a criar.

Foco prioritário: **entidades isoladas** (sem conexões) que já foram extraídas mas não têm conteúdo ligando-as ao grafo.

Para cada sugestão, forneça:
- **Título do artigo** (otimizado para SEO)
- **Entidades que conectaria** (quais nós isolados ou subconectados ele ligaria)
- **Intenção de busca** (informacional / comercial / navegacional)
- **Impacto estimado** no grafo (quantas novas conexões criaria)

Organize por prioridade (maior impacto primeiro). Sugira no mínimo 8 artigos.

Dados do grafo:
${ctx}`

  const prompt = mode === 'suggest' ? suggestPrompt : analyzePrompt

  // ── Stream response ───────────────────────────────────────────────────────
  const stream = await getGroq().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    max_tokens: 2048,
    temperature: 0.4,
    stream: true,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
  })

  return new NextResponse(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Transfer-Encoding': 'chunked',
    },
  })
}
