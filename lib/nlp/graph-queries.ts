/**
 * Knowledge Graph Query Utilities
 *
 * Phase 4: Agent Integration
 * Provides graph traversal and contextual query functions for AGI integration.
 */

'use server'

import { prisma } from '@/lib/prisma'

// ============================================
// TYPES
// ============================================

export interface EntityWithRelations {
  id: string
  name: string
  type: string
  description: string | null
  wikidataId: string | null
  relevanceScore: number
  relations: {
    id: string
    predicate: string
    object: {
      id: string
      name: string
      type: string
      description: string | null
    }
    confidence: number
  }[]
  relatedContent: {
    contentId: string
    contentType: string
  }[]
}

export interface PathNode {
  entity: {
    id: string
    name: string
    type: string
  }
  relationship?: {
    predicate: string
    confidence: number
  }
}

export interface GraphPath {
  path: PathNode[]
  totalStrength: number
  depth: number
}

export interface ContentRecommendation {
  contentId: string
  contentType: string
  relevanceScore: number
  matchingEntities: {
    name: string
    type: string
  }[]
  reasoning: string
}

// ============================================
// CORE GRAPH QUERIES
// ============================================

/**
 * Find entities related to a given entity
 *
 * @param entityId - Starting entity ID
 * @param maxDepth - Maximum traversal depth (1-3 recommended)
 * @param minStrength - Minimum relationship strength (0.0-1.0)
 * @returns Array of related entities with relationship info
 */
export async function findRelatedEntities(
  entityId: string,
  maxDepth: number = 2,
  minStrength: number = 0.3
): Promise<EntityWithRelations[]> {
  // Get direct relationships (depth 1)
  const directRelations = await prisma.relationship.findMany({
    where: {
      OR: [
        { subjectId: entityId },
        { objectId: entityId },
      ],
      confidence: {
        gte: minStrength,
      },
    },
    include: {
      subject: {
        include: {
          contentLinks: {
            select: {
              contentId: true,
              contentType: true,
            },
          },
        },
      },
      object: {
        include: {
          contentLinks: {
            select: {
              contentId: true,
              contentType: true,
            },
          },
        },
      },
    },
    orderBy: {
      confidence: 'desc',
    },
    take: 20,
  })

  // Build entity map
  const entityMap = new Map<string, EntityWithRelations>()

  for (const rel of directRelations) {
    const isSource = rel.subjectId === entityId
    const entity = isSource ? rel.object : rel.subject
    const otherEntity = isSource ? rel.subject : rel.object

    if (!entityMap.has(entity.id)) {
      entityMap.set(entity.id, {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        description: entity.description,
        wikidataId: entity.wikidataId,
        relevanceScore: rel.confidence,
        relations: [],
        relatedContent: entity.contentLinks.map((ce) => ({
          contentId: ce.contentId,
          contentType: ce.contentType,
        })),
      })
    }

    const entityData = entityMap.get(entity.id)!
    entityData.relations.push({
      id: rel.id,
      predicate: rel.predicate,
      object: {
        id: otherEntity.id,
        name: otherEntity.name,
        type: otherEntity.type,
        description: otherEntity.description,
      },
      confidence: rel.confidence,
    })
  }

  // For depth > 1, fetch second-degree relationships
  if (maxDepth > 1) {
    const firstDegreeIds = Array.from(entityMap.keys())

    const secondDegreeRelations = await prisma.relationship.findMany({
      where: {
        OR: [
          { subjectId: { in: firstDegreeIds } },
          { objectId: { in: firstDegreeIds } },
        ],
        confidence: {
          gte: minStrength * 0.8, // Slightly lower threshold for 2nd degree
        },
      },
      include: {
        subject: true,
        object: true,
      },
      orderBy: {
        confidence: 'desc',
      },
      take: 30,
    })

    // Add second-degree entities with reduced relevance
    for (const rel of secondDegreeRelations) {
      const entities = [rel.subject, rel.object]
      for (const entity of entities) {
        if (!entityMap.has(entity.id) && entity.id !== entityId) {
          entityMap.set(entity.id, {
            id: entity.id,
            name: entity.name,
            type: entity.type,
            description: entity.description,
            wikidataId: entity.wikidataId,
            relevanceScore: rel.confidence * 0.7, // Discount for 2nd degree
            relations: [],
            relatedContent: [],
          })
        }
      }
    }
  }

  return Array.from(entityMap.values()).sort(
    (a, b) => b.relevanceScore - a.relevanceScore
  )
}

/**
 * Find the shortest path between two entities
 *
 * Uses BFS to find shortest relationship path.
 * Useful for explaining connections between concepts.
 */
export async function findPathBetweenEntities(
  sourceId: string,
  targetId: string,
  maxDepth: number = 4
): Promise<GraphPath | null> {
  // BFS implementation
  const queue: { entityId: string; path: PathNode[]; confidence: number }[] = [
    {
      entityId: sourceId,
      path: [],
      confidence: 1.0,
    },
  ]

  const visited = new Set<string>([sourceId])

  while (queue.length > 0) {
    const current = queue.shift()!

    if (current.path.length >= maxDepth) {
      continue
    }

    // Get neighbors
    const relationships = await prisma.relationship.findMany({
      where: {
        OR: [
          { subjectId: current.entityId },
          { objectId: current.entityId },
        ],
      },
      include: {
        subject: true,
        object: true,
      },
    })

    for (const rel of relationships) {
      const nextEntityId =
        rel.subjectId === current.entityId
          ? rel.objectId
          : rel.subjectId
      const nextEntity =
        rel.subjectId === current.entityId
          ? rel.object
          : rel.subject

      if (visited.has(nextEntityId)) continue

      const newPath: PathNode[] = [
        ...current.path,
        {
          entity: {
            id: nextEntity.id,
            name: nextEntity.name,
            type: nextEntity.type,
          },
          relationship: {
            predicate: rel.predicate,
            confidence: rel.confidence,
          },
        },
      ]

      const newStrength = current.confidence * rel.confidence

      // Found target
      if (nextEntityId === targetId) {
        return {
          path: newPath,
          totalStrength: newStrength,
          depth: newPath.length,
        }
      }

      visited.add(nextEntityId)
      queue.push({
        entityId: nextEntityId,
        path: newPath,
        confidence: newStrength,
      })
    }
  }

  return null // No path found
}

/**
 * Search entities by name or description
 *
 * Fuzzy search with relevance scoring.
 */
export async function searchEntitiesByContext(
  query: string,
  limit: number = 10
): Promise<EntityWithRelations[]> {
  // Extract meaningful keywords from query (filter stopwords and short words)
  const stopwords = ['como', 'para', 'com', 'uma', 'que', 'por', 'mais', 'dos', 'das', 'nos', 'nas', 'o', 'a', 'de', 'do', 'da', 'em', 'no', 'na', 'os', 'as']
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopwords.includes(word))

  // Build OR conditions for each keyword
  type SearchCondition =
    | { name: { contains: string; mode: 'insensitive' } }
    | { description: { contains: string; mode: 'insensitive' } }
    | { type: { contains: string; mode: 'insensitive' } }

  const searchConditions: SearchCondition[] = keywords.flatMap((keyword) => [
    { name: { contains: keyword, mode: 'insensitive' as const } },
    { description: { contains: keyword, mode: 'insensitive' as const } },
  ])

  // If no keywords found, fallback to original query
  if (searchConditions.length === 0) {
    searchConditions.push(
      { name: { contains: query, mode: 'insensitive' as const } },
      { description: { contains: query, mode: 'insensitive' as const } },
      { type: { contains: query, mode: 'insensitive' as const } }
    )
  }

  const entities = await prisma.entity.findMany({
    where: {
      OR: searchConditions,
    },
    include: {
      subjectRelationships: {
        include: {
          object: true,
        },
        orderBy: {
          confidence: 'desc',
        },
        take: 5,
      },
      objectRelationships: {
        include: {
          subject: true,
        },
        orderBy: {
          confidence: 'desc',
        },
        take: 5,
      },
      contentLinks: {
        select: {
          contentId: true,
          contentType: true,
        },
      },
    },
    take: limit,
  })

  return entities.map((entity) => {
    // Calculate relevance score based on keyword matches
    const entityText = `${entity.name} ${entity.description || ''}`.toLowerCase()
    const matchedKeywords = keywords.filter((kw) => entityText.includes(kw))
    const relevanceScore = keywords.length > 0
      ? matchedKeywords.length / keywords.length
      : 1.0

    return {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      description: entity.description,
      wikidataId: entity.wikidataId,
      relevanceScore,
      relations: [
      ...entity.subjectRelationships.map((rel) => ({
        id: rel.id,
        predicate: rel.predicate,
        object: {
          id: rel.object.id,
          name: rel.object.name,
          type: rel.object.type,
          description: rel.object.description,
        },
        confidence: rel.confidence,
      })),
      ...entity.objectRelationships.map((rel) => ({
        id: rel.id,
        predicate: rel.predicate,
        object: {
          id: rel.subject.id,
          name: rel.subject.name,
          type: rel.subject.type,
          description: rel.subject.description,
        },
        confidence: rel.confidence,
      })),
    ],
    relatedContent: entity.contentLinks.map((ce) => ({
      contentId: ce.contentId,
      contentType: ce.contentType,
    })),
  }
  }).sort((a, b) => b.relevanceScore - a.relevanceScore) // Sort by relevance
}

// ============================================
// CONTENT RECOMMENDATION
// ============================================

/**
 * Recommend related blog posts based on entity overlap
 *
 * Analyzes which blog posts share entities with a given context
 * and ranks them by semantic similarity.
 */
export async function recommendRelatedContent(
  context: {
    entities?: string[] // Entity names mentioned in context
    currentContentId?: string // Exclude current content
    userProblem?: string // Optional problem description
  },
  limit: number = 5
): Promise<ContentRecommendation[]> {
  const { entities = [], currentContentId, userProblem } = context

  if (entities.length === 0 && !userProblem) {
    // No context provided, return most recent content with entities
    const recentContent = await prisma.contentEntity.findMany({
      include: {
        entity: true,
      },
      take: limit * 2,
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Group by contentId
    const contentMap = new Map<string, { contentType: string; entities: { name: string; type: string }[] }>()
    for (const ce of recentContent) {
      if (!contentMap.has(ce.contentId)) {
        contentMap.set(ce.contentId, { contentType: ce.contentType, entities: [] })
      }
      contentMap.get(ce.contentId)!.entities.push({
        name: ce.entity.name,
        type: ce.entity.type,
      })
    }

    return Array.from(contentMap.entries())
      .slice(0, limit)
      .map(([contentId, data]) => ({
        contentId,
        contentType: data.contentType,
        relevanceScore: 0.5,
        matchingEntities: data.entities,
        reasoning: 'Conteúdo recente',
      }))
  }

  // Find entities matching context
  const matchingEntities = await prisma.entity.findMany({
    where: {
      name: {
        in: entities.map((e) => e.toLowerCase()),
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      name: true,
      type: true,
    },
  })

  if (matchingEntities.length === 0) {
    return []
  }

  const matchingEntityIds = matchingEntities.map((e) => e.id)

  // Find content with these entities
  const contentEntities = await prisma.contentEntity.findMany({
    where: {
      contentId: currentContentId ? { not: currentContentId } : undefined,
      entityId: {
        in: matchingEntityIds,
      },
    },
    include: {
      entity: true,
    },
  })

  // Group by contentId and calculate relevance
  const contentMap = new Map<string, {
    contentType: string
    matchingEntityIds: Set<string>
    entities: { name: string; type: string }[]
  }>()

  for (const ce of contentEntities) {
    if (!contentMap.has(ce.contentId)) {
      contentMap.set(ce.contentId, {
        contentType: ce.contentType,
        matchingEntityIds: new Set(),
        entities: [],
      })
    }
    const content = contentMap.get(ce.contentId)!
    content.matchingEntityIds.add(ce.entityId)
    content.entities.push({
      name: ce.entity.name,
      type: ce.entity.type,
    })
  }

  // Calculate relevance scores
  const recommendations: ContentRecommendation[] = Array.from(contentMap.entries()).map(
    ([contentId, data]) => {
      const overlapCount = data.matchingEntityIds.size
      const relevanceScore = overlapCount / matchingEntityIds.length

      return {
        contentId,
        contentType: data.contentType,
        relevanceScore,
        matchingEntities: data.entities,
        reasoning: `${overlapCount} ${overlapCount === 1 ? 'conceito relacionado' : 'conceitos relacionados'}`,
      }
    }
  )

  return recommendations
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit)
}

/**
 * Get entity context for AGI prompts
 *
 * Extracts entities from user input and returns enriched context
 * for inclusion in AI prompts.
 */
export async function getEntityContextForPrompt(
  userInput: string,
  maxEntities: number = 5
): Promise<{
  entities: EntityWithRelations[]
  suggestedContent: ContentRecommendation[]
  contextSummary: string
}> {
  // Extract potential entity mentions (simple keyword matching)
  const words = userInput
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)

  // Search for matching entities
  const entities = await searchEntitiesByContext(userInput, maxEntities)

  // Get content recommendations
  const suggestedContent = await recommendRelatedContent({
    entities: entities.map((e) => e.name),
  })

  // Build context summary
  const contextSummary = entities.length > 0
    ? `Contexto identificado: ${entities.map((e) => e.name).join(', ')}. ` +
      `${suggestedContent.length} artigos relacionados disponíveis.`
    : 'Nenhum contexto específico identificado no grafo.'

  return {
    entities,
    suggestedContent,
    contextSummary,
  }
}

// ============================================
// DIAGNOSTIC QUERIES
// ============================================

/**
 * Diagnose a problem and find solutions using graph traversal
 *
 * Example: "alta latência de resposta" → traverse graph to find
 * related problems, solutions, and evidence.
 */
export async function diagnoseWithGraph(problem: string): Promise<{
  problemEntities: EntityWithRelations[]
  solutions: {
    entity: EntityWithRelations
    path: GraphPath
    evidence: ContentRecommendation[]
  }[]
  diagnosis: string
}> {
  // Find entities related to the problem
  const problemEntities = await searchEntitiesByContext(problem, 3)

  if (problemEntities.length === 0) {
    return {
      problemEntities: [],
      solutions: [],
      diagnosis: 'Problema não reconhecido no grafo de conhecimento.',
    }
  }

  // Find solution-type entities
  const allSolutions: {
    entity: EntityWithRelations
    path: GraphPath
    evidence: ContentRecommendation[]
  }[] = []

  for (const problemEntity of problemEntities) {
    // Get related entities that might be solutions
    const relatedEntities = await findRelatedEntities(problemEntity.id, 2, 0.4)

    // Filter for solution-type entities
    const solutionCandidates = relatedEntities.filter(
      (e) =>
        e.type === 'Technology' ||
        e.type === 'Methodology' ||
        e.type === 'Product' ||
        e.type === 'Service'
    )

    for (const solution of solutionCandidates) {
      // Find path from problem to solution
      const path = await findPathBetweenEntities(problemEntity.id, solution.id, 3)

      if (path) {
        // Find evidence (blog posts mentioning the solution)
        const evidence = await recommendRelatedContent({
          entities: [solution.name],
        })

        allSolutions.push({
          entity: solution,
          path,
          evidence,
        })
      }
    }
  }

  // Sort solutions by path strength and evidence
  allSolutions.sort((a, b) => {
    const scoreA = a.path.totalStrength * (1 + a.evidence.length * 0.2)
    const scoreB = b.path.totalStrength * (1 + b.evidence.length * 0.2)
    return scoreB - scoreA
  })

  const diagnosis =
    allSolutions.length > 0
      ? `Identificados ${allSolutions.length} caminhos de solução para "${problem}". ` +
        `Solução principal: ${allSolutions[0].entity.name}.`
      : `Problema "${problem}" identificado, mas nenhuma solução catalogada no grafo.`

  return {
    problemEntities,
    solutions: allSolutions.slice(0, 5),
    diagnosis,
  }
}
