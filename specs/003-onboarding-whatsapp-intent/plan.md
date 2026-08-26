# Implementation Plan: Intenção de WhatsApp no onboarding

**Branch**: `003-onboarding-whatsapp-intent` | **Date**: 2026-08-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-onboarding-whatsapp-intent/spec.md`

## Summary

Depois que o usuário conclui a escolha do welcome modal (demo / importar / do zero), mostrar uma segunda tela pequena perguntando qual WhatsApp ele pretende conectar (WABA / QR code / depois), só para quem a organização ainda não tem WhatsApp ligado. A resposta é gravada em `OnboardingProgress.stepData` (campo já existente). Nenhuma tabela nova, nenhuma migração, nenhum endpoint novo — estende o endpoint `POST /api/onboarding/complete` que já existe para aceitar a intenção junto do status.

## Technical Context

**Language/Version**: TypeScript 5, Next.js 16.1.1 (App Router), React 19.2.3

**Primary Dependencies**: Prisma 5.19 (`@prisma/client`), next-intl, shadcn/ui (Dialog, Card, Button), sonner (toast), PostHog (`lib/posthog`)

**Storage**: PostgreSQL via Prisma. Campo `OnboardingProgress.stepData` (`Json?`), já existente, sempre nulo hoje.

**Testing**: Vitest (`npm run test`), `npm run typecheck` (tsc --noEmit). Sem framework de E2E configurado no projeto para fluxo de onboarding — validação manual coberta em `quickstart.md`.

**Target Platform**: Web (dashboard autenticado), Next.js server components + client components.

**Project Type**: Web application (Next.js monólito — não se aplica a separação frontend/backend do template).

**Performance Goals**: Nenhum além do existente — a tela é um modal cliente já carregado (SC-005 exige zero regressão de LCP/carregamento do dashboard).

**Constraints**: Não pode adicionar campo obrigatório à tela de credenciais WABA (FR-005); não pode reimplementar o formulário WABA (FR-007); a gravação não pode travar o onboarding em caso de falha de rede (FR-012).

**Scale/Scope**: ~105 organizações ativas hoje; 1 tela nova + 1 endpoint estendido + 1 query de leitura (US3). Escopo pequeno, sem novos serviços.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` neste projeto é o template não preenchido (placeholders `[PRINCIPLE_N_NAME]`) — não há princípios ratificados para checar. Gate passa por ausência de constraints formais. Nenhuma violação a justificar.

## Project Structure

### Documentation (this feature)

```text
specs/003-onboarding-whatsapp-intent/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md         # Phase 1 output
├── contracts/            # Phase 1 output
└── tasks.md              # Phase 2 output (/speckit-tasks — not yet created)
```

### Source Code (repository root)

Projeto é um monólito Next.js App Router único (não há split frontend/backend nem múltiplos pacotes). Arquivos tocados por esta feature:

```text
components/onboarding/
├── welcome-modal.tsx           # já corrigido (US0) — chama a nova etapa ao final de handleChoice
├── onboarding-wrapper.tsx      # passa flag hasWhatsApp (wabaEnabled || evolutionEnabled) para a nova etapa
└── whatsapp-intent-step.tsx    # NOVO — a tela de 3 saídas (US1)

app/[locale]/dashboard/page.tsx  # inclui wabaEnabled/evolutionEnabled no select do fetch de organização (FR-011)

app/api/onboarding/complete/route.ts  # estendido para aceitar { status, intent? } e mesclar em stepData.whatsapp (FR-006)

scripts/                          # NOVO script de leitura para US3 (contagem por intenção), fora do runtime da app
```

**Structure Decision**: nenhuma estrutura nova. A feature vive inteiramente dentro do app Next.js existente, seguindo o padrão já usado por `welcome-modal.tsx` + `onboarding-wrapper.tsx` + a rota `/api/onboarding/complete`.

## Complexity Tracking

*Sem violações de constitution a justificar — seção não aplicável.*
