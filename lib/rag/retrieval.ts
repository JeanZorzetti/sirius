import { prisma } from '@/lib/prisma'
import { embedText, vectorToSql } from './embeddings'

interface ChunkRow {
  id: string
  text: string
  title: string
  similarity: number
}

/**
 * Retrieve relevant knowledge chunks for a given query.
 * If agentId is provided, returns chunks from docs assigned to that agent
 * OR from global docs (agentIds = {}).
 * If agentId is omitted, returns only global docs.
 */
export async function retrieveContext(
  organizationId: string,
  query: string,
  agentId?: string,
  topK = 3
): Promise<string> {
  try {
    const queryEmbedding = await embedText(query)
    const embeddingStr = vectorToSql(queryEmbedding)

    let rows: ChunkRow[]

    if (agentId) {
      rows = await prisma.$queryRaw<ChunkRow[]>`
        SELECT
          kc.id,
          kc.text,
          kd.title,
          1 - (kc.embedding <=> ${embeddingStr}::vector) AS similarity
        FROM "KnowledgeChunk" kc
        JOIN "KnowledgeDocument" kd ON kd.id = kc."documentId"
        WHERE kd."organizationId" = ${organizationId}
          AND kc.embedding IS NOT NULL
          AND (
            kd."agentIds" = '{}'
            OR ${agentId} = ANY(kd."agentIds")
          )
        ORDER BY kc.embedding <=> ${embeddingStr}::vector
        LIMIT ${topK}
      `
    } else {
      rows = await prisma.$queryRaw<ChunkRow[]>`
        SELECT
          kc.id,
          kc.text,
          kd.title,
          1 - (kc.embedding <=> ${embeddingStr}::vector) AS similarity
        FROM "KnowledgeChunk" kc
        JOIN "KnowledgeDocument" kd ON kd.id = kc."documentId"
        WHERE kd."organizationId" = ${organizationId}
          AND kc.embedding IS NOT NULL
          AND kd."agentIds" = '{}'
        ORDER BY kc.embedding <=> ${embeddingStr}::vector
        LIMIT ${topK}
      `
    }

    if (!rows.length) return ''

    return rows
      .filter(r => r.similarity > 0.5)
      .map(r => `[${r.title}]\n${r.text}`)
      .join('\n\n---\n\n')
  } catch {
    return ''
  }
}
