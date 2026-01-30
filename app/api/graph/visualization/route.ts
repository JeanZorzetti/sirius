/**
 * Graph Visualization Data API
 *
 * GET /api/graph/visualization?entityId=xxx&depth=2
 * Returns graph data in D3.js compatible format.
 */

import { NextRequest, NextResponse } from 'next/server'
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
  strength: number
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
    console.error('[API /graph/visualization] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
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
      sourceRelationships: {
        where: {
          strength: {
            gte: minStrength,
          },
        },
        include: {
          targetEntity: true,
        },
      },
      targetRelationships: {
        where: {
          strength: {
            gte: minStrength,
          },
        },
        include: {
          sourceEntity: true,
        },
      },
      contentEntities: {
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
      entity.sourceRelationships.length + entity.targetRelationships.length

    nodeMap.set(entity.id, {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      group: getTypeGroup(entity.type),
      size: Math.max(5, Math.min(20, connectionCount * 2)),
      description: entity.description || undefined,
      wikidataId: entity.wikidataId || undefined,
      contentCount: entity.contentEntities.length,
    })
  }

  // Build links
  for (const entity of entities) {
    for (const rel of entity.sourceRelationships) {
      // Only add link if both nodes exist in our limited set
      if (nodeMap.has(rel.targetEntityId)) {
        links.push({
          source: entity.id,
          target: rel.targetEntityId,
          type: rel.type,
          strength: rel.strength,
          value: Math.max(1, rel.strength * 5), // Thickness
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
        sourceRelationships: {
          where: {
            strength: {
              gte: minStrength,
            },
          },
          include: {
            targetEntity: {
              include: {
                contentEntities: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
        targetRelationships: {
          where: {
            strength: {
              gte: minStrength,
            },
          },
          include: {
            sourceEntity: {
              include: {
                contentEntities: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        },
        contentEntities: {
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
        entity.sourceRelationships.length + entity.targetRelationships.length

      nodeMap.set(entity.id, {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        group: getTypeGroup(entity.type),
        size: Math.max(5, Math.min(20, 10 + connectionCount * 2)),
        description: entity.description || undefined,
        wikidataId: entity.wikidataId || undefined,
        contentCount: entity.contentEntities.length,
      })
    }

    // Process relationships
    for (const rel of entity.sourceRelationships) {
      const targetEntity = rel.targetEntity

      // Add target node
      if (!nodeMap.has(targetEntity.id)) {
        nodeMap.set(targetEntity.id, {
          id: targetEntity.id,
          name: targetEntity.name,
          type: targetEntity.type,
          group: getTypeGroup(targetEntity.type),
          size: Math.max(5, 10),
          description: targetEntity.description || undefined,
          wikidataId: targetEntity.wikidataId || undefined,
          contentCount: targetEntity.contentEntities.length,
        })
      }

      // Add link
      links.push({
        source: entity.id,
        target: targetEntity.id,
        type: rel.type,
        strength: rel.strength,
        value: Math.max(1, rel.strength * 5),
      })

      // Queue for next depth
      if (!visitedNodes.has(targetEntity.id)) {
        visitedNodes.add(targetEntity.id)
        queue.push({ id: targetEntity.id, currentDepth: currentDepth + 1 })
      }
    }

    // Process reverse relationships
    for (const rel of entity.targetRelationships) {
      const sourceEntity = rel.sourceEntity

      if (!nodeMap.has(sourceEntity.id)) {
        nodeMap.set(sourceEntity.id, {
          id: sourceEntity.id,
          name: sourceEntity.name,
          type: sourceEntity.type,
          group: getTypeGroup(sourceEntity.type),
          size: Math.max(5, 10),
          description: sourceEntity.description || undefined,
          wikidataId: sourceEntity.wikidataId || undefined,
          contentCount: sourceEntity.contentEntities.length,
        })
      }

      // Don't add duplicate links
      const linkExists = links.some(
        (l) => l.source === sourceEntity.id && l.target === entity.id
      )

      if (!linkExists && !visitedNodes.has(sourceEntity.id)) {
        visitedNodes.add(sourceEntity.id)
        queue.push({ id: sourceEntity.id, currentDepth: currentDepth + 1 })
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
