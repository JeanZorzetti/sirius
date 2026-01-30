/**
 * Knowledge Graph - Relacionamentos entre Entidades
 *
 * Este arquivo documenta os relacionamentos semânticos entre entidades Wikidata.
 * Quando implementarmos Neo4j (Fase futura), esses relacionamentos serão transformados
 * em arestas (edges) no grafo, permitindo traversal e consultas complexas.
 *
 * Formato de Tripla: (Sujeito -> Predicado -> Objeto)
 * Exemplo: CRM -> subclassOf -> SOFTWARE_AS_A_SERVICE
 */

import { COMMON_WIKIDATA_ENTITIES } from './schema-generator'

/**
 * Tipos de Relacionamentos (Predicados)
 *
 * Baseados em Schema.org e Wikidata Properties
 */
export enum RelationshipType {
  // Hierarquia
  SUBCLASS_OF = 'subclassOf', // P279 no Wikidata
  INSTANCE_OF = 'instanceOf', // P31 no Wikidata
  PART_OF = 'partOf', // P361 no Wikidata

  // Relações de Uso
  USES = 'uses',
  USED_BY = 'usedBy',
  USED_IN = 'usedIn',
  ENABLES = 'enables',

  // Relações Profissionais
  PRACTICED_BY = 'practicedBy',
  REQUIRES_SKILL = 'requiresSkill',
  WORKS_FOR = 'worksFor',

  // Relações de Conteúdo
  RELATED_TO = 'relatedTo',
  PREREQUISITE_OF = 'prerequisiteOf',
  SOLVES = 'solves',
  CAUSES = 'causes',

  // Relações Geográficas
  LOCATED_IN = 'locatedIn',
  OPERATES_IN = 'operatesIn',

  // Relações de Indústria
  SERVES_INDUSTRY = 'servesIndustry',
  POPULAR_IN = 'popularIn',
}

/**
 * Interface para representar uma tripla RDF
 */
export interface EntityTriple {
  subject: string // URL Wikidata
  predicate: RelationshipType
  object: string // URL Wikidata
  confidence?: number // 0-1, para futuras validações por IA
  source?: string // URL do artigo/conteúdo que originou a relação
}

/**
 * Grafo de Relacionamentos Centralizado
 *
 * IMPORTANTE: Este é um grafo "flat" em TypeScript. Em produção com Neo4j,
 * esses relacionamentos seriam queries Cypher tipo:
 *
 * MATCH (crm:Entity {id: 'Q16635046'})-[:SUBCLASS_OF]->(saas:Entity)
 * RETURN saas
 */
export const ENTITY_RELATIONSHIPS: EntityTriple[] = [
  // ============================================================================
  // HIERARQUIA DE SOFTWARE
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.CRM,
    predicate: RelationshipType.SUBCLASS_OF,
    object: COMMON_WIKIDATA_ENTITIES.SOFTWARE_AS_A_SERVICE,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.CHATBOT,
    predicate: RelationshipType.SUBCLASS_OF,
    object: COMMON_WIKIDATA_ENTITIES.ARTIFICIAL_INTELLIGENCE,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.MACHINE_LEARNING,
    predicate: RelationshipType.SUBCLASS_OF,
    object: COMMON_WIKIDATA_ENTITIES.ARTIFICIAL_INTELLIGENCE,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.NATURAL_LANGUAGE_PROCESSING,
    predicate: RelationshipType.SUBCLASS_OF,
    object: COMMON_WIKIDATA_ENTITIES.ARTIFICIAL_INTELLIGENCE,
  },

  // ============================================================================
  // METODOLOGIAS DE VENDA → CONTEXTOS DE USO
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.SPIN_SELLING,
    predicate: RelationshipType.USED_IN,
    object: COMMON_WIKIDATA_ENTITIES.SALES,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.SPIN_SELLING,
    predicate: RelationshipType.INSTANCE_OF,
    object: COMMON_WIKIDATA_ENTITIES.CONSULTATIVE_SELLING,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.CHALLENGER_SALE,
    predicate: RelationshipType.USED_IN,
    object: COMMON_WIKIDATA_ENTITIES.SALES,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.SANDLER_SELLING_SYSTEM,
    predicate: RelationshipType.USED_IN,
    object: COMMON_WIKIDATA_ENTITIES.SALES,
  },

  // ============================================================================
  // FERRAMENTAS → USUÁRIOS
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.CRM,
    predicate: RelationshipType.USED_BY,
    object: COMMON_WIKIDATA_ENTITIES.SALES_REPRESENTATIVE,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.CRM,
    predicate: RelationshipType.USED_BY,
    object: COMMON_WIKIDATA_ENTITIES.REAL_ESTATE_BROKER,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.CRM,
    predicate: RelationshipType.USED_BY,
    object: COMMON_WIKIDATA_ENTITIES.SALES_MANAGER,
  },

  // ============================================================================
  // PROCESSOS DE VENDA → FERRAMENTAS
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.LEAD_GENERATION,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.CRM,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.EMAIL_MARKETING,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.AUTOMATION,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.PIPELINE_SALES,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.KANBAN,
  },

  // ============================================================================
  // PROFISSÕES → INDÚSTRIAS
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.REAL_ESTATE_BROKER,
    predicate: RelationshipType.WORKS_FOR,
    object: COMMON_WIKIDATA_ENTITIES.REAL_ESTATE,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.SALES_REPRESENTATIVE,
    predicate: RelationshipType.SERVES_INDUSTRY,
    object: COMMON_WIKIDATA_ENTITIES.REAL_ESTATE,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.SALES_REPRESENTATIVE,
    predicate: RelationshipType.SERVES_INDUSTRY,
    object: COMMON_WIKIDATA_ENTITIES.SOLAR_ENERGY,
  },

  // ============================================================================
  // STACK TÉCNICO → RELACIONAMENTOS
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.NEXTJS,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.REACT,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.REACT,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.JAVASCRIPT,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.TYPESCRIPT,
    predicate: RelationshipType.SUBCLASS_OF,
    object: COMMON_WIKIDATA_ENTITIES.JAVASCRIPT,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.NEXTJS,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.TYPESCRIPT,
  },

  // ============================================================================
  // MÉTRICAS → CONTEXTOS
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.RETURN_ON_INVESTMENT,
    predicate: RelationshipType.USED_IN,
    object: COMMON_WIKIDATA_ENTITIES.SALES,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.CUSTOMER_ACQUISITION_COST,
    predicate: RelationshipType.USED_IN,
    object: COMMON_WIKIDATA_ENTITIES.MARKETING,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.CONVERSION_RATE,
    predicate: RelationshipType.USED_IN,
    object: COMMON_WIKIDATA_ENTITIES.SALES_FUNNEL,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.NET_PROMOTER_SCORE,
    predicate: RelationshipType.USED_IN,
    object: COMMON_WIKIDATA_ENTITIES.CUSTOMER_SATISFACTION,
  },

  // ============================================================================
  // GEOGRAFIA → CONTEXTOS
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.SAO_PAULO,
    predicate: RelationshipType.LOCATED_IN,
    object: COMMON_WIKIDATA_ENTITIES.BRAZIL,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.RIO_DE_JANEIRO,
    predicate: RelationshipType.LOCATED_IN,
    object: COMMON_WIKIDATA_ENTITIES.BRAZIL,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.REAL_ESTATE,
    predicate: RelationshipType.POPULAR_IN,
    object: COMMON_WIKIDATA_ENTITIES.SAO_PAULO,
  },

  // ============================================================================
  // PROBLEMAS → SOLUÇÕES
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.CRM,
    predicate: RelationshipType.SOLVES,
    object: COMMON_WIKIDATA_ENTITIES.CHURN_RATE,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.AUTOMATION,
    predicate: RelationshipType.SOLVES,
    object: COMMON_WIKIDATA_ENTITIES.FOLLOW_UP,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.ANALYTICS,
    predicate: RelationshipType.ENABLES,
    object: COMMON_WIKIDATA_ENTITIES.PREDICTIVE_ANALYTICS,
  },

  // ============================================================================
  // METODOLOGIAS → FERRAMENTAS
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.SPIN_SELLING,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.CRM,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.CHALLENGER_SALE,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.CRM,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.SOLUTION_SELLING,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.CRM,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.CONSULTATIVE_SELLING,
    predicate: RelationshipType.REQUIRES_SKILL,
    object: COMMON_WIKIDATA_ENTITIES.NEGOTIATION,
  },

  // ============================================================================
  // PROFISSÕES → METODOLOGIAS
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.SALES_REPRESENTATIVE,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.SPIN_SELLING,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.SALES_MANAGER,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.SALES_FUNNEL,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.ACCOUNT_EXECUTIVE,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.SOLUTION_SELLING,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.REAL_ESTATE_BROKER,
    predicate: RelationshipType.REQUIRES_SKILL,
    object: COMMON_WIKIDATA_ENTITIES.NEGOTIATION,
  },

  // ============================================================================
  // PROCESSOS → METODOLOGIAS
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.PROSPECTING,
    predicate: RelationshipType.PART_OF,
    object: COMMON_WIKIDATA_ENTITIES.SALES_FUNNEL,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.CLOSING,
    predicate: RelationshipType.PART_OF,
    object: COMMON_WIKIDATA_ENTITIES.SALES_FUNNEL,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.FOLLOW_UP,
    predicate: RelationshipType.PART_OF,
    object: COMMON_WIKIDATA_ENTITIES.SALES_FUNNEL,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.NEGOTIATION,
    predicate: RelationshipType.PART_OF,
    object: COMMON_WIKIDATA_ENTITIES.SALES,
  },

  // ============================================================================
  // MARKETING → FERRAMENTAS
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.EMAIL_MARKETING,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.GMAIL,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.DIGITAL_MARKETING,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.ANALYTICS,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.CONTENT_MARKETING,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.BLOG,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.INBOUND_MARKETING,
    predicate: RelationshipType.RELATED_TO,
    object: COMMON_WIKIDATA_ENTITIES.CONTENT_MARKETING,
  },

  // ============================================================================
  // INDÚSTRIAS → FERRAMENTAS
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.REAL_ESTATE,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.CRM,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.SOLAR_ENERGY,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.CRM,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.INSURANCE,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.CRM,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.CONSULTING,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.CRM,
  },

  // ============================================================================
  // MÉTRICAS → PROCESSOS
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.CONVERSION_RATE,
    predicate: RelationshipType.USED_IN,
    object: COMMON_WIKIDATA_ENTITIES.LEAD_GENERATION,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.CHURN_RATE,
    predicate: RelationshipType.USED_IN,
    object: COMMON_WIKIDATA_ENTITIES.CUSTOMER_RETENTION,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.LIFETIME_VALUE,
    predicate: RelationshipType.RELATED_TO,
    object: COMMON_WIKIDATA_ENTITIES.CUSTOMER_ACQUISITION_COST,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.MONTHLY_RECURRING_REVENUE,
    predicate: RelationshipType.SUBCLASS_OF,
    object: COMMON_WIKIDATA_ENTITIES.REVENUE,
  },

  // ============================================================================
  // STACK TÉCNICO → PRODUTOS
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.SOFTWARE_AS_A_SERVICE,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.NODEJS,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.CRM,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.POSTGRESQL,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.CRM,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.REST_API,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.CHATBOT,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.NATURAL_LANGUAGE_PROCESSING,
  },

  // ============================================================================
  // CONCEITOS DE PRODUTO → FRAMEWORKS
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.KANBAN,
    predicate: RelationshipType.INSTANCE_OF,
    object: COMMON_WIKIDATA_ENTITIES.AGILE_SOFTWARE_DEVELOPMENT,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.SCRUM,
    predicate: RelationshipType.INSTANCE_OF,
    object: COMMON_WIKIDATA_ENTITIES.AGILE_SOFTWARE_DEVELOPMENT,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.MINIMUM_VIABLE_PRODUCT,
    predicate: RelationshipType.RELATED_TO,
    object: COMMON_WIKIDATA_ENTITIES.AGILE_SOFTWARE_DEVELOPMENT,
  },

  // ============================================================================
  // FERRAMENTAS → INTEGRAÇÕES
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.ZAPIER,
    predicate: RelationshipType.ENABLES,
    object: COMMON_WIKIDATA_ENTITIES.AUTOMATION,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.MAKE,
    predicate: RelationshipType.ENABLES,
    object: COMMON_WIKIDATA_ENTITIES.WORKFLOW_AUTOMATION,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.WHATSAPP,
    predicate: RelationshipType.USED_BY,
    object: COMMON_WIKIDATA_ENTITIES.SALES_REPRESENTATIVE,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.ZOOM,
    predicate: RelationshipType.USED_BY,
    object: COMMON_WIKIDATA_ENTITIES.SALES_MANAGER,
  },

  // ============================================================================
  // COMUNICAÇÃO → MARKETING
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.BLOG,
    predicate: RelationshipType.USED_IN,
    object: COMMON_WIKIDATA_ENTITIES.CONTENT_MARKETING,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.WEBINAR,
    predicate: RelationshipType.USED_IN,
    object: COMMON_WIKIDATA_ENTITIES.LEAD_GENERATION,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.PODCAST,
    predicate: RelationshipType.USED_IN,
    object: COMMON_WIKIDATA_ENTITIES.CONTENT_MARKETING,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.LINKEDIN,
    predicate: RelationshipType.USED_IN,
    object: COMMON_WIKIDATA_ENTITIES.DIGITAL_MARKETING,
  },

  // ============================================================================
  // GEOGRAFIA → INDÚSTRIAS
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.SAO_PAULO_STATE,
    predicate: RelationshipType.LOCATED_IN,
    object: COMMON_WIKIDATA_ENTITIES.BRAZIL,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.BELO_HORIZONTE,
    predicate: RelationshipType.LOCATED_IN,
    object: COMMON_WIKIDATA_ENTITIES.BRAZIL,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.BRASILIA,
    predicate: RelationshipType.LOCATED_IN,
    object: COMMON_WIKIDATA_ENTITIES.BRAZIL,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.CURITIBA,
    predicate: RelationshipType.LOCATED_IN,
    object: COMMON_WIKIDATA_ENTITIES.BRAZIL,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.PORTO_ALEGRE,
    predicate: RelationshipType.LOCATED_IN,
    object: COMMON_WIKIDATA_ENTITIES.BRAZIL,
  },

  // ============================================================================
  // PROFISSÕES → HABILIDADES
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.SOFTWARE_DEVELOPER,
    predicate: RelationshipType.REQUIRES_SKILL,
    object: COMMON_WIKIDATA_ENTITIES.TYPESCRIPT,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.PRODUCT_MANAGER,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.ANALYTICS,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.MARKETING_MANAGER,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.DIGITAL_MARKETING,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.ENTREPRENEUR,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.CRM,
  },

  // ============================================================================
  // IA → APLICAÇÕES
  // ============================================================================
  {
    subject: COMMON_WIKIDATA_ENTITIES.CHATBOT,
    predicate: RelationshipType.USED_IN,
    object: COMMON_WIKIDATA_ENTITIES.CUSTOMER_RELATIONSHIP_MANAGEMENT,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.PREDICTIVE_ANALYTICS,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.MACHINE_LEARNING,
  },
  {
    subject: COMMON_WIKIDATA_ENTITIES.BUSINESS_INTELLIGENCE,
    predicate: RelationshipType.USES,
    object: COMMON_WIKIDATA_ENTITIES.DATA_VISUALIZATION,
  },
]

/**
 * Utilitário: Buscar entidades relacionadas
 *
 * Simula uma query de grafo. Em Neo4j seria:
 * MATCH (e:Entity {id: entityId})-[r:relationshipType]->(related)
 * RETURN related
 */
export function findRelatedEntities(
  entityId: string,
  relationshipType: RelationshipType
): string[] {
  return ENTITY_RELATIONSHIPS.filter(
    (triple) =>
      triple.subject === entityId && triple.predicate === relationshipType
  ).map((triple) => triple.object)
}

/**
 * Utilitário: Buscar caminho entre duas entidades (breadth-first search)
 *
 * Em Neo4j seria:
 * MATCH path = shortestPath((start)-[*]-(end))
 * WHERE start.id = startId AND end.id = endId
 * RETURN path
 */
export function findPath(
  startId: string,
  endId: string,
  maxDepth: number = 3
): EntityTriple[] | null {
  // BFS implementation
  const queue: { id: string; path: EntityTriple[] }[] = [
    { id: startId, path: [] },
  ]
  const visited = new Set<string>([startId])

  while (queue.length > 0) {
    const { id, path } = queue.shift()!

    if (id === endId) {
      return path
    }

    if (path.length >= maxDepth) {
      continue
    }

    // Encontrar todas as arestas saindo deste nó
    const outgoingEdges = ENTITY_RELATIONSHIPS.filter(
      (triple) => triple.subject === id
    )

    for (const edge of outgoingEdges) {
      if (!visited.has(edge.object)) {
        visited.add(edge.object)
        queue.push({
          id: edge.object,
          path: [...path, edge],
        })
      }
    }
  }

  return null // Não há caminho
}

/**
 * Utilitário: Estatísticas do grafo
 */
export function getGraphStats() {
  const entities = Object.keys(COMMON_WIKIDATA_ENTITIES).length
  const relationships = ENTITY_RELATIONSHIPS.length
  const relationshipTypes = new Set(
    ENTITY_RELATIONSHIPS.map((t) => t.predicate)
  ).size

  return {
    totalEntities: entities,
    totalRelationships: relationships,
    uniqueRelationshipTypes: relationshipTypes,
    avgRelationshipsPerEntity: (relationships / entities).toFixed(2),
  }
}
