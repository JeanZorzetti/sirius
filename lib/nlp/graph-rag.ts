/**
 * Graph-Augmented RAG (Retrieval-Augmented Generation)
 *
 * Phase 4: AGI Integration
 * Combines graph traversal with semantic retrieval for enhanced context.
 */

'use server'

import { prisma } from '@/lib/prisma'
import {
  findRelatedEntities,
  searchEntitiesByContext,
  getEntityContextForPrompt,
} from './graph-queries'

// ============================================
// TYPES
// ============================================

export interface GraphRAGContext {
  userQuery: string
  extractedEntities: {
    id: string
    name: string
    type: string
    relevance: number
  }[]
  expandedEntities: {
    id: string
    name: string
    type: string
    relationshipType: string
    distance: number
  }[]
  relevantContent: {
    contentId: string
    contentType: string
    relevanceScore: number
    matchType: 'direct' | 'graph_expanded' | 'semantic'
  }[]
  contextSummary: string
}

export interface GraphRAGResponse {
  context: GraphRAGContext
  enrichedPrompt: string
  totalEntities: number
  totalContent: number
}

// ============================================
// GRAPH-AUGMENTED RETRIEVAL
// ============================================

/**
 * Retrieve context using graph traversal + semantic search
 *
 * Flow:
 * 1. Extract entities from user query
 * 2. Traverse graph to find related entities (expand context)
 * 3. Retrieve content matching both direct + expanded entities
 * 4. Rank by relevance (direct match > graph-expanded > semantic)
 */
export async function retrieveWithGraphAugmentation(
  userQuery: string,
  options: {
    maxEntities?: number // Max entities to extract (default: 5)
    graphDepth?: number // Graph traversal depth (default: 2)
    maxContent?: number // Max content pieces to return (default: 10)
    minRelevance?: number // Min relevance score (default: 0.3)
  } = {}
): Promise<GraphRAGContext> {
  const {
    maxEntities = 5,
    graphDepth = 2,
    maxContent = 10,
    minRelevance = 0.3,
  } = options

  // Step 1: Extract entities from query
  const entityContext = await getEntityContextForPrompt(userQuery, maxEntities)
  const extractedEntities = entityContext.entities.map((e) => ({
    id: e.id,
    name: e.name,
    type: e.type,
    relevance: e.relevanceScore,
  }))

  if (extractedEntities.length === 0) {
    // No entities found - return semantic search only
    return {
      userQuery,
      extractedEntities: [],
      expandedEntities: [],
      relevantContent: [],
      contextSummary: 'Nenhuma entidade identificada. Busca semântica básica.',
    }
  }

  // Step 2: Expand context via graph traversal
  const expandedEntityMap = new Map<
    string,
    {
      id: string
      name: string
      type: string
      relationshipType: string
      distance: number
    }
  >()

  for (const entity of extractedEntities) {
    const relatedEntities = await findRelatedEntities(
      entity.id,
      graphDepth,
      minRelevance
    )

    for (const related of relatedEntities) {
      if (!expandedEntityMap.has(related.id)) {
        // Infer relationship type from first relation
        const relationshipType =
          related.relations[0]?.predicate || 'related_to'
        const distance = graphDepth // Simplified - could calculate actual distance

        expandedEntityMap.set(related.id, {
          id: related.id,
          name: related.name,
          type: related.type,
          relationshipType,
          distance,
        })
      }
    }
  }

  const expandedEntities = Array.from(expandedEntityMap.values())

  // Step 3: Retrieve content
  // Combine direct entities + expanded entities
  const allEntityIds = [
    ...extractedEntities.map((e) => e.id),
    ...expandedEntities.map((e) => e.id),
  ]

  const contentLinks = await prisma.contentEntity.findMany({
    where: {
      entityId: {
        in: allEntityIds,
      },
    },
    select: {
      contentId: true,
      contentType: true,
      entityId: true,
    },
  })

  // Group by content and calculate relevance
  const contentMap = new Map<
    string,
    {
      contentId: string
      contentType: string
      matchingEntities: Set<string>
      directMatches: number
      expandedMatches: number
    }
  >()

  for (const ce of contentLinks) {
    const contentId = ce.contentId
    if (!contentMap.has(contentId)) {
      contentMap.set(contentId, {
        contentId: ce.contentId,
        contentType: ce.contentType,
        matchingEntities: new Set(),
        directMatches: 0,
        expandedMatches: 0,
      })
    }

    const content = contentMap.get(contentId)!
    content.matchingEntities.add(ce.entityId)

    // Check if direct or expanded match
    const isDirect = extractedEntities.some((e) => e.id === ce.entityId)
    if (isDirect) {
      content.directMatches++
    } else {
      content.expandedMatches++
    }
  }

  // Calculate relevance scores
  const relevantContent = Array.from(contentMap.values())
    .map((content) => {
      // Relevance formula:
      // - Direct matches: 1.0 weight per match
      // - Expanded matches: 0.5 weight per match
      // Normalized by total unique entities in query
      const score =
        (content.directMatches * 1.0 + content.expandedMatches * 0.5) /
        allEntityIds.length

      // Determine match type
      let matchType: 'direct' | 'graph_expanded' | 'semantic' = 'semantic'
      if (content.directMatches > 0) {
        matchType = 'direct'
      } else if (content.expandedMatches > 0) {
        matchType = 'graph_expanded'
      }

      return {
        contentId: content.contentId,
        contentType: content.contentType,
        relevanceScore: score,
        matchType,
      }
    })
    .filter((c) => c.relevanceScore >= minRelevance)
    .sort((a, b) => {
      // Sort: direct > graph_expanded > semantic
      // Then by relevance score
      const typeOrder = { direct: 0, graph_expanded: 1, semantic: 2 }
      if (typeOrder[a.matchType] !== typeOrder[b.matchType]) {
        return typeOrder[a.matchType] - typeOrder[b.matchType]
      }
      return b.relevanceScore - a.relevanceScore
    })
    .slice(0, maxContent)

  // Step 4: Build context summary
  const contextSummary = [
    `Entidades identificadas: ${extractedEntities.map((e) => e.name).join(', ')}`,
    expandedEntities.length > 0
      ? `Contexto expandido: +${expandedEntities.length} entidades relacionadas`
      : '',
    `${relevantContent.length} artigos relevantes encontrados`,
    relevantContent.filter((c) => c.matchType === 'direct').length > 0
      ? `${relevantContent.filter((c) => c.matchType === 'direct').length} com match direto`
      : '',
  ]
    .filter(Boolean)
    .join('. ')

  return {
    userQuery,
    extractedEntities,
    expandedEntities,
    relevantContent,
    contextSummary,
  }
}

/**
 * Build enriched prompt for LLM with graph context
 *
 * Takes user query and retrieves augmented context from graph.
 * Returns formatted prompt ready for LLM.
 */
export async function buildGraphAugmentedPrompt(
  userQuery: string,
  systemPrompt?: string
): Promise<GraphRAGResponse> {
  const context = await retrieveWithGraphAugmentation(userQuery)

  // Build enriched prompt
  let enrichedPrompt = systemPrompt
    ? `${systemPrompt}\n\n`
    : 'Você é um assistente especializado em vendas e CRM.\n\n'

  // Add graph context
  enrichedPrompt += '## Contexto do Knowledge Graph\n\n'

  if (context.extractedEntities.length > 0) {
    enrichedPrompt += '**Entidades Identificadas:**\n'
    for (const entity of context.extractedEntities) {
      enrichedPrompt += `- ${entity.name} (${entity.type})\n`
    }
    enrichedPrompt += '\n'
  }

  if (context.expandedEntities.length > 0) {
    enrichedPrompt += '**Contexto Expandido via Grafo:**\n'
    const topExpanded = context.expandedEntities.slice(0, 5)
    for (const entity of topExpanded) {
      enrichedPrompt += `- ${entity.name} (${entity.type}) via "${entity.relationshipType}"\n`
    }
    if (context.expandedEntities.length > 5) {
      enrichedPrompt += `- ... e mais ${context.expandedEntities.length - 5} entidades relacionadas\n`
    }
    enrichedPrompt += '\n'
  }

  // Add relevant content
  if (context.relevantContent.length > 0) {
    enrichedPrompt += '**Conteúdo Relevante:**\n'
    for (const content of context.relevantContent) {
      const matchBadge =
        content.matchType === 'direct'
          ? '[Match Direto]'
          : content.matchType === 'graph_expanded'
            ? '[Via Grafo]'
            : '[Semântico]'
      enrichedPrompt += `${matchBadge} ${content.contentType}: ${content.contentId}\n`
    }
  }

  // Add user query
  enrichedPrompt += `## Pergunta do Usuário\n\n${userQuery}\n\n`
  enrichedPrompt += `## Instruções\n\nResponda à pergunta do usuário usando o contexto do grafo acima. Cite artigos relevantes quando apropriado usando formato markdown [Título](/blog/slug).`

  return {
    context,
    enrichedPrompt,
    totalEntities:
      context.extractedEntities.length + context.expandedEntities.length,
    totalContent: context.relevantContent.length,
  }
}

/**
 * Query graph-augmented knowledge base
 *
 * Simplified interface for common use case:
 * User asks question → Get enriched context
 */
export async function queryGraphKnowledgeBase(
  userQuery: string
): Promise<{
  answer: string // LLM would generate this
  sources: {
    contentId: string
    contentType: string
    matchType: string
  }[]
  relatedConcepts: string[]
  contextSummary: string
}> {
  const ragResponse = await buildGraphAugmentedPrompt(userQuery)

  // Extract sources
  const sources = ragResponse.context.relevantContent.map((c) => ({
    contentId: c.contentId,
    contentType: c.contentType,
    matchType: c.matchType,
  }))

  // Extract related concepts
  const relatedConcepts = [
    ...ragResponse.context.extractedEntities.map((e) => e.name),
    ...ragResponse.context.expandedEntities.slice(0, 5).map((e) => e.name),
  ]

  return {
    answer: ragResponse.enrichedPrompt, // In production, pass to LLM
    sources,
    relatedConcepts,
    contextSummary: ragResponse.context.contextSummary,
  }
}
