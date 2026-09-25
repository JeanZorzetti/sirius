# Tasks: A área logada veste a pele do Pipeline (spec 010)

**Input**: [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md)

## Phase 1: Antes (medir e conferir premissas)

- [x] T001 Retratos "antes" da amostra (12 telas × 1440/390 × claro/escuro) em produção, e LCP "antes" de Contatos,
  Tarefas e Pipeline na régua da 009 (mediana de 5). Scratchpad.
- [x] T002 Conferir no CSS compilado do app que as utilidades de cor leem `var(--color-<matiz>-<degrau>)` (R2).

## Phase 2: Fundação — tokens e paleta (US1, US2, US4)

- [x] T003 [US1] Criar `app/app-pele.css`: tokens do shadcn no `:root` (claro) e `.dark` (noite + âmbar), gráficos,
  barra lateral, anel de foco (sobrescreve o verde do `base.css`).
- [x] T004 [US2] Remapear em `app/app-pele.css` as 22 matizes da paleta do Tailwind (R2), luminosidade do Tailwind por degrau.
- [x] T005 [US1] Regras de forma em `app/app-pele.css`: canto 4 px, pílula, sombra só nas camadas que flutuam, sem vidro,
  sem mancha, gradiente achatado (R4).
- [x] T006 [US1] Importar `app-pele.css` em `app/globals.css`, depois de `base.css`.
- [x] T007 [US1] Fontes do Pipeline no `:root` via `<style>` nos layouts `dashboard`, `(admin)` e `(ia)` (R5).
- [x] T008 `hoje.css`: anel de foco grafite; tirar a regra do `data-assistente`.

## Phase 3: Moldura (US1)

- [x] T009 [US1] `components/dashboard/sidebar.tsx`: presa à borda, sem vidro/brilho/sombra/gradiente, item ativo e
  "Modo IA" nos tokens da barra lateral.
- [x] T010 [US1] `components/dashboard/bottom-nav.tsx`: marcador e texto do item ativo em `primary`.
- [x] T011 [US1] `components/agi/AgiChatSidebar.tsx`: botão do assistente em `bg-primary text-primary-foreground`; sai o
  `data-assistente`.

## Phase 4: Hex (US2, US3)

- [x] T012 [US2] `scripts/codemod-hex-pele.mjs` pela AST (R7), com simulação (`--dry`) e lista de arquivos de risco.
- [x] T013 [US2] Rodar o codemod; revisar à mão os diffs com >10 trocas e todo uso de hex concatenado com alfa ou em `<stop>`.

## Phase 5: Guarda (US6)

- [x] T014 [US6] `__tests__/styles/app-color-guard.test.ts` (R8): literais de cor nos arquivos do app fora das exceções;
  as 22 matizes remapeadas em `app-pele.css`. Provar que falha com um literal plantado.

## Phase 6: Prova (US1–US5)

- [x] T015 `tsc`, lint dos arquivos tocados, vitest.
- [x] T016 Retratos "depois" locais (`next dev`) da amostra nos dois temas; olhar cada PNG; cor computada e contraste (R9).
- [x] T017 Páginas públicas (`/`, `/pricing`, `/blog`) abertas direto: iguais ao "antes".
- [ ] T018 Commit (caminhos explícitos), push, verificação em produção: retratos, cor computada, LCP "depois".
- [ ] T019 Registro: `.art/log.json`, handoff, memória do projeto.
