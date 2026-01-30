# Análise: Paradigma do Grafo de Conhecimento - Capítulo 1

**Objetivo**: Construir Autoridade Tópica Densa através de expansão automatizada do Knowledge Graph

---

## 1.1 Densidade Semântica - Status Atual

### ✅ **Implementado**

**Infraestrutura Base** - [lib/geo/schema-generator.ts](../lib/geo/schema-generator.ts)
```typescript
// Schema.org + Wikidata já integrados
export const COMMON_WIKIDATA_ENTITIES = {
  CRM: 'https://www.wikidata.org/wiki/Q16635046',
  SALES: 'https://www.wikidata.org/wiki/Q184753',
  BRAZIL: 'https://www.wikidata.org/wiki/Q155',
  // ... 16 entidades catalogadas
}
```

**Capacidades Atuais:**
- ✅ Geração de JSON-LD tipo-safe via `schema-dts`
- ✅ Vinculação manual de entidades Wikidata (`mentions`, `about`)
- ✅ Helpers pré-configurados (`createGeoConfig.crm()`, `.sales()`, `.realEstate()`)
- ✅ Citações externas via `citations`

### ❌ **Gap Identificado - Densidade Insuficiente**

**Problema**: Apenas 16 entidades no registro. Capítulo 1 exige:
- **100+ entidades** mínimas para "densidade tópica"
- Cobertura de conceitos adjacentes (metodologias de venda, tecnologias, indústrias)
- Relacionamentos explícitos entre entidades (não apenas listas planas)

**Exemplo de Gap**:
```typescript
// ❌ Atual: Lista plana sem relacionamentos
COMMON_WIKIDATA_ENTITIES.CRM = 'Q16635046'
COMMON_WIKIDATA_ENTITIES.SALES = 'Q184753'

// ✅ Requisito: Grafo com relacionamentos
{
  CRM: {
    wikidataId: 'Q16635046',
    relatedTo: ['SALES', 'LEAD_GENERATION'],
    subclassOf: 'SOFTWARE_AS_A_SERVICE',
    usedBy: ['REAL_ESTATE_BROKER', 'SALES_REPRESENTATIVE']
  }
}
```

---

## 1.1.1 "De Strings para Entidades" - Status Atual

### ✅ **Implementado Parcialmente**

**Tabela 1 do Relatório - Comparação de Estratégias:**

| Estratégia | Implementado? | Evidência |
|------------|---------------|-----------|
| ❌ Literal de String | Não usado | N/A |
| ❌ UUID Interno | Não usado | N/A |
| ✅ Wikidata Q-Code | **SIM** | `COMMON_WIKIDATA_ENTITIES.CRM = 'Q16635046'` |
| ❌ Híbrido (URI Semântica) | Não implementado | Não temos URIs proprietárias tipo `https://sirius.roilabs.com.br/id/crm` |

**Conclusão**: Estamos usando a estratégia correta (Wikidata Q-Codes), mas sem o nível híbrido que permitiria controle proprietário + linking global.

---

## 1.2 Registro Centralizado - Status Atual

### ✅ **Implementado com Tipagem Estrita**

**[lib/geo/schema-generator.ts:172-197](../lib/geo/schema-generator.ts#L172-L197)**
```typescript
export const COMMON_WIKIDATA_ENTITIES = {
  CRM: 'https://www.wikidata.org/wiki/Q16635046',
  // ... tipo-safe via `as const`
} as const
```

**TypeScript Safety:**
```typescript
import { WithContext, BlogPosting } from 'schema-dts'

// ✅ Tipagem estrita previne "schema drift"
const schema: WithContext<BlogPosting> = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  mentions: [{ '@type': 'Thing', '@id': wikidataUrl }]
}
```

### ❌ **Gap - Registro Limitado**

**Problema**: Registro é estático e manual. Capítulo 1 exige:
- Registro dinâmico que cresce com novos conteúdos
- Interface de curadoria para adicionar entidades
- Versionamento do registro (para rastrear evolução do grafo)

---

## 1.3 Expansão Automatizada - Status Atual

### ❌ **NÃO Implementado**

**Requisitos do Capítulo 1:**

#### 1.3.1 Extração de Entidades via NLP

**Status**: ❌ Não existe

**Pipeline Requerido:**
```typescript
// ❌ Não implementado
async function processNewContent(content: string) {
  // 1. Reconhecimento de Entidades (NER)
  const entities = await extractNamedEntities(content)

  // 2. Entity Linking (vincular a Wikidata)
  const linkedEntities = await linkToWikidata(entities)

  // 3. Extração de Relacionamentos
  const relationships = await extractRelationships(content, linkedEntities)

  // 4. Atualização do Grafo
  await updateKnowledgeGraph(linkedEntities, relationships)
}
```

**Ferramentas Necessárias:**
- NLP Library: `spacy`, `compromise`, ou LLM-based extraction
- Wikidata API: Para entity linking automático
- Banco de Grafos: Neo4j ou TigerGraph

#### 1.3.2 Integração com Stack TypeScript

**Status**: ❌ Não implementado

**Requisitos:**
1. **Banco de Grafos**: Neo4j com driver TypeScript
2. **Wikibase Privado** (opcional): Para taxonomia proprietária
3. **SPARQL Endpoint**: Para consultas ao grafo

**Arquitetura Proposta:**
```
┌─────────────────┐
│  CMS (Novo Post)│
└────────┬────────┘
         │
         v
┌─────────────────┐
│  NLP Pipeline   │ ← OpenAI/Anthropic para NER
│  (Node.js/Edge) │
└────────┬────────┘
         │
         v
┌─────────────────┐
│   Neo4j Graph   │ ← Armazena triplas (Sujeito->Predicado->Objeto)
│   Database      │
└────────┬────────┘
         │
         v
┌─────────────────┐
│ Agente Consultor│ ← Consome grafo via Cypher queries
│  (Honey Trap)   │
└─────────────────┘
```

---

## 1.4 Valor Estratégico - "Honey Trap" Agêntica

### Conexão com Fase 3 (Personalização Agêntica)

**Requisito do Capítulo 1:**
> "Se o agente identifica que o usuário tem um problema de 'alta latência', o grafo permite que o agente atravesse de Latência -> Streaming -> Edge Functions"

**Status Atual da Calculadora ROI:**
- ❌ Não consulta grafo de conhecimento
- ❌ Não faz traversal de relacionamentos
- ❌ Não cita fontes estruturadas

**Exemplo Ideal (não implementado):**

```typescript
// Usuário: "Meu time demora 24h para responder leads"
const diagnosis = await agent.diagnose(userInput)
// diagnosis.problem = 'alta_latencia_resposta'

// Grafo permite traversal:
// alta_latencia_resposta -> relacionado_a -> CRM_desorganizado
//                        -> solucionado_por -> Automação_Email
//                        -> evidência_em -> [artigo_123, case_study_456]

const solutions = await graph.traverse({
  start: diagnosis.problem,
  depth: 3,
  filter: { type: 'solution' }
})

// Agente retorna:
// "Identifiquei que alta latência de resposta está relacionada a CRM desorganizado.
//  Nossa solução de Automação de Email reduziu isso em 87% (fonte: case_study_456)"
```

---

## Roadmap de Implementação

### Fase 1: Expansão do Registro (Semanas 1-2)
- [ ] Expandir `COMMON_WIKIDATA_ENTITIES` de 16 para 100+ entidades
- [ ] Mapear conceitos: metodologias (SPIN, BANT, Sandler), tecnologias (React, TypeScript), indústrias
- [ ] Adicionar relacionamentos explícitos (não apenas Q-codes isolados)

### Fase 2: Pipeline NLP Básico (Semanas 3-4)
- [ ] Integrar OpenAI/Anthropic para Named Entity Recognition
- [ ] Criar endpoint `/api/content/analyze` que extrai entidades de novos posts
- [ ] Implementar Entity Linking automático com Wikidata API

### Fase 3: Banco de Grafos (Semanas 5-8)
- [ ] Setup Neo4j (cloud ou self-hosted)
- [ ] Migrar relacionamentos de entidades para triplas no Neo4j
- [ ] Criar interface de curadoria para revisar entidades extraídas

### Fase 4: Integração com Agente (Semanas 9-12)
- [ ] Agente consulta grafo via Cypher queries
- [ ] Implementar traversal de relacionamentos para diagnóstico
- [ ] Sistema de citações baseado em nós do grafo

---

## Resumo Executivo

| Componente | Status | Prioridade | Complexidade |
|------------|--------|------------|--------------|
| Registro de Entidades | 🟡 Parcial (16 entidades) | 🔴 Alta | 🟢 Baixa |
| Tipagem Estrita (schema-dts) | ✅ Implementado | - | - |
| Pipeline NLP Automático | ❌ Não existe | 🔴 Alta | 🔴 Alta |
| Banco de Grafos (Neo4j) | ❌ Não existe | 🟡 Média | 🔴 Alta |
| Integração com Agente | ❌ Não existe | 🔴 Alta | 🔴 Alta |

**Próximos Passos Recomendados:**
1. Expandir registro para 100+ entidades (quick win)
2. Prototipar NLP pipeline com OpenAI
3. Avaliar Neo4j vs. soluções mais simples (TigerGraph, TypeScript in-memory graph)

**Última Atualização**: 2025-01-30
