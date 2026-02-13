/**
 * NLP Pipeline - Knowledge Graph Builder
 *
 * Server Action that orchestrates entity extraction and graph persistence.
 * Processes content → extracts entities → stores in PostgreSQL.
 */

'use server'

import { prisma } from '@/lib/prisma'
import { extractEntities } from './extract-entities'
import { calculateContentHash } from './hash-utils'
import type {
  ExtractionRequest,
  ExtractionResponse,
  ExtractedEntity,
  ExtractedRelationship,
} from './types'
import logger from '@/lib/logger'

/**
 * Process content through NLP pipeline
 *
 * Steps:
 * 1. Create EntityExtraction record (status: processing)
 * 2. Extract entities using Groq LLM
 * 3. Upsert entities to database
 * 4. Upsert relationships to database
 * 5. Create ContentEntity links
 * 6. Update EntityExtraction record (status: completed)
 */
export async function processContentNLP(
  request: ExtractionRequest
): Promise<ExtractionResponse> {
  const startTime = Date.now()

  try {
    const {
      text,
      contentType = 'unknown',
      contentId,
      contentUrl,
      maxTokens,
      temperature,
    } = request

    // Step 1: Create EntityExtraction record
    const contentHash = calculateContentHash(text)
    const extraction = await prisma.entityExtraction.create({
      data: {
        contentType,
        contentId,
        contentUrl,
        textSample: text.slice(0, 500),
        contentHash,
        status: 'processing',
        modelUsed: 'llama-3.3-70b-versatile',
      },
    })

    logger.info({ extractionId: extraction.id }, '[NLP Pipeline] Started extraction')

    try {
      // Step 2: Extract entities using LLM
      const result = await extractEntities({
        text,
        contentType,
        contentId,
        contentUrl,
        maxTokens,
        temperature,
      })

      logger.info(
        { entities: result.entities.length, relationships: result.relationships.length },
        '[NLP Pipeline] Extracted entities and relationships'
      )

      // Step 3: Upsert entities to database
      const entityMap = new Map<string, string>() // name -> id

      for (const entity of result.entities) {
        const upserted = await upsertEntity(entity)
        entityMap.set(entity.name.toLowerCase(), upserted.id)
      }

      // Step 4: Upsert relationships to database
      for (const rel of result.relationships) {
        const subjectId = entityMap.get(rel.subject.toLowerCase())
        const objectId = entityMap.get(rel.object.toLowerCase())

        if (subjectId && objectId) {
          await upsertRelationship({
            subjectId,
            objectId,
            predicate: rel.predicate,
            confidence: rel.confidence,
            source: contentUrl || contentId,
          })
        } else {
          logger.warn(
            { subject: rel.subject, predicate: rel.predicate, object: rel.object },
            '[NLP Pipeline] Skipping relationship - entities not found'
          )
        }
      }

      // Step 5: Create ContentEntity links
      if (contentId) {
        for (const entity of result.entities) {
          const entityId = entityMap.get(entity.name.toLowerCase())
          if (entityId) {
            await prisma.contentEntity.create({
              data: {
                contentType,
                contentId,
                entityId,
                relevance: entity.relevance,
                context: entity.context,
              },
            })
          }
        }
      }

      // Step 6: Mark extraction as completed
      const processingTimeMs = Date.now() - startTime
      await prisma.entityExtraction.update({
        where: { id: extraction.id },
        data: {
          status: 'completed',
          extractedEntities: result.entities as any,
          extractedRelationships: result.relationships as any,
          processingTimeMs,
          completedAt: new Date(),
        },
      })

      logger.info(
        { extractionId: extraction.id, processingTimeMs },
        '[NLP Pipeline] Completed extraction'
      )

      return {
        success: true,
        data: result,
        extractionId: extraction.id,
        processingTimeMs,
      }
    } catch (error) {
      // Mark extraction as failed
      await prisma.entityExtraction.update({
        where: { id: extraction.id },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      })

      throw error
    }
  } catch (error) {
    const processingTimeMs = Date.now() - startTime
    console.error('[NLP Pipeline] Processing failed:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTimeMs,
    }
  }
}

/**
 * Upsert entity to database
 *
 * If entity with same wikidataId exists, update it.
 * Otherwise, create new entity.
 */
async function upsertEntity(entity: ExtractedEntity) {
  const existing = entity.wikidataId
    ? await prisma.entity.findUnique({
        where: { wikidataId: entity.wikidataId },
      })
    : null

  if (existing) {
    // Update existing entity
    return await prisma.entity.update({
      where: { id: existing.id },
      data: {
        aliases: {
          set: Array.from(
            new Set([...existing.aliases, ...(entity.aliases || [])])
          ),
        },
        description: entity.description || existing.description,
        metadata: {
          ...(existing.metadata as any),
          lastSeen: new Date().toISOString(),
        },
        updatedAt: new Date(),
      },
    })
  } else {
    // Create new entity
    return await prisma.entity.create({
      data: {
        name: entity.name,
        wikidataId: entity.wikidataId,
        type: entity.type,
        description: entity.description,
        aliases: entity.aliases || [],
        metadata: {
          firstSeen: new Date().toISOString(),
        },
      },
    })
  }
}

/**
 * Upsert relationship to database
 *
 * If relationship (triple) exists, update lastSeen timestamp.
 * Otherwise, create new relationship.
 */
async function upsertRelationship(data: {
  subjectId: string
  objectId: string
  predicate: string
  confidence?: number
  source?: string
}) {
  const existing = await prisma.relationship.findUnique({
    where: {
      subjectId_predicate_objectId: {
        subjectId: data.subjectId,
        predicate: data.predicate,
        objectId: data.objectId,
      },
    },
  })

  if (existing) {
    // Update lastSeen to mark freshness
    return await prisma.relationship.update({
      where: { id: existing.id },
      data: {
        lastSeen: new Date(),
        confidence: Math.max(
          existing.confidence,
          data.confidence || existing.confidence
        ),
        updatedAt: new Date(),
      },
    })
  } else {
    // Create new relationship
    return await prisma.relationship.create({
      data: {
        subjectId: data.subjectId,
        predicate: data.predicate,
        objectId: data.objectId,
        confidence: data.confidence ?? 1.0,
        source: data.source,
      },
    })
  }
}

/**
 * Query entities by name (fuzzy search)
 */
export async function searchEntities(query: string, limit: number = 10) {
  return await prisma.entity.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { aliases: { has: query } },
      ],
    },
    take: limit,
    orderBy: { updatedAt: 'desc' },
  })
}

/**
 * Find related entities (graph traversal)
 */
export async function findRelatedEntities(
  entityId: string,
  depth: number = 1,
  predicate?: string
) {
  const relationships = await prisma.relationship.findMany({
    where: {
      OR: [{ subjectId: entityId }, { objectId: entityId }],
      ...(predicate && { predicate }),
    },
    include: {
      subject: true,
      object: true,
    },
    orderBy: { lastSeen: 'desc' },
  })

  return relationships.map((rel) => ({
    relationship: {
      predicate: rel.predicate,
      confidence: rel.confidence,
      lastSeen: rel.lastSeen,
    },
    relatedEntity:
      rel.subjectId === entityId ? rel.object : rel.subject,
  }))
}

/**
 * Get extraction history
 */
export async function getExtractionHistory(
  contentType?: string,
  limit: number = 20
) {
  return await prisma.entityExtraction.findMany({
    where: contentType ? { contentType } : undefined,
    take: limit,
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get knowledge graph statistics
 */
export async function getGraphStats() {
  const [entityCount, relationshipCount, extractionCount] = await Promise.all([
    prisma.entity.count(),
    prisma.relationship.count(),
    prisma.entityExtraction.count({ where: { status: 'completed' } }),
  ])

  const recentExtractions = await prisma.entityExtraction.findMany({
    where: { status: 'completed' },
    orderBy: { completedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      contentType: true,
      processingTimeMs: true,
      completedAt: true,
    },
  })

  return {
    totalEntities: entityCount,
    totalRelationships: relationshipCount,
    totalExtractions: extractionCount,
    avgRelationshipsPerEntity:
      entityCount > 0
        ? (relationshipCount / entityCount).toFixed(2)
        : '0',
    recentExtractions,
  }
}
