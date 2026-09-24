# Tasks: As páginas públicas vestem a pele da home

**Input**: [plan.md](./plan.md), [research.md](./research.md), [data-model.md](./data-model.md), [quickstart.md](./quickstart.md)

Formato: `[P]` = pode rodar em paralelo (arquivos diferentes). `[USn]` = história da spec.

## Phase 1: Linha de base (antes de tocar no código)

- [x] T001 `npx next build` do HEAD (`fc041f1`) e `next start -p 3999`
- [x] T002 Retratos antes: amostra do quickstart em 1366 e 390, e `/dashboard` + contatos com a sessão de teste, nos
  temas claro e escuro salvo
- [x] T003 LCP antes (refeito no fim lado a lado, ver R11)

## Phase 2: Fundação

- [x] T004 [US1] `components/fluxo/fontes.ts` (sem preload; a home ficou com as instâncias dela, R6 revista)
- [x] T005 [US1] `app/fluxo-pele.css`: primitivos, mapeamento shadcn, regras de página, sombra/raio de escopo; os
  tokens valem também no `:root` enquanto uma página pública está montada (portais do Radix)
- [x] T006 [US1] `app/public.css` importa a pele
- [x] T007 [US1] `fluxo.css` perde tokens, regras gerais e o mapeamento `.fluxo-rodape` (e o layout, o `div` dele)
- [x] T008 [US1] `theme.css`: variante `dark` ignora páginas públicas; `--font-mono` com DM Mono no escopo;
  `--color-destaque`
- [x] T009 [US1] Layout `(marketing)`: `data-art` + fontes; menu com fundo sólido; menu do celular (Sheet) com o
  atributo por dentro
- [x] T010 [US1] `app/[locale]/not-found.tsx`, `app/not-found.tsx`, `app/error.tsx`
- [x] T011 Home e dashboard idênticos a T002 (claro e escuro)

## Phase 3: US1 + US2, limpeza

- [x] T012–T019 [US1] Codemod de classes sobre a AST do TypeScript (a 1ª versão, por regex, quebrou JSX em volta de
  template literals e foi descartada): 1.616 trocas em 44 arquivos, 4 manchas removidas. À mão: cor por segmento de
  `/solucoes` (e o campo `color` de `config/niche-data` e `city-data`), selo "Mais popular", `blog-content-wrapper`,
  wrappers escuros de `/pricing`, `/anuario`, `/register`, `/download`, brilhos `bg-[radial-gradient]`, ardósia
- [x] T013b [US1] Posts: 4.968 cores inline trocadas por variáveis (R10), com o fundo herdado de pai para filho
- [x] T013c [US1] `.prose` e `callout-*` do `base.css` e cinza do typography sobrescritos no escopo (R10)
- [x] T020 [US2] Estados de formulário: erro em `text-destaque` com o texto da mensagem; foco no pulso escuro
- [x] T020b [US2] 13 elementos com texto branco que perderam o gradiente de fundo ganharam `bg-primary`/`bg-destaque`;
  6 contrastes pontuais (botões de contorno, `text-destructive-foreground` inexistente no tema, rótulos a 50–60%)
- [x] T020c [US2] `/solucoes/[slug]` no celular estourava 27 px para o lado (já estourava antes): fila de botões com
  `flex-wrap`

## Phase 4: US4, a guarda

- [x] T021 [US4] `public-css-guard.test.ts`: (a) nenhuma matiz fixa, gradiente ou mancha nos arquivos que as rotas
  públicas alcançam (fora `components/ui`); (b) nenhum hex nos posts. Visto falhar num arquivo de teste antes de passar

## Phase 5: Verificação

- [x] T022 `tsc` 0; vitest 365 + 1 skip (o `deal-isolation` falha só sob carga e passa isolado); auditoria exit 0
- [x] T023 [US2] Retratos: home e dashboard idênticos (claro e escuro; 17 px de ±1 RGB em cantos no dashboard 1366 =
  ruído de antialias); mesmas contagens de links e de texto que produção nas 38 rotas
- [x] T024 [US1] Varredura de cor computada nas 38 rotas + 404: 0 elementos fora da paleta; tema escuro salvo → as
  páginas saem idênticas às claras
- [x] T025 [US2] Contraste AA em 100% dos textos e foco visível em 25/25 Tabs, nas 40 páginas
- [x] T026 [US3] LCP lado a lado (R11)
- [ ] T027 Commit, push (deploy), conferência em produção; handoff

## Resultados (24/09, build local, 4G lento 150 ms / 1,6 Mbps, CPU 4×, 390×844)

LCP, mediana de 5 rodadas intercaladas, os dois builds servidos de fora do OneDrive, terceiros bloqueados:

| | Antes (`fc041f1`) | Depois | |
|---|---|---|---|
| Home | 1.848 ms | 1.668 ms | −10% |
| `/pricing` | 1.724 ms | 1.736 ms | +1% |
| `/blog` | 1.576 ms | 1.440 ms | −9% |
| CLS | 0 | 0 – 0,0001 | |
| CSS público | 33,4 kb gz | 26,6 kb gz | |
| Fontes em `/pricing` / `/blog` | 0 / 0 kb | 58 / 48 kb, depois da 1ª pintura | |
| JS | igual | igual | |

Com a Schibsted pré-carregada (plano original): `/pricing` +14%, `/blog` +38%.
