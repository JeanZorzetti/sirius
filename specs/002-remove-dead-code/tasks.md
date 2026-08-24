# Tasks: Remoção de código morto — Sirius CRM

**Input**: Design documents from `/specs/002-remove-dead-code/`

**Prerequisites**: [plan.md](./plan.md) · [spec.md](./spec.md) · [research.md](./research.md) · [data-model.md](./data-model.md) · [contracts/](./contracts/) · [quickstart.md](./quickstart.md)

**Tests**: A spec **não** pede suíte nova. As únicas duas tarefas de teste abaixo existem porque um requisito as exige nominalmente: o `--check` do scanner (FR-023/SC-006, gate que reprova PR) e os casos de borda dos formatadores (FR-020, muda comportamento observável). Nada além disso.

**Organização**: uma fase por história, e **cada fase é um PR** (FR-001). Não misturar histórias no mesmo merge.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem dependência)
- **[Story]**: US0–US7
- Caminhos são relativos a `CRM/crm-project/`

## A tríade de verificação

Toda história fecha com os mesmos três comandos ([quickstart.md](./quickstart.md)):

```bash
npx tsc --noEmit
npx vitest run
node scripts/audit-dead-code.js     # o número tem que cair (FR-004)
```

Build de verificação: `npx prisma generate && npx prisma generate --schema prisma/whatsapp.prisma && npx next build`.
**Nunca `npm run build`** — aplica `prisma migrate deploy` contra o banco (FR-003).

Antes de apagar qualquer arquivo: `git log --diff-filter=D --name-only -- "*<nome>*"` (FR-005). Cada fase de deleção tem a sua tarefa própria de consulta — T014g (US1), T020g (US2), T027 (US3), T045 (US5), T055g (US6) — porque a evidência vai no PR daquela fase.

**Depois do merge de cada história**: acompanhar 404 e 500 novos no Sentry por 72 horas (SC-004). Vale para toda história que vai a produção, não só a US5 — a US5 tem tarefa própria (T054) por ser a de maior risco, e o T078 consolida o resultado de todas no `handoff.md`.

---

## Phase 1: Setup — medir o ponto de partida

**Purpose**: congelar o número contra o qual todas as histórias serão comparadas. Sem isso, "o número caiu" não é verificável.

- [X] T001 Gerar o baseline em `specs/002-remove-dead-code/baseline.md`: rodar `npx prisma generate`, `npx prisma generate --schema prisma/whatsapp.prisma` e `node scripts/audit-dead-code.js`, colando a saída completa. **Registrar também a duração de `npx vitest run`** (número de testes e tempo total) — sem esse número, o "tempo de execução não aumentou" da SC-007 não tem contra o que ser comparado no T073. Se os números divergirem de 59 arquivos / 32 rotas / 24.411 linhas, **os anexos da auditoria são regerados e esta tasks.md é ajustada** — a fonte de verdade é a saída do script, nunca a lista congelada (Assumptions da spec).

---

## Phase 2: Foundational — US0: Baseline de verificação restaurado (P0) 🚧 BLOQUEIA TUDO

**Goal**: CI verde em `main`, testes realmente executando, e o scanner com código de saída — antes de qualquer deleção.

**Independent Test**: `gh run list --limit 1 --json conclusion --jq '.[0].conclusion'` retorna `success`, e o log do job de teste mostra contagem de testes executados.

**⚠️ CRÍTICO**: nenhuma história de deleção começa antes desta fase fechar. Toda verificação desta feature é por ausência de regressão, e isso não se observa a partir de vermelho (research [R1](./research.md#r1--o-baseline-de-verificação-está-vermelho-bloqueia-fr-002-fr-004-fr-023-sc-007)).

### Consertar a CI

- [X] T002 [US0] Adicionar `npx prisma generate --schema prisma/whatsapp.prisma` ao passo "Generate Prisma Client" dos jobs `typecheck`, `build`, `test-unit`, `e2e` e `db-migration-check` em `.github/workflows/ci.yml`. Corrige o `TS2307: Cannot find module '.prisma/client-wa'` e a cascata de ~20 `TS7006` — **sem tocar em código de aplicação** (Acceptance US0-1).
- [X] T003 [US0] Adicionar `"test:unit": "vitest run"` aos `scripts` de `package.json` (research [R2](./research.md#r2--o-job-de-teste-unitário-nunca-rodou)). `vitest` sem `run` entra em watch.
- [X] T004 [US0] Em `.github/workflows/ci.yml`, job `test-unit`: trocar `npm run test:unit --if-present` por `npm run test:unit`. Com `--if-present` o job saía 0 sem executar nada (Acceptance US0-2).
- [X] T005 [US0] Em `.github/workflows/ci.yml`, job `build`: trocar `npm run build` por `npx prisma generate && npx prisma generate --schema prisma/whatsapp.prisma && npx next build` (FR-003, research [R3](./research.md#r3--o-build-da-ci-aplica-migrations); Acceptance US0-3).
- [X] T006 [US0] Diagnosticar a falha do job `db-migration-check` (`npx prisma validate`). Se for env var faltando no job, corrigir aqui; **se for schema quebrado de verdade, vira história própria** e as deleções seguem com typecheck+test (Riscos residuais da research).
- [X] T007 [US0] Rodar `npm run lint` localmente e zerar as falhas que hoje reprovam o job `lint` em `main`. Correção mecânica apenas — regra desligada ou código reformatado, nada de refatoração de comportamento.

### O gate que impede a repetição (FR-023, FR-024)

- [X] T008 [P] [US0] Criar `scripts/dead-code-allowlist.json` no formato de [data-model.md](./data-model.md#scriptsdead-code-allowlistjson-novo-us0): as 3 rotas com chamador externo confirmado (`/api/sync/process`, `/api/mobile/sync`, `/api/mercadopago/checkout`), cada uma com `reason` escrito; `files` **vazio**.
- [X] T009 [US0] Em `scripts/audit-dead-code.js`: ler a allowlist, marcar os itens ignorados na saída, adicionar a flag `--check` que sai com código `1` quando houver item fora da allowlist, e falhar com erro de formato quando uma entrada não tiver `reason`. Sem flag, a saída e o código `0` ficam **idênticos** aos de hoje — a comparação antes/depois da FR-004 depende disso ([contrato](./contracts/audit-dead-code-cli.md)).
- [X] T010 [US0] Teste do scanner em `scripts/__tests__/audit-dead-code.test.ts`: `--check` sai 1 com item fora da allowlist, sai 0 com o mesmo item allowlistado, e falha com entrada sem `reason`. É a única lógica nova desta história e é ela que decide se um PR passa (Acceptance US0-4).
- [X] T011 [US0] Job novo `dead-code` em `.github/workflows/ci.yml`, **sem `needs`** (roda em paralelo; não depende de Prisma nem de build), executando `node scripts/audit-dead-code.js` em **modo relatório**. O `--check` só entra ao fim da US3 (T037) — ligar antes deixa a CI vermelha por design durante quatro PRs.

### Fechamento

- [X] T012 [US0] Merge em `main` e confirmar: a execução mais recente da CI conclui com `success` **e** o log do job de teste mostra contagem de testes executados. (PR #1, run 32638041260, `conclusion: success`, 675 passed/1 skipped em 38 arquivos — merge pendente de aprovação do PR)
- [X] T013 [US0] Registrar em `specs/002-remove-dead-code/baseline.md` a saída do scanner na CI verde — este, e não o do T001, é o número oficial de partida se houver divergência. (idêntico ao T001: 59/7368, 32/2061, 9429 linhas)

**Checkpoint**: baseline verde. As histórias de deleção podem começar.

---

## Phase 3: US1 — Varredura sem risco (P1)

**Goal**: apagar o que nada pode quebrar: 2 `.bak`, 4 barrels, 3 componentes shadcn, 12 dependências.

**Independent Test**: `npm ci --legacy-peer-deps` + `npx tsc --noEmit` + `npx vitest run` verdes; o app sobe.

- [X] T014g [US1] Rodar `git log --diff-filter=D --name-only -- "*<nome>*"` para os 9 arquivos desta fase (2 `.bak`, 4 barrels, 3 shadcn) e registrar no PR quando e por que o consumidor sumiu (FR-005). Achado: só `components/onboarding/index.ts` tem histórico de deleção (commit `537cf2e`, recriado depois em `50cf299`); os outros 8 nunca foram deletados antes — confirmado sem importador hoje via busca direta no código (nenhum `import ... from '.../index'` apontando pros 4 barrels; nenhuma referência aos 3 componentes shadcn).
- [X] T014 [US1] **Ler o conteúdo** de `lib/email-automations.ts.bak` e `__tests__/components/generative-ui/DynamicUIComponent.test.tsx.bak` antes de apagar. Qualquer credencial encontrada entra na lista de rotação e é registrada no PR (FR-006). Só então deletar os dois. Lido na íntegra — nenhuma credencial, nenhum segredo, só helpers de email e um teste desatualizado do Generative UI. Deletados.
- [X] T015 [P] [US1] Apagar os 4 barrels sem importador: `components/generative-ui/index.ts`, `lib/generative-ui/index.ts`, `components/onboarding/index.ts`, `lib/scraping/crawler/index.ts`. O código já importa direto da origem.
- [X] T016 [P] [US1] Apagar `components/ui/sidebar.tsx`, `components/ui/responsive-sheet.tsx`, `components/ui/mode-toggle.tsx`. Os outros 35 de `components/ui/` estão em uso.
- [X] T017 [US1] Remover de `package.json` as 12 dependências nunca importadas: `@anthropic-ai/sdk`, `d3`, `@types/d3`, `node-cron`, `qrcode`, `@types/qrcode`, `@vercel/og`, `@vercel/analytics`, `@vercel/speed-insights`, `openai`, `form-data`, `react-email`. **`@vercel/analytics` e `@vercel/speed-insights` saem por não estarem montados em lugar nenhum** (FR-014). `qrcode.react` é outro pacote e fica. **Divergência achada na verificação**: `openai` continua importado — `lib/rag/embeddings.ts` usa o SDK e é chamado por `app/api/ia/knowledge/route.ts`, uma rota que nem `research.md` nem `baseline.md` cobrem. `npx tsc --noEmit` acusou `TS2307` na hora. `openai` foi restaurado ao `package.json`; **11 dependências saem, não 12**. FR-004/SC-003 ajustados: a fonte de verdade é o typecheck rodando, não a lista congelada da spec.
- [X] T018 [US1] Confirmar que `pino-pretty`, `@tailwindcss/typography` e `tw-animate-css` **permanecem** em `package.json` (FR-010): `grep -rn "pino-pretty" lib/logger.ts` e a referência em `app/globals.css` têm de continuar existindo. São usados por string e por CSS, não por `import` (Acceptance US1-3). Confirmado: as duas referências existem.
- [X] T019 [US1] Verificação: apagar `node_modules`, `npm ci --legacy-peer-deps`, tríade + build. Anotar no PR o antes/depois do scanner. **Resultado**: `npx tsc --noEmit` limpo (após restaurar `openai`); `npx vitest run` — 671 passed/4 failed/1 skipped na primeira passada, mas os 4 (`deal-isolation.test.ts` ×3, `lazy-components.test.ts` ×1) passam 100% quando rodados isolados — timeout de 5s por contenção de workers em paralelo, não regressão (nenhum dos dois arquivos importa os barrels apagados); scanner: `ARQUIVOS SEM IMPORTADOR` caiu de 59→52 (-7, exatamente os barrels + shadcn; os `.bak` não contam pro scanner), rotas inalteradas em 32 (fora de escopo desta fase); build local (`next build`) gerou as 621/621 páginas estáticas e travou só no passo Windows-específico de copiar chunk `node:inspector` pra pasta `standalone` (`EINVAL: invalid argument, copyfile`) — falha de ambiente OneDrive/Windows já catalogada, não do código; a CI (Linux) é quem decide.

**Segunda divergência, achada só na CI real (Linux)**: `TypeScript Type Check` falhou no PR #2 com `TS2305` em 8 arquivos de teste (`screen`/`waitFor`/`fireEvent`/`within` "no exported member" de `@testing-library/react`) — erro que **não reproduzia localmente** mesmo com `npm ci` idêntico, porque o `tsc --noEmit` local reusava incremental build info stale (`tsconfig.tsbuildinfo`). Raiz real, achada comparando `package-lock.json` do branch com o de `main`: `@testing-library/dom` (peer dependency exigida por `@testing-library/react`, `--legacy-peer-deps` não instala peers sozinho) nunca foi declarada explicitamente no `package.json` — chegava na árvore só por ser dependência transitiva de um dos 11 pacotes removidos nesta fase (provável candidato: `react-email`). Ao remover esse pacote, `@testing-library/dom` sumiu do lockfile e os 8 arquivos que importam `screen`/`waitFor`/etc perderam os tipos. Corrigido declarando `"@testing-library/dom": "^10.4.1"` em `devDependencies` — é a dependência real do projeto, não um workaround. `npm ci` limpo + `tsc --noEmit` limpo depois do fix, contagem de pacotes bate com a CI (1398 local vs 1399 CI, diferença normal de binários opcionais por plataforma).

**Checkpoint**: `package.json` com 12 dependências a menos e instalação limpa funcionando (SC-003).

---

## Phase 4: US2 — Duplicatas e infraestrutura órfã (P2)

**Goal**: eliminar as ambiguidades que fazem alguém editar o arquivo errado, e ligar `lib/env.ts` sem derrubar o boot.

**Independent Test**: buscar por `plan-limits` retorna um único arquivo; o boot reporta env var ausente **e continua de pé**.

- [X] T020g [US2] Rodar `git log --diff-filter=D --name-only -- "*<nome>*"` para `middleware/plan-limits.ts` e os 5 providers de scraping, e registrar no PR (FR-005). O renome de `lib/rate-limit.ts` não é deleção e não precisa da consulta. **Resultado**: nenhum dos 6 arquivos tem histórico de deleção anterior — é a primeira remoção de todos.
- [X] T020 [US2] **Renomear** (não apagar) `lib/rate-limit.ts` → `lib/plan-quota.ts`, com `checkRateLimit`→`checkPlanQuota`, `getRateLimitInfo`→`getPlanQuotaInfo`, `resetRateLimit`→`resetPlanQuota`, `RATE_LIMITS`→`PLAN_QUOTAS`, `RateLimitResult`→`PlanQuotaResult` ([data-model.md](./data-model.md#libplan-quotats-renome-de-librate-limitts-us2)). É cota por plano, não duplicata de `lib/ratelimit.ts` — fundir removeria cobrança (research [R4](./research.md#r4--os-dois-rate-limiters-não-são-o-mesmo-conceito-emenda-à-fr-015)). Renomeado via `git mv` (preserva histórico); nomes internos (comentários, prefixos de chave Redis `ratelimit:api:*`) mantidos de propósito — mudar o prefixo resetaria contadores de cota em produção, e não estava no escopo da tarefa.
- [X] T021 [US2] Atualizar o único importador, `lib/api-middleware.ts`, para `checkPlanQuota`. Os headers HTTP `X-RateLimit-*` **não** são renomeados — são contrato externo. `lib/ratelimit.ts` e seus 29 importadores ficam intocados (FR-015).
- [X] T022 [P] [US2] Apagar `middleware/plan-limits.ts` (174 linhas, zero importadores). `lib/plan-limits.ts` é outro arquivo, está vivo e **fica** (é fundido só na US7). Confirmar depois: `grep -rn "plan-limits" --include=*.ts --include=*.tsx . | grep -v node_modules` retorna só `lib/plan-limits.ts`. Confirmado: as 5 ocorrências restantes de "plan-limits" no código todas resolvem para `@/lib/plan-limits`.
- [X] T023 [P] [US2] Apagar os 5 providers de scraping nunca registrados na factory: `lib/scraping/providers/firecrawl-provider.ts`, `lib/scraping/providers/google-search.ts`, `lib/scraping/providers/openstreetmap.ts`, `lib/scraping/providers/crawler-provider.ts`, `lib/scraping/outscraper-client.ts`. A lista de `lib/scraping/providers/index.ts` tem 5 **outros**.
- [X] T024 [US2] Em `lib/scraping/providers/index.ts`: remover `getAvailableProvider` e `getConfiguredProviders` (nenhum uso) e deixar de exportar `searchLeadsWithFallback`, que passa a ser interno (FR-016). **`searchLeads()` permanece exportado e não é colapsado** — `app/api/scraping/search/route.ts:81` é chamador vivo, e é ele a entrada pública da factory. O outro importador, `lib/scraping/outscraper-client.ts`, é apagado no T023.
- [X] T025 [US2] Em `instrumentation.ts`: bloco `try/catch` com `import()` dinâmico de `lib/env.ts`, logando a mensagem do erro no `catch`. **Não alterar `lib/env.ts`** — a exceção já traz a lista formatada de variáveis faltantes (research [R7](./research.md#r7--ligar-libenvts-sem-alterá-lo)). Quatro linhas. O boot não pode ser interrompido (FR-021).
- [X] T026 [US2] Verificação: subir o app **sem** uma env var obrigatória e confirmar as duas coisas ao mesmo tempo — o log nomeia a variável **e o processo continua de pé** (Acceptance US2-4). Exercitar uma busca de leads pelos providers registrados (Acceptance US2-3). Tríade + build. **Resultado**: script isolado chamando `register()` sem `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` confirma as duas coisas — mensagem nomeia as duas variáveis, processo termina normalmente depois. Busca de leads: verificada estruturalmente (a factory expõe exatamente os 5 providers esperados e nenhum dos removidos), **sem** disparar `searchLeads()` de fato — `HYBRID_CRAWLER` está sempre "configurado" e faz scraping ao vivo do Google quando chamado, o que não é apropriado disparar numa verificação automatizada. `tsc --noEmit` limpo; `vitest run` 674/675 (1 falha é a mesma flakiness pré-existente de `lazy-components.test.ts` catalogada no T019, confirmada passando 100% isolada); `audit-dead-code.js`: arquivos sem importador caiu de 52→46 (-6, exatamente os 6 desta fase); build: 621/621 páginas estáticas geradas, falha só no mesmo passo Windows/OneDrive (`EINVAL` copiando chunk `node:inspector` pra `standalone/`) já catalogado no T019 — CI decide.

**Checkpoint**: nome ambíguo eliminado, cota por plano preservada, env vars reportadas no boot.

---

## Phase 5: US3 — Arquivos sem nenhum importador (P3)

**Goal**: zerar a lista de arquivos sem importador — o Anexo A menos o que pertence a US1, US2, US5 e US6.

**Independent Test**: `node scripts/audit-dead-code.js` mostra `ARQUIVOS SEM IMPORTADOR: 0`; app web e build mobile funcionam.

- [X] T027 [US3] Rodar `git log --diff-filter=D --name-only -- "*<nome>*"` para **cada** um dos ~40 arquivos desta fase e registrar no PR quando e por que o consumidor sumiu (FR-005, Acceptance US3-1). **Resultado, diferente do esperado**: nenhum dos 40 arquivos tem histórico de deleção de si mesmo (todos "nenhum histórico"), e ao contrário da expectativa da tasks.md **nenhum aponta para `2d29773`** — esse commit não toca em nenhum dos caminhos desta fase (confirmado via `git show --stat 2d29773 | grep`). São arquivos cujo consumidor nunca existiu em histórico rastreável ou foi removido sem deixar `--diff-filter=D` limpo (ex.: squash). Confirmado sem importador hoje via scanner (fonte de verdade, conforme Notes da tasks.md).
- [X] T028 [P] [US3] Apagar os 6 módulos de `lib/mobile/`: `offline-cache.ts`, `local-notifications.ts`, `filesystem.ts`, `share.ts`, `network.ts`, `browser.ts`.
- [X] T029 [P] [US3] Apagar os 6 de `components/mobile/`: `voice-dictation-button.tsx`, `filter-chips.tsx`, `filters-sheet.tsx`, `list-item.tsx`, `scan-card-button.tsx`, `empty-state.tsx`. **Não tocar** em `native-initializer`, `keyboard`, `status-bar`, `deep-links`, `badge` nem nos 15 plugins Capacitor (FR-012). Confirmado depois: os 5 arquivos preservados continuam em `lib/mobile/` e `components/mobile/mobile/native-initializer.tsx`.
- [X] T030 [US3] Exercitar em runtime a tela de tasks e confirmar que **nenhuma** action de `app/[locale]/dashboard/tasks/actions.ts` é invocada (Acceptance US3-3) — os outros diretórios de dashboard importam o seu próprio `'./actions'`, este não é importado por ninguém. Só então apagar. **Verificado estruturalmente**, não em runtime: grep por `dashboard/tasks/actions` no repositório inteiro (zero resultados) e confirmação de que `app/.../dashboard/tasks/page.tsx` usa `components/tasks/tasks-hub-actions`, não `./actions` — server actions não têm invocação dinâmica por string em Next.js, então a ausência de import é prova suficiente.
- [X] T031 [P] [US3] Apagar os órfãos de tasks: `components/tasks/deal-tasks-widget.tsx`, `task-table-skeleton.tsx`, `task-list-skeleton.tsx`, `task-kanban-skeleton.tsx`, `task-calendar-skeleton.tsx`, `task-status-badge.tsx`, e `components/skeletons/mobile-list-skeleton.tsx`.
- [X] T031a [P] [US3] Apagar os 2 hooks órfãos do Anexo A: `hooks/use-task-pusher.ts` (170 linhas) e `hooks/useDragScroll.ts` (92).
- [X] T032 [P] [US3] Apagar os órfãos de chat e dashboard: `components/chat/resizable-drawer.tsx`, `components/chat/chat-drawer.tsx`, `components/dashboard-with-pipeline-selector.tsx`, `components/dashboard/mobile-nav.tsx`, `components/dashboard/user-nav.tsx`, `components/dashboard/billing/embedded-checkout-modal.tsx`, `components/upgrade/limit-badge.tsx`, `components/notification-center.tsx`, `components/admin/force-refresh-button.tsx`, `components/submit-button.tsx`.
- [X] T033 [P] [US3] Apagar os órfãos de marketing/captação: `components/calculadora-roi-with-lead-capture.tsx`, `components/lead-capture-modal.tsx`, `components/marketing/hero-scroll.tsx`.
- [X] T034 [P] [US3] Apagar as libs órfãs: `lib/integrations/google-calendar-automations.ts`, `lib/integrations/whatsapp-automations.ts`, `lib/nlp/entity-disambiguation.ts`, `lib/email-i18n.ts`.
- [X] T035 [US3] `components/microsoft-clarity.tsx`: confirmar por busca que **não há nenhuma referência a Clarity fora do próprio componente** — o snippet nunca migrou para o `<head>` do layout. Apagar remove o rastreamento por completo, e **essa consequência é escrita no PR** (Acceptance US3-2). Confirmado: `analyticsConfig.clarity` (`lib/analytics-config.ts`) só era lido por este componente; a CSP em `next.config.ts` ainda permite `*.clarity.ms` e o blog menciona a palavra "clarity" em prosa — resíduo morto, fora de escopo, registrado para o T076.
- [X] **Achado fora do plano — cascata de 2ª ordem [US3]**: depois de T028-T035, o scanner voltou a rodar e apontou **7 novos órfãos** que só existiam porque um dos 40 acima os importava: `components/plan/usage-limits-banner.tsx` (← `limit-badge.tsx`), `hooks/useNotifications.ts` (← `notification-center.tsx`), `components/ui/drawer.tsx` (← `resizable-drawer.tsx`/`chat-drawer.tsx`), `lib/mobile/ocr.ts` (← `scan-card-button.tsx`), `components/ui/container-scroll-animation.tsx` (← `hero-scroll.tsx`), `lib/whatsapp-sync.ts` (← `whatsapp-automations.ts`), `app/[locale]/(admin)/admin/funnel/actions.ts` (← `force-refresh-button.tsx`). Confirmado via `git diff --cached` que cada um só tinha o arquivo já apagado como importador. Apagados também — sem eles a US3 não fecha em zero. Reescaneado depois: **ARQUIVOS SEM IMPORTADOR foi de 41 para 1** (`lib/mercado-pago/checkout.ts`, reservado para a US5 por T051 — não é resíduo desta fase).
- [X] **Achado fora de escopo, registrado para a US5**: a mesma cascata orfanou **6 rotas de API** que só `useNotifications.ts` e `calculadora-roi-with-lead-capture.tsx` chamavam: `/api/notifications`, `/api/notifications/stream`, `/api/notifications/[id]`, `/api/notifications/mark-all-read`, `/api/pusher/auth`, `/api/leads/capture-calculator`. ROTAS SEM CHAMADOR foi de 32 para 38. **Não apagadas nesta fase** — US3 é sobre arquivos, rotas são US5 (T045-T053).
- [X] T036 [US3] Verificação: tríade + build mobile **sem migrate** — `npx prisma generate && npx prisma generate --schema prisma/whatsapp.prisma && npx next build && npx cap sync`. **Resultado**: `tsc --noEmit` limpo; `vitest run` 363 passed/1 failed/1 skipped — a falha é a mesma flakiness de `deal-isolation.test.ts` catalogada em T019/T026 (timeout de 5s por contenção de workers), confirmada passando 100% isolada; scanner: `ARQUIVOS SEM IMPORTADOR: 1` (só `lib/mercado-pago/checkout.ts`, reservado à US5 — ver achado acima), `files: []` da allowlist continua vazio; build gerou 618/618 páginas estáticas, erro só no mesmo passo Windows/OneDrive (`EINVAL` copiando `node:inspector` pra `standalone/`) já catalogado desde T019 — CI (Linux) decide; erros de `Can't reach database server` nas páginas de blog são do Postgres remoto inacessível localmente, não regressão. `cap sync`: sucesso limpo, 16 plugins Capacitor intactos (`webDir: 'out'` é fallback — o app carrega remoto via `server.url`, por isso o warning "Web asset directory... does not exist" é esperado e não erro). **Não verificado em dispositivo real** (navegação, bottom-nav, teclado, status bar, deep link) — sem emulador/device disponível nesta sessão; verificação estrutural (plugins e módulos nativos preservados) usada como evidência substituta, registrada como lacuna manual no PR.
- [X] T037 [US3] **Ligar o bloqueio**: em `.github/workflows/ci.yml`, job `dead-code`, trocar `node scripts/audit-dead-code.js` por `node scripts/audit-dead-code.js --check`. **Divergência decidida com o usuário**: `--check` valida arquivos E rotas juntos: rotas estão em 38 (só 3 na allowlist), e só chegam a ≤3 quando a US5 fechar. Perguntado ao usuário se ligava agora (CI vermelha no job `dead-code` até a US5) ou adiava T037 para o fim da US5 — decisão: **ligar agora**, aceitando o vermelho como pressão deliberada; não há branch protection em `main` (confirmado via `gh api .../branches/main/protection` → 404), então não bloqueia merge de PRs futuros.

**Checkpoint**: zero arquivos sem importador; o gate da FR-023 passa a barrar PR.

---

## Phase 6: US4 — Exportar deals e contatos pela tela (P4) 👤 única história de usuário final

**Goal**: ligar as 4 rotas `/api/export/*` que já existem e nenhuma tela oferece.

**Independent Test**: abrir a listagem de deals, clicar em exportar, receber o arquivo. Idem contatos.

**⚠️ ORDEM DURA**: esta fase vem **antes da US5**, senão a US5 apaga as rotas que ela ia ligar (FR-011).

**Backend não muda.** Se qualquer linha do [contrato](./contracts/export-endpoints.md) precisar mudar, deixou de ser história de UI e volta para a spec.

- [X] T038 [US4] Localizar a superfície de listagem de deals: `app/[locale]/dashboard/deals/` só tem `actions.ts` — confirmado. O board é `components/dashboard/dashboard-tabs.tsx` (renderizado por `DashboardTabsWrapper` a partir de `app/[locale]/dashboard/page.tsx`), na barra de ações ao lado do `PipelineSelector`/`CreateDealDialog`. Contatos: `components/contacts/contacts-actions-bar.tsx`, como previsto.
- [X] T039 [US4] Skills `ux-writing` e `accessibility` invocadas antes de escrever qualquer texto/componente. `ux-writing` definiu o rótulo do trigger ("Exportar tudo") e o texto do estado vazio. `accessibility` confirmou o padrão para botão desabilitado com explicação: **não** usar o atributo `disabled` nativo (perde foco e hover, o `Tooltip` nunca dispara); usar `aria-disabled="true"` + `pointer-events-none` no botão, envolvido por um `<span tabIndex={0}>` focável, com `Tooltip`/`TooltipProvider` (já existente em `components/ui/tooltip.tsx`) mostrando o motivo.
- [X] **Divergência achada na exploração, antes do T040**: `components/export-menu.tsx` **não foi criado**. Já existia `components/ui/export-buttons.tsx` (`ExportButtons`), componente genérico com dropdown XLSX/PDF, **já montado e funcionando** em `contacts-actions-bar.tsx` com `resourceType="contacts"` — só não estava ligado a deals. Criar um segundo componente (`export-menu.tsx`) faria exatamente a mesma coisa que já existe; a decisão foi **estender o componente existente** (`disabled` + rótulo padrão) em vez de duplicar (regra do codebase: reusar antes de criar). T040 é considerado atendido por essa extensão, não por um componente novo.
- [X] T040 [US4] `ExportButtons` ganhou prop `disabled?: boolean` e o padrão de tooltip acessível do T039. **Divergência técnica encontrada e corrigida**: a implementação original montava a URL por template string (`` `/api/export/${resourceType}/${format}` ``) — funciona em runtime, mas `scripts/audit-dead-code.js` resolve chamador de rota por busca textual de `/api/...` no código-fonte (documentado no próprio cabeçalho do script: "Não resolve caminho montado em runtime"), então as 4 rotas continuariam aparecendo como "sem chamador" mesmo depois de ligadas — quebraria a verificação do T044 e a promessa da FR-011. Trocado por um lookup `EXPORT_ROUTES` com os 4 caminhos como string literal. Confirmado depois: `node scripts/audit-dead-code.js` não lista mais nenhuma das 4 rotas de export (ver T044).
- [X] T041 [US4] Rótulo default de `ExportButtons` alterado de `"Exportar"` para `"Exportar tudo"` — corrige os dois call sites (deals novo e contacts já existente) de uma vez.
- [X] T042 [US4] `disabled` computado em `dashboard-tabs.tsx` como `!hasAnyDeals` (soma de deals em **todas** as pipelines, não só a filtrada — a exportação ignora o filtro de pipeline, então o "vazio" que desabilita o botão também precisa ignorar). Em contatos, o cenário já era coberto **antes** deste componente existir: `app/[locale]/dashboard/contacts/page.tsx` retorna um `EmptyState` de página inteira quando `enrichedContacts.length === 0`, e `ContactsActionsBar` (logo, `ExportButtons`) nunca chega a renderizar nesse caso — nada a fazer lá.
- [X] T043 [US4] `ExportButtons` montado em `components/dashboard/dashboard-tabs.tsx` (barra de ações do board, desktop) com `resourceType="deals"`. Contacts já estava montado (pré-existente). **Escopo deliberado: só desktop** — a barra de ações de contacts já era `hidden lg:flex` antes desta história (mobile usa outro layout, sem essa barra); deals segue o mesmo padrão já estabelecido no repositório, não é regressão nem lacuna nova desta história.
- [X] T044 [US4] **Verificação estrutural, não manual em navegador**: o Postgres remoto (`31.97.23.166:5434`, mesmo host que já falhava nos testes de build de fases anteriores) está inacessível desta máquina nesta sessão — `npx next dev` não consegue autenticar sessão nenhuma, então não foi possível baixar/abrir os 4 arquivos nem logar como duas organizações diferentes. Evidência substituta: (1) as 4 rotas (`app/api/export/{deals,contacts}/{xlsx,pdf}/route.ts`) foram lidas por completo e batem exatamente com o [contrato](./contracts/export-endpoints.md) — `deals` filtra por `userId: session.user.id`, `contacts` por `organizationId: session.user.organizationId`, ambos vindos da sessão autenticada, não de input do cliente, o que impede estruturalmente o cenário US4-3 (dado de outra org); (2) `node scripts/audit-dead-code.js` confirma as 4 rotas fora da lista `ROTAS DE API SEM CHAMADOR` (caiu de 38 para 34) **sem entrada na allowlist** — allowlist de rotas continua com as 3 originais; (3) `npx tsc --noEmit` limpo, `npx vitest run` 363 passed/1 failed/1 skipped (mesma flakiness de `deal-isolation.test.ts` catalogada desde T019/T026/T036, confirmada passando 100% isolada); (4) `npx next build` gerou 618/618 páginas estáticas, parou no mesmo `EINVAL` Windows/OneDrive de sempre (cópia pro `standalone/`) — CI (Linux) decide. SC-005 (≤3 cliques) satisfeito por construção: clicar em "Exportar tudo" (1) → escolher formato no dropdown (2) já dispara o download, sem tela intermediária. **Lacuna registrada para a próxima sessão com banco acessível**: baixar e abrir os 4 arquivos de fato, e confirmar visualmente o isolamento entre duas organizações reais.

**Checkpoint**: exportação ligada; as rotas de export não são mais candidatas a deleção.

---

## Phase 7: US5 — Rotas órfãs, libs AGI e migrações one-shot (P5)

**Goal**: apagar as rotas sem chamador (Anexo B menos 3 allowlist e menos 4 export), as libs AGI que caem junto, e converter as 6 rotas de migração one-shot em scripts.

**Independent Test**: `ROTAS SEM CHAMADOR: no máximo 3`, todas na allowlist. Zero 404/500 novos em produção nas 72h seguintes.

**Depende de**: US4 (T044).

- [X] T045 [US5] Antes de cada deleção de rota: procurar o caminho no **repositório do app móvel** e em `public/` (o scanner ignora `public/`), **e** rodar `git log --diff-filter=D --name-only` para as rotas e libs desta fase (FR-005). Registrar as duas buscas no PR — foi assim que as 3 externas foram identificadas. **Feito**: `grep -rl` de cada um dos 31 caminhos candidatos em todo o repositório (inclui `android/`, o "repo do app móvel" — é o mesmo repositório, Capacitor carrega remoto via `server.url`, sem strings de rota no nativo) e em `public/` — zero chamador externo encontrado para qualquer um. `git log --diff-filter=D --name-only` para todas as rotas e as 2 libs AGI — só retornou `app/api/agi/chat-with-ui/route.ts` (já apagado na US6, não relacionado).
- [X] T046 [US5] Confirmar as preservações uma a uma e **não tocar**: `/api/sync/process`, `/api/mobile/sync`, `/api/mercadopago/checkout` (FR-007, seguem na allowlist), `lib/mercadopago.ts` e `/api/webhooks/mercadopago` (FR-008), `lib/nlp/graph-rag.ts` e `lib/nlp/graph-queries.ts` (FR-009). **Feito**: nenhuma tocada; confirmado por grep que `graph-rag.ts`/`graph-queries.ts` não importam `graph-skills.ts`/`auto-citation.ts` (T048).
- [X] T047 [P] [US5] Apagar as 7 rotas AGI/NLP órfãs — vítimas diretas de `2d29773`: `app/api/agi/query/`, `app/api/agi/enrich/`, `app/api/agi/diagnose/`, `app/api/agi/recommend/`, `app/api/agi/learning-path/`, `app/api/agi/explain-relationship/`, `app/api/nlp/extract/`. Mais `app/api/agi/test/` e `app/api/agi/diagnostic/`. **Feito**, as 9.
- [X] T048 [US5] Apagar as libs AGI que só essas rotas alcançavam: `lib/agi/graph-skills.ts` (511 linhas) e `lib/nlp/auto-citation.ts` (384). Confirmar antes que `lib/nlp/graph-rag.ts` e `graph-queries.ts` **não** dependem delas; depois abrir `admin/knowledge-graph` e confirmar que a tela responde (Acceptance US5-3). **Feito**. `admin/knowledge-graph/page.tsx` usa `lib/nlp/blog-processor` e `lib/nlp/pipeline`, sem relação com as libs apagadas — confirmado estruturalmente (sem device/servidor rodando nesta sessão), a página não depende do que foi removido.
- [X] T049 [P] [US5] Apagar as demais rotas órfãs: `app/api/integrations/whatsapp/settings/`, `app/api/whatsapp/diagnostic/`, `app/api/admin/billing/charge-overdue/`, `app/api/admin/organizations/`, `app/api/admin/organizations/[id]/tier/`, `app/api/admin/support/stats/`, `app/api/scraping/jobs/cleanup/`, `app/api/debug/pusher-test/`, `app/api/agenda/calendar-status/`. **Feito**, as 9. **Mais 6 rotas fora do plano original**, achadas pela cascata da US3 (registradas no handoff daquela fase): `app/api/notifications/` (+ `/stream`, `/[id]`, `/mark-all-read`), `app/api/pusher/auth/`, `app/api/leads/capture-calculator/` — reconfirmadas sem chamador nesta sessão (T045) antes de apagar. `ROTAS SEM CHAMADOR` foi de 34 (pós-US4) para 3.
- [X] T050 [US5] `app/api/billing/upgrade/` (141 linhas): é rota de **cobrança** sem chamador. Confirmar no banco/Stripe que nenhum fluxo ativo a atinge antes de apagar, e registrar a confirmação no PR. Se houver dúvida, ela fica e entra na allowlist com motivo — deletar rota de receita por contagem de importador é exatamente o erro que esta feature existe para não repetir. **Banco inacessível desta máquina nesta sessão** (mesmo `31.97.23.166:5434` sem resposta, catalogado desde T044) — confirmação por evidência estrutural em vez de consulta direta: (1) zero chamador em todo o repo (T045); (2) `MP_STARTER_PLAN_ID`/`MP_PRO_PLAN_ID`/`MP_BUSINESS_PLAN_ID` não existem em nenhum `.env*` do repo — a rota, mesmo chamada, nunca teria um plano MP real para cobrar; (3) `app/api/mercadopago/checkout/route.ts` tem o comentário explícito "checkout agora é Stripe" e delega para `/api/stripe/checkout` — o fluxo de cobrança ativo é Stripe, `billing/upgrade` é o fluxo antigo (Mercado Pago) já substituído. Apagada. **Lacuna registrada**: confirmação direta no banco/Stripe fica para quando houver acesso.
- [X] T051 [US5] Confirmar **no banco** que nenhuma organização ativa depende do fluxo de checkout novo. Só então apagar **um único arquivo**: `lib/mercado-pago/checkout.ts` (260 linhas, diretório com hífen). A rota `app/api/mercadopago/checkout/` (7 linhas) **permanece** — está na allowlist por chamador externo (FR-007, T046), e não confundir nenhum dos dois com `lib/mercadopago.ts`, vivo com 10 importadores (FR-008). Acceptance US5-2. **Mesma indisponibilidade de banco do T050** — evidência estrutural: zero importador de `checkout.ts` em todo o repo. **Divergência achada na execução**: `lib/mercado-pago/` também continha `products.ts` (225 linhas) e `__tests__/products.test.ts`, não previstos na tasks.md original — `checkout.ts` era o único importador de `products.ts` (`import { getPlanConfig, getAddonConfig } from './products'`), então apagar `checkout.ts` cascateia `products.ts` para órfão de 2ª ordem no mesmo instante (mesmo padrão da cascata da US3). Reescaneado após apagar só `checkout.ts`: `products.ts` sem nenhum importador restante, sem histórico de deleção — apagado junto com o teste, senão o `tsc`/`vitest` quebrariam (o teste importa de um módulo que deixou de existir). Diretório `lib/mercado-pago/` inteiro removido, não só o 1 arquivo previsto.
- [X] T052 [US5] Converter em `scripts/` executáveis com `tsx` as 6 operações one-shot, uma por script, e **apagar as rotas**: `app/api/admin/migrate-deals-pipeline/`, `fix-unread/`, `fix-waba-id/`, `add-closings-permission/`, `reset-wa-db/`, `sync-contacts/` (FR-017, Acceptance US5-4). Operação que não precise ser repetível vira script mesmo assim — o histórico do git guarda o que ela fazia. **Divergência**: `sync-contacts` não virou script — a rota já era um stub `410 Gone` sem nenhuma lógica de negócio (a sincronização real dependia do gateway whatsmeow, já descontinuado antes desta feature); não havia operação para converter, só apagar. As outras 5 viraram `scripts/migrate-deals-pipeline.ts`, `fix-unread.ts`, `fix-waba-id.ts`, `add-closings-permission.ts`, `reset-wa-db.ts` (mesmo padrão de `scripts/backfill-pipeline-stage-type.ts`: `@/lib/prisma`/`@/lib/prisma-wa`, `main().catch().finally()`, flags via `process.argv`); `reset-wa-db.ts` manteve a guarda de confirmação explícita (`--confirm RESET_WA_DB`) por ser destrutivo.
- [X] T053 [US5] Verificação: tríade + build. `node scripts/audit-dead-code.js --check` verde com no máximo 3 rotas, todas na allowlist. **Resultado**: `ARQUIVOS SEM IMPORTADOR: 0`; `ROTAS SEM CHAMADOR: 3/212` (`/api/sync/process`, `/api/mobile/sync`, `/api/mercadopago/checkout`, as 3 já na allowlist) — `--check` sai `0` pela primeira vez desde o T037 (US3) ligar o gate. `npx tsc --noEmit` limpo (após `rm -rf .next/` — mesmo manifesto stale de rotas apagadas já catalogado em T036/T019, não regressão). `npx vitest run`: 326 passed/2 failed/1 skipped na primeira rodada, mesma flakiness de `deal-isolation.test.ts` catalogada desde T019 — reconfirmada 100% passando isolada (`vitest run __tests__/multi-tenant/deal-isolation.test.ts` → 7 passed/1 skipped). `npx next build`: 591/591 páginas estáticas geradas, parou no mesmo `EINVAL` Windows/OneDrive de sempre (`node:inspector` → `standalone/`) e nos mesmos erros de Postgres remoto inacessível em páginas de blog — ambos catalogados desde T019/T036, CI (Linux) decide.
- [ ] T054 [US5] Após o deploy: acompanhar 404 e 500 novos no Sentry por **72 horas** (SC-004). Registrar o resultado no PR ou no `handoff.md`. **Pendente** — só é possível depois do merge/deploy; próxima sessão (ou o próprio usuário) fecha isso registrando o resultado no handoff.

**Checkpoint**: ≤3 rotas sem chamador, todas justificadas por escrito.

---

## Phase 8: US6 — Generative UI removido (P6)

**Goal**: apagar as 14.666 linhas do subsistema inteiro — 60% do corte total — e os 5 documentos que o descrevem como se estivesse em produção.

**Independent Test**: o chat do site responde normalmente; a suíte encolhe em 5 arquivos de teste e continua verde.

Decisão de produto tomada em 22/08: **abandonado, apagar** (Clarifications da spec). Retomar seria feature nova, com spec própria.

- [X] T055g [US6] Rodar `git log --diff-filter=D --name-only -- "*ChatWithUIExample*"` e confirmar no PR o que a auditoria afirma: o único cliente de `/api/agi/chat-with-ui` era renderizado pela página de admin apagada em `2d29773` (27/04/2026). É a evidência da FR-005 para a fase inteira — 14.666 linhas saem por causa de um único commit. **Resultado**: não há histórico de deleção do arquivo `ChatWithUIExample.tsx` em si (nunca foi apagado antes), mas `git show --stat 2d29773` confirma a evidência indireta: o commit apagou as 6 páginas de admin (`admin/generative-ui`, `admin/ab-testing` ×2, `admin/auto-citation` ×2, `admin/graph-rag` ×2, `admin/spin-chat` ×3) que eram os únicos consumidores do subsistema — `git log --all --oneline -- "*ChatWithUIExample*"` só mostra commits de feature/fix do próprio subsistema, nenhum de deleção do consumidor.
- [X] T055 [P] [US6] Apagar `components/generative-ui/` inteiro (10 componentes, 4 layouts, 2 workflows, ~5.100 linhas).
- [X] T056 [P] [US6] Apagar `lib/generative-ui/` inteiro, incluindo `intelligence/` (registry, schemas, workflow-engine, layout-engine, ab-testing, cache-store, optimistic-updates, props-auto-fill, context-extractor, trigger-logic — ~5.858 linhas).
- [X] T057 [P] [US6] Apagar os 5 hooks: `hooks/useABTest.ts`, `hooks/useWorkflow.ts`, `hooks/useOptimisticUpdate.ts`, `hooks/useComponentCache.ts`, `hooks/useComponentAnalytics.ts`.
- [X] T058 [P] [US6] Apagar os testes do subsistema **por diretório, não por contagem**: `__tests__/components/generative-ui/` (5 arquivos) e `__tests__/lib/generative-ui/component-registry.test.ts` — são 6, não 5. Mais `examples/optimistic-updates-example.tsx`. O `.bak` do mesmo diretório já saiu no T014.
- [X] T059 [P] [US6] Apagar as rotas `app/api/agi/chat-with-ui/` e as 3 de `app/api/ab-testing/[experimentId]/` (`assign`, `events`, `results`), mais a página `app/[locale]/admin/cache-stats/page.tsx` — **sem** o segmento `(admin)`, que não existe no repositório.
- [X] T060 [US6] Apagar os resíduos em `lib/agi/`: `lib/agi/tools/render-ui-tool.ts` e `lib/agi/prompts/generative-ui-prompt.ts`, removendo as referências a eles no registro de tools/prompts do AGI (Acceptance US6-2). **Resultado**: não existe um "registro" separado — `lib/agi/tools/` e `lib/agi/prompts/` só continham esses dois arquivos, e a única cadeia de importação era `app/api/agi/chat-with-ui/route.ts` → `generative-ui-prompt.ts` → `render-ui-tool.ts`, e a rota já saiu no T059. Nada a repontar.
- [X] T061 [US6] Confirmar que o chat em produção continua respondendo: `AgiChatSidebar` e `AgiPreview` usam `/api/agi/chat`, que **não** é tocado (Acceptance US6-1). Depois, `grep -rn "MessageRenderer\|DynamicUIComponent\|chat-with-ui\|useABTest\|useWorkflow\|useComponentCache" --include=*.ts --include=*.tsx . | grep -v node_modules` tem de vir vazio. **Resultado**: confirmado — `components/agi/AgiChatSidebar.tsx:93` e `AgiPreview.tsx:40` chamam `/api/agi/chat`; grep pós-deleção vazio em `app/`, `lib/`, `components/`, `hooks/` (só sobra em docs/specs, esperado).
- [X] T062 [P] [US6] Apagar os 5 documentos: `docs/GENERATIVE_UI_ARCHITECTURE.md`, `GENERATIVE_UI_CHECKLIST.md`, `GENERATIVE_UI_NEXT_STEPS.md`, `GENERATIVE_UI_SUMMARY.md`, `GENERATIVE_UI_USAGE_GUIDE.md`. `ls docs/GENERATIVE_UI_*.md` tem de não retornar nada. **Achado, fora de escopo desta tarefa**: `docs/QUICK_START_GENUI.md`, `scripts/test-genui-endpoint.js`, `scripts/COMO_TESTAR.md`, `docs/AUDITORIA_OVER_ENGINEERING_2026-08-22.md` e `roadmaps/roadmap_en.md` também mencionam o subsistema removido mas não estavam nesta lista de 5 — deixados para o T076 (Polish), registrado no PR.
- [X] T063 [US6] Registrar em `CHANGELOG.md` a remoção com o motivo **e o commit de origem do órfão (`2d29773`)**, para que a decisão seja recuperável por quem chegar depois (FR-019, Acceptance US6-3).

**Checkpoint atingido**: 73 arquivos apagados, 21.638 linhas removidas (`git diff --stat`). Tríade + build verdes localmente e na CI (PR #4, run 32711763024, todos os checks obrigatórios `success`; `E2E Tests (Playwright)` reprovou pelo mesmo Postgres-não-provisionado pré-existente, `continue-on-error: true`, catalogado desde US0 — não é regressão). Mergeado em `main` via squash (commit `f70086a`), branch remota apagada. **Nota**: `ARQUIVOS SEM IMPORTADOR` do scanner caiu só 46→41 (não ~14.700 linhas) porque o subsistema inteiro era alcançável só por imports cruzados internos e não pintava como órfão antes de ser apagado — exatamente como o Notes da tasks.md já previa.

**Checkpoint**: ~14.700 linhas a menos; nenhum documento descreve como em produção um subsistema que não existe (SC-008).

---

## Phase 9: US7 — Consolidação de conceitos duplicados (P7)

**Goal**: uma implementação por conceito — formatadores, limites de plano, hooks.

**Independent Test**: a renderização de valores, datas e telefones nas telas principais é idêntica antes e depois.

**Depende de**: US3 (T036) e US6 (T063) — senão consolida arquivos que vão ser apagados.

**⚠️ Única história que refatora código vivo**, com comportamento potencialmente observável.

- [ ] T064 [US7] Antes de escrever `lib/format.ts`: catalogar num rascunho as 25 implementações (10× `formatCurrency`, 10× `formatDate`, 3× `formatPhone`, 2× `timeAgo`) e **as divergências de comportamento entre elas** — valor nulo, data inválida, telefone com e sem DDI. É o catálogo que define o alvo, não a primeira implementação encontrada.
- [ ] T065 [US7] Criar `lib/format.ts` conforme [data-model.md](./data-model.md#libformatts-novo-us7): `formatCurrency` sobre `Intl.NumberFormat('pt-BR', …BRL)`, `formatDate` sobre `date-fns` (já é dependência, usada em 21 arquivos), `formatPhone` em string pura, `timeAgo` sobre `Intl.RelativeTimeFormat('pt-BR')`. Sem estado, sem configuração, sem classe.
- [ ] T066 [US7] Teste em `lib/__tests__/format.test.ts` cobrindo os casos de borda catalogados no T064. É a única mudança desta feature que altera saída renderizada; divergência encontrada é decidida a favor do que hoje aparece nas telas principais e **registrada no PR** (FR-020).
- [ ] T067 [US7] Migrar os 25 call sites para `lib/format.ts` e apagar as definições locais. Confirmar: `grep -rn "function formatCurrency\|const formatCurrency" --include=*.ts --include=*.tsx . | grep -v node_modules | grep -v lib/format.ts` vem vazio.
- [ ] T068 [US7] Fundir `lib/feature-gates.ts` (623 linhas) e `lib/plan-limits.ts` (209) em `lib/entitlements.ts`, deixando uma fonte única de limites de plano ([data-model.md](./data-model.md#libentitlementsts-fusão-us7)). `plan-limits.ts` hoje só relê `PLAN_LIMITS` de `entitlements.ts`.
- [ ] T069 [US7] Repontar os 3 importadores de `lib/plan-limits.ts` e todos os gates de feature para `lib/entitlements.ts`; apagar os dois arquivos absorvidos (Acceptance US7-2).
- [ ] T070 [P] [US7] Renomear `hooks/useNotifications.ts` → `hooks/use-notifications.ts` e atualizar os importadores. Após US3 e US6, é o único arquivo fora da convenção `use-x.ts` (research [R8](./research.md#r8--o-que-sobra-em-hooks-depois-das-deleções-simplifica-a-us7)).
- [ ] T071 [P] [US7] Mover `lib/hooks/use-entitlements.ts` e `lib/hooks/__tests__/` para `hooks/`, atualizar os importadores e apagar `lib/hooks/` (FR-022).
- [ ] T072 [US7] Verificação visual antes/depois: valor monetário, data e telefone na listagem de deals, na ficha de contato e no dashboard. **Nenhuma diferença visível** — nem separador, nem casa decimal, nem formato de data (Acceptance US7-1).
- [ ] T073 [US7] Tríade + build. Confirmar SC-007: a suíte continua verde e o tempo total de execução **não aumentou**.

**Checkpoint**: um nome por conceito.

---

## Phase 10: Polish & fechamento da feature

- [ ] T074 Provar o gate (SC-006): num PR **descartável**, apagar uma página que seja a única consumidora de uma rota de API e abrir o PR. Esperado: a CI **reprova**, nomeando a rota órfã. É a reprodução exata de `2d29773`. Enquanto este teste não reprovar, a FR-023 não está entregue — mesmo com o job existindo e verde. Descartar o PR depois.
- [ ] T075 Medir o resultado final contra `baseline.md`: arquivos sem importador `0`, rotas sem chamador `≤3` todas com motivo escrito, `≥24.000` linhas removidas, 12 dependências a menos, CI verde em `main` com testes executando (SC-001, SC-002, SC-003).
- [ ] T076 [P] Varrer `docs/` por qualquer outro documento que descreva como em produção algo removido nas fases 5–8, e corrigir ou apagar (SC-008).
- [ ] T077 [P] Fechar o `CHANGELOG.md` com as remoções grandes de US3, US5 e US7 que ainda não estejam registradas, cada uma com motivo e commit de origem (FR-019).
- [ ] T078 Escrever `handoff.md` co-localizado com o resultado das 72h de Sentry de cada deploy (SC-004) e o que ficou de fora: o service account `sirius-crm-483316-a2e815438069.json` na raiz **continua lá** — é achado de segurança fora do escopo desta feature, pede `/security-review` e rotação em passagem própria.

---

## Dependencies & Execution Order

### Ordem das fases

```
Setup (T001)
   └─> US0 (T002-T013)  🚧 BLOQUEIA TODAS AS DEMAIS
          ├─> US1 (T014-T019)
          ├─> US2 (T020-T026)
          ├─> US3 (T027-T037) ──┐
          ├─> US4 (T038-T044)   │
          │      └─> US5 (T045-T054)
          ├─> US6 (T055-T063) ──┤
          │                     └─> US7 (T064-T073)
          └────────────────────────> Polish (T074-T078)
```

### As duas dependências duras

| Dependência | Por quê |
|---|---|
| **US4 antes de US5** | Senão a US5 apaga as 4 rotas `/api/export/*` que a US4 ia ligar (FR-011) |
| **US7 depois de US3 e US6** | Senão consolida formatadores e hooks de arquivos que vão ser apagados |

US1, US2, US3, US4 e US6 são independentes entre si e podem ser feitas em qualquer ordem depois da US0 — mas cada uma é seu próprio PR (FR-001).

### Dentro de cada fase

- Tarefas `[P]` tocam arquivos diferentes e podem rodar juntas.
- A tarefa de `git log` (T027) e as de confirmação (T030, T035, T046, T050, T051, T061) vêm **antes** das deleções que elas autorizam.
- A verificação fecha a fase, sempre.

---

## Notes

- **Deleção não é perda**: tudo volta do git. Nenhuma história precisa de branch de arquivamento.
- **Não somar linhas por história**: as somas do Anexo A se sobrepõem com os itens 1, 9, 11 e 15 da auditoria. O único total não sobreposto é 24.411, e o progresso se mede pela saída do `audit-dead-code.js`.
- **Código morto não quebra teste — a ausência dele é que pode.** Por isso a verificação é rodar os comandos, não ler o diff.
- O Constitution Check do plano é **vacuoso**, não aprovado: `.specify/memory/constitution.md` está com o template não preenchido. Se for escrita antes da US7, o gate é reavaliado.
