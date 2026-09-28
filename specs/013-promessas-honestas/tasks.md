# Tasks: O site só promete o que o produto faz, e a cobrança faz o que o site promete

**Input**: [spec.md](spec.md), [plan.md](plan.md)

## Phase 1: Foundational

- [ ] T001 Campos `cancelAtPeriodEnd`, `currentPeriodEnd`, `pendingPlan` em `Organization` + migration `20260928000000_cobranca_agendada`
- [ ] T002 Regras puras em `lib/stripe.ts`: `planChange()` e `dentroDoArrependimento()`, com teste em `lib/__tests__/stripe.test.ts`
- [ ] T003 `downgradeToFree` zera os três campos novos (`lib/billing-effects.ts`)

## Phase 2: US1 — Cancelar mantém o que foi pago (P1)

- [ ] T004 [US1] `lib/stripe.ts`: `agendarCancelamento(subId, sim)` devolve o fim do período; `desistirComReembolso(subId)` reembolsa faturas pagas e cancela
- [ ] T005 [US1] `app/api/billing/cancel/route.ts`: POST agenda ou desiste; DELETE desfaz; e-mail de comprovante
- [ ] T006 [US1] `app/[locale]/dashboard/billing/`: botão e tela mostram o agendamento e "Manter assinatura"

## Phase 3: US2 — Trocar de plano mantém uma assinatura só (P1)

- [ ] T007 [US2] `lib/stripe.ts`: `trocarPreco(subId, plan, { proporcional })`
- [ ] T008 [US2] `app/api/stripe/checkout/route.ts`: com assinatura, upgrade/downgrade/same/blocked em vez de checkout
- [ ] T009 [US2] `app/api/webhooks/stripe/route.ts`: renovação aplica `pendingPlan`
- [ ] T010 [US2] `plans/page.tsx`: trata resposta sem `checkoutUrl` e mostra o agendamento

## Phase 4: US3 — Teste de 14 dias (P1)

- [ ] T011 [US3] `TRIAL_DAYS = 14` em `lib/entitlements.ts`, usado no cadastro (`app/auth/actions.ts`)
- [ ] T012 [US3] Texto: /pricing, home, `faqSchema`, metadados, help, blog, e-mails, termos

## Phase 5: US4 — Prova social real (P2)

- [ ] T013 [US4] Tirar `aggregateRating`/`review` dos 4 templates; tirar `socialProof`/depoimentos de `config/niche-data.ts`; "120+ times", "100+ empresas", "centenas"

## Phase 6: US5 — /features descreve o que existe (P2)

- [ ] T014 [US5] Tabela de comparação da /features a partir de `PLAN_LIMITS`
- [ ] T015 [US5] Tirar SSO, offline de escrita, audit completo, ponta a ponta, IA de perdas, abertura/clique, "IA qualifica cada lead" de marketing.json, home, /download, /features, niche-data
- [ ] T016 [US5] Teste `__tests__/seo/promessas-publicas.test.ts`: frases proibidas ausentes nas mensagens e páginas públicas

## Phase 7: Polish

- [ ] T017 lint + tsc + unit nos arquivos tocados; build local
- [ ] T018 Handoff e memória
