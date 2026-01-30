# Blog ↔ NLP Pipeline Integration

**Status**: ✅ Implementado e Testado
**Data**: 2025-01-30
**Capítulo**: 1 - Knowledge Graph Expansion (Complete)

---

## Visão Geral

Integração completa do **NLP Pipeline** com o **sistema de blog**, permitindo extração automatizada de entidades semânticas, construção do grafo de conhecimento, e recomendações inteligentes de conteúdo.

### Resultados de Produção

Após processar **todos os 7 blog posts** do Sirius CRM:

| Métrica | Valor |
|---------|-------|
| Posts Processados | 7/7 (100%) |
| Entidades Extraídas | 88 |
| Relacionamentos | 73 |
| Média Entidades/Post | 12.6 |
| Densidade do Grafo | 0.83 rel/entity |
| Tempo Total | 100.2s |
| Tokens Usados | ~33,904 |
| Custo Estimado | $0.03 |

---

## Arquitetura da Integração

```
┌─────────────────────────────────────────────────────────────────┐
│                         Blog Post                               │
│  (como-organizar-pipeline-vendas, spin-selling-guia-completo)   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              lib/nlp/blog-processor.ts                          │
│  • processBlogPost(slug)                                        │
│  • processBlogPostsBatch(slugs[])                               │
│  • getPostEntities(slug)                                        │
│  • getRelatedPostsByEntities(slug) ← Semantic Recommendations   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  lib/nlp/pipeline.ts                            │
│  • processContentNLP() → LLM Extraction                         │
│  • upsertEntity() → PostgreSQL                                  │
│  • upsertRelationship() → Graph Persistence                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              PostgreSQL Knowledge Graph                         │
│  Entity (88 nodes) ←→ Relationship (73 edges)                   │
│  ContentEntity (blog_post links)                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Componentes Implementados

### 1. Server Actions (lib/nlp/blog-processor.ts)

**Funções Principais:**

```typescript
// Processar um post específico
processBlogPost(slug: string): Promise<ExtractionResponse>

// Processar múltiplos posts em batch
processBlogPostsBatch(slugs?: string[]): Promise<BatchResult>

// Obter entidades de um post
getPostEntities(slug: string): Promise<Entity[]>

// Recomendações semânticas baseadas no grafo
getRelatedPostsByEntities(slug: string, limit = 3): Promise<BlogPost[]>

// Estatísticas de processamento
getBlogProcessingStats(): Promise<Stats>

// Verificar se post foi processado
isPostProcessed(slug: string): Promise<boolean>
```

**Funcionalidades:**

- ✅ Strip HTML tags para extração limpa
- ✅ Combina título + excerpt + conteúdo para contexto completo
- ✅ Rate limiting (500ms entre posts)
- ✅ Similarity scoring para recomendações
- ✅ Fallback para posts aleatórios se grafo vazio

---

### 2. Script Batch CLI (scripts/process-blog-posts.ts)

**Uso:**

```bash
# Processar apenas posts pendentes (default)
npx tsx scripts/process-blog-posts.ts

# Processar post específico
npx tsx scripts/process-blog-posts.ts --slug=spin-selling-guia-completo

# Reprocessar todos (force)
npx tsx scripts/process-blog-posts.ts --force
```

**Output:**

```
🤖 Blog Posts NLP Processor

📊 Current Status:
   Total Blog Posts: 7
   ✅ Already Processed: 7
   🏷️  Total Entities Extracted: 88
   📈 Avg Entities/Post: 12.6

🚀 Starting batch processing...

✅ Funil de Vendas: O Que É, Etapas e Como Criar o Seu [Guia Completo 2026]
   Entities: 16
   Relationships: 15
   Time: 30.6s
   Tokens: 6846
```

---

### 3. API Endpoint (POST /api/nlp/process-blog-posts)

**Request:**

```json
{
  "force": false,        // Reprocessar posts já processados?
  "slugs": ["slug1"]     // Opcional: posts específicos
}
```

**Response:**

```json
{
  "success": true,
  "total": 7,
  "successful": 7,
  "failed": 0,
  "results": [
    {
      "slug": "spin-selling-guia-completo",
      "title": "SPIN Selling: A Metodologia...",
      "entitiesCount": 14,
      "relationshipsCount": 11,
      "processingTimeMs": 28782,
      "tokensUsed": 6548
    }
  ]
}
```

---

### 4. Admin Dashboard (/admin/knowledge-graph)

**Features:**

1. **Statistics Cards:**
   - Total Entities
   - Blog Posts Processed
   - Graph Density (avg relationships/entity)
   - Total Extractions

2. **Recent Entities Table:**
   - Entity name + type + description
   - Wikidata link (se disponível)
   - Relationship count
   - Linked posts count

3. **Blog Posts Status:**
   - ✅ Processed / ⏳ Pending badges
   - Entities extracted count
   - Processing time + tokens used
   - Direct links to blog posts

4. **Interactive Actions:**
   - `Process Pending Posts (N)` - Processa apenas pendentes
   - `Reprocess All` - Force reprocessing
   - `Refresh Stats` - Atualiza métricas

**Screenshot (Descrição):**

```
┌─────────────────────────────────────────────────────────────────┐
│ SIRIUS ADMIN                        [Voltar ao App]            │
│ Knowledge Graph | Users | Analytics | SEO | Funnel | ...       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Knowledge Graph                                                │
│  Semantic entity extraction and relationship mapping            │
│                                                                 │
│  [Process Pending Posts (0)] [Reprocess All] [Refresh Stats]   │
│                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │ Total        │ │ Blog Posts   │ │ Avg Density  │           │
│  │ Entities     │ │ 7/7          │ │ 0.83         │           │
│  │ 88           │ │ 0 pending    │ │ rel/entity   │           │
│  └──────────────┘ └──────────────┘ └──────────────┘           │
│                                                                 │
│  Recent Entities              │  Blog Posts Status              │
│  ─────────────────────────    │  ──────────────────────────     │
│  • SPIN Selling              │  ✅ Como organizar Pipeline      │
│    methodology (Q7570944)     │     12 entities · 6.0s          │
│    14 rel · 3 posts           │                                 │
│                              │  ✅ SPIN Selling Guia            │
│  • CRM                       │     14 entities · 28.8s         │
│    technology (Q16635046)     │                                 │
│    22 rel · 5 posts           │  ...                            │
└─────────────────────────────────────────────────────────────────┘
```

---

### 5. Integração no Blog Post Page

**Modificações em app/(marketing)/blog/[slug]/page.tsx:**

```typescript
// ✨ NOVO: Auto-processamento opcional (produção)
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_AUTO_NLP === 'true') {
  processBlogPost(slug).catch(console.error)
}

// ✨ NOVO: Recomendações baseadas em grafo semântico
const relatedPosts = await getRelatedPostsByEntities(slug, 2)
// Antes: blogPosts.filter(p => p.slug !== slug).slice(0, 2) ← Aleatório
```

**Algoritmo de Recomendação:**

1. Busca entidades do post atual: `getPostEntities(slug)`
2. Encontra posts que compartilham essas entidades
3. Calcula similarity score = Σ(relevance) para cada post
4. Ordena por score e retorna top N
5. Fallback: posts aleatórios se grafo vazio

---

## Melhorias de Robustez

### Sanitização de Dados LLM

**Problema:** LLM pode retornar tipos/predicados fora do enum Zod.

**Solução:** Função `sanitizeExtractionData()` em [lib/nlp/extract-entities.ts](lib/nlp/extract-entities.ts:43):

```typescript
// Mapeia tipos inválidos → "other"
if (!VALID_ENTITY_TYPES.has(entity.type)) {
  console.warn(`Invalid entity type "${entity.type}", mapping to "other"`)
  entity.type = 'other'
}

// Mapeia predicados inválidos → "relatedTo"
if (!VALID_PREDICATES.has(relationship.predicate)) {
  console.warn(`Invalid predicate "${relationship.predicate}", mapping to "relatedTo"`)
  relationship.predicate = 'relatedTo'
}
```

**Exemplos de Mapeamento (Durante Processamento):**

- `"organization"` → `"other"` (Huthwaite Research Group)
- `"company"` → `"other"` (Salesforce, Gartner)
- `"publication"` → `"other"` (Harvard Business Review)
- `"measuredBy"` → `"relatedTo"`
- `"validates"` → `"relatedTo"`
- `"practices"` → `"relatedTo"`

**Resultado:** 100% success rate (7/7 posts processados).

---

## Resultados Detalhados por Post

| Post | Entidades | Relacionamentos | Tempo | Tokens | Destaques |
|------|-----------|-----------------|-------|--------|-----------|
| **Pipeline de Vendas** | 12 | 10 | 6.0s | 5874 | CRM, Kanban, Sales Pipeline |
| **CRM Simples vs Complexo** | 14 | 11 | 5.2s | 4674 | Salesforce, HubSpot, LGPD |
| **Ciência do Follow-up** | 10 | 8 | 6.8s | 4926 | Response Rate, Persistence |
| **Funil de Vendas** | 16 | 15 | 30.6s | 6846 | Sales Funnel, Conversion, B2B |
| **SPIN Selling** | 14 | 11 | 28.8s | 6548 | Neil Rackham, Huthwaite |
| **Custo Oculto Inação CRM** | 17 | 14 | 16.3s | 4027 | ROI, Context Switching Cost |
| **Planilha Comissão** | 5 | 4 | 2.5s | 1009 | Real Estate, Commission |

**Total:** 88 entidades, 73 relacionamentos, 33,904 tokens, $0.03

---

## Entidades Mais Conectadas (Top 10)

Baseado em `SELECT name, COUNT(*) FROM Relationship WHERE subjectId = entity.id OR objectId = entity.id GROUP BY name`:

1. **CRM** - 22 relacionamentos (technology)
2. **SPIN Selling** - 14 relacionamentos (methodology)
3. **Sales** - 12 relacionamentos (process)
4. **Lead** - 9 relacionamentos (concept)
5. **Conversion Rate** - 8 relacionamentos (metric)
6. **Follow-up** - 7 relacionamentos (process)
7. **Pipeline** - 6 relacionamentos (tool)
8. **B2B** - 6 relacionamentos (industry)
9. **ROI** - 5 relacionamentos (metric)
10. **WhatsApp** - 5 relacionamentos (tool)

---

## Exemplos de Relacionamentos Extraídos

```
SPIN Selling --[uses]--> CRM
CRM --[enables]--> Sales Automation
Sales Representative --[uses]--> SPIN Selling
Lead --[partOf]--> Sales Funnel
Follow-up --[increases]--> Conversion Rate
Pipeline --[usedIn]--> Sales Management
Kanban --[visualizes]--> Pipeline
ROI --[measures]--> CRM Effectiveness
WhatsApp --[usedBy]--> Sales Representative
Brazil --[operates]--> Real Estate Market
```

---

## Próximos Passos (Roadmap)

### Fase 2 (Semanas 3-4) - ✅ Completo
- [x] Blog post processing automation
- [x] Semantic recommendations engine
- [x] Admin dashboard for curation
- [x] Batch processing CLI

### Fase 3 (Semanas 5-8) - Planejado
- [ ] Entity disambiguation (Apple fruta vs Apple empresa)
- [ ] Confidence threshold tuning (filtrar relacionamentos fracos)
- [ ] Re-processar conteúdo quando atualizado (webhook)
- [ ] Export grafo para Neo4j (queries complexas)

### Fase 4 (Semanas 9-12) - Planejado
- [ ] Integração com Agente Conversacional (Honey Trap)
- [ ] Graph-augmented RAG (retrieval usando traversal)
- [ ] Auto-sugestões de conteúdo baseado em gaps no grafo
- [ ] Visualização interativa do grafo (D3.js/Cytoscape)

---

## Configuração de Produção

### Variáveis de Ambiente

```bash
# .env
GROQ_API_KEY="gsk_..."              # Obrigatório para extração
ENABLE_AUTO_NLP="true"              # Opcional: auto-processar novos posts
```

### Auto-Processamento

Para habilitar processamento automático de posts quando visitados pela primeira vez:

1. Adicione `ENABLE_AUTO_NLP=true` ao `.env`
2. Deploy para produção
3. Posts serão processados em background no primeiro acesso

**Nota:** Desabilitado por padrão para evitar custos inesperados. Use batch script manualmente se preferir.

---

## Performance e Custos

### Groq API (llama-3.3-70b-versatile)

| Métrica | Valor |
|---------|-------|
| Velocidade | ~500-800 tokens/s |
| Custo Input | $0.60 / 1M tokens |
| Custo Output | $0.90 / 1M tokens |
| Custo Médio/Post | $0.004 |

### Estimativa Mensal

| Ação | Posts/Mês | Custo/Mês |
|------|-----------|-----------|
| Processar 10 posts novos | 10 | $0.04 |
| Processar 50 posts novos | 50 | $0.20 |
| Reprocessar todos (7) | 4x | $0.11 |
| **Total Estimado** | - | **$0.31/mês** |

**Conclusão:** Custo trivial para volume médio de conteúdo.

---

## Troubleshooting

### Erro: "Entity table does not exist"

**Causa:** Migração do banco não executada.

**Solução:**

```bash
npx prisma db push
npx prisma generate
```

### Erro: "Invalid entity type/predicate"

**Causa:** LLM retornou tipo fora do enum.

**Solução:** Automática! Sanitização mapeia para "other"/"relatedTo".

### Posts não processados aparecem como "Pending"

**Causa:** Script batch ainda não rodado ou falha silenciosa.

**Solução:**

```bash
npx tsx scripts/process-blog-posts.ts --force
```

### Dashboard vazio após processar

**Causa:** Cache do Next.js.

**Solução:** Refresh a página ou use `router.refresh()` no client.

---

## Testing

### Teste Manual

```bash
# 1. Processar todos os posts
npx tsx scripts/process-blog-posts.ts

# 2. Verificar entidades no banco
npx prisma studio
# Navigate to: Entity, Relationship, ContentEntity tables

# 3. Testar API de stats
curl http://localhost:3000/api/nlp/stats

# 4. Testar dashboard admin
# Navigate to: http://localhost:3000/admin/knowledge-graph

# 5. Testar recomendações
# Navigate to: http://localhost:3000/blog/spin-selling-guia-completo
# Verifique seção "Leia também" (deve mostrar posts relacionados)
```

### Teste Automatizado (Futuro)

```typescript
// __tests__/nlp/blog-processor.test.ts
describe('Blog NLP Integration', () => {
  it('should extract entities from blog post', async () => {
    const result = await processBlogPost('spin-selling-guia-completo')
    expect(result.success).toBe(true)
    expect(result.entitiesCount).toBeGreaterThan(0)
  })

  it('should recommend related posts', async () => {
    const related = await getRelatedPostsByEntities('spin-selling-guia-completo')
    expect(related).toHaveLength(2)
    expect(related[0].slug).not.toBe('spin-selling-guia-completo')
  })
})
```

---

## Referências

- [NLP Pipeline Guide](./NLP_PIPELINE_GUIDE.md) - Guia completo do pipeline
- [Knowledge Graph Analysis](./KNOWLEDGE_GRAPH_ANALYSIS.md) - Análise do grafo
- [Groq Documentation](https://console.groq.com/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)

---

**Última Atualização**: 2025-01-30
**Autor**: Claude Sonnet 4.5
**Status**: Production-ready ✅
