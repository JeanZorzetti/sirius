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
    type: string
    targetEntity: {
      id: string
      name: string
      type: string
      description: string | null
    }
    strength: number
  }[]
  relatedContent: {
    id: string
    title: string
    slug: string
    excerpt: string | null
  }[]
}

export interface PathNode {
  entity: {
    id: string
    name: string
    type: string
  }
  relationship?: {
    type: string
    strength: number
  }
}

export interface GraphPath {
  path: PathNode[]
  totalStrength: number
  depth: number
}

export interface ContentRecommendation {
  contentId: string
  title: string
  slug: string
  excerpt: string | null
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
        { sourceEntityId: entityId },
        { targetEntityId: entityId },
      ],
      strength: {
        gte: minStrength,
      },
    },
    include: {
      sourceEntity: {
        include: {
          contentEntities: {
            include: {
              blogPost: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  excerpt: true,
                },
              },
            },
          },
        },
      },
      targetEntity: {
        include: {
          contentEntities: {
            include: {
              blogPost: {
                select: {
                  id: true,
                  title: true,
                  slug: true,
                  excerpt: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      strength: 'desc',
    },
    take: 20,
  })

  // Build entity map
  const entityMap = new Map<string, EntityWithRelations>()

  for (const rel of directRelations) {
    const isSource = rel.sourceEntityId === entityId
    const entity = isSource ? rel.targetEntity : rel.sourceEntity
    const otherEntity = isSource ? rel.sourceEntity : rel.targetEntity

    if (!entityMap.has(entity.id)) {
      entityMap.set(entity.id, {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        description: entity.description,
        wikidataId: entity.wikidataId,
        relevanceScore: rel.strength,
        relations: [],
        relatedContent: entity.contentEntities
          .map((ce) => ce.blogPost)
          .filter((post): post is NonNullable<typeof post> => post !== null)
          .map((post) => ({
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
          })),
      })
    }

    const entityData = entityMap.get(entity.id)!
    entityData.relations.push({
      id: rel.id,
      type: rel.type,
      targetEntity: {
        id: otherEntity.id,
        name: otherEntity.name,
        type: otherEntity.type,
        description: otherEntity.description,
      },
      strength: rel.strength,
    })
  }

  // For depth > 1, fetch second-degree relationships
  if (maxDepth > 1) {
    const firstDegreeIds = Array.from(entityMap.keys())

    const secondDegreeRelations = await prisma.relationship.findMany({
      where: {
        OR: [
          { sourceEntityId: { in: firstDegreeIds } },
          { targetEntityId: { in: firstDegreeIds } },
        ],
        strength: {
          gte: minStrength * 0.8, // Slightly lower threshold for 2nd degree
        },
      },
      include: {
        sourceEntity: true,
        targetEntity: true,
      },
      orderBy: {
        strength: 'desc',
      },
      take: 30,
    })

    // Add second-degree entities with reduced relevance
    for (const rel of secondDegreeRelations) {
      const entities = [rel.sourceEntity, rel.targetEntity]
      for (const entity of entities) {
        if (!entityMap.has(entity.id) && entity.id !== entityId) {
          entityMap.set(entity.id, {
            id: entity.id,
            name: entity.name,
            type: entity.type,
            description: entity.description,
            wikidataId: entity.wikidataId,
            relevanceScore: rel.strength * 0.7, // Discount for 2nd degree
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
  const queue: { entityId: string; path: PathNode[]; strength: number }[] = [
    {
      entityId: sourceId,
      path: [],
      strength: 1.0,
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
          { sourceEntityId: current.entityId },
          { targetEntityId: current.entityId },
        ],
      },
      include: {
        sourceEntity: true,
        targetEntity: true,
      },
    })

    for (const rel of relationships) {
      const nextEntityId =
        rel.sourceEntityId === current.entityId
          ? rel.targetEntityId
          : rel.sourceEntityId
      const nextEntity =
        rel.sourceEntityId === current.entityId
          ? rel.targetEntity
          : rel.sourceEntity

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
            type: rel.type,
            strength: rel.strength,
          },
        },
      ]

      const newStrength = current.strength * rel.strength

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
        strength: newStrength,
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
  const entities = await prisma.entity.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { type: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      sourceRelationships: {
        include: {
          targetEntity: true,
        },
        orderBy: {
          strength: 'desc',
        },
        take: 5,
      },
      targetRelationships: {
        include: {
          sourceEntity: true,
        },
        orderBy: {
          strength: 'desc',
        },
        take: 5,
      },
      contentEntities: {
        include: {
          blogPost: {
            select: {
              id: true,
              title: true,
              slug: true,
              excerpt: true,
            },
          },
        },
      },
    },
    take: limit,
  })

  return entities.map((entity) => ({
    id: entity.id,
    name: entity.name,
    type: entity.type,
    description: entity.description,
    wikidataId: entity.wikidataId,
    relevanceScore: 1.0, // Could implement TF-IDF scoring here
    relations: [
      ...entity.sourceRelationships.map((rel) => ({
        id: rel.id,
        type: rel.type,
        targetEntity: {
          id: rel.targetEntity.id,
          name: rel.targetEntity.name,
          type: rel.targetEntity.type,
          description: rel.targetEntity.description,
        },
        strength: rel.strength,
      })),
      ...entity.targetRelationships.map((rel) => ({
        id: rel.id,
        type: rel.type,
        targetEntity: {
          id: rel.sourceEntity.id,
          name: rel.sourceEntity.name,
          type: rel.sourceEntity.type,
          description: rel.sourceEntity.description,
        },
        strength: rel.strength,
      })),
    ],
    relatedContent: entity.contentEntities
      .map((ce) => ce.blogPost)
      .filter((post): post is NonNullable<typeof post> => post !== null)
      .map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
      })),
  }))
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
    currentPostSlug?: string // Exclude current post
    userProblem?: string // Optional problem description
  },
  limit: number = 5
): Promise<ContentRecommendation[]> {
  const { entities = [], currentPostSlug, userProblem } = context

  if (entities.length === 0 && !userProblem) {
    // No context provided, return most connected posts
    const topPosts = await prisma.blogPost.findMany({
      include: {
        contentEntities: {
          include: {
            entity: true,
          },
        },
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return topPosts.map((post) => ({
      contentId: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      relevanceScore: 0.5,
      matchingEntities: post.contentEntities.map((ce) => ({
        name: ce.entity.name,
        type: ce.entity.type,
      })),
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

  // Find blog posts with these entities
  const posts = await prisma.blogPost.findMany({
    where: {
      slug: currentPostSlug ? { not: currentPostSlug } : undefined,
      contentEntities: {
        some: {
          entityId: {
            in: matchingEntityIds,
          },
        },
      },
    },
    include: {
      contentEntities: {
        include: {
          entity: true,
        },
      },
    },
  })

  // Calculate relevance scores
  const recommendations: ContentRecommendation[] = posts.map((post) => {
    const postEntityIds = post.contentEntities.map((ce) => ce.entity.id)
    const overlap = matchingEntityIds.filter((id) => postEntityIds.includes(id))
    const relevanceScore = overlap.length / matchingEntityIds.length

    return {
      contentId: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      relevanceScore,
      matchingEntities: post.contentEntities
        .filter((ce) => overlap.includes(ce.entity.id))
        .map((ce) => ({
          name: ce.entity.name,
          type: ce.entity.type,
        })),
      reasoning: `${overlap.length} ${overlap.length === 1 ? 'conceito relacionado' : 'conceitos relacionados'}`,
    }
  })

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
