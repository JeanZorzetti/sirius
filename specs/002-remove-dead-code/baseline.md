# Baseline — Remoção de código morto

**Feature**: `002-remove-dead-code` | **Medido em**: 2026-08-23 (T001, local, antes da US0)

Números medidos localmente, antes de qualquer correção de CI ou deleção. Servem de ponto de comparação para todas as histórias (FR-004, SC-007). O número oficial de partida, se a CI divergir deste, é o do T013 (medido em CI verde).

## Prisma generate

```
npx prisma generate
✔ Generated Prisma Client (v5.19.0) to .\node_modules\@prisma\client in 1.44s

npx prisma generate --schema prisma/whatsapp.prisma
✔ Generated Prisma Client (v5.19.0) to .\node_modules\.prisma\client-wa in 153ms
```

Ambos os schemas geram sem erro localmente. O que falta é o segundo `generate` no workflow da CI (research R1) — não um problema de schema.

## `node scripts/audit-dead-code.js`

Números batem exatamente com os congelados em quickstart.md — nenhum ajuste necessário nesta tasks.md.

```
ARQUIVOS SEM IMPORTADOR: 59 | 7368 linhas
   344 lib/integrations/google-calendar-automations.ts
   343 components/calculadora-roi-with-lead-capture.tsx
   324 lib/nlp/entity-disambiguation.ts
   311 components/chat/resizable-drawer.tsx
   272 app/[locale]/dashboard/tasks/actions.ts
   272 lib/integrations/whatsapp-automations.ts
   267 components/mobile/voice-dictation-button.tsx
   260 lib/mercado-pago/checkout.ts
   256 components/chat/chat-drawer.tsx
   223 components/dashboard-with-pipeline-selector.tsx
   222 hooks/useABTest.ts
   205 components/lead-capture-modal.tsx
   197 components/notification-center.tsx
   189 components/ui/sidebar.tsx
   187 components/generative-ui/workflows/DealCreationWorkflow.tsx
   182 components/dashboard/mobile-nav.tsx
   182 lib/scraping/providers/firecrawl-provider.ts
   176 lib/mobile/offline-cache.ts
   170 hooks/use-task-pusher.ts
   166 components/generative-ui/workflows/OnboardingWorkflow.tsx
   164 components/tasks/deal-tasks-widget.tsx
   154 examples/optimistic-updates-example.tsx
   146 lib/scraping/providers/google-search.ts
   124 components/upgrade/limit-badge.tsx
   122 lib/env.ts
    96 lib/mobile/local-notifications.ts
    94 components/dashboard/user-nav.tsx
    92 hooks/useDragScroll.ts
    91 lib/scraping/providers/openstreetmap.ts
    90 components/generative-ui/layouts/MultiComponentRenderer.tsx
    88 components/mobile/filter-chips.tsx
    84 lib/mobile/filesystem.ts
    76 components/tasks/task-table-skeleton.tsx
    73 components/mobile/filters-sheet.tsx
    72 lib/mobile/share.ts
    71 components/mobile/list-item.tsx
    71 components/ui/responsive-sheet.tsx
    70 components/microsoft-clarity.tsx
    68 components/mobile/scan-card-button.tsx
    63 lib/scraping/outscraper-client.ts
    62 lib/scraping/providers/crawler-provider.ts
    60 components/dashboard/billing/embedded-checkout-modal.tsx
    59 lib/generative-ui/index.ts
    57 lib/mobile/network.ts
    48 lib/email-i18n.ts
    44 components/tasks/task-list-skeleton.tsx
    41 components/tasks/task-kanban-skeleton.tsx
    41 components/ui/mode-toggle.tsx
    40 components/skeletons/mobile-list-skeleton.tsx
    38 components/admin/force-refresh-button.tsx
    38 components/mobile/empty-state.tsx
    36 components/tasks/task-calendar-skeleton.tsx
    33 components/marketing/hero-scroll.tsx
    33 components/tasks/task-status-badge.tsx
    31 lib/mobile/browser.ts
    28 components/submit-button.tsx
     9 components/generative-ui/index.ts
     9 lib/scraping/crawler/index.ts
     4 components/onboarding/index.ts

ROTAS DE API SEM CHAMADOR: 32/247 | 2061 linhas
   141 /api/agi/diagnostic
   141 /api/billing/upgrade
   122 /api/integrations/whatsapp/settings
   117 /api/admin/billing/charge-overdue
    98 /api/admin/migrate-deals-pipeline
    87 /api/whatsapp/diagnostic
    84 /api/export/deals/pdf
    81 /api/export/deals/xlsx
    73 /api/admin/organizations/[id]/tier
    71 /api/agi/query
    66 /api/admin/support/stats
    66 /api/agi/explain-relationship
    64 /api/agi/enrich
    63 /api/agi/recommend
    61 /api/admin/fix-unread
    61 /api/agi/diagnose
    61 /api/export/contacts/pdf
    61 /api/nlp/extract
    58 /api/export/contacts/xlsx
    57 /api/agi/test
    55 /api/agi/learning-path
    55 /api/scraping/jobs/cleanup
    47 /api/admin/fix-waba-id
    43 /api/admin/organizations
    43 /api/debug/pusher-test
    40 /api/admin/reset-wa-db
    39 /api/agenda/calendar-status
    36 /api/sync/process
    25 /api/mobile/sync
    22 /api/admin/add-closings-permission
    16 /api/admin/sync-contacts
     7 /api/mercadopago/checkout

total removível (arquivos + rotas, script atual): 9429 linhas
```

**Nota sobre os 24.411 linhas totais da spec**: o script hoje só marca entrada (arquivos/rotas sem importador direto). O subsistema Generative UI (~14.666 linhas, US6) é alcançável internamente por imports cruzados dentro de si mesmo — só os 2 barrels de borda (`components/generative-ui/index.ts`, 59+9 linhas) aparecem aqui. As 14.666 linhas somem da árvore quando as poucas entradas externas (rotas `chat-with-ui`, `ab-testing`) forem apagadas na US6, não porque o scanner as liste hoje uma a uma.

## `npx vitest run`

```
Test Files  2 failed | 35 passed (37)
     Tests  4 failed | 668 passed | 1 skipped (673)
  Duration  83.17s (transform 13.97s, setup 90.72s, import 250.61s, tests 84.75s, environment 270.60s)
  Wall time (measured via `time`): 1m41.911s
```

**4 falhas pré-existentes**, todas por `Test timed out in 5000ms`, não relacionadas a código morto:
- `__tests__/multi-tenant/deal-isolation.test.ts` — 3 testes (timeout em import dinâmico de `@/app/[locale]/dashboard/actions`)
- `lib/generative-ui/__tests__/lazy-components.test.ts` — 1 teste (`preloadComponents`, será apagado por inteiro na US6)

Essas 4 falhas **não são objeto desta feature** — não decorrem de FR nenhuma. Ficam registradas aqui como parte do baseline: a comparação da SC-007 ("tempo não aumentou") é contra os 668 passed / 83.17s, não contra "suíte 100% verde", que já não é verdade hoje.

## Ponto de partida oficial

| Medida | T001 (local) |
|---|---|
| Arquivos sem importador | 59 (7.368 linhas) |
| Rotas sem chamador | 32 de 247 (2.061 linhas) |
| Testes | 668 passed / 4 failed / 1 skipped (673 total, 37 arquivos) |
| Duração da suíte | 83.17s (vitest) / 101.9s (wall, inclui overhead do `time`) |

Confirmado pelo T013 após a CI ficar verde (US0) — aquele número, e não este, é o oficial se divergir.
