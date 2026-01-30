# NLP Pipeline - Guia de Implementação

**Status**: ✅ Implementado
**Objetivo**: Extração automatizada de entidades e relacionamentos semânticos usando LLMs
**Stack**: Groq (LLM), PostgreSQL (Graph DB), Vercel AI SDK, Prisma

---

## Visão Geral

Este pipeline implementa o **Capítulo 1.3 do Relatório Técnico** - Expansão Automatizada do Grafo de Conhecimento. Ao processar conteúdo (blog posts, documentação, artigos), o sistema:

1. **Extrai entidades** (conceitos, tecnologias, metodologias, personas, etc.)
2. **Identifica relacionamentos** entre entidades (triplas RDF: Sujeito -> Predicado -> Objeto)
3. **Persiste no PostgreSQL** usando tabelas relacionais que simulam um grafo
4. **Enriquece com Wikidata IDs** automaticamente quando possível
5. **Rastreia freshness** (recência) atualizando `lastSeen` em relacionamentos

---

## Arquitetura

```
┌─────────────────┐
│  Content Input  │ (Blog Post, Documentation, etc.)
└────────┬────────┘
         │
         v
┌─────────────────┐
│  API Endpoint   │ POST /api/nlp/extract
│  /Server Action │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Groq LLM       │ llama-3.3-70b-versatile
│  (JSON Mode)    │ Structured extraction
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Zod Validation │ Type-safe parsing
└────────┬────────┘
         │
         v
┌─────────────────┐
│  Wikidata       │ Enrich entities with Q-codes
│  Enrichment     │
└────────┬────────┘
         │
         v
┌─────────────────┐
│  PostgreSQL     │ Entity, Relationship tables
│  (Prisma)       │
└─────────────────┘
```

---

## Modelos de Dados (Prisma)

### Entity
Representa um nó no grafo de conhecimento.

```prisma
model Entity {
  id          String   @id @default(uuid())
  name        String   // "CRM", "SPIN Selling", etc.
  wikidataId  String?  @unique // "Q16635046"
  type        String   // methodology, technology, industry, persona, etc.
  description String?
  aliases     String[] // Alternative names
  metadata    Json     // Flexible storage

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  subjectRelationships Relationship[] @relation("SubjectEntity")
  objectRelationships  Relationship[] @relation("ObjectEntity")
  contentLinks         ContentEntity[]
}
```

### Relationship
Representa arestas no grafo (triplas RDF).

```prisma
model Relationship {
  id         String   @id @default(uuid())
  subjectId  String
  predicate  String   // uses, usedBy, subclassOf, etc.
  objectId   String
  confidence Float    @default(1.0) // 0-1
  source     String?  // URL/ID of content
  lastSeen   DateTime @default(now()) // Freshness

  subject Entity @relation("SubjectEntity", ...)
  object  Entity @relation("ObjectEntity", ...)

  @@unique([subjectId, predicate, objectId])
}
```

### EntityExtraction
Rastreia execuções do pipeline.

```prisma
model EntityExtraction {
  id                      String  @id @default(uuid())
  contentType             String  // blog_post, documentation, etc.
  contentId               String?
  contentUrl              String?
  textSample              String? // First 500 chars
  extractedEntities       Json    // Raw LLM output
  extractedRelationships  Json
  modelUsed               String? // llama-3.3-70b-versatile
  tokensUsed              Int?
  processingTimeMs        Int?
  status                  String  @default("pending")
  error                   String?

  createdAt   DateTime  @default(now())
  completedAt DateTime?
}
```

### ContentEntity
Vincula conteúdo às entidades extraídas (many-to-many).

```prisma
model ContentEntity {
  id          String  @id @default(uuid())
  contentType String
  contentId   String  // Slug or ID
  entityId    String
  relevance   Float   @default(1.0)
  context     String? // Sentence where found

  entity Entity @relation(...)
}
```

---

## Setup & Configuração

### 1. Instalar Dependências

```bash
npm install ai groq-sdk zod
```

### 2. Configurar Variáveis de Ambiente

Adicione ao `.env`:

```bash
# Groq API Key (get from https://console.groq.com/keys)
GROQ_API_KEY="gsk_..."
```

### 3. Executar Migração do Banco

```bash
# Aplicar schema manualmente (se não usar Prisma Migrate)
psql -U postgres -d sirius_crm -f prisma/migrations/add_knowledge_graph.sql

# OU gerar e aplicar via Prisma
npx prisma db push
npx prisma generate
```

---

## Uso

### Opção 1: Via API REST

```bash
curl -X POST http://localhost:3000/api/nlp/extract \
  -H "Content-Type: application/json" \
  -d '{
    "text": "SPIN Selling is a sales methodology that uses CRM to track customer interactions...",
    "contentType": "blog_post",
    "contentId": "spin-selling-guide",
    "contentUrl": "/blog/spin-selling-guide"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "entities": [
      {
        "name": "SPIN Selling",
        "type": "methodology",
        "wikidataId": "Q7570944",
        "relevance": 0.95,
        "context": "SPIN Selling is a sales methodology..."
      },
      {
        "name": "CRM",
        "type": "technology",
        "wikidataId": "Q16635046",
        "relevance": 0.85
      }
    ],
    "relationships": [
      {
        "subject": "SPIN Selling",
        "predicate": "uses",
        "object": "CRM",
        "confidence": 0.9
      }
    ]
  },
  "extractionId": "uuid-here",
  "processingTimeMs": 2341,
  "tokensUsed": 1523
}
```

### Opção 2: Via Server Action

```typescript
import { processContentNLP } from '@/lib/nlp/pipeline'

const result = await processContentNLP({
  text: 'Your content here...',
  contentType: 'blog_post',
  contentId: 'my-article-slug',
})

if (result.success) {
  console.log('Extracted:', result.data.entities)
}
```

### Opção 3: Buscar Entidades

```bash
curl "http://localhost:3000/api/nlp/entities?q=CRM&limit=10"
```

### Opção 4: Estatísticas do Grafo

```bash
curl http://localhost:3000/api/nlp/stats
```

**Response:**
```json
{
  "totalEntities": 156,
  "totalRelationships": 283,
  "totalExtractions": 42,
  "avgRelationshipsPerEntity": "1.81",
  "recentExtractions": [...]
}
```

---

## Teste do Pipeline

Execute o script de teste:

```bash
npx tsx scripts/test-nlp-pipeline.ts
```

**Saída esperada:**
```
🧠 NLP Pipeline - Test Script
======================================================================

📄 Processing sample content...

✅ Extraction completed!

📊 EXTRACTION RESULTS:

⏱️  Processing Time: 2341ms
🆔 Extraction ID: abc-123-def
🔢 Tokens Used: 1523

──────────────────────────────────────────────────────────────────────

🏷️  ENTITIES EXTRACTED:

1. SPIN Selling
   Type: methodology
   Wikidata ID: Q7570944
   Relevance: 95%
   Description: Sales methodology developed by Neil Rackham

2. CRM
   Type: technology
   Wikidata ID: Q16635046
   Relevance: 90%

... (more entities)

──────────────────────────────────────────────────────────────────────

🔗 RELATIONSHIPS EXTRACTED:

1. SPIN Selling --[uses]--> CRM
   Confidence: 90%
   Source: "SPIN Selling combined with CRM tools..."

2. Sales Representative --[uses]--> SPIN Selling
   Confidence: 85%

... (more relationships)

✨ Test completed successfully!
```

---

## Integração com Sistema Existente

### 1. Processar Novos Blog Posts

```typescript
// app/(marketing)/blog/[slug]/page.tsx
import { processContentNLP } from '@/lib/nlp/pipeline'

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getBlogPost(params.slug)

  // Trigger NLP extraction in background
  if (process.env.NODE_ENV === 'production') {
    processContentNLP({
      text: post.content,
      contentType: 'blog_post',
      contentId: post.slug,
      contentUrl: `/blog/${post.slug}`,
    }).catch(console.error)
  }

  return <article>...</article>
}
```

### 2. Query do Grafo para Agente Conversacional

```typescript
import { findRelatedEntities, searchEntities } from '@/lib/nlp/pipeline'

// Usuário pergunta: "Como SPIN Selling se relaciona com CRM?"
const spinEntity = await searchEntities('SPIN Selling', 1)
if (spinEntity[0]) {
  const related = await findRelatedEntities(spinEntity[0].id, 2, 'uses')
  // Retorna: CRM, Sales Representative, etc.
}
```

### 3. Visualização do Grafo (Futuro)

```typescript
// Dashboard admin para visualizar grafo
export default async function KnowledgeGraphPage() {
  const stats = await getGraphStats()
  const entities = await prisma.entity.findMany({ take: 100 })
  const relationships = await prisma.relationship.findMany({ take: 200 })

  return <GraphVisualization nodes={entities} edges={relationships} />
}
```

---

## Performance & Custos

### Groq (llama-3.3-70b-versatile)

- **Velocidade**: ~500-800 tokens/segundo (ultra-rápido)
- **Custo**: ~$0.60 por 1M tokens de entrada, ~$0.90 por 1M tokens de saída
- **Exemplo**: Processar 2.000 palavras (~2.500 tokens) custa ~$0.003 (0.3 centavos)

### Estimativa de Volume

| Ação | Tokens | Custo/Execução |
|------|--------|----------------|
| Processar blog post (1500 palavras) | ~2000 input + 1000 output | $0.002 |
| Processar documentação (5000 palavras) | ~6500 input + 2000 output | $0.006 |
| Processar 100 artigos/mês | ~250K tokens total | $0.20/mês |

**Conclusão**: Custo trivial (<$1/mês) para volume médio de conteúdo.

---

## Limitações & Futuras Melhorias

### Limitações Atuais

1. **Sem Neo4j nativo**: Usamos PostgreSQL com tabelas relacionais. Para grafos massivos (100K+ entidades), Neo4j seria mais eficiente.
2. **Extração única por conteúdo**: Não re-processa conteúdo atualizado automaticamente.
3. **Sem entity disambiguation**: Duas menções de "Apple" (fruta vs. empresa) não são diferenciadas.

### Roadmap de Melhorias

**Fase 2 (Semanas 3-4):**
- [ ] Interface admin para curar entidades extraídas
- [ ] Re-processar conteúdo atualizado (webhook on update)
- [ ] Confidence threshold tuning (filtrar relacionamentos fracos)

**Fase 3 (Semanas 5-8):**
- [ ] Migrar para Neo4j para queries complexas
- [ ] Implementar entity linking para desambiguação
- [ ] Graph embeddings para similaridade semântica

**Fase 4 (Semanas 9-12):**
- [ ] Integração com Agente Conversacional (Honey Trap)
- [ ] Graph-augmented RAG (retrieval usando traversal)
- [ ] Auto-sugestões de conteúdo baseado em gaps no grafo

---

## Troubleshooting

### Erro: "No response from Groq API"

**Causa**: API key inválida ou rate limit excedido.

**Solução**:
```bash
# Verificar API key
echo $GROQ_API_KEY

# Testar manualmente
curl https://api.groq.com/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"
```

### Erro: Prisma "Entity table does not exist"

**Causa**: Migração não executada.

**Solução**:
```bash
psql -U postgres -d sirius_crm -f prisma/migrations/add_knowledge_graph.sql
npx prisma generate
```

### Erro: "Text too long"

**Causa**: Texto excede 50.000 caracteres.

**Solução**: Use `extractEntitiesBatch()` para dividir em chunks.

---

## Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `lib/nlp/types.ts` | Schemas Zod e tipos TypeScript |
| `lib/nlp/extract-entities.ts` | Função de extração via Groq LLM |
| `lib/nlp/pipeline.ts` | Orquestração e persistência no DB |
| `app/api/nlp/extract/route.ts` | API endpoint para extração |
| `app/api/nlp/entities/route.ts` | API endpoint para busca |
| `app/api/nlp/stats/route.ts` | API endpoint para estatísticas |
| `prisma/migrations/add_knowledge_graph.sql` | Migração SQL |
| `scripts/test-nlp-pipeline.ts` | Script de teste |

---

## Referências

- [Groq Documentation](https://console.groq.com/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Wikidata Query Service](https://query.wikidata.org/)
- [RDF Triple Store](https://www.w3.org/TR/rdf11-primer/)
- [Knowledge Graphs (Google)](https://developers.google.com/knowledge-graph)

---

**Última Atualização**: 2025-01-30
**Autor**: Claude Sonnet 4.5
**Status**: Production-ready (MVP)
