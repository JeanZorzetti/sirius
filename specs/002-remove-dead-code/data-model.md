# Data Model — Remoção de código morto

**Feature**: `002-remove-dead-code` | **Fase**: 1

## Entidades de dados: nenhuma

Esta feature **não cria, altera nem remove entidade de banco**. Nenhuma migration, nenhuma mudança em `prisma/schema.prisma` ou `prisma/whatsapp.prisma`, nenhum backfill.

Isso é uma restrição, não uma observação: qualquer história que precise de migration está fora do escopo desta feature e vira spec própria. O corolário prático está na FR-003 — a verificação nunca usa `npm run build`, justamente porque esse script aplicaria migrations que esta feature não tem.

As duas entidades **lidas** (nunca escritas) são `Deal` e `Contact`, na US4, pelas rotas de export que já existem.

## Formas-alvo dos módulos

O que esta feature de fato modela são módulos. Abaixo, a forma final de cada um — o contrato interno que `/speckit-tasks` vai desdobrar.

### `scripts/dead-code-allowlist.json` (novo, US0)

Fonte única das exceções do scanner. Cada entrada carrega o motivo; entrada sem motivo é inválida.

```json
{
  "routes": [
    { "path": "/api/sync/process",        "reason": "chamado por public/sw-push.js (public/ é ignorado pelo scanner)" },
    { "path": "/api/mobile/sync",         "reason": "chamado pelo app Capacitor, fora deste repositório" },
    { "path": "/api/mercadopago/checkout","reason": "redirect de 7 linhas mantido para o app mobile antigo" }
  ],
  "files": []
}
```

Regras:
- `files` nasce **vazio** e assim deve permanecer ao fim da US3. Entrada nova em `files` exige justificativa no PR.
- Remover uma entrada é permitido; adicionar é o que precisa de defesa.

### `lib/plan-quota.ts` (renome de `lib/rate-limit.ts`, US2)

Cota por organização e plano. Único importador: `lib/api-middleware.ts`.

| Antes | Depois |
|---|---|
| `checkRateLimit(organizationId, plan)` | `checkPlanQuota(organizationId, plan)` |
| `getRateLimitInfo(plan)` | `getPlanQuotaInfo(plan)` |
| `resetRateLimit(organizationId, plan)` | `resetPlanQuota(organizationId, plan)` |
| `RATE_LIMITS`, `RateLimitResult` | `PLAN_QUOTAS`, `PlanQuotaResult` |

Comportamento idêntico, incluindo os headers `X-RateLimit-*` emitidos pelo middleware — os headers são contrato HTTP e **não** são renomeados.

`lib/ratelimit.ts` (limite por rota/IP, 29 importadores) fica intocado.

### `lib/format.ts` (novo, US7)

Substitui 25 implementações independentes. Sem estado, sem configuração, sem classe.

| Export | Baseado em | Substitui |
|---|---|---|
| `formatCurrency(value)` | `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` | 10 definições |
| `formatDate(date, style?)` | `date-fns` (já é dependência, usada em 21 arquivos) | 10 definições |
| `formatPhone(raw)` | string, sem dependência | 3 definições |
| `timeAgo(date)` | `Intl.RelativeTimeFormat('pt-BR')` | 2 definições |

Regra de migração: a saída renderizada em pt-BR tem de ser idêntica à anterior, incluindo os casos de borda de cada implementação antiga (valor nulo, data inválida, telefone com e sem DDI). Divergência encontrada durante a consolidação é decidida a favor do comportamento que hoje aparece nas telas principais, e registrada no PR.

### `lib/entitlements.ts` (fusão, US7)

Absorve `lib/feature-gates.ts` (623 linhas) e `lib/plan-limits.ts` (209 linhas, que hoje só relê `PLAN_LIMITS` de `entitlements.ts`). Resultado: uma fonte única de limites de plano, consultada por todos os gates de feature. Os 3 importadores de `plan-limits.ts` passam a importar de `entitlements.ts`.

Não confundir com `middleware/plan-limits.ts` (174 linhas, zero importadores), que é apagado na US2.

### `hooks/` (unificação, US7)

Convenção única `use-x.ts`. Depois das deleções de US3 e US6 sobram dois movimentos: renomear `useNotifications.ts` → `use-notifications.ts` e mover `lib/hooks/use-entitlements.ts` (com seu `__tests__/`) para `hooks/`.

### `instrumentation.ts` (fiação, US2)

Ganha um bloco que importa `lib/env.ts` dentro de `try/catch` e loga a mensagem de erro. Não altera `lib/env.ts`, não interrompe o boot, e faz o arquivo deixar de constar como órfão no scanner.
