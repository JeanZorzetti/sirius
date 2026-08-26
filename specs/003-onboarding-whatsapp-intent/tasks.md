---

description: "Task list for 003-onboarding-whatsapp-intent"
---

# Tasks: Intenção de WhatsApp no onboarding

**Input**: Design documents from `/specs/003-onboarding-whatsapp-intent/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/onboarding-complete.md](./contracts/onboarding-complete.md), [quickstart.md](./quickstart.md)

**Tests**: Não solicitados explicitamente na spec. O projeto não tem framework de E2E para onboarding (`plan.md` §Testing); a verificação de cada história é o cenário manual correspondente em `quickstart.md`, mais `npm run typecheck && npm run test` como guarda de regressão.

**Organização**: tarefas agrupadas por user story (P0–P3 de `spec.md`), na ordem em que devem ser entregues.

## Path Conventions

Projeto é um monólito Next.js App Router único — todos os caminhos abaixo são relativos à raiz de `crm-project/`.

---

## Phase 1: Setup

**Propósito**: confirmar baseline antes de tocar em código. Sem dependência nova (Prisma, shadcn/ui e next-intl já estão no projeto).

- [x] T001 Rodar `npm run typecheck && npm run test` na raiz de `crm-project/` e confirmar que passam antes de iniciar (baseline verde documentado no handoff de 25/08: typecheck verde, `audit-dead-code.js` sem órfãos novos).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Propósito**: infraestrutura compartilhada por US1, US2 e US3. US0 **não depende** desta fase (já foi implementada e não usa nada daqui).

**⚠️ CRITICAL**: US1/US2/US3 só começam depois desta fase.

- [x] T002 [P] Em `app/[locale]/dashboard/page.tsx`, adicionar `wabaEnabled` e `evolutionEnabled` ao `select` de `organization` (linha ~59-64) e computar `hasWhatsApp = organization.wabaEnabled || organization.evolutionEnabled` (FR-011; decisão em `research.md` §"Gate de exibição").
- [x] T003 Propagar `hasWhatsApp` como nova prop obrigatória: `DashboardPage` → `<OnboardingWrapper hasWhatsApp={...}>` (`app/[locale]/dashboard/page.tsx`) → `OnboardingWrapper` repassa para `<WelcomeModal hasWhatsApp={...}>` (`components/onboarding/onboarding-wrapper.tsx`, `components/onboarding/welcome-modal.tsx`).
- [x] T004 Estender `app/api/onboarding/complete/route.ts`: aceitar campo opcional `intent` no corpo (`'waba' | 'qr' | 'later'`); quando presente e válido, mesclar em `stepData` do `upsert` existente como `{ whatsapp: { intent, declaredAt: new Date().toISOString() } }`; valor fora do enum é ignorado sem falhar a request (contrato em `contracts/onboarding-complete.md`; FR-006, FR-012).

**Checkpoint**: gate de exibição e persistência de intenção prontos — US1/US2/US3 podem começar.

---

## Phase 3: User Story 0 - A gravação do onboarding volta a dizer a verdade (Priority: P0)

**Status**: ✅ **Concluído em 26/08/2026** (antes da criação deste tasks.md, por já estar desbloqueado e não depender de decisão de produto).

**Goal**: `OnboardingProgress.status` deixa de ser sobrescrito por uma corrida de requests.

**Independent Test**: `quickstart.md` Cenário 4.

### Implementation for User Story 0

- [x] T005 [US0] Remover a chamada `onClose()` redundante do ramo `demo` de `handleChoice` em `components/onboarding/welcome-modal.tsx` (o `window.location.href` seguinte já navega; `onClose()` disparava o `POST /api/onboarding/complete {SKIPPED}` fire-and-forget de `onboarding-wrapper.tsx` em paralelo com o `COMPLETED` do seed-demo).
- [x] T006 [US0] Remover a chamada `onClose()` redundante do ramo `scratch` de `handleChoice`, mesmo motivo.
- [x] T007 [US0] Verificar `npm run typecheck` verde após a remoção.

**Checkpoint**: US0 no ar. `status` só é sobrescrito por `SKIPPED` quando o usuário fecha o modal sem escolher (via `onOpenChange`, intocado).

---

## Phase 4: User Story 1 - O usuário é perguntado sobre o WhatsApp (Priority: P1) 🎯 MVP

**Goal**: ao final da escolha do passo 1, quem ainda não tem WhatsApp ligado vê uma etapa com 3 saídas (waba / qr / depois) e a resposta é persistida.

**Independent Test**: `quickstart.md` Cenários 1 e 2.

### Implementation for User Story 1

- [x] T008 [US1] Criar `components/onboarding/whatsapp-intent-step.tsx`: componente que renderiza as 3 saídas dentro do mesmo `Dialog` já usado por `welcome-modal.tsx` (reuso de `Card`/`Button`, decisão em `research.md` §"Onde a nova etapa se encaixa"). Recebe `onChoose(intent: 'waba' | 'qr' | 'later')` e `isLoading` como props — sem chamar `fetch` diretamente (isso é responsabilidade de quem monta o componente).
- [x] T009 [US1] Em `components/onboarding/welcome-modal.tsx`, adicionar estado `step: 'choice' | 'intent'`. Ao final de `handleChoice` para os ramos `demo` e `scratch` (e ao `onSuccess` do `ImportContactsModal`), se `!hasWhatsApp` trocar para `step = 'intent'` em vez de navegar imediatamente; se `hasWhatsApp` já for `true`, manter o comportamento atual (navega direto, etapa nunca aparece — FR-011).
- [x] T010 [US1] Implementar `onChoose` em `welcome-modal.tsx`: dispara `POST /api/onboarding/complete` com `{ status: 'COMPLETED', intent }` (contrato T004) e então navega para o destino que o ramo original já ia usar (`/dashboard?tour=true` para quem veio de `demo`, `/dashboard` para `scratch`/`import`). Falha de rede não bloqueia a navegação (FR-012) — mesmo padrão fire-and-forget já usado no restante do arquivo, mas desta vez sem a corrida do bug de US0 (chamada única, não duplicada).
- [x] T011 [US1] Garantir que a etapa não exige nenhum campo do Meta Business Manager para ser concluída (FR-005) — revisão de que nenhuma das 3 saídas abre formulário nesta tela.
- [x] T012 [US1] Invocar a skill `accessibility` sobre `whatsapp-intent-step.tsx`: foco inicial previsível, navegável por teclado, fechamento por ESC herdado do `Dialog` pai (FR-013).
- [x] T013 [US1] Invocar a skill `ux-writing` para os textos finais das 3 saídas, deixando explícito antes do clique que "possui API oficial" exige credenciais da Meta e que "QR code" não está liberado ainda (FR-010, FR-014).
- [x] T014 [US1] Rodar `quickstart.md` Cenários 1 e 2 manualmente (organização sem WhatsApp vê a etapa e persiste `later`; organização com `wabaEnabled`/`evolutionEnabled` não vê a etapa). Validado via Playwright contra `npm run dev` + banco real, com orgs/usuários descartáveis (`isTestAccount=true`), removidos ao final.

**Checkpoint**: US1 funcional e testável isoladamente — MVP da feature.

---

## Phase 5: User Story 2 - Quem tem WABA conecta sem sair do fluxo (Priority: P2)

**Goal**: a saída "possui API oficial" leva direto ao formulário WABA já existente, sem duplicar nada.

**Independent Test**: `quickstart.md` Cenário 3.

**Depende de**: Phase 4 (usa o mesmo `whatsapp-intent-step.tsx` e o mesmo `onChoose`).

### Implementation for User Story 2

- [x] T015 [US2] Em `welcome-modal.tsx`, na saída "possui API oficial": chamar `onChoose('waba')` (grava a intenção) e então `router.push('/dashboard/settings/integrations/whatsapp-official')` via `next/navigation` — não `window.location.href`, pois não há dado novo para recarregar (research.md §"Reuso do formulário WABA").
- [x] T016 [US2] Confirmar, sem alterar código, que `app/[locale]/dashboard/settings/integrations/whatsapp-official/page.tsx` mantém intocado seu próprio gate de tier (`BUSINESS`/`wabaGrandfathered` → redirect para `/upgrade`) e que `WhatsAppOfficialSettingsForm` continua sendo o único formulário de credenciais (FR-007 — nenhuma duplicação de campo, validação ou criptografia de token).
- [x] T017 [US2] Rodar `quickstart.md` Cenário 3 manualmente. Validado via Playwright: saída "waba" navegou para `/dashboard/settings/integrations/whatsapp-official` e `stepData.whatsapp.intent="waba"` foi gravado antes da navegação.

**Checkpoint**: US1 + US2 funcionam juntas; abandonar o formulário WABA no meio preserva a intenção já gravada em T015 (edge case da spec).

---

## Phase 6: User Story 3 - A objeção vira número (Priority: P3)

**Goal**: consulta que transforma a demanda declarada por QR code em um número confiável.

**Independent Test**: `quickstart.md` Cenário 5.

**Depende de**: Phase 4 e 5 apenas para existirem dados reais a contar; a query em si só depende de T004 (Foundational).

### Implementation for User Story 3

- [x] T018 [US3] Criar `scripts/whatsapp-intent-report.ts` (padrão de `scripts/audit-dead-code.js` já existente): query Prisma que agrupa `OnboardingProgress` por `stepData->'whatsapp'->>'intent'`, exclui organizações com `isTestAccount = true`, e reporta separadamente "não declarou" (chave `whatsapp` ausente) de `later` (data-model.md §"Quem lê hoje").
- [x] T019 [US3] Rodar `quickstart.md` Cenário 5 e conferir que os totais batem com o número de organizações elegíveis (sem `wabaEnabled`/`evolutionEnabled`) que passaram pela etapa desde o deploy de US1. Script rodou contra o banco real (108 orgs elegíveis, 0 declarações — feature ainda não foi ao ar). Contagem por `intent`/`later`/`waba`/`qr` validada manualmente durante os cenários 1-4 (cada declaração feita nos testes apareceu corretamente separada por chave). Reconferir após deploy real, quando houver volume orgânico.

**Checkpoint**: as 4 histórias da spec estão completas e testáveis independentemente.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T020 [P] Rodar `npm run typecheck && npm run test` completo após todas as fases.
- [x] T021 Re-rodar `quickstart.md` Cenário 4 (regressão US0) uma última vez, para confirmar que a etapa nova não reintroduziu a corrida corrigida em T005/T006. Validado via Playwright para os ramos `demo` e `scratch`: `OnboardingProgress.status = 'COMPLETED'` em ambos após a navegação completa (nunca `SKIPPED`).
- [x] T022 Atualizar `specs/003-onboarding-whatsapp-intent/handoff.md` com o que foi implementado, decisões tomadas e o que ficou de fora (padrão dos handoffs anteriores do projeto).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sem dependências.
- **Foundational (Phase 2)**: depende de Phase 1 — bloqueia US1/US2/US3 (não bloqueia US0, já concluída).
- **US0 (Phase 3)**: já concluída; não depende de Phase 2.
- **US1 (Phase 4)**: depende de Phase 2 (T002-T004).
- **US2 (Phase 5)**: depende de Phase 4 (reaproveita `whatsapp-intent-step.tsx` e `onChoose`).
- **US3 (Phase 6)**: depende de Phase 2 (T004, para ter o que ler) — tecnicamente pode rodar em paralelo com US1/US2, mas só produz números úteis depois que eles estiverem no ar.
- **Polish (Phase 7)**: depende de todas as fases anteriores.

### Parallel Opportunities

- T002 e T004 tocam arquivos diferentes e podem ser feitos em paralelo; T003 depende de T002 (precisa saber o nome da prop).
- US3 (Phase 6) pode ser implementada em paralelo com US1/US2 (Phase 4/5) por não compartilhar arquivo — só a validação de T019 precisa esperar dados reais.

---

## Implementation Strategy

### MVP First

1. Phase 1 (Setup) → Phase 2 (Foundational) → Phase 4 (US1).
2. **Parar e validar**: Cenários 1 e 2 do quickstart.
3. US0 já está em produção — não bloqueia nem depende do MVP.

### Incremental Delivery

1. Foundational pronto → US1 no ar (MVP: pergunta feita, dado sendo coletado).
2. US2 adiciona o caminho de conversão real (quem tem WABA conecta).
3. US3 fecha o ciclo: transforma a coleta em número para a decisão de produto sobre o gateway não oficial (a motivação original da spec).
