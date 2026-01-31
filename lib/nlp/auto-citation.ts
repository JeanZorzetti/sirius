/**
 * Auto-Citation System
 *
 * Phase 4: Agent Integration
 * Automatically enriches agent responses with citations to related blog posts.
 */

'use server'

import { recommendRelatedContent, searchEntitiesByContext } from './graph-queries'

// ============================================
// TYPES
// ============================================

export interface Citation {
  text: string // The text to be linked
  url: string // The URL to link to
  title: string // The title of the linked content
  reason: string // Why this citation is relevant
}

export interface EnrichedResponse {
  originalText: string
  enrichedText: string // Text with markdown links inserted
  citations: Citation[]
  entityMentions: {
    entity: string
    type: string
    citationCount: number
  }[]
}

// ============================================
// ENTITY EXTRACTION FROM TEXT
// ============================================

/**
 * Extract potential entity mentions from text
 *
 * Simple keyword-based extraction. Could be enhanced with NLP.
 */
function extractPotentialEntities(text: string): string[] {
  // Common sales/CRM/business terms that might be entities
  const knownTerms = [
    'CRM',
    'SPIN Selling',
    'BANT',
    'funil de vendas',
    'automação',
    'lead',
    'conversão',
    'ROI',
    'CAC',
    'LTV',
    'churn',
    'discovery',
    'qualificação',
    'objeção',
    'follow-up',
    'pipeline',
    'proposta',
    'fechamento',
    'negociação',
    'prospecção',
    'cold call',
    'email marketing',
    'WhatsApp',
    'corretor',
    'imóveis',
    'vendas',
    'representante',
    'consultor',
    'agência',
    'energia solar',
    'Salesforce',
    'HubSpot',
    'Pipedrive',
    'RD Station',
    'metodologia',
    'Sandler',
    'Challenger',
    'MEDDIC',
    'Solution Selling',
  ]

  const mentions: string[] = []
  const lowerText = text.toLowerCase()

  for (const term of knownTerms) {
    const regex = new RegExp(`\\b${term.toLowerCase()}\\b`, 'gi')
    if (regex.test(lowerText)) {
      mentions.push(term)
    }
  }

  return Array.from(new Set(mentions)) // Remove duplicates
}

// ============================================
// AUTO-CITATION ENGINE
// ============================================

/**
 * Enrich agent response with auto-citations
 *
 * Analyzes the response text, finds entity mentions, and inserts
 * markdown links to relevant blog posts.
 */
export async function enrichWithCitations(
  responseText: string,
  options: {
    maxCitations?: number // Max citations to add (default: 3)
    minRelevance?: number // Min relevance score (default: 0.5)
    excludeSlugs?: string[] // Blog posts to exclude
  } = {}
): Promise<EnrichedResponse> {
  const { maxCitations = 3, minRelevance = 0.5, excludeSlugs = [] } = options

  // Extract entity mentions
  const entityMentions = extractPotentialEntities(responseText)

  if (entityMentions.length === 0) {
    return {
      originalText: responseText,
      enrichedText: responseText,
      citations: [],
      entityMentions: [],
    }
  }

  // Get recommendations based on entity mentions
  const recommendations = await recommendRelatedContent({
    entities: entityMentions,
  })

  // Filter by relevance and exclusions
  const relevantRecommendations = recommendations
    .filter((rec) => rec.relevanceScore >= minRelevance)
    .filter((rec) => !excludeSlugs.includes(rec.contentId))
    .slice(0, maxCitations)

  if (relevantRecommendations.length === 0) {
    return {
      originalText: responseText,
      enrichedText: responseText,
      citations: [],
      entityMentions: entityMentions.map((entity) => ({
        entity,
        type: 'Unknown',
        citationCount: 0,
      })),
    }
  }

  // Build citations
  const citations: Citation[] = relevantRecommendations.map((rec) => ({
    text: rec.matchingEntities[0]?.name || rec.contentId,
    url: `/content/${rec.contentType}/${rec.contentId}`,
    title: rec.contentId,
    reason: rec.reasoning,
  }))

  // Insert citations into text
  let enrichedText = responseText

  // Strategy: Replace first mention of each entity with a link
  const linkedEntities = new Set<string>()

  for (const citation of citations) {
    const entityName = citation.text

    // Find first occurrence (case-insensitive)
    const regex = new RegExp(`\\b${entityName}\\b`, 'i')
    const match = enrichedText.match(regex)

    if (match && !linkedEntities.has(entityName.toLowerCase())) {
      const matchedText = match[0] // Preserve original case
      const link = `[${matchedText}](${citation.url})`

      enrichedText = enrichedText.replace(regex, link)
      linkedEntities.add(entityName.toLowerCase())
    }
  }

  // Count citations per entity
  const entityCitationMap = new Map<string, number>()
  for (const citation of citations) {
    for (const entity of citation.text.split(/\s+/)) {
      entityCitationMap.set(
        entity.toLowerCase(),
        (entityCitationMap.get(entity.toLowerCase()) || 0) + 1
      )
    }
  }

  return {
    originalText: responseText,
    enrichedText,
    citations,
    entityMentions: entityMentions.map((entity) => ({
      entity,
      type: 'Concept', // Could be enhanced by querying actual entity types
      citationCount: entityCitationMap.get(entity.toLowerCase()) || 0,
    })),
  }
}

/**
 * Get citation suggestions for a given context
 *
 * Returns suggested citations without modifying text.
 * Useful for showing "Related Articles" sidebars.
 */
export async function getCitationSuggestions(
  context: {
    text?: string
    entities?: string[]
    currentContentId?: string
  },
  limit: number = 5
): Promise<Citation[]> {
  const { text, entities, currentContentId } = context

  let entityList = entities || []

  if (text && entityList.length === 0) {
    entityList = extractPotentialEntities(text)
  }

  if (entityList.length === 0) {
    return []
  }

  const recommendations = await recommendRelatedContent({
    entities: entityList,
    currentContentId: currentContentId,
  })

  return recommendations.slice(0, limit).map((rec) => ({
    text: rec.contentId,
    url: `/content/${rec.contentType}/${rec.contentId}`,
    title: rec.contentId,
    reason: rec.reasoning,
  }))
}

// ============================================
// CONTEXT-AWARE RESPONSE ENRICHMENT
// ============================================

/**
 * Enrich agent response with both citations and context
 *
 * Comprehensive enrichment that adds:
 * - Inline citations to related blog posts
 * - "Learn more" section with additional resources
 * - Entity context for better understanding
 */
export async function enrichAgentResponse(params: {
  response: string
  userInput: string
  currentContext?: {
    contentId?: string
    entities?: string[]
  }
  options?: {
    includeSources?: boolean // Add "Fontes:" section (default: true)
    includeRelated?: boolean // Add "Leia também:" section (default: true)
    maxInlineCitations?: number // Max inline citations (default: 2)
    maxRelatedLinks?: number // Max related links (default: 3)
  }
}): Promise<EnrichedResponse> {
  const {
    response,
    userInput,
    currentContext = {},
    options = {},
  } = params

  const {
    includeSources = true,
    includeRelated = true,
    maxInlineCitations = 2,
    maxRelatedLinks = 3,
  } = options

  // Extract entities from both user input and response
  const userEntities = extractPotentialEntities(userInput)
  const responseEntities = extractPotentialEntities(response)
  const allEntities = Array.from(
    new Set([...userEntities, ...responseEntities, ...(currentContext.entities || [])])
  )

  // Get inline citations
  const enrichedResult = await enrichWithCitations(response, {
    maxCitations: maxInlineCitations,
    excludeSlugs: currentContext.contentId ? [currentContext.contentId] : [],
  })

  let finalText = enrichedResult.enrichedText

  // Add "Leia também:" section
  if (includeRelated) {
    const relatedSuggestions = await getCitationSuggestions(
      {
        entities: allEntities,
        currentContentId: currentContext.contentId,
      },
      maxRelatedLinks
    )

    // Filter out already cited posts
    const citedUrls = new Set(enrichedResult.citations.map((c) => c.url))
    const newSuggestions = relatedSuggestions.filter(
      (s) => !citedUrls.has(s.url)
    )

    if (newSuggestions.length > 0) {
      finalText += '\n\n**Leia também:**\n'
      for (const suggestion of newSuggestions) {
        finalText += `- [${suggestion.title}](${suggestion.url})\n`
      }

      // Add to citations
      enrichedResult.citations.push(...newSuggestions)
    }
  }

  // Add "Fontes:" section
  if (includeSources && enrichedResult.citations.length > 0) {
    const uniqueCitations = Array.from(
      new Map(enrichedResult.citations.map((c) => [c.url, c])).values()
    )

    finalText += '\n\n**Fontes:**\n'
    for (const citation of uniqueCitations) {
      finalText += `- [${citation.title}](${citation.url}) - ${citation.reason}\n`
    }
  }

  return {
    ...enrichedResult,
    enrichedText: finalText,
  }
}

/**
 * Format entity context for AI prompts
 *
 * Creates a context block to include in AI system prompts.
 */
export async function formatEntityContextForAI(
  entities: string[]
): Promise<string> {
  if (entities.length === 0) {
    return ''
  }

  const entityData = await Promise.all(
    entities.map((name) => searchEntitiesByContext(name, 1))
  )

  const flatEntities = entityData
    .flat()
    .filter((e) => e.description)
    .slice(0, 5)

  if (flatEntities.length === 0) {
    return ''
  }

  let context = '## Contexto do Grafo de Conhecimento\n\n'

  for (const entity of flatEntities) {
    context += `**${entity.name}** (${entity.type}): ${entity.description}\n`

    if (entity.relatedContent.length > 0) {
      context += `  → Conteúdo relacionado: ${entity.relatedContent.map((c) => `${c.contentType}:${c.contentId}`).join(', ')}\n`
    }
  }

  return context
}
