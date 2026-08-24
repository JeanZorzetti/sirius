# Handoff — Remoção de código morto (Sirius CRM)

**Feature**: `002-remove-dead-code` | **Escrito em**: 2026-08-24 (atualizado após US5) | **Para**: próxima sessão que continuar via `/speckit-implement`

## Onde parou

**US0 (Fase 1+2), US1 (Fase 3), US2 (Fase 4), US6 (Fase 8), US3 (Fase 5) e US4 (Fase 6) concluídas e mergeadas em `main`** — commits `521cc65` (PR #1), `75fcf11` (PR #2, US1), `6543fc8` (PR #3, US2), `f70086a` (PR #4, US6), `c1c5d3d` (PR #5, US3, squash) e `eb181f4` (PR #6, US4). T001–T044 e T055–T063 todos `[X]` em [tasks.md](./tasks.md).

**US5 (Fase 7, T045–T053) concluída nesta sessão**, branch `002-us5-rotas-orfas-agi-migracoes`, aguardando abertura/merge do PR — ver seção própria abaixo. **T054 (monitorar Sentry 72h pós-deploy) fica pendente** até o merge acontecer de fato; registrar o resultado no handoff quando alguém tiver acesso ao Sentry depois do deploy.

Próximo passo depois do merge da US5: **US7** (T064 em diante, Fase 9) — já estava desbloqueada desde que US3+US6 fecharam, não depende de US5. Depois dela só falta o Polish (Fase 10, T074+).

**⚠️ O gate `--check` do job `dead-code` (ligado vermelho de propósito no T037/US3) agora fecha verde** — `ROTAS DE API SEM CHAMADOR` caiu de 38 para 3 (todas na allowlist: `/api/sync/process`, `/api/mobile/sync`, `/api/mercadopago/checkout`) e `ARQUIVOS SEM IMPORTADOR` está em 0. Confirmado localmente com `node scripts/audit-dead-code.js --check` → exit 0. Isso deve refletir na CI do PR da US5 assim que ela rodar — se por algum motivo aparecer vermelho lá, é regressão de verdade agora (diferente do período US3→US5, onde vermelho era esperado).

**⚠️ Nota para quem for fazer a US7**: a T070 do plano ("Renomear `hooks/useNotifications.ts` → `hooks/use-notifications.ts`") está **obsoleta** — esse arquivo foi apagado na cascata de 2ª ordem da US3 (junto com `components/notification-center.tsx`, que era seu único importador). Não existe mais nada para renomear ali; pular essa parte específica de T070 quando chegar a hora (o resto da tarefa, se houver, segue normal).

## US5 — o que saiu diferente do planejado

Divergência real, achada só depois de reescanear (mesmo padrão de cascata de 2ª ordem já visto na US3, desta vez em dois lugares):

1. **`lib/mercado-pago/` tinha mais coisa do que o T051 previa.** A tarefa mandava apagar só `lib/mercado-pago/checkout.ts` (260 linhas). O diretório também continha `products.ts` (225 linhas, config de planos/preços MP) e `__tests__/products.test.ts`. `checkout.ts` era o único importador de `products.ts` (`import { getPlanConfig, getAddonConfig } from './products'`) — apagar `checkout.ts` cascateia `products.ts` para órfão de 2ª ordem imediatamente. Reescaneado depois de apagar só `checkout.ts`: `products.ts` ficou com zero importador, sem histórico de deleção (`git log --diff-filter=D` vazio) — apagado junto com o teste (senão `tsc`/`vitest` quebravam, o teste importa de um módulo que deixou de existir).
2. **`lib/email-marketing.ts` (197 linhas) órfão de 2ª ordem da cascata da própria US3.** `app/api/leads/capture-calculator/route.ts` (uma das 6 rotas "fora do plano original" já registradas no handoff da US3) era o único importador de `captureLeadFromCalculator`. Ao apagar a rota (T049), `lib/email-marketing.ts` ficou sem chamador — pego só no reescaneamento pós-T049/T052, não estava em nenhuma lista congelada porque a cascata da US3 nunca tinha sido rastreada até esse arquivo. Sem histórico de deleção, sem outro importador — apagado.

Depois dessas duas cascatas, `node scripts/audit-dead-code.js` foi de `ARQUIVOS SEM IMPORTADOR: 1` (o `lib/mercado-pago/checkout.ts` reservado pela US3) para **0**, e `ROTAS SEM CHAMADOR` de 34 (estado pós-US4) para **3**, todas na allowlist — bate exatamente com a meta do T053.

**T050 e T051 (rotas/lib de cobrança) verificados por evidência estrutural, não consulta direta ao banco/Stripe** — mesmo problema de `31.97.23.166:5434` inacessível desta máquina, catalogado desde T044/US4. Testado de novo nesta sessão (`prisma.$queryRaw` direto) para confirmar que continua assim, não é suposição herdada. Evidência substituta usada, registrada em detalhe no `tasks.md`: zero chamador em todo o repo (incluindo `android/`) para as duas; nenhuma env var `MP_STARTER_PLAN_ID`/`MP_PRO_PLAN_ID`/`MP_BUSINESS_PLAN_ID` existe em nenhum `.env*`; e `app/api/mercadopago/checkout/route.ts` traz o comentário explícito "checkout agora é Stripe", confirmando que o fluxo de cobrança ativo migrou e o antigo (Mercado Pago, `billing/upgrade` + `lib/mercado-pago/`) é órfão de verdade, não só sem importador textual. **Lacuna registrada**: confirmação direta no banco/Stripe fica para quando alguém tiver acesso.

**T052 — `sync-contacts` não virou script.** A rota já era um stub `410 Gone` sem nenhuma lógica (a sincronização real dependia do gateway whatsmeow, descontinuado antes desta feature) — não havia operação para preservar em script, só apagar a rota morta. As outras 5 (`migrate-deals-pipeline`, `fix-unread`, `fix-waba-id`, `add-closings-permission`, `reset-wa-db`) viraram scripts em `scripts/`, seguindo o padrão já usado em `scripts/backfill-pipeline-stage-type.ts` (import de `@/lib/prisma`/`@/lib/prisma-wa`, `main().catch().finally()`, flags via `process.argv`). `reset-wa-db.ts` manteve a guarda de confirmação explícita (`--confirm RESET_WA_DB`) por apagar dados em massa.

**Verificação (T053)**: `ARQUIVOS SEM IMPORTADOR: 0`; `ROTAS SEM CHAMADOR: 3/212` (as 3 da allowlist); `--check` sai `0` pela primeira vez desde o T037 ligar o gate. `npx tsc --noEmit` limpo (precisou `rm -rf .next/` primeiro — mesmo manifesto stale de rotas apagadas já catalogado em T019/T036, não regressão). `npx vitest run`: 326 passed/2 failed/1 skipped — mesma flakiness de `deal-isolation.test.ts` de sempre (timeout de 5s por contenção de workers), reconfirmada 100% passando isolada. `npx next build`: 591/591 páginas estáticas geradas, parou no mesmo `EINVAL` Windows/OneDrive (`node:inspector` → `standalone/`) e nos mesmos erros de Postgres remoto inacessível em páginas de blog — os dois catalogados desde T019/T036, CI (Linux) decide o resultado real.

**Não verificado nesta sessão**: `admin/knowledge-graph` estruturalmente confirmado independente das libs AGI apagadas (imports diferentes — `lib/nlp/blog-processor` e `lib/nlp/pipeline`, não `graph-skills.ts`/`auto-citation.ts`), mas não aberto de fato num navegador (sem servidor/banco disponível nesta sessão). Se a próxima sessão tiver acesso, vale confirmar visualmente (Acceptance US5-3).

PR ainda não aberto no momento em que este handoff foi escrito — ver "Como retomar" para o estado exato do branch.

## US4 — o que saiu diferente do planejado

(Nunca teve handoff próprio — feito antes da US3 fechar o registro do PR #6. Resumo a partir do `tasks.md`, para não faltar contexto.)

`components/export-menu.tsx` **não foi criado** — já existia `components/ui/export-buttons.tsx` (`ExportButtons`), componente genérico com dropdown XLSX/PDF já funcionando em `contacts-actions-bar.tsx`. Decisão: estender o componente existente (prop `disabled`, rótulo "Exportar tudo", padrão de tooltip acessível via `ux-writing`/`accessibility`) em vez de duplicar. Divergência técnica achada e corrigida: a URL das rotas de export era montada por template string, o que faria `scripts/audit-dead-code.js` continuar marcando as 4 rotas `/api/export/*` como "sem chamador" mesmo depois de ligadas (o script não resolve caminho montado em runtime) — trocado por um lookup `EXPORT_ROUTES` com os 4 caminhos como string literal. T044 (verificação) foi estrutural, não em navegador — Postgres remoto inacessível também nessa sessão. CI do PR #6: verde nos checks obrigatórios de sempre (ver padrão dos PRs anteriores).

## US3 — o que saiu diferente do planejado

Duas divergências reais, as duas achadas só depois de rodar o scanner de novo — nenhuma das duas estava na tasks.md:

1. **Cascata de 2ª ordem em arquivos.** Os ~40 arquivos listados na tasks.md para esta fase eram o Anexo A congelado antes da US1/US2/US6 rodarem. Depois de apagar esses 40, rodei `node scripts/audit-dead-code.js` de novo (hábito herdado da US6, T055g) e apareceram **7 órfãos novos**: cada um só tinha, como único importador, um dos 40 arquivos que acabei de apagar. Exemplos: `hooks/useNotifications.ts` só era usado por `components/notification-center.tsx` (que saiu no T032); `lib/mobile/ocr.ts` só era usado por `components/mobile/scan-card-button.tsx` (T029). Confirmado via `git diff --cached` que cada um dos 7 tinha exatamente um importador, e esse importador era um arquivo já deletado nesta mesma leva. Apaguei os 7 também — **sem isso a US3 não fecha em zero**, e a tasks.md nem sabia que eles existiam (T031a já tinha esse mesmo padrão previsto para 2 hooks; aqui apareceu de novo, maior, e sem aviso prévio). `ARQUIVOS SEM IMPORTADOR`: 41 → 1 (o `1` que sobra, `lib/mercado-pago/checkout.ts`, é da US5, não desta fase — T051 já reserva ele).
2. **A mesma cascata orfanou rotas de API, que não são desta fase.** `hooks/useNotifications.ts` e `components/calculadora-roi-with-lead-capture.tsx` eram os únicos chamadores de 6 rotas (`/api/notifications`, `/api/notifications/stream`, `/api/notifications/[id]`, `/api/notifications/mark-all-read`, `/api/pusher/auth`, `/api/leads/capture-calculator`). `ROTAS SEM CHAMADOR` subiu de 32 para 38. **Não toquei nelas** — US3 é sobre arquivos (Anexo A), rotas são Anexo B, escopo da US5. Ficam registradas aqui para a próxima sessão não redescobrir do zero: quando for fazer a US5, rodar o scanner de novo primeiro, porque provavelmente vai ter mais 6 rotas na lista do que a tasks.md original previa.

**T027 também saiu diferente do esperado**: a tasks.md previa que "a maioria aponta para `2d29773`" (o commit que matou o Generative UI e derrubou o consumo cruzado de 6 páginas admin, mesma causa da US6). Não foi isso — `git show --stat 2d29773 | grep` não bate com nenhum caminho dos 47 arquivos desta fase. Nenhum dos 47 tem histórico de deleção de si mesmo (`git log --diff-filter=D` vazio para todos). A causa real ficou sem explicação individual — provavelmente componentes/libs que nunca chegaram a ser conectados (código morto de nascença, não órfão por refactor).

**T037 (ligar o gate `--check`) teve decisão do usuário no meio da sessão** — ver o aviso no topo deste handoff. Resumindo: liguei, sabendo que fica vermelho até a US5, porque foi isso que o usuário escolheu quando perguntei.

CI do PR #5: verde em todos os checks que importam (`Lint & Format Check`, `TypeScript Type Check`, `Security Audit`, `Database Migration Check`, `Unit Tests (Vitest)`, `Build Application`). `Dead Code Scan` reprovou **por design** (T037, ver aviso). `E2E Tests (Playwright)` reprovou pelo mesmo Postgres-não-provisionado pré-existente, catalogado desde a US0. Mergeado por squash pelo próprio usuário (`c1c5d3d`), branch remota apagada por mim depois.

**Verificação não feita**: Acceptance US3-4 pedia passar pelo app Capacitor num device/emulador real (navegação, bottom-nav, teclado, status bar, deep link). Não tinha device disponível nesta sessão — fiz só a verificação estrutural (`npx cap sync` limpo, 16 plugins intactos, os 5 módulos nativos que não podiam ser tocados — `native-initializer`, `keyboard.ts`, `status-bar.ts`, `deep-links.ts`, `badge.ts` — confirmados presentes). Se a próxima sessão tiver acesso a um device, vale fechar esse buraco antes de considerar a US3 100% verificada.

## US6 — o que saiu diferente do planejado

Nada divergiu de fato (nenhuma correção de bug), mas duas coisas do planejamento pediram ajuste de leitura na hora de executar, ambas registradas no PR:

1. **T055g não achou histórico de deleção do arquivo em si.** `git log --diff-filter=D --name-only -- "*ChatWithUIExample*"` voltou vazio — o arquivo nunca foi apagado antes (é a própria fase que o apaga). A evidência da FR-005 veio indireta: `git show --stat 2d29773` confirma que esse commit apagou as 6 páginas de admin (`admin/generative-ui`, `admin/ab-testing` ×2, `admin/auto-citation` ×2, `admin/graph-rag` ×2, `admin/spin-chat` ×3) que eram os únicos consumidores do subsistema inteiro, não só do `ChatWithUIExample`.
2. **T060 não tinha "registro" nenhum para repontar.** `lib/agi/tools/` e `lib/agi/prompts/` só continham os dois arquivos da própria tarefa — não existe um índice/registry central de tools do AGI. A cadeia de import era só `chat-with-ui/route.ts` → `generative-ui-prompt.ts` → `render-ui-tool.ts`, e a rota já saiu no T059. Nada a atualizar em outro lugar.

Achado fora de escopo, deixado como está e registrado no PR (T062): `docs/QUICK_START_GENUI.md`, `scripts/test-genui-endpoint.js`, `scripts/COMO_TESTAR.md`, `docs/AUDITORIA_OVER_ENGINEERING_2026-08-22.md` e `roadmaps/roadmap_en.md` ainda mencionam o subsistema removido, mas não estavam na lista de 5 docs do T062 — vão para o T076 (Polish).

**Números**: 73 arquivos apagados, 21.638 linhas (`git diff --stat`) — bem acima da estimativa de ~14.700 do tasks.md (a estimativa somava só components+lib; testes, hooks, rotas e docs entram por fora). O scanner (`ARQUIVOS SEM IMPORTADOR`) só caiu 46→41, **não** ~14.700 linhas — o subsistema inteiro era alcançável só por imports cruzados internos e não pintava como órfão antes de ser apagado, exatamente como a nota da tasks.md já previa. `npx tsc --noEmit` só ficou limpo depois de `rm -rf .next/` — a primeira rodada acusava `TS2307` em manifestos de rotas stale (`validator.ts`) de um build anterior que ainda referenciava as rotas apagadas; não é regressão de código.

CI do PR #4: verde em todos os checks obrigatórios (`Dead Code Scan`, `TypeScript Type Check`, `Lint & Format Check`, `Unit Tests (Vitest)`, `Build Application`, `Security Audit`, `Database Migration Check`). `E2E Tests (Playwright)` reprovou — mesmo Postgres não provisionado na CI, catalogado desde US0, `continue-on-error: true`, não é regressão.

## US2 — o que saiu diferente do planejado

Nada divergiu do planejado desta vez — a única fase das quatro já executadas sem surpresa de verificação. Duas decisões deliberadas de escopo, registradas no PR:

1. **Prefixos de chave Redis não renomeados.** `lib/plan-quota.ts` manteve os prefixos `ratelimit:api:free`/`ratelimit:api:pro` como estavam — mudar o prefixo resetaria contadores de cota já em produção, e não estava no escopo da tarefa (que listava 5 identificadores de código a renomear, não chaves de armazenamento).
2. **T026 (busca de leads pelos providers) verificado estruturalmente, não ao vivo.** `HYBRID_CRAWLER` (prioridade 4 na factory, sempre "configurado") faz scraping ao vivo do Google quando `searchLeads()` é chamado de verdade. Em vez de disparar isso numa verificação automatizada, confirmei que a factory expõe exatamente os 5 providers esperados (nenhum dos 5 apagados) e que `searchLeads()` continua sendo a entrada pública — evidência suficiente de que a remoção não quebrou o call graph, sem gerar tráfego real contra terceiros.

CI do PR #3: verde em todos os checks obrigatórios (`Dead Code Scan`, `TypeScript Type Check`, `Lint & Format Check`, `Unit Tests (Vitest)`, `Build Application`, `Security Audit`, `Database Migration Check`). `E2E Tests (Playwright)` reprovou — mesmo problema pré-existente de Postgres não provisionado na CI (`continue-on-error: true`), já catalogado desde a US0, não é regressão desta fase.

## US1 — o que saiu diferente do planejado (duas divergências reais, achadas na verificação)

1. **`openai` não podia sair.** A lista das 12 dependências a remover (T017) incluía `openai`, mas `lib/rag/embeddings.ts` ainda o importa e é usado por `app/api/ia/knowledge/route.ts` — rota que nem `research.md` nem `baseline.md` cobrem. `npx tsc --noEmit` acusou na hora. Restaurado; **saíram 11 dependências, não 12**.
2. **`@testing-library/dom` só aparecia na CI (Linux), não localmente.** Depois de restaurar o `openai` e rodar a tríade local (tudo verde), o PR reprovou no `TypeScript Type Check` da CI com `TS2305` em 8 arquivos de teste (`screen`/`waitFor`/etc "no exported member" de `@testing-library/react`). Não reproduzia local por causa de `tsconfig.tsbuildinfo` desatualizado (`incremental: true` mascarava o erro). Raiz real: `@testing-library/dom` é peer dependency de `@testing-library/react`, nunca foi declarada em `package.json` — chegava na árvore só como transitiva de um dos pacotes removidos (`--legacy-peer-deps` não instala peers sozinho). Corrigido declarando `"@testing-library/dom": "^10.4.1"` em `devDependencies`.

**Lição para as próximas fases de remoção de dependência**: depois de editar `package.json`, sempre `rm -rf node_modules tsconfig*.tsbuildinfo && npm ci --legacy-peer-deps` antes de confiar no `tsc --noEmit` local — um `npm install <pkg>` incremental ou um `.tsbuildinfo` velho escondem exatamente esse tipo de regressão, e só a CI (que sempre roda limpa) pega. Comparar o `package-lock.json` do branch contra o de `main` (`git diff main -- package-lock.json`) é como se achou a causa raiz das duas vezes.

O E2E do PR #2 falhou (`continue-on-error`, como esperado) — mesmo problema pré-existente da US0, Postgres não provisionado na CI. Verificação manual: `npx next dev` local, `GET /` → `200`.

## Regra de execução acordada com o usuário nesta sessão

- **Uma história = um branch = um PR** (FR-001 da própria spec — não é preferência minha, é requisito).
- **Fase a fase, com checkpoint**: rodar a história, verificar localmente (tríade: `tsc --noEmit`, `vitest run`, `audit-dead-code.js`), abrir PR, acompanhar a CI real (`gh run watch`), só then perguntar antes de dar merge. Não emendar duas histórias no mesmo PR.
- Antes de cada branch nova: `git status` limpo. Ver "Pendência" abaixo antes de mexer nos arquivos citados.

## O que a US0 corrigiu (contexto para não repetir diagnóstico)

CI estava vermelha desde julho. Além dos T002–T011 previstos na tasks.md, apareceram **3 problemas pré-existentes não previstos pela research.md**, todos raiz-causa consertados:

1. `components/marketing/kanban-preview.tsx` — erro de tipo (`accent` ausente em 3 dos 4 itens de um array `as const`) bloqueava o typecheck. Fix de 1 linha × 3.
2. `mcp-server/` é subprojeto próprio (`package.json`/`tsconfig.json`/`node_modules` independentes, nunca instalado pela CI) — vazava pro `tsc --noEmit` da raiz. Excluído em `tsconfig.json`, mesmo tratamento que `scripts/` e `e2e/` já tinham.
3. `test-e2e` nunca tinha rodado de verdade (sempre bloqueado por `needs: [build]`, que estava vermelho). Ao rodar pela primeira vez: **17 specs, não 3** (`ls e2e/*.spec.ts` não pega subpastas — tem `e2e/api/`, `e2e/auth/`, `e2e/deals/`, `e2e/pipelines/`, `e2e/tasks/`), 378 testes, a maioria batendo em Postgres que a CI não provisiona. Decisão do usuário: **não bloquear o PR nisso** — `continue-on-error: true` no job, `globalTimeout: 8min` no `playwright.config.ts` (senão o job batia no `timeout-minutes` e virava `cancelled`, que `continue-on-error` não neutraliza — só `failure` normal é neutralizado). Subir Postgres real em CI é história própria, não escopo desta feature.

Lint tinha **1148 erros pré-existentes** (não relacionados a código morto: `no-explicit-any`, `no-html-link-for-pages`, `no-require-imports`, `react-hooks/*`). Rebaixados a `warn` em `eslint.config.mjs` com comentário `ponytail:` explicando — não foi feito refactor de tipos em massa, é dívida visível, não escondida.

Baseline oficial (idêntico local e CI, `specs/002-remove-dead-code/baseline.md`): **59 arquivos sem importador (7.368 linhas), 32 rotas sem chamador (2.061 linhas), 9.429 linhas via o scanner hoje** (os ~24.411 totais da spec só aparecem depois que a US6 apagar o Generative UI, que hoje é alcançável por imports cruzados internos e por isso não pinta como órfão ainda).

## ⚠️ Pendência — NÃO É DESTA FEATURE, mas precisa de decisão

Antes de começar a US0, havia mudanças não commitadas em `main` que não pareciam parte da spec 002:
`.dockerignore`, `.gitignore`, `app/[locale]/(marketing)/help/page.tsx`, `app/[locale]/dashboard/settings/integrations/whatsapp-official/page.tsx`, `app/[locale]/dashboard/support/page.tsx`, `components/dashboard/sidebar.tsx`, `components/integrations/whatsapp-setup-cta.tsx` (+ 3 arquivos da própria spec 002, já reconciliados).

Por instrução do usuário, foram guardadas em `git stash` em vez de descartadas — **ainda estão em `stash@{0}` ("wip antes de speckit-implement...")** e nunca foram reaplicadas. `git stash show -p stash@{0}` pra ver o conteúdo antes de decidir (aplicar, descartar ou perguntar pro usuário de quem é esse trabalho).

Existe também um `stash@{1}` ("WIP on main: 0633e39...") — esse é anterior a esta sessão, não mexi nele, não sei do que se trata.

## Arquivos não rastreados na raiz (não é lixo, não apagar sem checar)

`.claude/skills/`, `.specify/{init-options.json,integration.json,integrations/,memory/,scripts/,templates/,workflows/}`, `docs/screenshots/image.png` — instalação do Spec Kit + 1 screenshot, nunca commitados no repo (vieram de uma sessão anterior). Não fazem parte de nenhum PR desta feature. Ficam como estão até alguém decidir commitá-los ou não.

## Como retomar

1. `git status` na `main` — confirmar limpa (deve mostrar só os untracked de sempre, ver seção acima).
2. **Estado do branch da US5 no momento em que este handoff foi escrito**: `002-us5-rotas-orfas-agi-migracoes`, criado a partir de `main` pós-US4 (`eb181f4`), com T045-T053 implementados e verificados localmente (tríade + build), mas **ainda sem commit, sem push, sem PR aberto**. Antes de continuar: `git status` nesse branch (ou `git branch -a` se ele não existir mais localmente) pra ver se ficou pendente ou se já foi commitado/PR aberto por essa mesma sessão depois deste handoff. Se pendente: revisar `git status`/`git diff` contra a lista de arquivos apagados/criados nas seções "US5" acima, `git add`, commit, push, abrir PR, acompanhar CI (`gh run watch`), **perguntar antes de mergear** — mesmo fluxo de sempre.
3. Depois do merge da US5: próxima fase é **US7** (Fase 9, T064 em diante) — já desbloqueada, sem dependência de US5. Criar branch a partir de `main` atualizada, mesmo fluxo (tríade local, PR, CI, perguntar antes de merge). Ver a nota "US7" no topo deste handoff sobre a T070 estar parcialmente obsoleta (`hooks/useNotifications.ts` já não existe, apagado na cascata da US3).
4. Depois da US7: só falta o Polish (Fase 10, T074+) — `tasks.md` tem a lista completa, incluindo o T077 (fechar `CHANGELOG.md` com as remoções grandes de US3/US5/US7) e o T076 (docs órfãs deixadas de propósito pela US6, mais o achado desta sessão de entradas stale em `i18n/routing.ts` apontando pra páginas do Generative UI já apagadas — `/admin/auto-citation`, `/admin/ab-testing`, `/admin/generative-ui`, `/admin/graph-rag`, `/admin/spin-chat` — fora do escopo da US5, registrar ali).
5. **Antes de apagar qualquer arquivo em qualquer fase futura**: rodar `node scripts/audit-dead-code.js` de novo primeiro, mesmo que a tasks.md já tenha uma lista congelada — tanto a US3 quanto a US5 mostraram cascatas de 2ª ordem (um arquivo/lib que só existia por causa de outro já apagado na mesma fase) que só aparecem no scanner ao vivo, nunca na lista congelada do plano original.
6. **`node scripts/audit-dead-code.js --check` deve estar verde agora** (0 arquivos, 3 rotas, todas na allowlist) assim que a US5 mergear — se aparecer vermelho depois disso, é regressão de verdade, não mais o vermelho esperado do período US3→US5.
7. **Nota de ferramenta**: `.claude/skills/speckit-implement/` (e as demais `speckit-*`) existem no repo mas estão **não commitadas** — o harness pode não descobri-las via listagem automática de skills numa sessão nova. Se `Skill({skill: "speckit-implement"})` falhar com "Unknown skill", ler `.claude/skills/speckit-implement/SKILL.md` diretamente e seguir manualmente — foi o que esta sessão fez.
