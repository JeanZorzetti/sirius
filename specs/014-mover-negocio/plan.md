# Implementation Plan: Todo movimento de negócio passa por uma porta

**Branch**: `014-mover-negocio` | **Date**: 2026-09-27 | **Spec**: [spec.md](spec.md)

## Summary

`lib/pipeline/mover-negocio.ts` concentra dois atos: criar negócio (`aoCriarNegocio`) e mudar etapa, funil ou status
(`moverNegocio`). Todos os caminhos passam por ali: kanban, edição, botões de ganho e perda, troca de funil, API v1 e
agente da IA.

- **O que a porta faz:**
  - valida a conta, a etapa e o funil;
  - grava o movimento e o histórico numa transação;
  - dispara as automações;
  - avisa o responsável quando outra pessoa fez o movimento.
- **O que fica com os chamadores:** os webhooks, porque a tela e a API v1 publicam formatos diferentes que integrações
  já leem.

## Design

- **Status:** `statusDepoisDoMovimento`, uma função pura com teste. O status explícito vence. Sem ele, a etapa WON ou
  LOST define o status, e sair de uma dessas para uma etapa aberta reabre o negócio.
- **Histórico:** `Activity` ganha `fromStageId`, `toStageId` e `actorType`. O tipo é `STAGE_CHANGE`,
  `PIPELINE_CHANGE`, `STATUS_CHANGE` ou `CREATE`.
- **Idempotência:** `AutomationExecution.activityId` é único junto com `automationId`. O motor reserva a linha antes de
  executar as ações; se der P2002, pula.
- **Ações novas** em `lib/automations/actions.ts`:
  - `SEND_WHATSAPP`: só WABA e só dentro da janela de 24 h. Respeita o SAIR e um teto de 200 mensagens automáticas por
    24 h, contadas pelas mensagens de id `auto_`. A mensagem entra na conversa.
  - `UPDATE_FIELD`: aceita `value`, `userId` (da mesma conta), `closeDate` e `dueDate` (data ISO ou "N dias"). Grava
    direto, sem passar por `moverNegocio`, para não criar laço.
- **Editor:** `components/automations/campos-acoes-novas.tsx`, com rótulos visíveis, usado nas páginas "nova" e
  "editar".
- **Migration:** `20260928010000_movimento_de_negocio`, só aditiva.

## Constitution Check

A constituição não está preenchida. Valem:

- a guarda AST de isolamento (spec 011);
- o CI verde.
