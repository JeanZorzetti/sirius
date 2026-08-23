# Handoff — Remoção de código morto (Sirius CRM)

**Feature**: `002-remove-dead-code` | **Escrito em**: 2026-08-23 | **Para**: próxima sessão que continuar via `/speckit-implement`

## Onde parou

**US0 (Fase 1 + Fase 2) concluída e mergeada em `main`** — commit `521cc65` (squash de PR #1). T001–T013 todos `[X]` em [tasks.md](./tasks.md).

Próximo passo: **Fase 3 — US1 (T014–T019)**, "Varredura sem risco": apagar 2 `.bak`, 4 barrels sem importador, 3 componentes shadcn órfãos, 12 dependências nunca importadas. Ninguém começou essa fase ainda.

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
2. Rodar `/speckit-implement` de novo (ou seguir manualmente `tasks.md` a partir da Fase 3).
3. Criar branch nova a partir de `main` atualizada (ex.: `002-us1-varredura-sem-risco`), executar T014–T019, tríade local, PR, CI, merge — mesmo fluxo da US0.
4. Ordem das fases (não muda): US1/US2/US3/US4/US6 são independentes entre si e podem vir em qualquer ordem; **US4 tem que vir antes da US5** (senão a US5 apaga as rotas de export que a US4 ia ligar); **US7 vem depois de US3 e US6**.
