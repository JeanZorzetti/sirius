import { prisma } from '@/lib/prisma'
import { embedText, vectorToSql } from './embeddings'

interface ChunkRow {
  id: string
  text: string
  title: string
  similarity: number
}

export async function retrieveContext(
  organizationId: string,
  query: string,
  topK = 3
): Promise<string> {
  try {
    const queryEmbedding = await embedText(query)
    const embeddingStr = vectorToSql(queryEmbedding)

    const rows = await prisma.$queryRaw<ChunkRow[]>`
      SELECT
        kc.id,
        kc.text,
        kd.title,
        1 - (kc.embedding <=> ${embeddingStr}::vector) AS similarity
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeDocument" kd ON kd.id = kc."documentId"
      WHERE kd."organizationId" = ${organizationId}
        AND kc.embedding IS NOT NULL
      ORDER BY kc.embedding <=> ${embeddingStr}::vector
      LIMIT ${topK}
    `

    if (!rows.length) return ''

    return rows
      .filter(r => r.similarity > 0.5)
      .map(r => `[${r.title}]\n${r.text}`)
      .join('\n\n---\n\n')
  } catch {
    return ''
  }
}
