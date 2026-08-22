# Specification Quality Checklist: Remoção de código morto — Sirius CRM

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-22
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs) — *com desvio deliberado, ver Notas*
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders — *parcial, ver Notas*
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details) — *com desvio deliberado, ver Notas*
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification — *ver Notas*

## Notas

**Desvio deliberado sobre "no implementation details".** O objeto desta feature **é** o código: arquivos, rotas e dependências. Uma spec de remoção de código morto que não nomeasse os arquivos seria inexecutável e, pior, insegura — a diferença entre `lib/mercadopago.ts` (vivo, 10 importadores) e `lib/mercado-pago/checkout.ts` (órfão) é exatamente o tipo de detalhe que impede um incidente de faturamento. Os caminhos concretos estão concentrados nos FR-007 a FR-012 (preservações) e nos cenários de aceite, onde funcionam como guardrail, não como projeto de solução. O **como** (ordem dos commits, estratégia de merge, forma do gate de CI) segue em aberto para `/speckit-plan`.

**Stakeholder não-técnico.** US4 (exportação) é legível por qualquer stakeholder. US1–US3 e US5–US7 têm como cliente quem mantém o repositório; o valor de negócio delas está declarado no Contexto (12% da base não é alcançável, e o risco é a repetição do commit `2d29773`), não em cada história.

**Três decisões de produto foram resolvidas na sessão de clarificação** (Generative UI → apagar; `/api/export/*` → ligar; `lib/env.ts` → ligar em modo relatório). Nenhuma pendente.

**Ponto de atenção para o `/speckit-plan`**: FR-021 exige mudar o comportamento de `validateEnv()` (hoje lança) antes de ligá-lo — chaves Stripe obrigatórias ainda estão pendentes em produção, conforme handoff de 07/07. Ligar sem essa mudança derruba o boot.
