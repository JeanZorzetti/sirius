# Phase 4: AGI Integration - Graph-Augmented Intelligence

**Status**: ✅ Implementado
**Data**: 2025-01-30

---

## Visão Geral

Phase 4 integra o Knowledge Graph com o sistema AGI (Artificial General Intelligence) do Sirius CRM, permitindo que o agente conversacional:

1. **Consulte o grafo** para enriquecer respostas
2. **Atravesse relacionamentos** para diagnósticos contextuais
3. **Cite automaticamente** artigos relacionados
4. **Recomende conteúdo** baseado em similaridade semântica
5. **Gere caminhos de aprendizado** progressivos

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      User Input                              │
│           "Meu time demora 24h para responder leads"         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────────┐
│              AGI Graph Skills Layer                          │
│  lib/agi/graph-skills.ts                                     │
│  - diagnosticarComGrafo()                                    │
│  - recomendarConteudo()                                      │
│  - enriquecerRespostaComCitacoes()                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────────┐
│           Knowledge Graph Query Engine                       │
│  lib/nlp/graph-queries.ts                                    │
│  - findRelatedEntities() - BFS traversal                     │
│  - findPathBetweenEntities() - Shortest path                 │
│  - recommendRelatedContent() - Similarity scoring            │
│  - diagnoseWithGraph() - Problem → Solution paths            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────────┐
│              Auto-Citation System                            │
│  lib/nlp/auto-citation.ts                                    │
│  - enrichWithCitations() - Inline links                      │
│  - enrichAgentResponse() - Full enrichment                   │
│  - getCitationSuggestions() - Related articles               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     v
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL Graph Database                     │
│  Tables: Entity, Relationship, ContentEntity                 │
│  122 entidades | 82 relacionamentos | 7 blog posts           │
└─────────────────────────────────────────────────────────────┘
```

---

## Componentes Implementados

### 1. Graph Query Utilities ([lib/nlp/graph-queries.ts](../lib/nlp/graph-queries.ts))

#### 1.1 `findRelatedEntities(entityId, maxDepth, minStrength)`

Encontra entidades relacionadas usando traversal de grafo.

**Exemplo:**
```typescript
const related = await findRelatedEntities('crm-entity-id', 2, 0.3)
// Retorna:
// [
//   {
//     id: 'automation-entity-id',
//     name: 'Automação',
//     relevanceScore: 0.85,
//     relations: [...],
//     relatedContent: [{ title: 'Como Automatizar...', slug: '...' }]
//   }
// ]
```

**Parâmetros:**
- `entityId` - ID da entidade inicial
- `maxDepth` - Profundidade máxima (1-3 recomendado)
- `minStrength` - Força mínima do relacionamento (0.0-1.0)

**Algoritmo:**
1. Busca relacionamentos diretos (depth 1) via Prisma
2. Para `maxDepth > 1`, busca relacionamentos de 2º grau
3. Calcula `relevanceScore` com decay: `strength * 0.7` para 2º grau
4. Inclui conteúdo relacionado (blog posts) para cada entidade

---

#### 1.2 `findPathBetweenEntities(sourceId, targetId, maxDepth)`

Encontra o caminho mais curto entre duas entidades (BFS).

**Exemplo:**
```typescript
const path = await findPathBetweenEntities('crm-id', 'conversion-id', 4)
// Retorna:
// {
//   path: [
//     { entity: { name: 'Automação' }, relationship: { type: 'enables', strength: 0.8 } },
//     { entity: { name: 'Follow-up Rápido' }, relationship: { type: 'leads_to', strength: 0.7 } },
//     { entity: { name: 'Conversão' }, relationship: null }
//   ],
//   totalStrength: 0.56,
//   depth: 3
// }
```

**Use Cases:**
- Explicar como dois conceitos estão conectados
- Visualizar caminhos de causa-efeito
- Identificar conceitos intermediários

---

#### 1.3 `recommendRelatedContent(context, limit)`

Recomenda blog posts baseado em overlap de entidades.

**Exemplo:**
```typescript
const recommendations = await recommendRelatedContent({
  entities: ['CRM', 'conversão', 'follow-up'],
  currentPostSlug: 'spin-selling-guia-completo',
}, 5)
// Retorna:
// [
//   {
//     title: 'Como Automatizar Follow-up no CRM',
//     slug: 'automatizar-follow-up-crm',
//     relevanceScore: 0.85,
//     matchingEntities: [{ name: 'CRM', type: 'Technology' }],
//     reasoning: '2 conceitos relacionados'
//   }
// ]
```

**Algoritmo de Relevância:**
```typescript
relevanceScore = overlap.length / totalEntities
```
Onde `overlap` = entidades em comum entre contexto e post.

---

#### 1.4 `diagnoseWithGraph(problem)`

Diagnostica problema e sugere soluções usando graph traversal.

**Exemplo:**
```typescript
const diagnosis = await diagnoseWithGraph('alta latência de resposta')
// Retorna:
// {
//   problemEntities: [{ name: 'Latência de Resposta', type: 'Problem' }],
//   solutions: [
//     {
//       entity: { name: 'Automação de Email', type: 'Technology' },
//       path: { totalStrength: 0.72, depth: 2 },
//       evidence: [
//         { title: 'Automação Reduziu Tempo em 87%', slug: '...' }
//       ]
//     }
//   ],
//   diagnosis: 'Identificados 3 caminhos de solução...'
// }
```

**Fluxo:**
1. Busca entidades que mencionam o problema (fuzzy search)
2. Para cada entidade-problema, busca entidades relacionadas tipo "Solution"
3. Calcula caminhos (paths) entre problema e soluções
4. Busca evidências (blog posts) que mencionam as soluções
5. Ranqueia por `path.strength × (1 + evidence.length × 0.2)`

---

### 2. Auto-Citation System ([lib/nlp/auto-citation.ts](../lib/nlp/auto-citation.ts))

#### 2.1 `enrichWithCitations(responseText, options)`

Insere links inline automaticamente.

**Exemplo:**
```typescript
const enriched = await enrichWithCitations(
  'O CRM ajuda a aumentar conversão através de follow-up automático.',
  { maxCitations: 2 }
)
// Retorna:
// {
//   originalText: '...',
//   enrichedText: 'O [CRM](/blog/crm-guia-completo) ajuda a aumentar conversão...',
//   citations: [
//     { text: 'CRM', url: '/blog/crm-guia-completo', title: '...' }
//   ]
// }
```

**Estratégia de Linking:**
- Substitui **primeira menção** de cada entidade
- Preserva case original (e.g., "CRM" → "[CRM](...)")
- Evita links duplicados

---

#### 2.2 `enrichAgentResponse(params)`

Enriquecimento completo com seções "Leia também" e "Fontes".

**Exemplo:**
```typescript
const enriched = await enrichAgentResponse({
  response: 'O CRM melhora follow-up e aumenta conversão.',
  userInput: 'Como melhorar vendas?',
  options: { includeSources: true, includeRelated: true }
})
// Retorna:
// {
//   enrichedText:
//     'O [CRM](/blog/crm) melhora follow-up e aumenta conversão.
//
//     **Leia também:**
//     - [SPIN Selling: Guia Completo](/blog/spin-selling)
//     - [Automação de Vendas](/blog/automacao-vendas)
//
//     **Fontes:**
//     - [CRM: Guia Completo](/blog/crm) - 2 conceitos relacionados',
//   citations: [...],
//   entities: ['CRM', 'follow-up', 'conversão']
// }
```

---

### 3. AGI Graph Skills ([lib/agi/graph-skills.ts](../lib/agi/graph-skills.ts))

Skills para integração com agente conversacional.

#### 3.1 `diagnosticarComGrafo(problemDescription)`

**Input:** "Meu time demora 24h para responder leads"

**Output:**
```typescript
{
  problem: 'Meu time demora 24h para responder leads',
  diagnosis: 'Identificados 3 caminhos de solução para "alta latência"...',
  solutions: [
    {
      name: 'CRM com Automação',
      description: 'Sistema de gerenciamento com follow-up automático',
      confidence: 0.85,
      evidence: [
        { title: 'Como CRM Reduziu Tempo em 87%', url: '/blog/...' }
      ]
    }
  ],
  relatedConcepts: [
    { name: 'Follow-up', type: 'Process', relationship: 'part_of' }
  ]
}
```

---

#### 3.2 `recomendarConteudo(params)`

**Input:**
```typescript
{
  userInput: 'Quero aprender SPIN Selling',
  conversationHistory: ['Como qualificar leads?'],
  currentTopic: 'Metodologias de Vendas'
}
```

**Output:**
```typescript
{
  recommendations: [
    { title: 'SPIN Selling: Guia Completo', url: '/blog/...', relevance: 0.92 },
    { title: 'Discovery com SPIN', url: '/blog/...', relevance: 0.78 }
  ],
  context: 'Contexto identificado: SPIN Selling, Qualificação, Discovery. 3 artigos relacionados.',
  entityCount: 5
}
```

---

#### 3.3 `enriquecerRespostaComCitacoes(params)`

**Input:**
```typescript
{
  response: 'Para melhorar conversão, use CRM com automação de follow-up.',
  userInput: 'Como aumentar vendas?',
  includeSources: true
}
```

**Output:**
```typescript
{
  response: 'Para melhorar conversão, use [CRM](/blog/crm) com automação de follow-up.\n\n**Fontes:**\n- [CRM: Guia...](/blog/crm)',
  citations: [...],
  entities: ['CRM', 'conversão', 'automação']
}
```

---

#### 3.4 `gerarCaminhoAprendizado(topic)`

Gera roadmap progressivo de aprendizado.

**Input:** "SPIN Selling"

**Output:**
```typescript
{
  learningPath: [
    {
      step: 1,
      topic: 'Fundamentos de Vendas',
      resources: [{ title: 'Introdução...', url: '/blog/...' }]
    },
    { step: 2, topic: 'Discovery', resources: [...] },
    { step: 3, topic: 'SPIN Selling', resources: [...] },
    { step: 4, topic: 'Objeções Avançadas', resources: [...] }
  ],
  estimatedReadingTime: 60 // minutos
}
```

**Algoritmo:**
1. Busca entidades relacionadas com `relationship.type === 'prerequisite_of'`
2. Adiciona tópico principal
3. Adiciona tópicos relacionados (`related_to`)
4. Adiciona tópicos avançados (`leads_to`, `enables`)
5. Estima tempo: `10 min × total_resources`

---

## API Endpoints

### POST `/api/agi/diagnose`

Diagnostica problema de negócio.

**Request:**
```json
{
  "problem": "Meu time demora 24h para responder leads"
}
```

**Response:**
```json
{
  "success": true,
  "diagnosis": {
    "problem": "...",
    "diagnosis": "Identificados 3 caminhos...",
    "solutions": [...],
    "relatedConcepts": [...]
  }
}
```

---

### POST `/api/agi/recommend`

Recomenda conteúdo contextual.

**Request:**
```json
{
  "userInput": "Como qualificar leads?",
  "conversationHistory": ["Quero melhorar vendas"],
  "currentTopic": "Qualificação"
}
```

**Response:**
```json
{
  "success": true,
  "recommendations": {
    "recommendations": [...],
    "context": "Contexto identificado: ...",
    "entityCount": 5
  }
}
```

---

### POST `/api/agi/enrich`

Enriquece resposta com citações.

**Request:**
```json
{
  "response": "O CRM ajuda a aumentar conversão.",
  "userInput": "Como melhorar vendas?",
  "includeSources": true,
  "includeRelated": true
}
```

**Response:**
```json
{
  "success": true,
  "enriched": {
    "response": "O [CRM](/blog/crm) ajuda...\n\n**Leia também:**\n...",
    "citations": [...],
    "entities": ["CRM", "conversão"]
  }
}
```

---

### GET `/api/agi/learning-path?topic=SPIN+Selling`

Gera caminho de aprendizado.

**Response:**
```json
{
  "success": true,
  "learningPath": {
    "learningPath": [
      { "step": 1, "topic": "Fundamentos", "resources": [...] }
    ],
    "estimatedReadingTime": 60
  }
}
```

---

### GET `/api/agi/explain-relationship?concept1=CRM&concept2=conversão`

Explica relacionamento entre conceitos.

**Response:**
```json
{
  "success": true,
  "relationship": {
    "explanation": "CRM está relacionado a conversão através de automação...",
    "path": [
      { "from": "CRM", "relationship": "enables", "to": "Automação" },
      { "from": "Automação", "relationship": "leads_to", "to": "Conversão" }
    ],
    "strength": 0.72
  }
}
```

---

## Casos de Uso

### 1. Diagnóstico Contextual no ROI Calculator

**Cenário:** Usuário insere dados na calculadora ROI e recebe diagnóstico personalizado.

**Implementação:**
```typescript
// Quando usuário submete calculadora
const diagnosis = await diagnosticarComGrafo(
  `Time com ${numVendedores} vendedores tem conversão de ${taxaConversao}% e tempo de resposta de ${tempoResposta}h`
)

// Exibir soluções:
// "Identificamos que alta latência de resposta está relacionada a CRM desorganizado.
//  Nossa solução de Automação de Email reduziu isso em 87% (fonte: case_study_456)"
```

---

### 2. Chatbot com Auto-Citação

**Cenário:** Chatbot responde dúvidas e cita automaticamente artigos relevantes.

**Implementação:**
```typescript
// Resposta do LLM
const llmResponse = "Para melhorar qualificação, use BANT ou SPIN Selling."

// Enriquecer com citações
const enriched = await enriquecerRespostaComCitacoes({
  response: llmResponse,
  userInput: userQuestion,
})

// Retorna:
// "Para melhorar qualificação, use [BANT](/blog/bant) ou [SPIN Selling](/blog/spin).
//
//  **Leia também:**
//  - [Discovery: Guia Completo](/blog/discovery)
//  - [Como Qualificar em 5 Passos](/blog/qualificacao)"
```

---

### 3. Sidebar "Leia Também"

**Cenário:** Exibir artigos relacionados em blog posts.

**Implementação:**
```typescript
// Em blog/[slug]/page.tsx
const suggestions = await getCitationSuggestions({
  text: post.content,
  currentSlug: post.slug
}, 5)

// Renderizar sidebar:
// <aside>
//   <h3>Leia Também</h3>
//   {suggestions.map(s => <a href={s.url}>{s.title}</a>)}
// </aside>
```

---

### 4. Caminho de Aprendizado Personalizado

**Cenário:** Usuário quer aprender SPIN Selling do zero.

**Implementação:**
```typescript
const learningPath = await gerarCaminhoAprendizado('SPIN Selling')

// Exibir roadmap:
// 1. Fundamentos de Vendas (20 min)
// 2. Discovery e Qualificação (30 min)
// 3. SPIN Selling: Guia Completo (40 min)
// 4. Técnicas Avançadas de Objeção (25 min)
// Total: 115 minutos
```

---

## Métricas e Performance

### Complexidade de Queries

| Query | Complexidade | Tempo Médio | Queries DB |
|-------|--------------|-------------|------------|
| `findRelatedEntities(depth=1)` | O(E) | ~50ms | 1 |
| `findRelatedEntities(depth=2)` | O(E²) | ~150ms | 2 |
| `findPathBetweenEntities(maxDepth=4)` | O(E×D) | ~200ms | 3-5 |
| `diagnoseWithGraph()` | O(E²×D) | ~300ms | 4-8 |
| `recommendRelatedContent()` | O(P×E) | ~100ms | 2-3 |

**Legenda:**
- E = Número de entidades
- D = Profundidade máxima
- P = Número de posts

---

### Custo de Inferência

**Atualmente:** Queries apenas no PostgreSQL (sem LLM).

**Futuro (quando integrar com LLM):**
- Enriquecimento de resposta: ~500 tokens → $0.0003/req (GPT-4o-mini)
- Diagnóstico com contexto: ~1500 tokens → $0.001/req
- **Estimativa:** $0.10/dia (~100 requisições)

---

## Limitações Atuais

### 1. Entity Extraction é Keyword-Based

**Problema:** `extractPotentialEntities()` usa lista hardcoded de termos.

**Solução Futura:** Integrar NER (Named Entity Recognition) com:
- SpaCy (português)
- LLM-based extraction (já implementado em Phase 2)

---

### 2. PostgreSQL como Graph DB

**Problema:** Queries multi-hop são lentas (200ms para depth=4).

**Solução:** Migrar para Neo4j quando > 10K entidades (ver [NEO4J_MIGRATION_PLAN.md](../docs/NEO4J_MIGRATION_PLAN.md)).

**Cypher vs SQL:**
```cypher
// Neo4j: 10ms
MATCH path = (a:Entity {name: 'CRM'})-[*1..3]-(b:Entity {name: 'Conversão'})
RETURN path
LIMIT 1
```

```sql
-- PostgreSQL: 200ms (3 subqueries recursivas)
WITH RECURSIVE paths AS (...)
```

---

### 3. Sem Cache de Queries

**Problema:** Mesmas queries executadas repetidamente.

**Solução:** Implementar Redis cache:
```typescript
const cacheKey = `graph:related:${entityId}:${maxDepth}`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)

const result = await findRelatedEntities(...)
await redis.setex(cacheKey, 3600, JSON.stringify(result)) // 1h TTL
```

---

## Próximos Passos

### ⏳ Visualização Interativa do Grafo

**Ferramenta:** D3.js force-directed graph

**Endpoint:** GET `/api/graph/visualization?entityId=...&depth=2`

**Features:**
- Nodes clicáveis (redireciona para entidade/artigo)
- Filtros: por tipo, por relevância
- Zoom e pan
- Highlight de caminhos

---

### ⏳ Content Gap Analysis

**Objetivo:** Identificar clusters de entidades sem artigos.

**Query:**
```sql
SELECT e.name, e.type, COUNT(ce.id) as article_count
FROM "Entity" e
LEFT JOIN "ContentEntity" ce ON ce."entityId" = e.id
GROUP BY e.id
HAVING COUNT(ce.id) = 0
ORDER BY (
  SELECT COUNT(*) FROM "Relationship" r
  WHERE r."sourceEntityId" = e.id OR r."targetEntityId" = e.id
) DESC
LIMIT 10
```

**Output:**
- "Você tem 12 entidades sobre Sandler mas nenhum artigo"
- "Cluster de 'Metodologias de Vendas' está 40% coberto"

---

### ⏳ Graph-Augmented RAG

**Conceito:** Usar graph traversal ANTES de buscar no vector store.

**Fluxo:**
1. User query: "Como melhorar conversão?"
2. Extract entities: ["conversão", "vendas"]
3. **Graph traversal:** Buscar entidades relacionadas → ["CRM", "automação", "follow-up"]
4. **Vector search:** Buscar documentos que mencionam TODAS as entidades (original + relacionadas)
5. LLM responde com contexto expandido

**Vantagem:** Busca mais precisa (combina semântica + relacionamentos estruturados).

---

## Resumo Executivo

| Componente | Status | LOC | Arquivos |
|------------|--------|-----|----------|
| Graph Query Engine | ✅ | 550 | lib/nlp/graph-queries.ts |
| Auto-Citation System | ✅ | 400 | lib/nlp/auto-citation.ts |
| AGI Graph Skills | ✅ | 480 | lib/agi/graph-skills.ts |
| API Endpoints | ✅ | 180 | app/api/agi/* (5 endpoints) |
| **Total** | **✅** | **1610** | **7 arquivos** |

---

**Última Atualização:** 2025-01-30
**Autor:** AGI Sirius + Claude Code
