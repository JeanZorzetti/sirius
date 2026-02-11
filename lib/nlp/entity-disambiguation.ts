/**
 * NLP Pipeline - Entity Disambiguation
 *
 * Handles cases where multiple entities share the same name but have different meanings
 * (e.g., "Apple" as fruit vs "Apple" as company, "Java" as programming language vs coffee).
 */

'use server'

import { prisma } from '@/lib/prisma'
import type { ExtractedEntity } from './types'
import logger from '@/lib/logger'

/**
 * Disambiguation strategy based on entity type and context
 */
export interface DisambiguationContext {
  name: string
  type: string
  description?: string | null
  context?: string | null // Sentence where entity appeared
  wikidataId?: string | null
}

/**
 * Check if an entity name is ambiguous (exists with different types/meanings)
 */
export async function isAmbiguousEntity(name: string): Promise<boolean> {
  const existingEntities = await prisma.entity.findMany({
    where: {
      name: {
        equals: name,
        mode: 'insensitive',
      },
    },
    select: {
      type: true,
      wikidataId: true,
    },
  })

  // If multiple entities with same name but different types or Wikidata IDs
  if (existingEntities.length > 1) {
    const uniqueTypes = new Set(existingEntities.map((e) => e.type))
    const uniqueWikiIds = new Set(
      existingEntities.map((e) => e.wikidataId).filter(Boolean)
    )

    return uniqueTypes.size > 1 || uniqueWikiIds.size > 1
  }

  return false
}

/**
 * Find the correct entity match considering disambiguation
 */
export async function findDisambiguatedEntity(
  context: DisambiguationContext
): Promise<{ id: string; name: string } | null> {
  const { name, type, wikidataId, description } = context

  // Strategy 1: Exact Wikidata ID match (most reliable)
  if (wikidataId) {
    const entity = await prisma.entity.findUnique({
      where: { wikidataId },
      select: { id: true, name: true },
    })

    if (entity) return entity
  }

  // Strategy 2: Name + Type match
  const entitiesByName = await prisma.entity.findMany({
    where: {
      name: {
        equals: name,
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      name: true,
      type: true,
      wikidataId: true,
      description: true,
      metadata: true,
    },
  })

  if (entitiesByName.length === 0) {
    return null // No match
  }

  if (entitiesByName.length === 1) {
    return { id: entitiesByName[0].id, name: entitiesByName[0].name }
  }

  // Multiple matches - disambiguate
  const matchByType = entitiesByName.find((e) => e.type === type)
  if (matchByType) {
    return { id: matchByType.id, name: matchByType.name }
  }

  // Strategy 3: Semantic similarity of descriptions (if available)
  if (description) {
    const matchByDescription = entitiesByName.find((e) => {
      if (!e.description) return false
      // Simple keyword matching (can be improved with embeddings)
      const keywords1 = description.toLowerCase().split(/\W+/)
      const keywords2 = e.description.toLowerCase().split(/\W+/)
      const overlap = keywords1.filter((k) => keywords2.includes(k)).length
      return overlap > 2 // At least 2 overlapping keywords
    })

    if (matchByDescription) {
      return { id: matchByDescription.id, name: matchByDescription.name }
    }
  }

  // Fallback: Return first match but log ambiguity
  logger.warn(
    { name, candidateCount: entitiesByName.length, firstMatchType: entitiesByName[0].type },
    '[Disambiguation] Ambiguous entity, using first match'
  )

  return { id: entitiesByName[0].id, name: entitiesByName[0].name }
}

/**
 * Create a canonical name for disambiguation when needed
 * E.g., "Apple" → "Apple (company)" or "Apple (fruit)"
 */
export function createCanonicalName(name: string, type: string, description?: string | null): string {
  // Don't modify if already has disambiguation marker
  if (name.includes('(') && name.includes(')')) {
    return name
  }

  // Common disambiguation patterns
  const disambiguators: Record<string, string> = {
    technology: 'tech',
    tool: 'software',
    concept: 'concept',
    geography: 'place',
    persona: 'person',
    industry: 'industry',
    methodology: 'method',
    process: 'process',
    metric: 'metric',
  }

  const disambiguator = disambiguators[type] || type

  // Special cases based on description keywords
  if (description) {
    const lower = description.toLowerCase()
    if (lower.includes('company') || lower.includes('corporation')) {
      return `${name} (company)`
    }
    if (lower.includes('programming') || lower.includes('language')) {
      return `${name} (programming)`
    }
    if (lower.includes('framework')) {
      return `${name} (framework)`
    }
  }

  return `${name} (${disambiguator})`
}

/**
 * Detect and resolve ambiguous entities during extraction
 */
export async function resolveEntityAmbiguities(
  entities: ExtractedEntity[]
): Promise<
  Array<
    ExtractedEntity & {
      disambiguated: boolean
      canonicalName?: string
      originalName?: string
    }
  >
> {
  const resolved = []

  for (const entity of entities) {
    const isAmbiguous = await isAmbiguousEntity(entity.name)

    if (isAmbiguous) {
      const canonicalName = createCanonicalName(
        entity.name,
        entity.type,
        entity.description
      )

      logger.info(
        { originalName: entity.name, canonicalName },
        '[Disambiguation] Resolved entity name'
      )

      resolved.push({
        ...entity,
        originalName: entity.name,
        name: canonicalName, // Use canonical name for storage
        disambiguated: true,
      })
    } else {
      resolved.push({
        ...entity,
        disambiguated: false,
      })
    }
  }

  return resolved
}

/**
 * Get all ambiguous entities in the database (for admin review)
 */
export async function getAmbiguousEntities() {
  // Find names that appear with multiple types
  const duplicates = await prisma.entity.groupBy({
    by: ['name'],
    _count: {
      id: true,
    },
    having: {
      id: {
        _count: {
          gt: 1,
        },
      },
    },
  })

  const ambiguous = []

  for (const dup of duplicates) {
    const entities = await prisma.entity.findMany({
      where: {
        name: dup.name,
      },
      select: {
        id: true,
        name: true,
        type: true,
        wikidataId: true,
        description: true,
        _count: {
          select: {
            subjectRelationships: true,
            objectRelationships: true,
            contentLinks: true,
          },
        },
      },
    })

    // Only include if they have different types or Wikidata IDs
    const uniqueTypes = new Set(entities.map((e) => e.type))
    const uniqueWikiIds = new Set(
      entities.map((e) => e.wikidataId).filter(Boolean)
    )

    if (uniqueTypes.size > 1 || uniqueWikiIds.size > 1) {
      ambiguous.push({
        name: dup.name,
        count: entities.length,
        variants: entities,
      })
    }
  }

  return ambiguous
}

/**
 * Merge duplicate entities (admin action)
 *
 * Merges targetId into keepId, updating all relationships and links
 */
export async function mergeEntities(
  keepId: string,
  targetId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.$transaction(async (tx) => {
      // Update all relationships where target is subject
      await tx.relationship.updateMany({
        where: { subjectId: targetId },
        data: { subjectId: keepId },
      })

      // Update all relationships where target is object
      await tx.relationship.updateMany({
        where: { objectId: targetId },
        data: { objectId: keepId },
      })

      // Update all content links
      await tx.contentEntity.updateMany({
        where: { entityId: targetId },
        data: { entityId: keepId },
      })

      // Delete the target entity
      await tx.entity.delete({
        where: { id: targetId },
      })
    })

    return { success: true }
  } catch (error) {
    console.error('[Disambiguation] Merge failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
