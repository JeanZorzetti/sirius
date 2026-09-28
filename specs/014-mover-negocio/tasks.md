# Tasks: Todo movimento de negócio passa por uma porta

- [x] T001 Migration aditiva: `Activity.fromStageId/toStageId/actorType`, `AutomationExecution.activityId` único com `automationId`
- [x] T002 `lib/pipeline/mover-negocio.ts` (`moverNegocio`, `aoCriarNegocio`, `statusDepoisDoMovimento`) + teste
- [x] T003 Motor: reserva por `automationId + activityId` antes das ações (FR-005)
- [x] T004 [US1/US2] Tela: kanban, edição, ganho/perda/reabrir, troca de funil, criar
- [x] T005 [US1/US2] API v1: POST, PATCH (etapa de outro funil → 400), `/stage`
- [x] T006 [US1/US2] Agente da IA: abrir negócio e mover etapa aprovados
- [x] T007 [US3] Ações `SEND_WHATSAPP` e `UPDATE_FIELD`
- [x] T008 [US3] Editor de automação com as ações novas (rótulos visíveis)
- [ ] T009 Depois do deploy: mover um negócio da conta de teste com automação ligada e conferir `AutomationExecution`
