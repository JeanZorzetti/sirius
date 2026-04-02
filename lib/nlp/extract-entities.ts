/**
 * NLP Pipeline - Entity Extraction via Groq LLM
 *
 * Uses Groq's ultra-fast inference to extract entities and relationships from text.
 * Leverages JSON mode for structured output validated by Zod schemas.
 */

import Groq from 'groq-sdk'
import {
  ExtractionRequest,
  ExtractionResult,
  ExtractionResultSchema,
  enrichEntityWithWikidata,
} from './types'
import logger from '@/lib/logger'

/**
 * Lazy Groq client — instantiated on first use to avoid build-time errors
 */
let _groq: Groq | null = null
function getGroq(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _groq
}

/**
 * System prompt for entity extraction
 */
const EXTRACTION_SYSTEM_PROMPT = `You are an expert knowledge graph engineer specializing in entity extraction and semantic analysis for CRM and sales content.

Your task is to analyze text and extract:
1. **Entities**: Concepts, technologies, methodologies, personas, industries, metrics, processes, tools, or geographic locations mentioned in the text.
2. **Relationships**: Semantic connections between entities (e.g., "SPIN Selling uses CRM", "Sales Representative uses SPIN Selling").

Guidelines:
- Focus on business, sales, technology, and domain-specific entities
- Extract only entities explicitly mentioned or strongly implied in the text
- Assign relevance scores (0-1) based on how central the entity is to the content
- Identify relationships that are clearly stated or logically inferred
- Use standard relationship predicates: uses, usedBy, subclassOf, instanceOf, partOf, enables, solves, relatedTo, etc.
- If you recognize a Wikidata Q-code for an entity, include it (e.g., CRM = Q16635046)

Output format: JSON object with "entities" and "relationships" arrays.`

/**
 * Valid entity types and relationship predicates
 */
const VALID_ENTITY_TYPES = new Set([
  'methodology',
  'technology',
  'industry',
  'persona',
  'metric',
  'process',
  'tool',
  'concept',
  'geography',
  'other',
])

const VALID_PREDICATES = new Set([
  'uses',
  'usedBy',
  'usedIn',
  'subclassOf',
  'instanceOf',
  'partOf',
  'enables',
  'solves',
  'relatedTo',
  'prerequisiteOf',
  'practicedBy',
  'requiresSkill',
  'locatedIn',
  'operatesIn',
  'servesIndustry',
  'popularIn',
])

/**
 * Sanitize extraction data by mapping invalid types/predicates to fallbacks
 */
function sanitizeExtractionData(data: any): any {
  const sanitized = { ...data }

  // Sanitize entities
  if (Array.isArray(sanitized.entities)) {
    sanitized.entities = sanitized.entities.map((entity: any) => {
      const sanitizedEntity = { ...entity }

      // Map invalid entity types to 'other'
      if (sanitizedEntity.type && !VALID_ENTITY_TYPES.has(sanitizedEntity.type)) {
        logger.warn(
          { entityType: sanitizedEntity.type, entityName: sanitizedEntity.name },
          '[NLP] Invalid entity type, mapping to "other"'
        )
        sanitizedEntity.type = 'other'
      }

      return sanitizedEntity
    })
  }

  // Sanitize relationships
  if (Array.isArray(sanitized.relationships)) {
    sanitized.relationships = sanitized.relationships.map((rel: any) => {
      const sanitizedRel = { ...rel }

      // Map invalid predicates to 'relatedTo'
      if (sanitizedRel.predicate && !VALID_PREDICATES.has(sanitizedRel.predicate)) {
        logger.warn(
          { predicate: sanitizedRel.predicate, subject: sanitizedRel.subject, object: sanitizedRel.object },
          '[NLP] Invalid predicate, mapping to "relatedTo"'
        )
        sanitizedRel.predicate = 'relatedTo'
      }

      return sanitizedRel
    })
  }

  return sanitized
}

/**
 * Build user prompt for entity extraction
 */
function buildExtractionPrompt(text: string): string {
  // Truncate text if too long (max ~4000 tokens = ~16000 chars)
  const maxChars = 16000
  const truncatedText = text.length > maxChars ? text.slice(0, maxChars) + '...' : text

  return `Analyze the following text and extract all relevant entities and relationships:

---
${truncatedText}
---

Return a JSON object with:
- "entities": Array of {name, type, wikidataId?, description?, aliases?, relevance, context?}
- "relationships": Array of {subject, predicate, object, confidence, source?}
- "summary": Brief summary of main topics (optional)

Entity types: methodology, technology, industry, persona, metric, process, tool, concept, geography, other

Relationship predicates: uses, usedBy, usedIn, subclassOf, instanceOf, partOf, enables, solves, relatedTo, prerequisiteOf, practicedBy, requiresSkill, locatedIn, operatesIn, servesIndustry, popularIn

Be thorough but precise. Focus on entities and relationships that add semantic value to a knowledge graph.`
}

/**
 * Extract entities and relationships from text using Groq LLM
 */
export async function extractEntities(
  request: ExtractionRequest
): Promise<ExtractionResult> {
  const startTime = Date.now()

  try {
    const {
      text,
      maxTokens = 4096,
      temperature = 0.3, // Low temperature for more deterministic extraction
    } = request

    // Call Groq API with JSON mode
    const completion = await getGroq().chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Fast and high-quality
      messages: [
        {
          role: 'system',
          content: EXTRACTION_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: buildExtractionPrompt(text),
        },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' }, // Force JSON output
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from Groq API')
    }

    // Parse and validate JSON response
    const rawData = JSON.parse(responseText)

    // Sanitize data before validation (map invalid types/predicates to fallbacks)
    const sanitizedData = sanitizeExtractionData(rawData)

    const validatedData = ExtractionResultSchema.parse(sanitizedData)

    // Enrich entities with Wikidata IDs from our lookup table
    const enrichedEntities = validatedData.entities.map(enrichEntityWithWikidata)

    const result: ExtractionResult = {
      ...validatedData,
      entities: enrichedEntities,
    }

    const processingTime = Date.now() - startTime

    // Log extraction stats
    logger.info(
      { entities: result.entities.length, relationships: result.relationships.length, processingTimeMs: processingTime, tokensUsed: completion.usage?.total_tokens ?? null },
      '[NLP] Extraction complete'
    )

    return result
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('[NLP] Entity extraction failed:', error)

    // Return empty result on error
    return {
      entities: [],
      relationships: [],
      summary: `Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

/**
 * Extract entities from multiple text chunks (for long documents)
 */
export async function extractEntitiesBatch(
  texts: string[],
  baseRequest: Omit<ExtractionRequest, 'text'> = {}
): Promise<ExtractionResult> {
  const results = await Promise.all(
    texts.map((text) => extractEntities({ ...baseRequest, text }))
  )

  // Merge results
  const allEntities = results.flatMap((r) => r.entities)
  const allRelationships = results.flatMap((r) => r.relationships)

  // Deduplicate entities by name
  const uniqueEntities = Array.from(
    new Map(allEntities.map((e) => [e.name.toLowerCase(), e])).values()
  )

  // Deduplicate relationships by triple
  const uniqueRelationships = Array.from(
    new Map(
      allRelationships.map((r) => [
        `${r.subject}-${r.predicate}-${r.object}`.toLowerCase(),
        r,
      ])
    ).values()
  )

  return {
    entities: uniqueEntities,
    relationships: uniqueRelationships,
    summary: results.map((r) => r.summary).filter(Boolean).join(' | '),
  }
}
