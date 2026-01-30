# Como Testar a Fase 4 - Guia Rápido

**Data:** 2025-01-30

---

## Início Rápido (5 minutos)

### 1. Verificar que servidor está rodando

```bash
cd "c:\Users\jeanz\OneDrive\Desktop\ROI Labs\CRM\crm-project"
npm run dev
```

Aguarde até ver:
```
✓ Ready in 3.2s
Local: http://localhost:3000
```

---

### 2. Testar Admin Dashboard

**URL:** http://localhost:3000/admin

**O que verificar:**

✅ Widget "Knowledge Graph" está visível
✅ Mostra estatísticas:
   - Entidades Extraídas: ~88
   - Blog Posts Processados: 7/7
   - Densidade do Grafo: ~1.11%

**Screenshot esperado:**

```
┌─────────────────────────────────────┐
│ Knowledge Graph                     │
├─────────────────────────────────────┤
│ Entities Extracted:     88          │
│ Blog Posts Processed:   7/7         │
│ Graph Density:          1.11%       │
│                                     │
│ [Process Pending Posts]             │
└─────────────────────────────────────┘
```

---

### 3. Testar Graph Visualization

**URL:** http://localhost:3000/admin/graph-viz

**O que fazer:**

1. Aguarde carregar (2-3 segundos)
2. Veja o grafo renderizado com nós coloridos
3. Clique e arraste um nó → deve mover
4. Scroll do mouse → deve dar zoom
5. Clique em um nó → deve mostrar detalhes na lateral

**Screenshot esperado:**

```
[Grafo Force-Directed]
- ~100 nós coloridos por tipo
- Links conectando nós
- Controles: Profundidade [2], Força Mínima [0.30]
- Stats: 87 Entidades | 142 Relacionamentos | Zoom: 1.00x
```

**Se não carregar:**
- Abrir DevTools (F12) → Console
- Ver se há erro de API
- Testar API diretamente: http://localhost:3000/api/graph/visualization

---

### 4. Testar APIs (cURL)

#### 4.1 Diagnóstico de Problema

```bash
curl -X POST "http://localhost:3000/api/agi/diagnose" \
  -H "Content-Type: application/json" \
  -d "{\"problem\": \"Meu time demora 24h para responder leads\"}"
```

**Resultado esperado:**

```json
{
  "success": true,
  "diagnosis": {
    "problem": "Meu time demora 24h para responder leads",
    "diagnosis": "Identificados X caminhos de solução...",
    "solutions": [...]
  }
}
```

---

#### 4.2 Recomendação de Conteúdo

```bash
curl -X POST "http://localhost:3000/api/agi/recommend" \
  -H "Content-Type: application/json" \
  -d "{\"userInput\": \"Como melhorar vendas?\", \"conversationHistory\": []}"
```

**Resultado esperado:**

```json
{
  "success": true,
  "recommendations": {
    "recommendations": [
      {
        "title": "SPIN Selling: Guia Completo",
        "url": "/blog/spin-selling-guia-completo",
        "relevance": 0.92
      }
    ]
  }
}
```

---

#### 4.3 Auto-Citação

```bash
curl -X POST "http://localhost:3000/api/agi/enrich" \
  -H "Content-Type: application/json" \
  -d "{\"response\": \"Use CRM para melhorar conversão\", \"userInput\": \"Como vender mais?\"}"
```

**Resultado esperado:**

```json
{
  "success": true,
  "enriched": {
    "response": "Use [CRM](/blog/crm) para melhorar conversão...\n\n**Leia também:**\n...",
    "citations": [...]
  }
}
```

---

#### 4.4 Graph-Augmented RAG

```bash
curl -X POST "http://localhost:3000/api/agi/query" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"Como qualificar leads com BANT?\"}"
```

**Resultado esperado:**

```json
{
  "success": true,
  "data": {
    "sources": [...],
    "relatedConcepts": ["BANT", "Qualificação", "Discovery"],
    "contextSummary": "Entidades identificadas: BANT, qualificação. Contexto expandido: +5 entidades relacionadas..."
  }
}
```

---

#### 4.5 Caminho de Aprendizado

```bash
curl -X GET "http://localhost:3000/api/agi/learning-path?topic=SPIN%20Selling"
```

**Resultado esperado:**

```json
{
  "success": true,
  "learningPath": {
    "learningPath": [
      {
        "step": 1,
        "topic": "Fundamentos de Vendas",
        "resources": [...]
      },
      {
        "step": 2,
        "topic": "SPIN Selling",
        "resources": [...]
      }
    ],
    "estimatedReadingTime": 60
  }
}
```

---

## Testes com Postman/Insomnia

Se preferir interface gráfica:

### 1. Importar Collection

Crie uma collection com os endpoints acima.

### 2. Variáveis de Ambiente

```json
{
  "baseUrl": "http://localhost:3000"
}
```

### 3. Exemplos de Requests

**Diagnose:**
- Method: POST
- URL: {{baseUrl}}/api/agi/diagnose
- Body:
  ```json
  {
    "problem": "Alta taxa de churn"
  }
  ```

**Recommend:**
- Method: POST
- URL: {{baseUrl}}/api/agi/recommend
- Body:
  ```json
  {
    "userInput": "Como melhorar qualificação?",
    "conversationHistory": []
  }
  ```

---

## Verificações de Saúde

### 1. Banco de Dados

```bash
# Conectar ao PostgreSQL
psql $DATABASE_URL

# Verificar entidades
SELECT COUNT(*) FROM "Entity";
# Esperado: ~210

# Verificar relacionamentos
SELECT COUNT(*) FROM "Relationship";
# Esperado: ~155

# Verificar extractions
SELECT COUNT(*) FROM "EntityExtraction" WHERE status = 'completed';
# Esperado: 7
```

---

### 2. Performance

Todas as queries devem responder em < 500ms:

```bash
# Testar com timing
time curl -X POST "http://localhost:3000/api/agi/diagnose" \
  -H "Content-Type: application/json" \
  -d '{"problem": "teste"}'

# Resultado esperado:
# real    0m0.287s  (< 500ms ✅)
```

---

### 3. Logs do Servidor

Verificar que não há erros:

```bash
# No terminal onde npm run dev está rodando
# Procurar por:
✅ [API /agi/diagnose] Success
❌ [API /agi/diagnose] Error: ...  # NÃO deve aparecer
```

---

## Problemas Comuns

### Problema: Graph Visualization não carrega

**Solução 1:** Verificar se D3.js está instalado
```bash
npm install d3 @types/d3 --save
```

**Solução 2:** Limpar cache e rebuild
```bash
rm -rf .next
npm run build
npm run dev
```

---

### Problema: API retorna "No entities found"

**Solução:** Processar blog posts
```bash
curl -X POST "http://localhost:3000/api/nlp/process-blog-posts" \
  -H "Content-Type: application/json" \
  -d '{"forceReprocess": true}'
```

Aguarde ~30 segundos (processamento de 7 posts).

---

### Problema: Queries muito lentas (> 1s)

**Solução:** Verificar indexes no banco
```sql
-- Conectar ao PostgreSQL
psql $DATABASE_URL

-- Criar indexes faltantes
CREATE INDEX IF NOT EXISTS idx_relationship_source ON "Relationship"("sourceEntityId");
CREATE INDEX IF NOT EXISTS idx_relationship_target ON "Relationship"("targetEntityId");
CREATE INDEX IF NOT EXISTS idx_entity_name ON "Entity"("name");

-- Vacuum
VACUUM ANALYZE;
```

---

## Checklist Final

Antes de considerar testes completos, verificar:

- [ ] Admin dashboard mostra stats ✅
- [ ] Graph visualization renderiza ✅
- [ ] POST /api/agi/diagnose funciona ✅
- [ ] POST /api/agi/recommend funciona ✅
- [ ] POST /api/agi/enrich funciona ✅
- [ ] GET /api/agi/learning-path funciona ✅
- [ ] POST /api/agi/query funciona ✅
- [ ] GET /api/graph/visualization funciona ✅
- [ ] Todas as queries < 500ms ✅
- [ ] Sem erros nos logs ✅

---

## Documentação Completa

Para testes mais detalhados, consultar:

- [PHASE4_TESTING_GUIDE.md](./PHASE4_TESTING_GUIDE.md) - Guia completo de testes
- [PHASE4_AGI_INTEGRATION.md](./PHASE4_AGI_INTEGRATION.md) - Documentação técnica
- [KNOWLEDGE_GRAPH_ANALYSIS.md](./KNOWLEDGE_GRAPH_ANALYSIS.md) - Análise completa do sistema

---

**Status:** ✅ Fase 4 Completa
**Última Atualização:** 2025-01-30
