# Auditoria de Over-Engineering — Sirius CRM

**Data:** 2026-08-22
**Escopo:** repo inteiro (`app/`, `components/`, `lib/`, `hooks/`, `middleware/`, `scripts/`)
**Método:** `ponytail-audit` + varredura estática de grafo de importação
**Fora de escopo:** bugs de correção, segurança e performance (ver [Fora de escopo](#fora-de-escopo))

---

## Sumário executivo

**~24.400 linhas (12% do código TS/TSX) não são alcançáveis por nenhum caminho de execução.** Não é dívida acumulada aos poucos: **dois terços (16.057 linhas) ficaram órfãos de uma vez só**, num único commit de limpeza que apagou 10 páginas de admin e deixou todo o backend delas para trás.

| Base medida | Linhas |
|---|---:|
| `app/` | 65.262 |
| `components/` | 64.968 |
| `lib/` | 67.573 |
| `hooks/` | 1.996 |
| **Total** | **199.799** |
| **Removível** | **24.411 (12,2%)** |

Composição do removível:

| Bloco | Linhas | Item |
|---|---:|---|
| Subsistema Generative UI (fechado em si mesmo) | 14.666 | [1](#1-delete-subsistema-generative-ui-inteiro--14666-linhas) |
| Arquivos sem importador, fora do bloco acima | 6.857 | [2](#2-delete-59-arquivos-sem-nenhum-importador--7368-linhas) |
| Rotas de API sem chamador (descontados 3 falsos positivos) | 1.993 | [3](#3-delete-32-rotas-de-api-sem-chamador--2061-linhas-em-247-rotas) |
| Libs AGI que caem junto com as rotas órfãs | 895 | [4](#4-delete-bibliotecas-agi-órfãs-pelas-rotas-do-item-3--895-linhas) |
| **Total** | **24.411** | |

Também há **12 dependências declaradas em `package.json` e nunca importadas**.

---

## Causa raiz

Commit **`2d29773`** — *"feat: add access tracking system and clean up obsolete admin pages"*, **27/04/2026**.

Esse commit apagou 10 páginas de admin:

```
app/[locale]/(admin)/admin/generative-ui/page.tsx
app/[locale]/(admin)/admin/ab-testing/page.tsx
app/[locale]/(admin)/admin/ab-testing/[experimentId]/page.tsx
app/[locale]/(admin)/admin/auto-citation/page.tsx
app/[locale]/(admin)/admin/auto-citation/auto-citation-tester.tsx
app/[locale]/(admin)/admin/graph-rag/page.tsx
app/[locale]/(admin)/admin/graph-rag/graph-rag-tester.tsx
app/[locale]/(admin)/admin/spin-chat/page.tsx
app/[locale]/(admin)/admin/spin-chat/spin-chat-tester.tsx
app/[locale]/(admin)/admin/spin-chat/diagnostic-mode-selector.tsx
```

Essas páginas eram a **única superfície de consumo** de quatro subsistemas inteiros. As páginas foram embora; os subsistemas ficaram — com testes, rotas de API e documentação. Ninguém percebeu porque nada quebra: código não alcançado compila, passa no lint e passa nos próprios testes.

O padrão a aprender: **apagar a UI não apaga o backend dela.** Uma limpeza de página precisa de um passo de "quem mais chamava isto?" antes do commit — que é exatamente o que `scripts/audit-dead-code.js` automatiza agora.

---

## Achados ranqueados

### 1. `delete:` subsistema Generative UI inteiro — **14.666 linhas**

Loop fechado consigo mesmo. Nenhuma página renderiza `MessageRenderer` ou `DynamicUIComponent`. O único cliente de `/api/agi/chat-with-ui` é `ChatWithUIExample.tsx`, que por sua vez só era renderizado pela página de admin apagada em 27/04. O chat que está no ar usa `/api/agi/chat`, outro endpoint.

| Parte | Linhas |
|---|---:|
| `components/generative-ui/` (10 componentes + 4 layouts + 2 workflows) | ~5.100 |
| `lib/generative-ui/` (registry, schemas, workflow-engine, layout-engine, ab-testing, cache-store, optimistic-updates) | ~4.200 |
| `lib/generative-ui/intelligence/` (props-auto-fill, context-extractor, trigger-logic) | 1.658 |
| Testes (`__tests__/`, 5 arquivos) | 1.707 |
| `hooks/` (useABTest, useWorkflow, useOptimisticUpdate, useComponentCache, useComponentAnalytics) | ~900 |
| Rotas `/api/agi/chat-with-ui` + `/api/ab-testing/*` (3) | ~700 |
| `app/[locale]/admin/cache-stats/page.tsx` | ~400 |

**Histórico:** `docs/GENERATIVE_UI_SUMMARY.md` declara *"Fase 1 de 6 — 100% COMPLETO"* em 31/01/2026. Houve trabalho real de integração em 02–03/02 (7 commits de fix no layout do chat, trigger do ROICalculator, modelo da Groq). A Fase 2 nunca começou. Último commit de feature: **03/02/2026** — 6,5 meses parado. Depois disso só varreduras de higiene (Sprint R1/R1.5/R2, junho).

**Antes de apagar:** decidir se é feature abandonada ou pausada. Se for retomar, o que falta é *uma página* que renderize `MessageRenderer` — o resto está pronto e testado. Se não for, são 14,6k linhas mantidas, type-checadas e testadas a cada CI por nada.

### 2. `delete:` 59 arquivos sem nenhum importador — **7.368 linhas**

Nem import estático, nem `import()` dinâmico, nem `require()`. Lista completa no [Anexo A](#anexo-a--arquivos-sem-importador). Destaques fora do bloco 1: `google-calendar-automations.ts` (344), `calculadora-roi-with-lead-capture.tsx` (343), `entity-disambiguation.ts` (324), `resizable-drawer.tsx` (311), `tasks/actions.ts` (272), `whatsapp-automations.ts` (272).

### 3. `delete:` 32 rotas de API sem chamador — **2.061 linhas** em 247 rotas

Lista completa no [Anexo B](#anexo-b--rotas-de-api-sem-chamador). Sete delas (`/api/agi/query`, `enrich`, `diagnose`, `recommend`, `learning-path`, `explain-relationship`, `/api/nlp/extract`) são vítimas diretas do commit de 27/04.

### 4. `delete:` bibliotecas AGI órfãs pelas rotas do item 3 — **895 linhas**

`lib/agi/graph-skills.ts` (511) só é importado pelas 5 rotas AGI órfãs. `lib/nlp/auto-citation.ts` (384) só por `/api/agi/enrich` e pelo próprio `graph-skills`. Caem juntas.
`lib/nlp/graph-rag.ts` e `lib/nlp/graph-queries.ts` **sobrevivem** — `admin/knowledge-graph` ainda os alcança via `/api/graph/rag`.

### 5. `yagni:` 6 rotas admin que são migração one-shot virada endpoint permanente

`migrate-deals-pipeline`, `fix-unread`, `fix-waba-id`, `add-closings-permission`, `reset-wa-db`, `sync-contacts`. Substituto: `scripts/` + `tsx`, que já é dependência do projeto. Endpoint permanente para operação de uma vez é superfície de ataque parada de graça.

### 6. `delete:` 12 dependências declaradas e nunca importadas

`@anthropic-ai/sdk` · `d3` · `@types/d3` · `node-cron` · `qrcode` · `@types/qrcode` · `@vercel/og` · `@vercel/analytics` · `@vercel/speed-insights` · `openai` · `form-data` · `react-email`

Notas: `openai` só aparece em strings de URL da Groq (`api.groq.com/openai/v1`), nunca como import. `qrcode.react` é outro pacote e **está** em uso. `@vercel/analytics` e `@vercel/speed-insights` estão instalados mas nunca montados no layout — ou liga, ou tira. `pino-pretty`, `@tailwindcss/typography` e `tw-animate-css` **parecem** órfãos numa busca por import mas são usados por string (`logger.ts`) e por CSS (`globals.css`) — mantidos.

### 7. `delete:` dois rate limiters coexistindo

`lib/rate-limit.ts` (158 linhas, Upstash) tem **1** importador — `lib/api-middleware.ts`.
`lib/ratelimit.ts` (193 linhas, Upstash + fallback em memória) tem **29**.
Nomes diferentes por um hífen. Substituto: `ratelimit.ts`.

### 8. `delete:` `middleware/plan-limits.ts` — 174 linhas, zero importadores

E existe `lib/plan-limits.ts` vivo com o mesmo nome, em outro diretório.

### 9. `delete:` 5 providers de scraping nunca registrados na factory — 539 linhas

`firecrawl-provider` (181), `google-search` (145), `openstreetmap` (90), `crawler-provider` (62), `outscraper-client` (63). A lista em `lib/scraping/providers/index.ts` tem 5 **outros** providers. Esses nunca entraram.

Na mesma factory: `searchLeadsWithFallback` é exportado mas só tem uso interno; `getAvailableProvider` e `getConfiguredProviders` não têm nenhum uso; `searchLeads()` é wrapper de uma linha em cima de `searchLeadsWithFallback`.

### 10. `stdlib:` formatadores reescritos à mão em 25 arquivos

10× `formatCurrency`, 10× `formatDate`, 3× `formatPhone`, 2× `timeAgo` — definições independentes, cada uma com suas próprias regras de locale e casos de borda.

Substituto nativo: `Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.RelativeTimeFormat`. E `date-fns` já é dependência, já usada em 21 arquivos. Um `lib/format.ts` resolve os 25.

### 11. `delete:` `lib/env.ts` — 122 linhas de validação de env var que nada importa

Ou liga em `instrumentation.ts`, ou apaga. Do jeito que está dá falsa sensação de que as env vars são validadas no boot — e não são. Relevante num projeto onde erro de env var já é a primeira hipótese de debug documentada no `CLAUDE.md`.

### 12. `yagni:` três nomes para um conceito só — 1.380 linhas

`lib/entitlements.ts` (548) + `lib/feature-gates.ts` (623) + `lib/plan-limits.ts` (209). `plan-limits.ts` apenas relê `PLAN_LIMITS` de `entitlements.ts` e tem 3 importadores. Substituto: fundir em `entitlements.ts`.

### 13. `delete:` 4 barrels de re-export com zero importadores

`components/generative-ui/index.ts` · `lib/generative-ui/index.ts` · `components/onboarding/index.ts` · `lib/scraping/crawler/index.ts`. O código já importa direto do arquivo de origem.

### 14. `delete:` 2 arquivos `.bak` versionados no git

`lib/email-automations.ts.bak` · `__tests__/components/generative-ui/DynamicUIComponent.test.tsx.bak`

### 15. `delete:` 3 componentes shadcn instalados e nunca usados

`ui/sidebar.tsx` (188) · `ui/responsive-sheet.tsx` (70) · `ui/mode-toggle.tsx` (40). Os outros 35 de `components/ui/` estão em uso — essa camada está saudável.

### 16. `yagni:` dois diretórios de hooks com convenções de nome diferentes

`hooks/` (13 arquivos, misturando `use-x.ts` e `useX.ts`) e `lib/hooks/` (1 arquivo). Escolher um.

### 17. `shrink:` 12 módulos mobile órfãos — 1.121 linhas

`lib/mobile/` (516): offline-cache (176), local-notifications (96), filesystem (84), share (72), network (57), browser (31).
`components/mobile/` (605): voice-dictation-button (267), filter-chips (88), filters-sheet (73), list-item (71), scan-card-button (68), empty-state (38).

O stack Capacitor em si **está vivo** — `native-initializer` é carregado por `dashboard-shell-client` e puxa `keyboard`, `status-bar` e `deep-links`; `badge` é usado por `bottom-nav`; os 15 plugins do `package.json` são todos usados. Só essas 12 folhas nunca foram ligadas.

---

## Plano de execução sugerido

Ordem por risco crescente. Cada fase é um PR próprio.

| Fase | O quê | Linhas | Risco |
|---|---|---:|---|
| 1 | Itens 14, 13, 15, 6 — `.bak`, barrels, shadcn não usado, deps | ~300 + 12 deps | nenhum |
| 2 | Itens 7, 8, 11, 9 — rate limiter duplicado, `middleware/plan-limits`, `lib/env`, providers | ~990 | baixo |
| 3 | Item 2 — 59 arquivos sem importador (Anexo A) | 7.368 | baixo |
| 4 | Itens 3, 4, 5 — rotas órfãs + libs AGI + migrações one-shot | ~2.950 | médio |
| 5 | **Item 1 — Generative UI.** Precisa de decisão de produto antes | 14.666 | decisão |
| 6 | Itens 10, 12, 16, 17 — consolidação (formatadores, entitlements, hooks, mobile) | ~1.500 | médio |

Fases 4 em diante são mudança não-trivial: **usar o fluxo Spec Kit** (`speckit-specify` → `plan` → `tasks` → `implement`), já que o projeto tem `.specify/`.

**Verificação obrigatória em cada fase**, porque código morto não quebra teste — a ausência dele é que pode quebrar:

```bash
npm run typecheck
npm run test
npm run build          # ATENÇÃO: roda prisma migrate deploy contra o banco
node scripts/audit-dead-code.js   # o número tem que cair
```

---

## Como reproduzir

```bash
node scripts/audit-dead-code.js
```

Resolve import estático, `import()` dinâmico e `require()`, em `.ts/.tsx/.js/.mjs`.

### Limites do método

Coisas que o scanner **não** enxerga e que exigem conferência manual antes de apagar:

- **Caminho montado em runtime** — `import(\`@/components/${nome}\`)`. Nenhum encontrado neste repo, mas o padrão passaria batido.
- **Referência só em Markdown** — a primeira versão do scanner lia `.md` e deu 13 rotas como vivas que só apareciam na documentação. Corrigido; é por isso que os números aqui são maiores que os de uma varredura ingênua.
- **Chamador fora do repo** — webhook, cron externo, app nativo, service worker. Tratados por allowlist (`EXTERNAL`) e pelo skip de `public/`. Falsos positivos conhecidos e já verificados: `/api/sync/process` (chamado por `public/sw-push.js`), `/api/mobile/sync` (app Capacitor), `/api/mercadopago/checkout` (7 linhas, redirect).
- **Entrypoints por convenção** — `page.tsx`, `route.ts`, `middleware.ts`, `i18n/request.ts`, seeds. Tratados por allowlist (`isEntry`).

Antes de apagar qualquer coisa: `git log --diff-filter=D --name-only -- "*<nome>*"` para ver se o consumidor foi apagado — e por quê.

---

## Fora de escopo

Esta auditoria cobre **apenas over-engineering**. Não olhei correção, segurança nem performance. Duas coisas apareceram de relance e merecem passagem própria:

- `sirius-crm-483316-a2e815438069.json` — service account do Google na raiz do repo. Rodar `/security-review`.
- 2 arquivos `.bak` versionados (item 14) podem conter credencial antiga; conferir antes de só apagar.

---

## Anexo A — arquivos sem importador

59 arquivos, 7.368 linhas. Gerado por `node scripts/audit-dead-code.js`.

```
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
```

> `components/microsoft-clarity.tsx`: conferir se o snippet não foi movido para o `<head>` do layout antes de apagar.
> `app/[locale]/dashboard/tasks/actions.ts`: server actions. Outros diretórios de dashboard têm o seu próprio `actions.ts` e importam por `'./actions'` — este não é importado por ninguém.

## Anexo B — rotas de API sem chamador

32 rotas de 247, 2.061 linhas. Marcadas com ⚠️ as três com chamador externo confirmado (falso positivo).

```
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
    36 /api/sync/process              ⚠️ chamado por public/sw-push.js
    25 /api/mobile/sync               ⚠️ app Capacitor
    22 /api/admin/add-closings-permission
    16 /api/admin/sync-contacts
     7 /api/mercadopago/checkout      ⚠️ redirect
```

> `/api/export/*` (4 rotas, 284 linhas) implementa exportação em PDF e XLSX que nenhuma tela oferece. É feature pronta e desligada, não lixo — decidir entre ligar um botão ou apagar.

> **Mercado Pago — não confundir os dois.** O `handoff.md` de 07/07 é explícito: *"MP continua no código de propósito (assinaturas legadas). Não remover `lib/mercadopago.ts` nem o webhook enquanto houver `mercadoPagoSubscriptionId` ativo em alguma org."* Isso vale para **`lib/mercadopago.ts`** (373 linhas, 10 importadores) e para **`/api/webhooks/mercadopago`** — ambos vivos e fora desta auditoria. O que está órfão é outra coisa: **`lib/mercado-pago/checkout.ts`** (260 linhas, diretório com hífen) e a rota `/api/mercadopago/checkout` (7 linhas). Confirmar no banco que nenhuma org ativa depende do fluxo de checkout novo antes de mexer.

---

## Documentos relacionados a revisar

Cinco documentos descrevem o subsistema do item 1 como se estivesse em produção. Se o item 1 for apagado, eles vão junto; se for retomado, precisam de uma nota de status:

`docs/GENERATIVE_UI_ARCHITECTURE.md` · `GENERATIVE_UI_CHECKLIST.md` · `GENERATIVE_UI_NEXT_STEPS.md` · `GENERATIVE_UI_SUMMARY.md` · `GENERATIVE_UI_USAGE_GUIDE.md`
