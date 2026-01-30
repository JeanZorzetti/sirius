/**
 * NLP Pipeline - Types & Schemas
 *
 * Defines TypeScript types and Zod schemas for entity extraction via LLMs.
 */

import { z } from 'zod'

/**
 * Entity Extraction Result
 */
export const EntitySchema = z.object({
  name: z.string().describe('Entity name (ex: "CRM", "SPIN Selling")'),
  type: z
    .enum([
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
    .describe('Entity category'),
  wikidataId: z
    .string()
    .nullish()
    .describe('Wikidata Q-code if known (ex: "Q16635046")'),
  description: z.string().nullish().describe('Brief entity description'),
  aliases: z.array(z.string()).nullish().describe('Alternative names/synonyms'),
  relevance: z
    .number()
    .min(0)
    .max(1)
    .describe('How relevant is this entity to the content (0-1)'),
  context: z
    .string()
    .nullish()
    .describe('Sentence/paragraph where entity was mentioned'),
})

export type ExtractedEntity = z.infer<typeof EntitySchema>

/**
 * Relationship Extraction Result (RDF Triple)
 */
export const RelationshipSchema = z.object({
  subject: z.string().describe('Subject entity name'),
  predicate: z
    .enum([
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
    .describe('Relationship type'),
  object: z.string().describe('Object entity name'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .default(0.8)
    .describe('Confidence level of this relationship (0-1)'),
  source: z.string().nullish().describe('Context/sentence that implies this relationship'),
})

export type ExtractedRelationship = z.infer<typeof RelationshipSchema>

/**
 * Complete Extraction Result
 */
export const ExtractionResultSchema = z.object({
  entities: z.array(EntitySchema).describe('List of extracted entities'),
  relationships: z
    .array(RelationshipSchema)
    .describe('List of extracted relationships between entities'),
  summary: z
    .string()
    .nullish()
    .describe('Brief summary of main topics covered in the text'),
})

export type ExtractionResult = z.infer<typeof ExtractionResultSchema>

/**
 * Extraction Request Parameters
 */
export interface ExtractionRequest {
  text: string // Content to process
  contentType?: string // blog_post, documentation, help_article, etc.
  contentId?: string // Optional content identifier
  contentUrl?: string // Optional content URL
  maxTokens?: number // Max tokens for LLM response
  temperature?: number // LLM temperature (0-1)
}

/**
 * Extraction Response
 */
export interface ExtractionResponse {
  success: boolean
  data?: ExtractionResult
  extractionId?: string // Database ID of EntityExtraction record
  tokensUsed?: number
  processingTimeMs?: number
  error?: string
}

/**
 * Known Wikidata Entities Registry
 *
 * Pre-populated lookup table for common entities (from schema-generator.ts).
 * Used to enrich LLM extractions with Wikidata IDs.
 */
export const WIKIDATA_LOOKUP: Record<string, string> = {
  // Methodologies
  'SPIN Selling': 'Q7570944',
  'Challenger Sale': 'Q28865486',
  'Consultative Selling': 'Q5163809',
  'Solution Selling': 'Q7559359',
  'Sandler Selling': 'Q7416173',

  // Technology
  CRM: 'Q16635046',
  'Customer Relationship Management': 'Q177777',
  'Software as a Service': 'Q1172284',
  SaaS: 'Q1172284',
  'Artificial Intelligence': 'Q11660',
  AI: 'Q11660',
  'Machine Learning': 'Q2539',
  'Natural Language Processing': 'Q30642',
  NLP: 'Q30642',
  Chatbot: 'Q171713',
  Automation: 'Q193292',

  // Stack
  TypeScript: 'Q2334976',
  JavaScript: 'Q2005',
  React: 'Q19399674',
  'Next.js': 'Q110476280',
  'Node.js': 'Q756100',
  PostgreSQL: 'Q192490',

  // Business
  Sales: 'Q184753',
  Marketing: 'Q39809',
  'Lead Generation': 'Q1139696',
  'Sales Funnel': 'Q7405825',
  'Sales Pipeline': 'Q7196563',
  'Conversion Rate': 'Q5166551',
  ROI: 'Q1052397',
  KPI: 'Q604025',

  // Geography
  Brazil: 'Q155',
  'São Paulo': 'Q174',
  'Rio de Janeiro': 'Q8678',

  // Industries
  'Real Estate': 'Q891723',
  'Solar Energy': 'Q47512',
  Insurance: 'Q43183',
  Consulting: 'Q4185496',
  Healthcare: 'Q31207',
  Education: 'Q8434',

  // Personas
  'Sales Representative': 'Q7406035',
  'Sales Manager': 'Q7406029',
  Entrepreneur: 'Q131524',
  CEO: 'Q484876',

  // Tools
  WhatsApp: 'Q301053',
  Slack: 'Q17059452',
  Zoom: 'Q19844930',
  Zapier: 'Q8065480',

  // Concepts
  Kanban: 'Q747892',
  Agile: 'Q291043',
  Scrum: 'Q207909',
  MVP: 'Q1154697',
}

/**
 * Enriches an extracted entity with Wikidata ID if found in lookup
 */
export function enrichEntityWithWikidata(
  entity: ExtractedEntity
): ExtractedEntity {
  if (!entity.wikidataId) {
    // Try exact match
    let wikidataId = WIKIDATA_LOOKUP[entity.name]

    // Try case-insensitive match
    if (!wikidataId) {
      const lowerName = entity.name.toLowerCase()
      const matchKey = Object.keys(WIKIDATA_LOOKUP).find(
        (key) => key.toLowerCase() === lowerName
      )
      if (matchKey) {
        wikidataId = WIKIDATA_LOOKUP[matchKey]
      }
    }

    if (wikidataId) {
      return { ...entity, wikidataId }
    }
  }

  return entity
}
