# Handoff — Remoção de código morto (Sirius CRM)

**Feature**: `002-remove-dead-code` | **Escrito em**: 2026-08-23 (atualizado após US2) | **Para**: próxima sessão que continuar via `/speckit-implement`

## Onde parou

**US0 (Fase 1+2), US1 (Fase 3) e US2 (Fase 4) concluídas e mergeadas em `main`** — commits `521cc65` (PR #1), `75fcf11` (PR #2, US1) e `6543fc8` (PR #3, US2). T001–T026 todos `[X]` em [tasks.md](./tasks.md).

Próximo passo: **qualquer uma de US3, US4 ou US6** (T027 em diante) — são independentes entre si e podem vir em qualquer ordem. Ninguém começou nenhuma delas ainda. **US4 antes de US5** e **US7 depois de US3 e US6** continuam sendo as duas regras duras (ver tasks.md).

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

1. `git status` — confirmar main limpa (deve mostrar só os untracked acima).
2. Rodar `/speckit-implement` de novo (ou seguir manualmente `tasks.md` a partir da Fase 5, US3).
3. Criar branch nova a partir de `main` atualizada (ex.: `002-us3-arquivos-sem-importador`, ou escolher US4/US6 primeiro — são independentes), executar as tarefas da fase, tríade local, PR, CI, merge — mesmo fluxo de US0/US1/US2.
4. Ordem das fases (não muda): US3/US4/US6 são independentes entre si e podem vir em qualquer ordem; **US4 tem que vir antes da US5** (senão a US5 apaga as rotas de export que a US4 ia ligar); **US7 vem depois de US3 e US6**.
