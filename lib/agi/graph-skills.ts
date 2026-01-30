/**
 * AGI Sirius - Graph-Augmented Skills
 *
 * Phase 4: Knowledge Graph Integration
 * Skills that leverage the knowledge graph for contextual understanding.
 */

'use server'

import {
  diagnoseWithGraph,
  getEntityContextForPrompt,
  findRelatedEntities,
  recommendRelatedContent,
} from '@/lib/nlp/graph-queries'
import {
  enrichAgentResponse,
  getCitationSuggestions,
} from '@/lib/nlp/auto-citation'

// ============================================
// TYPES
// ============================================

export interface GraphDiagnosisResult {
  problem: string
  diagnosis: string
  solutions: {
    name: string
    description: string | null
    confidence: number
    evidence: {
      title: string
      url: string
    }[]
  }[]
  relatedConcepts: {
    name: string
    type: string
    relationship: string
  }[]
}

export interface ContextualRecommendation {
  recommendations: {
    title: string
    url: string
    reason: string
    relevance: number
  }[]
  context: string
  entityCount: number
}

export interface EnrichedAgentResponse {
  response: string
  citations: {
    title: string
    url: string
    reason: string
  }[]
  entities: string[]
}

// ============================================
// SKILL: Graph-Based Problem Diagnosis
// ============================================

/**
 * Diagnose a business problem using knowledge graph traversal
 *
 * Example:
 * - Input: "Meu time demora 24h para responder leads"
 * - Output: Diagnosis with solutions, evidence, and related concepts
 */
export async function diagnosticarComGrafo(
  problemDescription: string
): Promise<GraphDiagnosisResult> {
  const result = await diagnoseWithGraph(problemDescription)

  return {
    problem: problemDescription,
    diagnosis: result.diagnosis,
    solutions: result.solutions.map((sol) => ({
      name: sol.entity.name,
      description: sol.entity.description,
      confidence: sol.path.totalStrength,
      evidence: sol.evidence.map((ev) => ({
        title: ev.title,
        url: `/blog/${ev.slug}`,
      })),
    })),
    relatedConcepts: result.problemEntities.flatMap((pe) =>
      pe.relations.map((rel) => ({
        name: rel.targetEntity.name,
        type: rel.targetEntity.type,
        relationship: rel.type,
      }))
    ),
  }
}

// ============================================
// SKILL: Contextual Content Recommendation
// ============================================

/**
 * Recommend relevant content based on conversation context
 *
 * Analyzes user input and conversation history to suggest
 * relevant blog posts from the knowledge graph.
 */
export async function recomendarConteudo(params: {
  userInput: string
  conversationHistory?: string[]
  currentTopic?: string
}): Promise<ContextualRecommendation> {
  const { userInput, conversationHistory = [], currentTopic } = params

  // Combine all context
  const fullContext = [
    currentTopic || '',
    ...conversationHistory,
    userInput,
  ].join(' ')

  // Get entity context
  const entityContext = await getEntityContextForPrompt(fullContext, 10)

  // Get recommendations
  const entityNames = entityContext.entities.map((e) => e.name)
  const recommendations = await recommendRelatedContent({
    entities: entityNames,
  })

  return {
    recommendations: recommendations.map((rec) => ({
      title: rec.title,
      url: `/blog/${rec.slug}`,
      reason: rec.reasoning,
      relevance: rec.relevanceScore,
    })),
    context: entityContext.contextSummary,
    entityCount: entityContext.entities.length,
  }
}

// ============================================
// SKILL: Enrich Response with Citations
// ============================================

/**
 * Automatically enrich agent response with citations
 *
 * Takes a raw agent response and adds:
 * - Inline citations to relevant blog posts
 * - "Leia também" section with additional resources
 * - Source attribution
 */
export async function enriquecerRespostaComCitacoes(params: {
  response: string
  userInput: string
  includeSources?: boolean
  includeRelated?: boolean
}): Promise<EnrichedAgentResponse> {
  const {
    response,
    userInput,
    includeSources = true,
    includeRelated = true,
  } = params

  const enriched = await enrichAgentResponse({
    response,
    userInput,
    options: {
      includeSources,
      includeRelated,
      maxInlineCitations: 2,
      maxRelatedLinks: 3,
    },
  })

  return {
    response: enriched.enrichedText,
    citations: enriched.citations.map((c) => ({
      title: c.title,
      url: c.url,
      reason: c.reason,
    })),
    entities: enriched.entityMentions.map((e) => e.entity),
  }
}

// ============================================
// SKILL: Explain Relationship Between Concepts
// ============================================

/**
 * Explain how two concepts are related using graph traversal
 *
 * Example:
 * - Input: "CRM", "conversão"
 * - Output: "CRM está relacionado a conversão através de: CRM → automação → follow-up rápido → conversão"
 */
export async function explicarRelacionamento(
  concept1: string,
  concept2: string
): Promise<{
  explanation: string
  path: {
    from: string
    relationship: string
    to: string
  }[]
  strength: number
}> {
  // Search for entities
  const [entities1, entities2] = await Promise.all([
    getEntityContextForPrompt(concept1, 1),
    getEntityContextForPrompt(concept2, 1),
  ])

  if (entities1.entities.length === 0 || entities2.entities.length === 0) {
    return {
      explanation: `Não foi possível encontrar "${concept1}" ou "${concept2}" no grafo de conhecimento.`,
      path: [],
      strength: 0,
    }
  }

  // Find path between entities
  const entity1 = entities1.entities[0]
  const entity2 = entities2.entities[0]

  // Get related entities for both
  const [related1, related2] = await Promise.all([
    findRelatedEntities(entity1.id, 2),
    findRelatedEntities(entity2.id, 2),
  ])

  // Find common entities
  const commonIds = related1
    .map((e) => e.id)
    .filter((id) => related2.some((e2) => e2.id === id))

  if (commonIds.length === 0) {
    return {
      explanation: `"${concept1}" e "${concept2}" não possuem relacionamentos diretos no grafo.`,
      path: [],
      strength: 0,
    }
  }

  // Build explanation path
  const commonEntity = related1.find((e) => e.id === commonIds[0])!

  const relation1 = entity1.relations.find(
    (r) => r.targetEntity.id === commonEntity.id
  )
  const relation2 = entity2.relations.find(
    (r) => r.targetEntity.id === commonEntity.id
  )

  const path = [
    {
      from: entity1.name,
      relationship: relation1?.type || 'relacionado_a',
      to: commonEntity.name,
    },
    {
      from: commonEntity.name,
      relationship: relation2?.type || 'relacionado_a',
      to: entity2.name,
    },
  ]

  const strength =
    ((relation1?.strength || 0.5) + (relation2?.strength || 0.5)) / 2

  const explanation = `"${entity1.name}" está relacionado a "${entity2.name}" através de "${commonEntity.name}". ` +
    `O caminho é: ${entity1.name} → ${commonEntity.name} → ${entity2.name}.`

  return {
    explanation,
    path,
    strength,
  }
}

// ============================================
// SKILL: Get Learning Path for Topic
// ============================================

/**
 * Generate a learning path for a topic using graph relationships
 *
 * Example:
 * - Input: "SPIN Selling"
 * - Output: [Fundamentos de Vendas] → [Discovery] → [SPIN Selling] → [Técnicas Avançadas]
 */
export async function gerarCaminhoAprendizado(
  topic: string
): Promise<{
  learningPath: {
    step: number
    topic: string
    type: string
    resources: {
      title: string
      url: string
    }[]
  }[]
  estimatedReadingTime: number
}> {
  // Get entity context
  const entityContext = await getEntityContextForPrompt(topic, 1)

  if (entityContext.entities.length === 0) {
    return {
      learningPath: [],
      estimatedReadingTime: 0,
    }
  }

  const mainEntity = entityContext.entities[0]

  // Get related entities with different relationship types
  const relatedEntities = await findRelatedEntities(mainEntity.id, 2, 0.3)

  // Group by type and relationship
  const prerequisites = relatedEntities.filter((e) =>
    e.relations.some((r) => r.type === 'requires' || r.type === 'prerequisite_of')
  )

  const advanced = relatedEntities.filter((e) =>
    e.relations.some((r) => r.type === 'enables' || r.type === 'leads_to')
  )

  const related = relatedEntities.filter(
    (e) =>
      !prerequisites.includes(e) &&
      !advanced.includes(e) &&
      e.relatedContent.length > 0
  )

  // Build learning path
  const learningPath: {
    step: number
    topic: string
    type: string
    resources: { title: string; url: string }[]
  }[] = []

  let step = 1

  // Prerequisites
  for (const entity of prerequisites.slice(0, 2)) {
    learningPath.push({
      step: step++,
      topic: entity.name,
      type: entity.type,
      resources: entity.relatedContent.map((c) => ({
        title: c.title,
        url: `/blog/${c.slug}`,
      })),
    })
  }

  // Main topic
  learningPath.push({
    step: step++,
    topic: mainEntity.name,
    type: mainEntity.type,
    resources: mainEntity.relatedContent.map((c) => ({
      title: c.title,
      url: `/blog/${c.slug}`,
    })),
  })

  // Related topics
  for (const entity of related.slice(0, 2)) {
    learningPath.push({
      step: step++,
      topic: entity.name,
      type: entity.type,
      resources: entity.relatedContent.map((c) => ({
        title: c.title,
        url: `/blog/${c.slug}`,
      })),
    })
  }

  // Advanced topics
  for (const entity of advanced.slice(0, 2)) {
    learningPath.push({
      step: step++,
      topic: entity.name,
      type: entity.type,
      resources: entity.relatedContent.map((c) => ({
        title: c.title,
        url: `/blog/${c.slug}`,
      })),
    })
  }

  // Estimate reading time (10 min per resource)
  const totalResources = learningPath.reduce(
    (sum, item) => sum + item.resources.length,
    0
  )
  const estimatedReadingTime = totalResources * 10

  return {
    learningPath,
    estimatedReadingTime,
  }
}

// ============================================
// SKILL REGISTRY
// ============================================

export interface GraphSkillDefinition {
  name: string
  description: string
  execute: (...args: any[]) => Promise<any>
  tags: string[]
  examples: string[]
}

export const GRAPH_SKILLS: Record<string, GraphSkillDefinition> = {
  diagnosticar_problema: {
    name: 'diagnosticar_problema',
    description: 'Diagnostica problema de negócio usando grafo de conhecimento',
    execute: diagnosticarComGrafo,
    tags: ['grafo', 'diagnostico', 'solucoes'],
    examples: [
      'Meu time demora 24h para responder leads',
      'Tenho alta taxa de churn',
      'Conversão está baixa',
    ],
  },

  recomendar_conteudo: {
    name: 'recomendar_conteudo',
    description: 'Recomenda conteúdo relevante baseado em contexto',
    execute: recomendarConteudo,
    tags: ['grafo', 'recomendacao', 'conteudo'],
    examples: [
      'Quero aprender sobre SPIN Selling',
      'Como melhorar qualificação de leads',
    ],
  },

  enriquecer_resposta: {
    name: 'enriquecer_resposta',
    description: 'Enriquece resposta com citações automáticas',
    execute: enriquecerRespostaComCitacoes,
    tags: ['grafo', 'citacoes', 'enriquecimento'],
    examples: [],
  },

  explicar_relacionamento: {
    name: 'explicar_relacionamento',
    description: 'Explica relacionamento entre dois conceitos',
    execute: explicarRelacionamento,
    tags: ['grafo', 'relacionamentos', 'explicacao'],
    examples: ['Como CRM se relaciona com conversão?'],
  },

  gerar_caminho_aprendizado: {
    name: 'gerar_caminho_aprendizado',
    description: 'Gera caminho de aprendizado progressivo para um tópico',
    execute: gerarCaminhoAprendizado,
    tags: ['grafo', 'aprendizado', 'educacao'],
    examples: ['Quero aprender SPIN Selling do zero'],
  },
}

/**
 * Execute a graph skill by name
 */
export async function executeGraphSkill(
  skillName: string,
  ...args: any[]
): Promise<any> {
  const skill = GRAPH_SKILLS[skillName]
  if (!skill) {
    throw new Error(`Graph skill '${skillName}' not found`)
  }

  try {
    return await skill.execute(...args)
  } catch (error) {
    throw new Error(
      `Failed to execute graph skill '${skillName}': ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Get all available graph skills
 */
export function getAvailableGraphSkills(): GraphSkillDefinition[] {
  return Object.values(GRAPH_SKILLS)
}
