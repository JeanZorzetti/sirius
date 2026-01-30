# Neo4j Migration Plan - Knowledge Graph

**Status**: 📋 Planejado (Fase 3)
**Prioridade**: Médio (para grafos >10K entidades)
**Complexidade**: Alta
**Tempo Estimado**: 2-3 semanas

---

## Por Que Migrar para Neo4j?

### PostgreSQL (Atual)
✅ **Vantagens:**
- Já integrado no stack
- Ótimo para queries simples (1-2 hops)
- Joins relacionais familiares
- Transações ACID nativas

❌ **Limitações:**
- Queries multi-hop (3+ níveis) são lentas
- Sem algoritmos de grafo nativos (PageRank, Community Detection)
- Visualização de grafo requer parsing manual
- Escala mal com grafos densos (>100K nós)

### Neo4j (Proposto)
✅ **Vantagens:**
- **Cypher**: Linguagem declarativa para grafos
- **Path finding**: Shortest path, All paths em O(n)
- **Graph algorithms**: PageRank, Betweenness, Louvain
- **Visualização nativa**: Neo4j Browser
- **Performance**: 1000x mais rápido para queries multi-hop

❌ **Desvantagens:**
- Infraestrutura adicional (Docker container)
- Curva de aprendizado (Cypher vs SQL)
- Custo adicional (Neo4j Aura = $65/mês ou self-hosted)

---

## Quando Migrar?

**Agora (PostgreSQL suficiente):**
- < 1.000 entidades
- < 5.000 relacionamentos
- Queries simples (1-2 hops)
- Blog recommendations (já funcionam bem)

**Migrar para Neo4j quando:**
- > 10.000 entidades
- > 50.000 relacionamentos
- Queries complexas (3+ hops)
- Análise de comunidades/clusters
- Graph ML (embeddings, link prediction)
- Performance crítica para UX

**Decisão Atual:** Manter PostgreSQL por agora. Reavaliar em 6 meses ou quando atingir 5K entidades.

---

## Arquitetura Híbrida (Recomendado)

Em vez de migração total, usar **arquitetura híbrida**:

```
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL                              │
│  • Entities (metadata, aliases, descriptions)               │
│  • EntityExtraction (audit log, tokens, processing time)    │
│  • ContentEntity (blog post links)                          │
│  • Transações ACID, backups, segurança                      │
└──────────────────────┬──────────────────────────────────────┘
                       │ Sync (hourly)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      Neo4j                                  │
│  • Nodes (entities) - minimal data (id, name, type)         │
│  • Relationships (edges) - predicates, confidence           │
│  • Graph algorithms, path finding, clustering               │
│  • Read-heavy queries, visualizations                       │
└─────────────────────────────────────────────────────────────┘
```

**Vantagens:**
- PostgreSQL = source of truth (ACID, backups)
- Neo4j = query performance (grafos complexos)
- Sync unidirecional: Postgres → Neo4j
- Rollback fácil se Neo4j falhar

---

## Modelo de Dados Neo4j

### Nodes (Entidades)

```cypher
CREATE (e:Entity {
  id: "uuid-here",
  name: "SPIN Selling",
  type: "methodology",
  wikidataId: "Q7570944",
  createdAt: datetime()
})
```

**Labels:**
- `:Entity` (base label)
- `:Methodology`, `:Technology`, `:Industry`, etc. (type-specific)

### Relationships (Relacionamentos)

```cypher
CREATE (a:Entity {name: "SPIN Selling"})-[:USES {
  confidence: 0.9,
  source: "/blog/spin-selling-guia-completo",
  lastSeen: datetime()
}]->(b:Entity {name: "CRM"})
```

**Relationship Types:**
- `:USES`, `:USED_BY`, `:ENABLES`, `:SOLVES`, etc.
- Properties: `confidence`, `source`, `lastSeen`

---

## Plano de Migração (3 Fases)

### Fase 1: Setup & Prova de Conceito (1 semana)

**Ações:**
1. **Deploy Neo4j** (Docker Compose ou Neo4j Aura)
2. **Criar schema** (constraints, indexes)
3. **Script de sync** inicial (Postgres → Neo4j)
4. **Testar queries** Cypher vs SQL

**Entregáveis:**
- `docker-compose.neo4j.yml`
- `scripts/sync-to-neo4j.ts`
- `docs/CYPHER_CHEATSHEET.md`

**Validação:**
- [ ] Neo4j rodando localmente
- [ ] 100% das entidades migradas
- [ ] 100% dos relacionamentos migrados
- [ ] Query "Find all entities related to SPIN Selling (3 hops)" < 100ms

---

### Fase 2: Queries & Algoritmos (1 semana)

**Ações:**
1. **Reescrever queries** do blog processor para Cypher
2. **Implementar graph algorithms:**
   - PageRank (entidades mais influentes)
   - Community Detection (clusters de tópicos)
   - Shortest Path (relacionamento entre conceitos)
3. **Criar dashboards** com Neo4j Bloom ou custom UI

**Entregáveis:**
- `lib/neo4j/queries.ts` (Cypher queries)
- `lib/neo4j/algorithms.ts` (PageRank, Louvain)
- `app/admin/graph-viz/page.tsx` (visualização)

**Validação:**
- [ ] Recomendações semânticas 2x mais rápidas
- [ ] PageRank identifica top 10 entidades
- [ ] Clusters detectam "Sales", "Tech", "Real Estate" automaticamente

---

### Fase 3: Produção & Monitoramento (1 semana)

**Ações:**
1. **Deploy Neo4j** em produção (Aura ou EC2)
2. **Sync automático** (cron job: Postgres → Neo4j a cada hora)
3. **Fallback** para Postgres se Neo4j cair
4. **Monitoramento** (Prometheus + Grafana)

**Entregáveis:**
- `lib/neo4j/sync-daemon.ts` (sync automático)
- `lib/neo4j/health-check.ts` (fallback logic)
- Alertas (Neo4j lag, sync failures)

**Validação:**
- [ ] 99.9% uptime Neo4j
- [ ] Sync lag < 5 minutos
- [ ] Fallback automático funciona

---

## Scripts de Migração

### 1. Export PostgreSQL → Neo4j (CSV)

```typescript
// scripts/export-to-neo4j-csv.ts
import { prisma } from '@/lib/prisma'
import * as fs from 'fs'

async function exportEntitiesToCSV() {
  const entities = await prisma.entity.findMany()

  const csv = [
    'id:ID,name,type,:LABEL',
    ...entities.map(
      (e) => `${e.id},"${e.name}",${e.type},Entity;${capitalize(e.type)}`
    ),
  ].join('\n')

  fs.writeFileSync('neo4j-import/entities.csv', csv)
}

async function exportRelationshipsToCSV() {
  const rels = await prisma.relationship.findMany()

  const csv = [
    ':START_ID,:END_ID,:TYPE,confidence:float,source',
    ...rels.map(
      (r) =>
        `${r.subjectId},${r.objectId},${r.predicate.toUpperCase()},${r.confidence},"${r.source}"`
    ),
  ].join('\n')

  fs.writeFileSync('neo4j-import/relationships.csv', csv)
}

// Run both
exportEntitiesToCSV()
exportRelationshipsToCSV()
```

### 2. Import Neo4j (Cypher)

```bash
# Using neo4j-admin import (fastest for bulk data)
neo4j-admin import \
  --nodes=entities.csv \
  --relationships=relationships.csv \
  --database=knowledge-graph

# Or using LOAD CSV (for incremental updates)
cypher-shell -u neo4j -p password -f import.cypher
```

```cypher
# import.cypher
// Create constraints
CREATE CONSTRAINT entity_id IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE;
CREATE CONSTRAINT wikidata_id IF NOT EXISTS FOR (e:Entity) REQUIRE e.wikidataId IS UNIQUE;

// Create indexes
CREATE INDEX entity_name IF NOT EXISTS FOR (e:Entity) ON (e.name);
CREATE INDEX entity_type IF NOT EXISTS FOR (e:Entity) ON (e.type);

// Load entities
LOAD CSV WITH HEADERS FROM 'file:///entities.csv' AS row
CREATE (e:Entity {
  id: row.id,
  name: row.name,
  type: row.type
})
SET e:(row.LABEL);

// Load relationships
LOAD CSV WITH HEADERS FROM 'file:///relationships.csv' AS row
MATCH (a:Entity {id: row.START_ID})
MATCH (b:Entity {id: row.END_ID})
CREATE (a)-[r:RELATIONSHIP {
  type: row.TYPE,
  confidence: toFloat(row.confidence),
  source: row.source
}]->(b);
```

### 3. Sync Incremental (Hourly Cron)

```typescript
// lib/neo4j/sync.ts
import neo4j from 'neo4j-driver'
import { prisma } from '@/lib/prisma'

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
)

export async function syncEntitiesToNeo4j() {
  const session = driver.session()

  try {
    // Get entities modified in last hour
    const recentEntities = await prisma.entity.findMany({
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
    })

    for (const entity of recentEntities) {
      await session.run(
        `
        MERGE (e:Entity {id: $id})
        SET e.name = $name, e.type = $type, e.wikidataId = $wikidataId
        SET e:(LABELS($type))
        `,
        {
          id: entity.id,
          name: entity.name,
          type: entity.type,
          wikidataId: entity.wikidataId,
        }
      )
    }

    console.log(`[Neo4j Sync] Synced ${recentEntities.length} entities`)
  } finally {
    await session.close()
  }
}
```

---

## Exemplo: Query Comparison

### PostgreSQL (Atual)

```sql
-- Find all entities related to "SPIN Selling" (2 hops)
WITH first_hop AS (
  SELECT DISTINCT r.object_id
  FROM "Relationship" r
  JOIN "Entity" e ON e.id = r.subject_id
  WHERE e.name = 'SPIN Selling'
),
second_hop AS (
  SELECT DISTINCT r.object_id
  FROM "Relationship" r
  WHERE r.subject_id IN (SELECT object_id FROM first_hop)
)
SELECT e.* FROM "Entity" e
WHERE e.id IN (SELECT object_id FROM first_hop UNION SELECT object_id FROM second_hop);
```

**Performance:** ~200ms (com 500 entidades)

### Neo4j (Proposto)

```cypher
// Find all entities related to "SPIN Selling" (2 hops)
MATCH (spin:Entity {name: "SPIN Selling"})-[*1..2]-(related)
RETURN DISTINCT related.name, related.type
ORDER BY related.name;
```

**Performance:** ~10ms (com 500 entidades), ~50ms (com 50K entidades)

---

## Graph Algorithms (Neo4j GDS)

### PageRank (Entidades Mais Influentes)

```cypher
// Find most influential entities
CALL gds.pageRank.stream('knowledge-graph')
YIELD nodeId, score
RETURN gds.util.asNode(nodeId).name AS entity, score
ORDER BY score DESC
LIMIT 10;
```

**Output:**
```
CRM - 0.876
SPIN Selling - 0.654
Sales Pipeline - 0.543
Lead Generation - 0.432
...
```

### Community Detection (Clusters de Tópicos)

```cypher
// Detect topic clusters
CALL gds.louvain.stream('knowledge-graph')
YIELD nodeId, communityId
RETURN communityId, collect(gds.util.asNode(nodeId).name) AS entities
ORDER BY size(entities) DESC;
```

**Output:**
```
Community 1: [CRM, Salesforce, HubSpot, Pipeline, ...]  // Tech cluster
Community 2: [SPIN Selling, Sandler, Challenger Sale, ...] // Sales Methods
Community 3: [Real Estate, São Paulo, Corretor, ...] // Real Estate
```

---

## Custos

| Opção | Custo Mensal | Specs | Pros | Cons |
|-------|--------------|-------|------|------|
| **Neo4j Aura Free** | $0 | 50K nodes, 175K rels | Grátis, managed | Limitado |
| **Neo4j Aura Professional** | $65 | 200K nodes, 1M rels, 2GB RAM | Managed, backups | Caro |
| **Self-hosted (AWS EC2)** | ~$30 | t3.medium (4GB RAM) | Controle total | Ops overhead |
| **Docker Local** | $0 | Dev only | Testes | Não produção |

**Recomendação:** Começar com Docker local → Neo4j Aura Free → Self-hosted se escalar.

---

## Checklist de Decisão

Migrar para Neo4j **APENAS SE**:
- [ ] Temos >10K entidades no grafo
- [ ] Queries multi-hop são críticas para UX
- [ ] Time tem bandwidth para gerenciar infra adicional
- [ ] Orçamento permite $30-65/mês ou devops para self-host
- [ ] Testamos PoC e vimos >5x speedup

**Se não, manter PostgreSQL.**

---

## Próximos Passos (Quando Migrar)

1. **Semana 1:** Setup Docker + PoC (100 entidades)
2. **Semana 2:** Migração full + graph algorithms
3. **Semana 3:** Produção + monitoramento
4. **Semana 4:** A/B test (Postgres vs Neo4j) → Decidir

---

**Última Atualização**: 2025-01-30
**Autor**: Claude Sonnet 4.5
**Decisão**: 🟡 **Adiar por 6 meses** (PostgreSQL suficiente por enquanto)
