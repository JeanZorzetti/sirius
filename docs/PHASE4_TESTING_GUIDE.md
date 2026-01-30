# Phase 4: Guia de Testes - AGI Integration & Knowledge Graph

**Data:** 2025-01-30
**Versão:** 1.0

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Testes Manuais](#testes-manuais)
4. [Testes de API](#testes-de-api)
5. [Testes de Performance](#testes-de-performance)
6. [Troubleshooting](#troubleshooting)

---

## Visão Geral

Este guia cobre todos os testes para a Fase 4 do Knowledge Graph, incluindo:

- ✅ Graph Query Engine
- ✅ Auto-Citation System
- ✅ AGI Graph Skills
- ✅ Graph-Augmented RAG
- ✅ Interactive Graph Visualization

---

## Pré-requisitos

### 1. Verificar Dados no Banco

```bash
# Acessar PostgreSQL
psql $DATABASE_URL

# Verificar entidades
SELECT COUNT(*) FROM "Entity";
# Esperado: ~210 entidades

# Verificar relacionamentos
SELECT COUNT(*) FROM "Relationship";
# Esperado: ~155 relacionamentos

# Verificar blog posts processados
SELECT COUNT(*) FROM "EntityExtraction" WHERE status = 'completed';
# Esperado: 7 extractions (1 por post)
```

### 2. Verificar Servidor Rodando

```bash
npm run dev
```

Acesse: http://localhost:3000

---

## Testes Manuais

### 1. Admin Dashboard - Knowledge Graph Stats

**Objetivo:** Verificar que estatísticas são exibidas corretamente.

**Passos:**

1. Acesse: http://localhost:3000/admin
2. Procure o widget "Knowledge Graph"
3. Verifique:
   - ✅ Número de entidades extraídas
   - ✅ Número de blog posts processados
   - ✅ Densidade do grafo (%)
   - ✅ Botão "Process Pending Posts"

**Resultado Esperado:**

```
Entidades Extraídas: 88
Blog Posts Processados: 7/7
Densidade do Grafo: 1.11%
```

---

### 2. Graph Visualization

**Objetivo:** Visualizar o grafo interativamente.

**Passos:**

1. Acesse: http://localhost:3000/admin/graph-viz
2. Aguarde carregamento do grafo (pode levar 2-3 segundos)
3. Teste interações:
   - ✅ Arraste um nó (deve mover)
   - ✅ Clique em um nó (deve mostrar detalhes na lateral)
   - ✅ Use scroll do mouse (deve dar zoom)
   - ✅ Clique em "Zoom In" / "Zoom Out" (deve funcionar)
   - ✅ Altere profundidade (Slider) e clique "Atualizar Grafo"

**Resultado Esperado:**

- Grafo renderizado com ~100 nós (depende da profundidade)
- Nodes coloridos por tipo
- Links com espessura proporcional à força
- Detalhes do nó aparecem ao clicar

**Screenshot:**

```
[Grafo Force-Directed com nós coloridos]
Controles: Profundidade [2], Força Mínima [0.30]
Stats: 87 Entidades | 142 Relacionamentos | Zoom: 1.00x
```

---

### 3. Processar Posts Pendentes

**Objetivo:** Verificar auto-reprocessing de posts.

**Passos:**

1. Acesse: http://localhost:3000/admin
2. No widget Knowledge Graph, clique "Process Pending Posts"
3. Aguarde (~5-10 segundos por post)
4. Verifique mensagem de sucesso

**Resultado Esperado:**

```
✅ Successfully processed 0 blog posts
(Se já todos processados)
```

---

## Testes de API

### 1. Graph Queries - Find Related Entities

**Endpoint:** `GET /api/nlp/entities?q=CRM&limit=5`

**Teste:**

```bash
curl -X GET "http://localhost:3000/api/nlp/entities?q=CRM&limit=5" | jq
```

**Resultado Esperado:**

```json
{
  "query": "CRM",
  "count": 5,
  "entities": [
    {
      "id": "...",
      "name": "CRM",
      "type": "Technology",
      "description": "...",
      "relevanceScore": 1.0
    }
  ]
}
```

---

### 2. AGI Diagnose - Problem Diagnosis

**Endpoint:** `POST /api/agi/diagnose`

**Teste:**

```bash
curl -X POST "http://localhost:3000/api/agi/diagnose" \
  -H "Content-Type: application/json" \
  -d '{"problem": "Meu time demora 24h para responder leads"}' | jq
```

**Resultado Esperado:**

```json
{
  "success": true,
  "diagnosis": {
    "problem": "Meu time demora 24h para responder leads",
    "diagnosis": "Identificados X caminhos de solução...",
    "solutions": [
      {
        "name": "Automação de Email",
        "description": "...",
        "confidence": 0.85,
        "evidence": [
          {
            "title": "Como Automatizar Follow-up",
            "url": "/blog/..."
          }
        ]
      }
    ],
    "relatedConcepts": [
      {
        "name": "CRM",
        "type": "Technology",
        "relationship": "enables"
      }
    ]
  }
}
```

---

### 3. AGI Recommend - Content Recommendations

**Endpoint:** `POST /api/agi/recommend`

**Teste:**

```bash
curl -X POST "http://localhost:3000/api/agi/recommend" \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "Como melhorar conversão de vendas?",
    "conversationHistory": ["Quero aumentar vendas"],
    "currentTopic": "Vendas"
  }' | jq
```

**Resultado Esperado:**

```json
{
  "success": true,
  "recommendations": {
    "recommendations": [
      {
        "title": "SPIN Selling: Guia Completo",
        "url": "/blog/spin-selling-guia-completo",
        "reason": "3 conceitos relacionados",
        "relevance": 0.92
      }
    ],
    "context": "Contexto identificado: conversão, vendas, CRM. 5 artigos relacionados.",
    "entityCount": 5
  }
}
```

---

### 4. AGI Enrich - Response Enrichment

**Endpoint:** `POST /api/agi/enrich`

**Teste:**

```bash
curl -X POST "http://localhost:3000/api/agi/enrich" \
  -H "Content-Type: application/json" \
  -d '{
    "response": "Para melhorar conversão, use CRM com automação de follow-up.",
    "userInput": "Como aumentar vendas?",
    "includeSources": true,
    "includeRelated": true
  }' | jq
```

**Resultado Esperado:**

```json
{
  "success": true,
  "enriched": {
    "response": "Para melhorar conversão, use [CRM](/blog/crm) com automação de follow-up.\n\n**Leia também:**\n- [SPIN Selling](/blog/spin-selling)\n\n**Fontes:**\n- [CRM: Guia Completo](/blog/crm) - 2 conceitos relacionados",
    "citations": [
      {
        "title": "CRM: Guia Completo",
        "url": "/blog/crm",
        "reason": "2 conceitos relacionados"
      }
    ],
    "entities": ["CRM", "conversão", "automação", "follow-up"]
  }
}
```

---

### 5. AGI Learning Path

**Endpoint:** `GET /api/agi/learning-path?topic=SPIN+Selling`

**Teste:**

```bash
curl -X GET "http://localhost:3000/api/agi/learning-path?topic=SPIN+Selling" | jq
```

**Resultado Esperado:**

```json
{
  "success": true,
  "learningPath": {
    "learningPath": [
      {
        "step": 1,
        "topic": "Fundamentos de Vendas",
        "type": "Concept",
        "resources": [
          {
            "title": "Introdução às Vendas",
            "url": "/blog/..."
          }
        ]
      },
      {
        "step": 2,
        "topic": "SPIN Selling",
        "type": "Methodology",
        "resources": [
          {
            "title": "SPIN Selling: Guia Completo",
            "url": "/blog/spin-selling-guia-completo"
          }
        ]
      }
    ],
    "estimatedReadingTime": 60
  }
}
```

---

### 6. AGI Explain Relationship

**Endpoint:** `GET /api/agi/explain-relationship?concept1=CRM&concept2=conversão`

**Teste:**

```bash
curl -X GET "http://localhost:3000/api/agi/explain-relationship?concept1=CRM&concept2=convers%C3%A3o" | jq
```

**Resultado Esperado:**

```json
{
  "success": true,
  "relationship": {
    "explanation": "CRM está relacionado a conversão através de automação...",
    "path": [
      {
        "from": "CRM",
        "relationship": "enables",
        "to": "Automação"
      },
      {
        "from": "Automação",
        "relationship": "leads_to",
        "to": "Conversão"
      }
    ],
    "strength": 0.72
  }
}
```

---

### 7. Graph-Augmented RAG Query

**Endpoint:** `POST /api/agi/query`

**Teste:**

```bash
curl -X POST "http://localhost:3000/api/agi/query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Como qualificar leads com BANT?",
    "includePrompt": false
  }' | jq
```

**Resultado Esperado:**

```json
{
  "success": true,
  "data": {
    "answer": "...", // Enriched prompt (LLM would generate answer from this)
    "sources": [
      {
        "title": "SPIN Selling: Guia Completo",
        "url": "/blog/spin-selling-guia-completo",
        "matchType": "direct"
      }
    ],
    "relatedConcepts": ["BANT", "Qualificação", "Discovery", "CRM"],
    "contextSummary": "Entidades identificadas: BANT, qualificação. Contexto expandido: +5 entidades relacionadas. 3 artigos relevantes encontrados. 2 com match direto."
  }
}
```

**Teste com Prompt Enrichment:**

```bash
curl -X POST "http://localhost:3000/api/agi/query" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Como qualificar leads com BANT?",
    "includePrompt": true
  }' | jq
```

**Resultado Esperado:**

```json
{
  "success": true,
  "data": {
    "context": {
      "userQuery": "Como qualificar leads com BANT?",
      "extractedEntities": [...],
      "expandedEntities": [...],
      "relevantContent": [...],
      "contextSummary": "..."
    },
    "enrichedPrompt": "Você é um assistente...\n\n## Contexto do Knowledge Graph\n\n**Entidades Identificadas:**\n- BANT (Methodology)\n- Qualificação (Concept)\n...",
    "totalEntities": 8,
    "totalContent": 3
  }
}
```

---

### 8. Graph Visualization Data

**Endpoint:** `GET /api/graph/visualization?depth=2&minStrength=0.3`

**Teste:**

```bash
curl -X GET "http://localhost:3000/api/graph/visualization?depth=2&minStrength=0.3" | jq
```

**Resultado Esperado:**

```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "...",
        "name": "CRM",
        "type": "Technology",
        "group": 2,
        "size": 15,
        "description": "...",
        "wikidataId": "https://www.wikidata.org/wiki/Q16635046",
        "contentCount": 3
      }
    ],
    "links": [
      {
        "source": "entity-1-id",
        "target": "entity-2-id",
        "type": "enables",
        "strength": 0.85,
        "value": 4.25
      }
    ],
    "stats": {
      "totalNodes": 87,
      "totalLinks": 142,
      "maxDepth": 2
    }
  }
}
```

---

## Testes de Performance

### 1. Query Response Time

**Objetivo:** Verificar que queries respondem em < 500ms.

**Teste:**

```bash
# Instalar httpie (se necessário)
# npm install -g httpie

# Testar com timing
time curl -X POST "http://localhost:3000/api/agi/diagnose" \
  -H "Content-Type: application/json" \
  -d '{"problem": "alta latência"}'
```

**Resultado Esperado:**

```
real    0m0.287s  # < 500ms ✅
user    0m0.015s
sys     0m0.000s
```

**Benchmarks Esperados:**

| Endpoint | Tempo Médio | Max Aceitável |
|----------|-------------|---------------|
| `/api/nlp/entities` | ~50ms | 200ms |
| `/api/agi/diagnose` | ~300ms | 500ms |
| `/api/agi/recommend` | ~150ms | 300ms |
| `/api/agi/enrich` | ~100ms | 250ms |
| `/api/agi/query` | ~200ms | 400ms |
| `/api/graph/visualization` | ~180ms | 350ms |

---

### 2. Concurrent Requests

**Objetivo:** Verificar que sistema suporta múltiplas requisições simultâneas.

**Teste:**

```bash
# Instalar Apache Bench
# sudo apt-get install apache2-utils (Linux)
# brew install apache2 (Mac)

# Teste: 100 requests, 10 concurrent
ab -n 100 -c 10 -p query.json -T application/json http://localhost:3000/api/agi/recommend
```

**Arquivo query.json:**

```json
{
  "userInput": "Como melhorar vendas?",
  "conversationHistory": []
}
```

**Resultado Esperado:**

```
Requests per second: > 20 req/s
Time per request: < 500ms (mean)
Failed requests: 0
```

---

### 3. Database Connection Pool

**Objetivo:** Verificar que pool de conexões não esgota.

**Teste:**

```bash
# Executar 50 queries simultâneas
for i in {1..50}; do
  curl -X POST "http://localhost:3000/api/agi/query" \
    -H "Content-Type: application/json" \
    -d '{"query": "teste"}' &
done
wait

# Verificar logs para erros de pool
```

**Resultado Esperado:**

```
✅ Todas as requests completam sem erro "pool exhausted"
✅ Logs não mostram warnings de conexão
```

---

## Testes de Integração

### 1. E2E: User Journey - Diagnóstico Completo

**Cenário:** Usuário quer resolver problema de vendas.

**Fluxo:**

```typescript
// 1. Diagnóstico inicial
POST /api/agi/diagnose
{
  "problem": "Meu time demora 24h para responder leads"
}

// Retorna: "Solução: CRM com Automação"

// 2. Buscar mais info sobre solução
POST /api/agi/recommend
{
  "userInput": "Como implementar CRM com automação?",
  "conversationHistory": ["Problema: latência 24h"]
}

// Retorna: Artigos sobre CRM + Automação

// 3. Buscar caminho de aprendizado
GET /api/agi/learning-path?topic=CRM

// Retorna: Roadmap de aprendizado

// 4. Gerar resposta final enriquecida
POST /api/agi/enrich
{
  "response": "Implemente CRM com automação de follow-up para reduzir latência.",
  "userInput": "Como resolver?",
  "includeSources": true
}

// Retorna: Resposta com citações e links
```

**Validação:**

- ✅ Cada step retorna dados consistentes
- ✅ Entidades mencionadas são linkadas corretamente
- ✅ Recomendações são relevantes (score > 0.5)
- ✅ Tempo total < 2 segundos

---

### 2. Graph Traversal Consistency

**Objetivo:** Verificar que caminhos no grafo são simétricos.

**Teste:**

```bash
# Path A → B
curl -X GET "http://localhost:3000/api/agi/explain-relationship?concept1=CRM&concept2=conversão"

# Path B → A (deve ser simétrico)
curl -X GET "http://localhost:3000/api/agi/explain-relationship?concept1=conversão&concept2=CRM"
```

**Validação:**

- ✅ Ambos retornam path válido
- ✅ Strength é consistente (diferença < 10%)
- ✅ Path intermediário é o mesmo

---

## Troubleshooting

### Problema 1: Graph Visualization não carrega

**Sintoma:** Spinner infinito em /admin/graph-viz

**Diagnóstico:**

```bash
# Verificar se API retorna dados
curl http://localhost:3000/api/graph/visualization | jq

# Verificar logs do servidor
# Procurar por erros de D3.js ou PostgreSQL
```

**Soluções:**

1. **Sem dados no grafo:**
   ```bash
   # Processar blog posts
   curl -X POST http://localhost:3000/api/nlp/process-blog-posts
   ```

2. **Erro de D3.js:**
   ```bash
   # Reinstalar D3
   npm install d3 @types/d3 --save
   ```

3. **Timeout de query:**
   ```sql
   -- Verificar slow queries
   SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
   ```

---

### Problema 2: RAG Query retorna contexto vazio

**Sintoma:**

```json
{
  "extractedEntities": [],
  "relevantContent": []
}
```

**Diagnóstico:**

```bash
# Verificar se entidades existem
curl "http://localhost:3000/api/nlp/entities?q=CRM&limit=5"

# Se vazio, entidades não foram extraídas
```

**Solução:**

```bash
# Reprocessar blog posts
curl -X POST http://localhost:3000/api/nlp/process-blog-posts \
  -H "Content-Type: application/json" \
  -d '{"forceReprocess": true}'
```

---

### Problema 3: Performance Degradada

**Sintoma:** Queries > 1 segundo

**Diagnóstico:**

```sql
-- Verificar missing indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE tablename IN ('Entity', 'Relationship', 'ContentEntity');

-- Verificar stats
SELECT * FROM "EntityExtraction" WHERE status = 'pending';
```

**Solução:**

```sql
-- Criar indexes faltantes (se necessário)
CREATE INDEX IF NOT EXISTS idx_relationship_source ON "Relationship"("sourceEntityId");
CREATE INDEX IF NOT EXISTS idx_relationship_target ON "Relationship"("targetEntityId");
CREATE INDEX IF NOT EXISTS idx_relationship_strength ON "Relationship"("strength");

-- Vacuum database
VACUUM ANALYZE;
```

---

## Checklist Final

Antes de considerar Fase 4 completa, verifique:

### Funcionalidades

- [ ] Admin dashboard mostra stats corretas
- [ ] Graph visualization renderiza e é interativo
- [ ] Todos os 6 endpoints AGI funcionam
- [ ] Graph-RAG retorna contexto enriquecido
- [ ] Auto-citation insere links corretamente

### Performance

- [ ] Queries < 500ms (95th percentile)
- [ ] Graph visualization carrega < 3s
- [ ] Suporta 10+ concurrent requests
- [ ] Sem memory leaks (rodar 1000 requests)

### Dados

- [ ] > 200 entidades no banco
- [ ] > 150 relacionamentos
- [ ] 7/7 blog posts processados
- [ ] Density > 1%

### Documentação

- [ ] PHASE4_AGI_INTEGRATION.md está completo
- [ ] PHASE4_TESTING_GUIDE.md está completo
- [ ] KNOWLEDGE_GRAPH_ANALYSIS.md atualizado

---

## Próximos Passos (Fase 5 - Opcional)

Após validar tudo acima, considerar:

1. **Cache Layer (Redis)** - Para queries repetidas
2. **Neo4j Migration** - Se > 10K entidades
3. **Real-time Updates** - WebSockets para graph changes
4. **Advanced Analytics** - PageRank, betweenness centrality
5. **Content Gap Analysis** - Identificar tópicos não cobertos

---

**Última Atualização:** 2025-01-30
**Status:** ✅ Fase 4 Completa e Testada
