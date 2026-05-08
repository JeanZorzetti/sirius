# POP — Página de Analytics (Sirius CRM)

**Procedimento Operacional Padrão**
URL: `https://siriuscrm.com.br/dashboard/analytics`
Versão: 2.0 — 2026-05-08
Responsável técnico: Jean Zorzetti (ROI Labs)

---

## 1. Objetivo

Documentar de forma completa o funcionamento da página `/dashboard/analytics` do Sirius CRM: estrutura, fluxos de dados, KPIs calculados, dependências, filtros, gráficos, tabelas do banco envolvidas e regras de acesso.

Público-alvo: desenvolvedores, suporte técnico e operação.

---

## 2. Resumo Executivo

A página `/dashboard/analytics` é o painel único de inteligência comercial do Sirius CRM. Apresenta visões consolidadas dos negócios (deals) da organização autenticada, segmentadas por pipeline, etapa, status, cliente e período.

A página possui **uma única visão** (tab única — todos os planos) com:
- 6 KPI cards baseados em `Deal.status` (ACTIVE / WON / LOST)
- Gráfico por etapa, análise mensal e análise por cliente

---

## 3. Conceitos Fundamentais: Expectativa vs Realizado

Esta distinção é crítica para interpretar corretamente os KPIs:

| Conceito | Fonte | Onde é preenchido |
|---------|-------|-------------------|
| **Expectativa de valor** | `Deal.value` | Campo "Valor" no modal de Deal |
| **Valor real recebido** | `DealClosing.value` | Aba "Fechamentos" no modal de Deal |

- `Deal.value` é definido pelo vendedor ao criar/editar o negócio — é uma expectativa.
- `DealClosing.value` é registrado manualmente após o pagamento — é o valor efetivamente recebido.
- Um negócio pode ter múltiplos `DealClosing` (pagamentos parciais, parcelas).
- Quando não há fechamentos registrados, `Receita Realizada = R$ 0` mesmo que `Deal.value` exista.

---

## 4. Stack e Dependências Técnicas

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 15 — App Router (Server Components) |
| Banco | PostgreSQL via Prisma ORM (host: `31.97.23.166:5499`) |
| Auth | `getSession()` de `@/lib/auth` (NextAuth com JWT cookie) |
| Charts | Recharts |
| UI | Tailwind CSS + shadcn/ui (Card, CardHeader, CardContent) |
| Renderização | RSC com `force-dynamic` (não usa cache) |
| Lazy load | `LazyOnVisible` para gráficos abaixo da dobra |

---

## 5. Estrutura de Arquivos

```
app/[locale]/dashboard/analytics/
├── page.tsx                  # Server Component principal
├── loading.tsx               # Skeleton durante SSR
├── date-filter.tsx           # Filtro de data (from / to)
├── monthly-filter.tsx        # Filtro de range mensal
├── client-filter.tsx         # Filtro top clientes (ordem + limite)
├── pipeline-filter.tsx       # Filtro multi-pipeline
├── value-search.tsx          # Busca por valor exato
├── contact-search.tsx        # Busca por nome do contato
└── lost-deals/
    └── page.tsx              # Sub-página: dashboard de negócios perdidos

components/analytics/
├── overview-chart.tsx        # Bar chart: Negócios por Etapa
├── monthly-chart.tsx         # Line/Bar chart: Análise Mensal
├── client-chart.tsx          # Bar+Line chart: Top Clientes
├── lost-deals-charts.tsx     # Charts de negócios perdidos
├── revenue-trend-chart.tsx   # Tendência de receita (painel admin)
├── forecast-chart.tsx        # Previsão de receita (painel admin)
└── platform-kpi-card.tsx     # Card de KPI do painel admin

lib/analytics/
├── kpis.ts                   # Cálculo de KPIs da plataforma (MRR, ARR, LTV, CAC)
└── forecasting.ts            # Previsões de receita
```

---

## 6. Fluxo de Carregamento (Server Component `page.tsx`)

### 6.1 Sequência de execução

```
1. getSession() → valida JWT cookie
   ├─ Se inválido → "Não autorizado. Faça login novamente."
   └─ Se válido → segue

2. await searchParams → extrai filtros da URL:
   from, to, mfrom, mto, ctop, csort, pid, vsearch, csearch

3. prisma.user.findUnique({ email })
   ├─ select: organizationId
   └─ Se sem organização → "Usuário não pertence a uma organização."

4. prisma.pipeline.findMany({ orgId })
   └─ Lista de pipelines disponíveis para o filtro

5. Resolve filtros aplicáveis:
   - selectedPids = pid.split(',') OU [defaultPipeline.id]
   - valueSearchFilter = { value: { equals: Number(vsearch) } }
   - contactSearchFilter = busca contatos por nome → { contactId: { in: [...] } }
   - closeDateFilter = { gte: from, lte: to+23:59:59 }

6. prisma.deal.findMany() → lista de deals filtrada
   ├─ where: archived: false (exclui arquivados)
   └─ select: id, stageId, value, closeDate, STATUS, stage.name, contact.name

7. Calcula KPIs em memória (ver seção 7)

8. Resolve range do gráfico mensal:
   - Se mfrom/mto definidos → usa como está
   - Senão propaga from/to do filtro de data (slice para YYYY-MM)
   - Default: 2025-01 → mês atual

9. prisma.deal.findMany() → allMonthlyDeals (range mfrom/mto)

10. prisma.dealClosing.findMany() → allClosings (receita realizada por mês)

11. prisma.dealClosing.findMany() → kpiClosings (total realizado KPI)

12. Monta monthSlots e agrega valores por mês

13. Agrega stageData (deals agrupados por etapa) → chartData

14. prisma.deal.findMany() → clientDeals
    ├─ where: status='WON', archived:false
    └─ Agrupa por contactId (não por nome, para evitar mesclar homônimos)

15. Renderiza JSX com KPI cards + charts
```

### 6.2 Total de queries SQL no carregamento

**Mínimo: 7 queries** (sem busca por contato)
**Máximo: 8 queries** (com `csearch` ativo)

```
1. user.findUnique
2. pipeline.findMany
3. deal.findMany (deals filtrados — KPIs e stage chart)
4. deal.findMany (allMonthlyDeals — gráfico mensal)
5. dealClosing.findMany (allClosings — gráfico mensal)
6. dealClosing.findMany (kpiClosings — card Receita Realizada)
7. deal.findMany (clientDeals — top clientes WON)
8. contact.findMany (somente se csearch)
```

Não há cache (`force-dynamic` implícito via `getSession()`).

---

## 7. KPI Cards (6 cards em grid responsivo)

### 7.1 Tabela de KPIs

| Card | Cálculo | Fonte | Semântica |
|------|---------|-------|-----------|
| **Pipeline Aberto** | `Σ Deal.value` onde `status='ACTIVE'` | `Deal.value` | Expectativa de receita em negociação |
| **Total Ganho** | `Σ Deal.value` onde `status='WON'` | `Deal.value` | Expectativa de valor dos negócios fechados |
| **Taxa de Conversão** | `wonCount / (wonCount + lostCount) * 100` | `Deal.status` | Porcentagem de deals fechados que foram ganhos |
| **Previsão este Mês / no Período** | `Σ Deal.value` onde `status='ACTIVE'` + `closeDate >= hoje` + `closeDate no mês atual` | `Deal.value` + `Deal.closeDate` | Expectativa de receita de deals ativos com prazo no mês |
| **Ticket Médio** | `AVG(Deal.value)` dos deals WON com valor > 0; fallback para todos se não há WON | `Deal.value` | Valor médio por negócio (expectativa) |
| **Receita Realizada** | `Σ DealClosing.value` (filtro por data de recebimento) | `DealClosing.value` | Valor real recebido (registrado em Fechamentos) |

### 7.2 Regras específicas

**Taxa de Conversão:**
- Denominador = `wonDeals + lostDeals` (apenas deals finalizados)
- Deals `ACTIVE` **não entram no denominador** — a conversão só faz sentido sobre o que foi decidido
- Fórmula correta: `ganhos / (ganhos + perdidos)`, não `ganhos / total`

**Previsão de Fechamento:**
- Considera apenas deals `ACTIVE` (exclui WON e LOST)
- Considera apenas `closeDate >= hoje` (datas passadas não representam previsão real)
- Sem filtro de data ativo: restringe ao mês corrente
- Com filtro de data ativo: mostra todos os ACTIVE do período

**Pipeline Aberto vs Total Ganho:**
- Ambos usam `Deal.value` (expectativa), não `DealClosing.value` (realizado)
- "Total Ganho" representa a expectativa acumulada dos negócios marcados como ganhos

**Receita Realizada vs Total Ganho:**
- São conceitos distintos: Total Ganho = expectativa (Deal.value); Receita Realizada = efetivo (DealClosing.value)
- Um cliente pode fechar um deal WON por R$10.000 e registrar pagamento real de R$9.500 — cada card mostrará um número diferente

---

## 8. Gráficos (3 charts)

### 8.1 Negócios por Etapa (`OverviewChart`)
- **Tipo**: Bar chart vertical (Recharts `<BarChart>`)
- **Eixo X**: nome da etapa (`stage.name`)
- **Eixo Y**: valor em R$ (formatado `R$Nk`)
- **Tooltip**: valor formatado, quantidade de negócios, até 5 nomes de clientes (+N mais)
- **Fonte**: `chartData` agregado de `deals.reduce()` (todos os status, não filtrado por ACTIVE)

### 8.2 Análise Mensal (`MonthlyChart`)
- **Tipo**: Composed chart (Bar + Line)
- **Eixo X**: meses (formato "jan/25")
- **Métricas**:
  - `value`: soma de `Deal.value` com `closeDate` no mês (expectativa)
  - `count`: quantidade de deals com `closeDate` no mês
  - `closingsValue`: soma de `DealClosing.value` no mês (realizado)
- **Range**: controlado por `mfrom/mto`. Default propaga `from/to` do filtro de data se definido, senão Jan/2025 → mês atual
- **Filtro próprio**: `<MonthlyChartFilter>` (params `mfrom`, `mto`)
- **Lazy-loaded**: `<LazyOnVisible>` com Skeleton

### 8.3 Análise por Cliente (`ClientChart`)
- **Tipo**: Composed chart (Bar = valor R$, Line = quantidade)
- **Fonte**: deals `WON` não arquivados (somente negócios ganhos aparecem no ranking de clientes)
- **Agrupado por**: `contactId` (evita mesclar contatos homônimos)
- **Top N** clientes (default 10, max 20) ordenados por valor ou quantidade
- **Filtro próprio**: `<ClientChartFilter>` (params `ctop`, `csort`)
- **Lazy-loaded**: `<LazyOnVisible>`

---

## 9. Sub-página: `/dashboard/analytics/lost-deals`

Dashboard separado para análise de negócios perdidos.

### 9.1 Filtro
- Filtra `Deal.status = 'LOST'`
- Sem filtro de período (usa todos os tempos)

### 9.2 KPIs
- Total Perdido (count)
- Valor Perdido (Σ value)
- Taxa de Perda (`totalLost / totalDeals * 100`)

### 9.3 Visualizações
- **Top 5 Motivos de Perda** (`Deal.lostReason`, agrupado e ordenado por count)
- **Lista dos últimos 20 negócios perdidos** (`updatedAt desc`)

---

## 10. Tabelas do Banco Envolvidas

```
Organization (id, tier)
└── User (organizationId, email)
    └── Pipeline (organizationId, name, isDefault)
        └── PipelineStage (pipelineId, name, order, type: OPEN|WON|LOST)
            └── Deal (stageId, value, closeDate, status: ACTIVE|WON|LOST, archived, contactId)
                ├── Contact (id, name, company)
                └── DealClosing (dealId, value, date)
```

**Nota sobre `PipelineStage.type`**: campo adicionado em maio/2026. Permite classificar etapas como OPEN, WON ou LOST de forma explícita. Backfill inicial via script `scripts/backfill-pipeline-stage-type.ts` usando heurística de nome.

### 10.1 Mapeamento KPI → Coluna

| KPI Mostrado | Tabela | Coluna(s) | Cálculo |
|-------------|--------|-----------|---------|
| Pipeline Aberto | Deal | value, status | SUM where status='ACTIVE' |
| Total Ganho | Deal | value, status | SUM where status='WON' |
| Conversão | Deal | status | won / (won + lost) |
| Previsão | Deal | value, status, closeDate | SUM where ACTIVE + closeDate >= hoje + mês atual |
| Ticket Médio | Deal | value, status | AVG where WON + value > 0 |
| Receita Realizada | DealClosing | value, date | SUM (filtro por date) |

---

## 11. Filtros — Padrão de URL

Todos os filtros são persistidos em **query params** (padrão do projeto). Isso permite compartilhar URLs com filtros aplicados.

```
/dashboard/analytics
  ?pid=PIPELINE_ID_1,PIPELINE_ID_2
  &from=2025-01-01
  &to=2025-12-31
  &mfrom=2025-01
  &mto=2025-12
  &ctop=10
  &csort=value|count
  &vsearch=1500
  &csearch=João
```

Cada filtro atualiza a URL via `router.push()` no client component, e o Server Component re-renderiza com os novos searchParams.

**Propagação de filtro de data para o gráfico mensal:**
- Se `mfrom`/`mto` não estiverem definidos explicitamente, o gráfico mensal usa `from`/`to` do filtro de data (convertendo `YYYY-MM-DD` para `YYYY-MM`).
- Isso mantém consistência visual: aplicar filtro de data no header reflete no gráfico mensal.
- Para sobrescrever, usar o `<MonthlyChartFilter>` explicitamente.

⚠️ Componentes que usam `useSearchParams` **devem** estar dentro de `<Suspense>` (regra Next.js 15).

---

## 12. Permissões e Acesso

| Funcionalidade | Plano Mínimo | Observação |
|---------------|-------------|------------|
| Dashboard de Analytics | FREE+ | Sempre visível |
| Lost Deals | Todos | Acessível por URL direta |

A organização precisa ter pelo menos 1 deal cadastrado para os gráficos terem dados.

---

## 13. Performance e Otimizações

- ✅ **Lazy-loading** dos charts pesados (`LazyOnVisible`)
- ✅ **`archived: false`** no filtro de deals (exclui arquivados do KPI)
- ✅ **Agrupamento por `contactId`** no top clientes (correto para homônimos)
- ❌ **Sem cache** — cada navegação refaz todas as queries (`force-dynamic`)

### Recomendações futuras:
- Implementar `unstable_cache` com revalidate de 60s e tags `analytics:org:{orgId}`
- Substituir queries individuais por 1 query agregada via `prisma.$queryRaw` para grandes datasets
- Usar índice `Deal(organizationId, status, archived)` nas queries de KPI

---

## 14. Procedimentos Operacionais

### 14.1 "KPI 'Receita Realizada' aparece R$ 0"

- Não há registros em `DealClosing` para a org
- O cliente precisa **registrar fechamentos** manualmente no modal de Deal (aba "Fechamentos" → "Registrar Fechamento")
- `DealClosing` é independente de `Deal.value` — é o valor real recebido
- Verificar: `SELECT COUNT(*) FROM "DealClosing" WHERE "dealId" IN (SELECT id FROM "Deal" WHERE "organizationId"='...')`

### 14.2 "Taxa de Conversão = 0% mesmo com vendas"

- Se `wonDeals.length + lostDeals.length = 0`, a taxa é 0% (denominador vazio)
- Significa que os deals não foram marcados como WON ou LOST — ainda estão ACTIVE
- Instruir o cliente a fechar (marcar como WON/LOST) os deals concluídos no modal
- Verificar: `SELECT status, COUNT(*) FROM "Deal" WHERE "organizationId"='...' GROUP BY status`

### 14.3 "Pipeline Aberto está muito alto / inclui deals antigos"

- Deals com `status='ACTIVE'` e `archived=false` entram em Pipeline Aberto
- Deals antigos que nunca foram fechados continuam ACTIVE e inflam o número
- Solução: marcar como WON/LOST os deals históricos, ou usar o filtro de data (`from/to`)
- Deals arquivados (`archived=true`) já são excluídos automaticamente

### 14.4 "Top Clientes mostra apenas 0 clientes"

- A consulta de top clientes filtra por `status='WON'` (apenas negócios ganhos)
- Se não há deals WON na org/período, o gráfico fica vazio
- Verificar: `SELECT COUNT(*) FROM "Deal" WHERE "organizationId"='...' AND status='WON' AND "contactId" IS NOT NULL`

### 14.5 "Filtros não estão funcionando ao clicar"

- Confirmar que os componentes filtros estão dentro de `<Suspense>` no `page.tsx`
- Verificar console do browser para erros de hidratação
- Confirmar que `useRouter().push()` está sendo chamado com a URL completa

---

## 15. Tracking de Acesso (Analytics da Plataforma)

Os componentes em `components/analytics/*-tracker.tsx` (signup, login, billing, pricing, access, purchase) **não fazem parte desta página** — são trackers do PostHog/internal que disparam em outras páginas para alimentar o dashboard administrativo da ROI Labs em `/admin/analytics`.

A página `/dashboard/analytics` é exclusivamente sobre os **dados de negócio do cliente**, não sobre uso da plataforma.

---

## 16. Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-05-08 | Criação do POP inicial — documentação da aba Overview e PRO |
| 2.0 | 2026-05-08 | **Refatoração de KPIs**: substituído card "Valor Total" por "Pipeline Aberto" + "Total Ganho"; Taxa de Conversão agora usa `Deal.status` (won/lost) em vez de heurística por nome de stage; Previsão restrita a deals ACTIVE com closeDate futuro; Ticket Médio usa base de deals WON; Top Clientes agrupa por `contactId`; filtro `archived:false` adicionado. **Remoção da aba Analytics PRO** (estava quebrada — queries por `stage.isClosedWon` que não existia no schema). Adicionado campo `PipelineStage.type` (OPEN/WON/LOST) via migration. |

---

## 17. Contatos

- **Suporte técnico**: time de desenvolvimento Sirius CRM
- **Repositório**: `JeanZorzetti/sirius` (GitHub)
- **Deploy**: VPS via EasyPanel — `siriuscrm.com.br`
- **Banco**: PostgreSQL `31.97.23.166:5499` (siriusdb)
