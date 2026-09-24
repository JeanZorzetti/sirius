# Tasks: Página pública só baixa o CSS que usa

**Input**: [plan.md](./plan.md), [research.md](./research.md), [quickstart.md](./quickstart.md)

## Phase 1: Linha de base (antes de tocar no código, build de `6ade6a2`)

- [x] T001 `npx next build` do HEAD e `next start`. Guardar o CSS compilado de hoje (`proto.mjs`) para o SC-004
- [x] T002 Retratos antes: `/`, `/pricing`, `/blog`, um post e o 404, em 1366 e 390 px
- [x] T003 Sessão de conta de teste (cookie assinado com o `SESSION_SECRET` local) e retratos antes: dashboard,
  kanban, contatos e configurações, em 1366 e 390 px
- [x] T004 LCP de base: mediana de 7 na home e de 3 em `/pricing` e `/blog`, e pedidos de fonte (`fonte.cjs`)

## Phase 2: US1 + US2, as duas folhas (P1)

- [x] T005 [US2] Recortar `app/theme.css` (linhas 5–48) e `app/base.css` (linhas 50–917) do `globals.css`, sem
  editar o conteúdo
- [x] T006 [US2] `app/globals.css` = `@layer properties, public;` + os 3 imports de hoje + `theme.css` + `base.css`
- [x] T007 [US1] `app/public.css`: camada `public`, `source(none)`, `@source` por pasta (research R1),
  `tw-animate-css` sem camada, tipografia, `theme.css` e `base.css` em `layer(public)`
- [x] T008 [US1] Root layout troca o import para `public.css`
- [x] T009 [US2] Import do `globals.css` em `dashboard/layout.tsx`, `(admin)/layout.tsx`, `(ia)/layout.tsx`,
  `admin/generative-ui-analytics/page.tsx`, `checkout/sucesso/page.tsx` e `debug/page.tsx`
- [x] T010 [US1][US2] `__tests__/styles/public-css-guard.test.ts`: (a) o grafo das rotas públicas está dentro dos
  `@source`; (b) toda página do app tem o `globals.css` nela ou num layout acima. Ver o teste falhar antes de
  passar
- [x] T011 [US2] SC-004: compilar o `globals.css` novo e comparar com o de T001

## Phase 3: US3, Geist (P2)

- [x] T012 [US3] `preload: false` na Geist do root layout

## Phase 4: Verificação

- [x] T013 `tsc`, vitest e auditoria de código morto no mesmo estado de antes
- [x] T014 `npx next build`: tamanho da folha pública (SC-001), e nenhuma página pública pede a do app
- [x] T015 Retratos depois (público e app) comparados com T002/T003 (SC-005)
- [x] T016 Ida e volta na mesma aba: dashboard → `/pricing` → voltar, e `/pricing` → dashboard (FR-004)
- [x] T017 LCP e fontes depois, contra T004 (SC-002, SC-003)
- [x] T018 Commit com `--literal-pathspecs`, push (deploy) e conferência na tela em produção: `/`, `/pricing`,
  `/blog` em 1366 e 390 px
- [x] T019 Handoff com os números

## Resultados (24/09, build local, perfil 4G lento + CPU 4×, 390×844)

| | Antes (`6ade6a2`) | Depois |
|---|---|---|
| Folha que as páginas públicas pedem | 440 kb / 53,2 kb gz | **237,5 kb / 32,3 kb gz** |
| Folha do app | 440 kb / 53,2 kb gz | igual, byte a byte, mais `@layer public;` (SC-004) |
| Home: LCP, mediana de 7 | 2.276 ms | **1.956 ms** (−320) |
| `/pricing`: LCP, mediana de 3 | 2.276 ms | **1.700 ms** (−576) |
| `/blog`: LCP, mediana de 3 | 2.096 ms | **1.640 ms** (−456) |
| Fontes baixadas: home / `/pricing` / `/blog` | 99 / 30 / 30 kb | 68 / 0 / 0 kb |
| Retratos (24 = 12 telas × 2 larguras) | ruído entre duas corridas de base: 0 px | 22 idênticos. 404 de 1º nível mudou (esperado). `/IA` 1366: 1 px, ±1 de RGB no blur do fundo |
| Ida e volta na mesma aba (6 casos) | | 6 idênticos ao aberto a frio, com as duas folhas no documento |
| `tsc` / vitest / auditoria | 0 / 355 + 1 skip / exit 0 | 0 / 359 + 1 skip / exit 0 |

Achados:
- A Geist nunca desenhou o site. A variável fica no `<body>` e a regra de fonte no `<html>`. Aplicá-la é decisão
  de design (handoff).
- A sessão do app foi assinada localmente para a org de teste "ROI Labs". O navegador de teste respondeu 204 a
  `/api/access/*` e `/api/push/*`, e nada foi gravado no banco.
