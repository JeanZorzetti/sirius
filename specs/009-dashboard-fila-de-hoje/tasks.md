# Tasks: O pipeline abre pela fila de quem pede ação hoje

**Input**: [plan.md](plan.md), [spec.md](spec.md), [data-model.md](data-model.md)
**Tests**: um arquivo vitest para a regra pura (`lib/pipeline/hoje.ts`); o resto se prova por retrato (quickstart).

## Phase 1: Fundação (bloqueia tudo)

- [x] T001 Regra pura em `lib/pipeline/hoje.ts`: dias corridos no fuso de Brasília, fato de tempo, pede ação, fila, resumo da etapa, dinheiro (cartão e compacto)
- [x] T002 [P] Teste `__tests__/pipeline/hoje.test.ts` cobrindo os cinco tipos de fato, a ordem da fila, arquivado/ganho fora da fila, resumo com e sem valor, formato "R$ 15.000" e "R$ 16,8 mil"
- [x] T003 `lib/types/pipeline.ts` e `components/kanban-board/types.ts`: `stageEnteredAt`, `wonAt`, `exemplo`
- [x] T004 `components/dashboard/dashboard-tabs-wrapper.tsx`: `Activity` STAGE_CHANGE agrupada (máx por negócio), `Organization.createdAt`, `wonAt`; serializa os três campos

## Phase 2: US1 — a fila (P1)

- [x] T005 [US1] `components/dashboard/fila-de-hoje.tsx`: título com contagem e critério, 3 grandes + resto contado com faixa de dias (desktop), rolagem lateral (celular), estado "nada pede ação hoje", "Conversar" (link do chat; sem telefone = indisponível com motivo) e "Abrir"
- [x] T006 [US1] `components/dashboard/dashboard-tabs.tsx`: topo numa linha (funil como título, buscas por slot, exportar, Novo Deal), fila acima do quadro e da lista do celular, sem a aba única; `Abrir` → `setEditingDeal`; subtítulo do app bar honesto (FR-015)
- [x] T007 [US1] `app/[locale]/dashboard/page.tsx`: invólucro `data-tela="hoje"` com as fontes da home; buscas passam como slot; sai o h1/subtítulo visível (fica h1 para leitor de tela)

## Phase 3: US2 — o quadro honesto (P1)

- [x] T008 [US2] `components/kanban-board/kanban-column.tsx`: cabeçalho (contagem, soma ou "sem valor", "valor em n de m", "k pedem ação"), coluna vazia em texto, Perdido sem vermelho fixo
- [x] T009 [US2] `components/kanban-board/deal-card.tsx`: contato ou "sem contato", valor via `lib/format` ou "sem valor", fato de tempo em texto, marca de forma para "pede ação", selo "exemplo"; sai a urgência só por cor
- [x] T010 [US2] `components/kanban-board/index.tsx`: barra do filtro e "Adicionar" em classes semânticas; quadro em grade de colunas que cabem na largura
- [x] T011 [P] [US2] Celular: `stage-stories.tsx` sem arco-íris (nome + contagem), `mobile-pipeline-list.tsx` (seção com soma honesta, vazio em texto, sem índigo), `deal-mobile-card.tsx` (fato de tempo, "sem valor", "exemplo")

## Phase 4: US3 — os dois temas (P2)

- [x] T012 [US3] `app/[locale]/dashboard/hoje.css`: tokens OKLCH claros (gelo, grafite, pulso da home) e escuros (noite, âmbar da folha), mapeamento das variáveis shadcn no escopo e em `:root:has()`, o pulso da home desenhado sob o título da fila, `prefers-reduced-motion`
- [x] T013 [US3] `components/pipelines/pipeline-selector.tsx`: o gatilho vira título (sem o ponto azul, cores semânticas)
- [x] T014 [US3] `components/agi/AgiChatSidebar.tsx`: atributo `data-assistente` no botão flutuante; a cor sai do `hoje.css`, só nesta rota

## Phase 5: US4 — exemplo (P3)

- [x] T015 [US4] Selo "exemplo" no cartão do quadro, no cartão do celular e na fila (já previsto em T005, T009, T011; conferir nos retratos)

## Phase 6: Prova e registro

- [x] T016 vitest + `tsc` nos arquivos da spec
- [x] T017 Retratos (quickstart §3), contraste (§4), teclado (§5), gates da `information-design` e da `art-direction`
- [x] T017b Fora do plano, achados na prova: `useId` no título da fila (renderizada 2×, id duplicado); o diálogo de criação
  controlado não desenha gatilho próprio (botão duplicado no celular); `data-testid` no quadro e `e2e/page-objects`
  atualizados (selecionavam por classe de estilo)
- [x] T018 Registro: `.art/log.json`, `.info/log.json`, handoff; commit e push
