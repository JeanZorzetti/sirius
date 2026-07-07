---
description: "Task list for Crawl Health — siriuscrm.com.br"
---

# Tasks: Saúde de Rastreamento (Crawl Health) — siriuscrm.com.br

**Input**: Design documents from `specs/001-crawl-health-reliability/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/crawl-health.md](./contracts/crawl-health.md), [quickstart.md](./quickstart.md)

**Tests**: A spec **não** pediu TDD. A verificação é **operacional** (curl de headers/latência, load test, releitura do GSC) — embutida nas tasks via quickstart, sem tasks de teste unitário separadas.

**Organization**: Agrupado por user story. US1 e US2 são ambas P1 (US1 = MVP que restaura a saúde; US2 = durabilidade). US3 (P2) e US4 (P3) são incrementos.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência pendente)
- **[Story]**: US1–US4 (mapeia para as user stories da spec)

---

## Phase 1: Setup

**Purpose**: Baseline e ferramentas de medição.

- [X] T001 Registrar snapshot do baseline de Crawl Stats (números de resposta/404/302/robots-indisponível) a partir de `docs/SEO/siriuscrm.com.br-Crawl-stats-2026-07-07/` no topo de `specs/001-crawl-health-reliability/quickstart.md` §7 como referência de comparação
- [X] T002 [P] Confirmar o limite atual de CPU/RAM do container na EasyPanel e anotar em `specs/001-crawl-health-reliability/research.md` (seção "Unknowns restantes") — input para a causa-raiz R0/R2
- [ ] T003 [P] Instalar/escolher ferramenta de load test (`hey`/`k6`/`ab`) na máquina de teste para executar `quickstart.md` §2 e §4

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pré-condições que bloqueiam as user stories.

**⚠️ CRITICAL**: US2 (reprodução) depende de staging; US1/US3 (edições) dependem do inventário atual.

- [ ] T004 Preparar ambiente de staging espelhando a config de prod (mesma imagem Docker, mesmas env vars relevantes) para reproduzir a causa-raiz sem afetar produção — bloqueia US2
- [ ] T005 Levantar o inventário atual de headers e redirects em produção via `curl` (`/robots.txt`, `/sitemap.xml`, e cada `permanent:false` de `next.config.ts`) e registrar em `specs/001-crawl-health-reliability/contracts/crawl-health.md` como estado-antes — bloqueia US1 e US3

**Checkpoint**: Baseline capturado, staging pronto, inventário conhecido → user stories podem começar.

---

## Phase 3: User Story 1 - Origem sempre responde rápido + robots/sitemap sempre 200 (Priority: P1) 🎯 MVP

**Goal**: `robots.txt`/`sitemap.xml` retornam 200 rápido mesmo com o app saturado; Google para de estrangular o crawl.

**Independent Test**: `quickstart.md` §1–§2 — sob carga concorrente contra rota SSR, `robots.txt` responde 200 em < 500 ms com `Cache-Control` cacheável.

- [X] T006 [US1] Adicionar entradas em `next.config.ts › headers()` para `source: '/robots.txt'` e `source: '/sitemap.xml'` com `Cache-Control` cacheável (`public, max-age=300, s-maxage=3600, stale-while-revalidate=86400`, a calibrar) — hoje é `max-age=0` (C1, C2, FR-013)
- [X] T007 [US1] Confirmar que a mudança de header **não altera** o corpo de `app/robots.ts` (governança de bots) nem de `app/sitemap.ts` (alternates hreflang) — invariantes de C6/FR-011
- [ ] T008 [P] [US1] (Infra, recomendado) Provisionar Cloudflare free na frente da origem com regra de cache para `/robots.txt`, `/sitemap.xml` e `/_next/static/*`; documentar a config em `Docs/Obsidian/80-dev/` (R2). Não-bloqueante: se pulado, T006 já entrega o MVP
- [ ] T009 [US1] Validar sob carga (`quickstart.md` §1–§2): 50 requisições SSR concorrentes + `robots.txt`/`sitemap.xml` retornando 200 em < 500 ms

**Checkpoint**: US1 funcional — robots/sitemap blindados. Deployável como MVP.

---

## Phase 4: User Story 2 - Causa-raiz identificada e regressão vigiada (Priority: P1)

**Goal**: Eliminar a condição que saturou o SSR (18/05–08/06) e nunca mais deixar passar 3 semanas sem detecção.

**Independent Test**: `quickstart.md` §4 (reprodução em staging) e §6 (teste de fogo do alerta ≤ 15 min).

- [ ] T010 [US2] Reproduzir a causa-raiz em staging (`quickstart.md` §4): carga contra rota pública SSR + query do padrão introduzido em 18–22/05, medindo latência com pool Prisma default vs ajustado (valida a hipótese R0)
- [ ] T011 [US2] Aplicar a mitigação da causa confirmada: ajustar pool de conexões em `lib/prisma.ts` e/ou reduzir o custo de `await maybeRefreshSession` em rotas públicas em `middleware.ts` e/ou revisar `node .../prisma migrate deploy` no boot em `docker/entrypoint.sh` e/ou aumentar recursos do container na EasyPanel (depende de T010). **Ao executar: quebrar esta task no único vetor que T010 confirmar — não aplicar todos os "e/ou" às cegas**
- [X] T012 [P] [US2] Configurar monitor externo (UptimeRobot): checks a cada 1–5 min em `/robots.txt` (200 + keyword `Sitemap:`) e `/api/health` (200 + `"status":"ok"`), alerta de uptime/latência (C6, FR-005); documentar em `Docs/Obsidian/80-dev/`
- [ ] T013 [P] [US2] Habilitar Sentry Performance/tracing (via `SENTRY_ORG`) em `next.config.ts`/config Sentry e logar `latency_ms` do `/api/health` na saída do container para retenção de observabilidade (FR-004)
- [X] T014 [US2] Teste de fogo do alerta (`quickstart.md` §6): degradar o alvo em staging (ou baixar o limiar) e cronometrar o alerta → deve chegar em ≤ 15 min (SC-009)
- [ ] T015 [US2] Documentar o runbook da causa-raiz (evidência de correlação deploy/git + resultado da reprodução) em `Docs/Obsidian/80-dev/` (FR-004)

**Checkpoint**: US2 funcional — causa mitigada, monitor ativo, incidente futuro é detectável.

---

## Phase 5: User Story 3 - Higiene de respostas: menos 404 e 302 (Priority: P2)

**Goal**: Reduzir 404 (2,67%→≤1%) e 302 (1,62%→≤0,5%), consolidando sinal de link.

**Independent Test**: `quickstart.md` §5 — `/ano` e `/mês` retornam 301; lista de 404 zerada ou justificada.

- [X] T016 [US3] Em `next.config.ts › redirects()`: mudar `/ano` e `/mês` de `permanent:false` para `permanent:true` (301) e consolidar o redirect duplicado de `/mês` que também existe em `middleware.ts` (manter só um) (R5, C5, FR-006)
- [X] T017 [US3] Extrair do GSC (Índice › Páginas / relatório de cobertura) e/ou logs a lista real de URLs que retornam 404
- [ ] T018 [US3] Para cada URL de T017: corrigir o link interno na origem, adicionar `301` em `next.config.ts › redirects()`, ou confirmar como 404 intencional (FR-007)
- [X] T019 [US3] Validar redirects (`quickstart.md` §5): códigos 301 esperados, sem loop

**Checkpoint**: US3 funcional — respostas limpas.

---

## Phase 6: User Story 4 - Eficiência de crawl budget e descoberta (Priority: P3)

**Goal**: Menos budget em recursos, descoberta de conteúdo novo em ≤ 7 dias, paridade mobile.

**Independent Test**: `quickstart.md` §7 (Detecção ↑, HTML share ↑) + verificação de 304 em assets e 200 no Googlebot Smartphone.

- [X] T020 [US4] Em `app/sitemap.ts`: substituir o `lastSiteUpdate` hard-coded (`new Date('2026-03-20')`) por data derivada do conteúdo quando disponível e confirmar que todo tipo publicável (blog/help/soluções/cidades/calculadoras) está incluído (FR-009)
- [X] T021 [P] [US4] Verificar que `/_next/static/*` retorna 304/cache no re-crawl (C4, FR-008) usando `quickstart.md`; ajustar `next.config.ts` só se falhar
- [X] T022 [P] [US4] Verificar paridade mobile: `curl -A "Googlebot-Mobile/Smartphone"` nas principais páginas públicas retorna 200 e latência saudável (FR-010, SC-010); ajustar só se houver erro mobile-específico
- [ ] T023 [US4] (Opcional) Rodar `npm run indexnow` para pingar IndexNow após as mudanças e acelerar a descoberta

**Checkpoint**: US4 funcional — crawl mais eficiente.

---

## Phase 7: Polish & Cross-Cutting

- [X] T024 [P] Criar/atualizar `handoff.md` co-localizado (feito/decisões/próximos/pendências/gotchas) — regra global ROI Labs
- [ ] T025 [P] Registrar as mudanças no vault `Docs/Obsidian/80-dev/` (changelog + runbook do incidente) — regra global de docs
- [ ] T026 Verificação final em produção após ≥ 14 dias (`quickstart.md` §7): reextrair GSC Crawl Stats e checar SC-001..SC-010; confirmar host status = "sem problemas" (FR-012, SC-006)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (P1)**: sem dependências — começa já.
- **Foundational (P2)**: depende do Setup — bloqueia as user stories.
- **User Stories (P3+)**: dependem da Foundational.
  - US1 e US2 (ambas P1) podem rodar em paralelo após Foundational (arquivos majoritariamente distintos).
  - US3 e US4 depois (ou em paralelo, se houver capacidade).
- **Polish (P7)**: depende das stories desejadas concluídas; T026 depende do deploy + 14 dias.

### Conflitos de arquivo (NÃO paralelizar entre si)

- **`next.config.ts`** é tocado por T006 (US1) e T016 (US3) → sequenciar (US1 primeiro).
- T011 (US2) toca `lib/prisma.ts`/`middleware.ts`/`entrypoint.sh` → livre em relação a T006/T016.

### Parallel Opportunities

- Setup: T002 e T003 em paralelo.
- US1↔US2: T008/T012/T013 (infra/monitor/observability) são independentes entre si e do código de T006.
- US4: T021 e T022 (verificações) em paralelo.
- Polish: T024 e T025 em paralelo.

---

## Implementation Strategy

### MVP First (US1)

1. Setup (T001–T003) → Foundational (T004–T005).
2. US1 (T006–T009) → **validar** `quickstart.md` §1–§2 → **deploy do MVP** (robots/sitemap blindados).

### Incremental

3. US2 (T010–T015) → causa-raiz + monitor → deploy.
4. US3 (T016–T019) → higiene de redirects → deploy.
5. US4 (T020–T023) → eficiência/discovery → deploy.
6. Polish (T024–T026) → docs + **verificação final após 14 dias**.

---

## Notes

- Verificação é operacional (`quickstart.md` + `contracts/crawl-health.md`), não unit test.
- Preservar invariantes: governança de bots (`robots.ts`), hreflang (`sitemap.ts`), auth das rotas protegidas (`middleware.ts`).
- Docs no vault Obsidian, nunca em `docs/` do repo (regra global) — exceto `handoff.md` e `specs/`.
- Commit após cada task ou grupo lógico; push ao fechar entrega (regra global).
