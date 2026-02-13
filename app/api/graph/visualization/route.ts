/**
 * Graph Visualization Data API
 *
 * GET /api/graph/visualization?entityId=xxx&depth=2
 * Returns graph data in D3.js compatible format.
 */

import logger from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

interface D3Node {
  id: string
  name: string
  type: string
  group: number // For coloring by type
  size: number // Node size based on connections
  description?: string
  wikidataId?: string
  contentCount: number
}

interface D3Link {
  source: string
  target: string
  type: string
  confidence: number
  value: number // Link thickness
}

interface D3GraphData {
  nodes: D3Node[]
  links: D3Link[]
  stats: {
    totalNodes: number
    totalLinks: number
    maxDepth: number
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth()
  if (auth instanceof Response) return auth
  try {
    const { searchParams } = request.nextUrl
    const entityId = searchParams.get('entityId')
    const depth = parseInt(searchParams.get('depth') || '2', 10)
    const minStrength = parseFloat(searchParams.get('minStrength') || '0.3')

    // If no entityId, return full graph (limited to top entities)
    if (!entityId) {
      return await getFullGraph(minStrength)
    }

    // Return subgraph around specific entity
    return await getSubgraph(entityId, depth, minStrength)
  } catch (error) {
    logger.error({ err: error }, '[API /graph/visualization] Error')

    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Get full graph (top 100 most connected entities)
 */
async function getFullGraph(minStrength: number): Promise<NextResponse> {
  // Get top entities by connection count
  const entities = await prisma.entity.findMany({
    include: {
      subjectRelationships: {
        where: {
          confidence: {
            gte: minStrength,
          },
        },
        include: {
          object: true,
        },
      },
      objectRelationships: {
        where: {
          confidence: {
            gte: minStrength,
          },
        },
        include: {
          subject: true,
        },
      },
      contentLinks: {
        select: {
          id: true,
        },
      },
    },
    take: 100,
    orderBy: {
      createdAt: 'desc',
    },
  })

  const nodeMap = new Map<string, D3Node>()
  const links: D3Link[] = []

  // Build nodes
  for (const entity of entities) {
    const connectionCount =
      entity.subjectRelationships.length + entity.objectRelationships.length

    nodeMap.set(entity.id, {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      group: getTypeGroup(entity.type),
      size: Math.max(5, Math.min(20, connectionCount * 2)),
      description: entity.description || undefined,
      wikidataId: entity.wikidataId || undefined,
      contentCount: entity.contentLinks.length,
    })
  }

  // Build links
  for (const entity of entities) {
    for (const rel of entity.subjectRelationships) {
      // Only add link if both nodes exist in our limited set
      if (nodeMap.has(rel.objectId)) {
        links.push({
          source: entity.id,
          target: rel.objectId,
          type: rel.predicate,
          confidence: rel.confidence,
          value: Math.max(1, rel.confidence * 5), // Thickness
        })
      }
    }
  }

  const graphData: D3GraphData = {
    nodes: Array.from(nodeMap.values()),
    links,
    stats: {
      totalNodes: nodeMap.size,
      totalLinks: links.length,
      maxDepth: 1,
    },
  }

  return NextResponse.json({
    success: true,
    data: graphData,
  })
}

/**
 * Get subgraph around specific entity
 */
async function getSubgraph(
  entityId: string,
  depth: number,
  minStrength: number
): Promise<NextResponse> {
  const visitedNodes = new Set<string>([entityId])
  const nodeMap = new Map<string, D3Node>()
  const links: D3Link[] = []

  // BFS traversal
  const queue: { id: string; currentDepth: number }[] = [
    { id: entityId, currentDepth: 0 },
  ]

  while (queue.length > 0) {
    const { id, currentDepth } = queue.shift()!

    if (currentDepth >= depth) continue

    // Get entity with relationships
    const entity = await prisma.entity.findUnique({
      where: { id },
      include: {
        subjectRelationships: {
          where: {
            confidence: {
              gte: minStrength,
            },
          },
          include: {
            object: {
              include: {
                contentLinks: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
        objectRelationships: {
          where: {
            confidence: {
              gte: minStrength,
            },
          },
          include: {
            subject: {
              include: {
                contentLinks: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
        contentLinks: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!entity) continue

    // Add current node
    if (!nodeMap.has(entity.id)) {
      const connectionCount =
        entity.subjectRelationships.length + entity.objectRelationships.length

      nodeMap.set(entity.id, {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        group: getTypeGroup(entity.type),
        size: Math.max(5, Math.min(20, 10 + connectionCount * 2)),
        description: entity.description || undefined,
        wikidataId: entity.wikidataId || undefined,
        contentCount: entity.contentLinks.length,
      })
    }

    // Process relationships
    for (const rel of entity.subjectRelationships) {
      const object = rel.object

      // Add target node
      if (!nodeMap.has(object.id)) {
        nodeMap.set(object.id, {
          id: object.id,
          name: object.name,
          type: object.type,
          group: getTypeGroup(object.type),
          size: Math.max(5, 10),
          description: object.description || undefined,
          wikidataId: object.wikidataId || undefined,
          contentCount: object.contentLinks.length,
        })
      }

      // Add link
      links.push({
        source: entity.id,
        target: object.id,
        type: rel.predicate,
        confidence: rel.confidence,
        value: Math.max(1, rel.confidence * 5),
      })

      // Queue for next depth
      if (!visitedNodes.has(object.id)) {
        visitedNodes.add(object.id)
        queue.push({ id: object.id, currentDepth: currentDepth + 1 })
      }
    }

    // Process reverse relationships
    for (const rel of entity.objectRelationships) {
      const subject = rel.subject

      if (!nodeMap.has(subject.id)) {
        nodeMap.set(subject.id, {
          id: subject.id,
          name: subject.name,
          type: subject.type,
          group: getTypeGroup(subject.type),
          size: Math.max(5, 10),
          description: subject.description || undefined,
          wikidataId: subject.wikidataId || undefined,
          contentCount: subject.contentLinks.length,
        })
      }

      // Don't add duplicate links
      const linkExists = links.some(
        (l) => l.source === subject.id && l.target === entity.id
      )

      if (!linkExists && !visitedNodes.has(subject.id)) {
        visitedNodes.add(subject.id)
        queue.push({ id: subject.id, currentDepth: currentDepth + 1 })
      }
    }
  }

  const graphData: D3GraphData = {
    nodes: Array.from(nodeMap.values()),
    links,
    stats: {
      totalNodes: nodeMap.size,
      totalLinks: links.length,
      maxDepth: depth,
    },
  }

  return NextResponse.json({
    success: true,
    data: graphData,
  })
}

/**
 * Map entity type to color group
 */
function getTypeGroup(type: string): number {
  const typeMap: Record<string, number> = {
    Concept: 1,
    Technology: 2,
    Methodology: 3,
    Industry: 4,
    Role: 5,
    Product: 6,
    Service: 7,
    Process: 8,
    Problem: 9,
    Solution: 10,
  }

  return typeMap[type] || 0
}
