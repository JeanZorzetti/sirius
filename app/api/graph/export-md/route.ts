import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { apiError } from '@/lib/api-error'
import { ERR } from '@/lib/error-messages'

export const runtime = 'nodejs'

// GET /api/graph/export-md?typeFilter=all&minStrength=0.3
export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session?.user) return await apiError(ERR.UNAUTHORIZED, 401, { req: request })

  const { searchParams } = new URL(request.url)
  const typeFilter = searchParams.get('typeFilter') ?? 'all'
  const minStrength = parseFloat(searchParams.get('minStrength') ?? '0.3')
  const projectName = searchParams.get('project') ?? 'Sirius CRM'

  const now = new Date()
  const dateStr = format(now, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  const fileDate = format(now, 'yyyy-MM-dd')

  // ── Fetch all entities ────────────────────────────────────────────────────
  const allEntities = await prisma.entity.findMany({
    include: {
      _count: {
        select: { subjectRelationships: true, objectRelationships: true, contentLinks: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  const entities =
    typeFilter === 'all' ? allEntities : allEntities.filter((e) => e.type === typeFilter)
  const entityIds = new Set(entities.map((e) => e.id))

  // ── Fetch relationships ───────────────────────────────────────────────────
  const allRels = await prisma.relationship.findMany({
    where: { confidence: { gte: minStrength } },
    include: {
      subject: { select: { id: true, name: true } },
      object:  { select: { id: true, name: true } },
    },
    orderBy: [{ confidence: 'desc' }, { predicate: 'asc' }],
  })

  const rels = allRels.filter((r) => entityIds.has(r.subjectId) && entityIds.has(r.objectId))

  // ── Aggregate stats ───────────────────────────────────────────────────────
  const totalEntities = entities.length
  const totalRels = rels.length

  // Connectivity map
  const connMap = new Map<string, number>()
  for (const r of rels) {
    connMap.set(r.subjectId, (connMap.get(r.subjectId) ?? 0) + 1)
    connMap.set(r.objectId,  (connMap.get(r.objectId)  ?? 0) + 1)
  }

  // Entities sorted by connectivity
  const byConn = [...entities].sort(
    (a, b) => (connMap.get(b.id) ?? 0) - (connMap.get(a.id) ?? 0)
  )

  // Group by type
  const byType = entities.reduce<Record<string, typeof entities>>((acc, e) => {
    ;(acc[e.type] = acc[e.type] ?? []).push(e)
    return acc
  }, {})

  // Relation type counts
  const relTypeCounts = rels.reduce<Record<string, number>>((acc, r) => {
    acc[r.predicate] = (acc[r.predicate] ?? 0) + 1
    return acc
  }, {})

  // ── Build Markdown ────────────────────────────────────────────────────────
  const lines: string[] = []

  const push = (...args: string[]) => lines.push(...args)

  push(
    `# Knowledge Graph — Relatório`,
    ``,
    `> **${projectName}** · Gerado em ${dateStr}`,
    ``,
    `---`,
    ``,
    `## Resumo Executivo`,
    ``,
    `| Métrica | Valor |`,
    `|---------|-------|`,
    `| Total de entidades | **${totalEntities}** |`,
    `| Total de relacionamentos | **${totalRels}** |`,
    `| Filtro de tipo | ${typeFilter === 'all' ? 'Todos os tipos' : typeFilter} |`,
    `| Confiança mínima | ${minStrength} |`,
    ``,
    `---`,
    ``,
    `## Distribuição por Tipo`,
    ``,
    `| Tipo | Qtd | % do total |`,
    `|------|-----|-----------|`,
  )

  for (const [type, items] of Object.entries(byType).sort((a, b) => b[1].length - a[1].length)) {
    const pct = totalEntities > 0 ? ((items.length / totalEntities) * 100).toFixed(1) : '0'
    push(`| ${capitalize(type)} | ${items.length} | ${pct}% |`)
  }

  push(``, `---`, ``, `## Tipos de Relacionamento`, ``, `| Relação | Ocorrências |`, `|---------|------------|`)

  for (const [pred, count] of Object.entries(relTypeCounts).sort((a, b) => b[1] - a[1])) {
    push(`| ${pred} | ${count} |`)
  }

  push(``, `---`, ``, `## Top 15 Entidades por Conectividade`, ``, `| # | Entidade | Tipo | Conexões | Conteúdos |`, `|---|----------|------|----------|-----------|`)

  byConn.slice(0, 15).forEach((e, i) => {
    const conn = connMap.get(e.id) ?? 0
    push(`| ${i + 1} | **${e.name}** | ${capitalize(e.type)} | ${conn} | ${e._count.contentLinks} |`)
  })

  push(``, `---`, ``)

  // Per-type sections
  for (const [type, items] of Object.entries(byType).sort((a, b) => b[1].length - a[1].length)) {
    push(
      `## ${capitalize(type)}s (${items.length})`,
      ``,
      `| Entidade | Slug | Conteúdos | Conexões |`,
      `|----------|------|-----------|---------|`,
    )
    const sorted = [...items].sort(
      (a, b) => (connMap.get(b.id) ?? 0) - (connMap.get(a.id) ?? 0)
    )
    for (const e of sorted) {
      const slug = e.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      push(`| ${e.name} | \`${slug}\` | ${e._count.contentLinks} | ${connMap.get(e.id) ?? 0} |`)
    }
    push(``, `---`, ``)
  }

  // Full relationship table
  push(`## Relacionamentos Completos`, ``, `| Origem | Relação | Destino | Confiança |`, `|--------|---------|---------|-----------|`)

  for (const r of rels) {
    push(`| ${r.subject.name} | ${r.predicate} | ${r.object.name} | ${r.confidence.toFixed(2)} |`)
  }

  push(``, `---`, ``, `*Relatório gerado automaticamente pelo Knowledge Graph do ${projectName}.*`)

  const markdown = lines.join('\n')
  const filename = `knowledge-graph-${fileDate}.md`

  return new NextResponse(markdown, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
