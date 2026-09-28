# Implementation Plan: O site só promete o que o produto faz, e a cobrança faz o que o site promete

**Branch**: `013-promessas-honestas` | **Date**: 2026-09-27 | **Spec**: [spec.md](spec.md)

## Summary

- **Cobrança:** o cancelamento, a troca de plano e o arrependimento passam a ser feitos na assinatura Stripe que já
  existe.
- **Estado:** a conta guarda o que está agendado em três campos novos de `Organization`.
- **Teste:** passa a 14 dias, numa constante única.
- **Texto público:** é reescrito para dizer só o que o código faz. Os limites da /features passam a vir de `PLAN_LIMITS`.

## Technical Context

- **Stack:** Next.js 16 (App Router), Prisma 7, Postgres, `stripe` 22.3 (API `2026-06-24.dahlia`) e Vitest.
- **Datas da assinatura (API dahlia):**
  - O período fica em `subscription.items.data[0].current_period_end`.
  - O início fica em `subscription.start_date`.
  - O pagamento de uma fatura sai de `invoicePayments.list({ invoice })`.
- **Onde entra cada regra:**
  - as regras puras (tipo de troca, janela de arrependimento) ficam em `lib/stripe.ts`, com teste de unidade;
  - as chamadas à Stripe ficam na mesma lib;
  - as rotas continuam finas.

## Design

### Dados

A migration `20260928000000_cobranca_agendada` acrescenta três campos a `Organization`:

- `cancelAtPeriodEnd Boolean @default(false)`;
- `currentPeriodEnd DateTime?`: preenchido quando algo é agendado, e mostrado na tela;
- `pendingPlan String?`: a chave de `CheckoutPlan` que vale na próxima renovação, por exemplo `STARTER` ou `PRO_ANNUAL`.

### Troca de plano (`POST /api/stripe/checkout`)

- **Conta gratuita, ou sem `stripeSubscriptionId`:** o checkout abre como hoje.
- **Com assinatura:** `planChange(atual, alvo)` classifica a troca.

| Tipo | Quando | O que faz |
|---|---|---|
| `upgrade` | tier maior, ou mensal→anual | `subscriptions.update` com o preço novo, `proration_behavior: 'always_invoice'`, `payment_behavior: 'error_if_incomplete'` e `cancel_at_period_end: false`; aplica `upgradePlan` na hora; limpa os agendamentos |
| `downgrade` | tier menor, no mesmo ciclo | `subscriptions.update` com `proration_behavior: 'none'`: a próxima fatura sai no preço novo. Grava `pendingPlan` e `currentPeriodEnd` |
| `same` | mesmo plano e mesmo ciclo | se há `pendingPlan`, devolve o preço atual e limpa o agendamento; senão, erro 400 |
| `blocked` | anual→mensal | erro 400 com explicação. A Stripe cobraria na hora ao mudar o intervalo |

- **Produto:** a Stripe exige `product` no `price_data` de um item de assinatura. O `products.create` usa o nome do
  plano, o mesmo que o checkout usa.

### Renovação (`invoice.paid` com `subscription_cycle`)

- O plano aplicado é `pendingPlan ?? org.tier`. `renewSubscription` recebe o tier e o ciclo.
- O agendamento é limpo no mesmo `update`.

### Cancelamento (`POST /api/billing/cancel`)

- **Com assinatura Stripe, dentro de 7 dias de `start_date`:**
  - reembolsa as faturas pagas da assinatura;
  - chama `subscriptions.cancel`;
  - chama `downgradeToFree` com o motivo `withdrawal_refund`.
- **Com assinatura Stripe, depois de 7 dias:**
  - chama `subscriptions.update({ cancel_at_period_end: true })`;
  - grava `cancelAtPeriodEnd` e `currentPeriodEnd`;
  - o rebaixamento acontece no `customer.subscription.deleted`, que já é tratado.
- **Sem assinatura Stripe** (Mercado Pago legado ou plano dado pelo admin): o comportamento atual continua.
- **`DELETE /api/billing/cancel`:** desfaz o agendamento com `cancel_at_period_end: false`.
- **E-mail de comprovante:** o cancelamento e a desistência mandam um e-mail curto ao dono.
- **`downgradeToFree`:** também zera `cancelAtPeriodEnd`, `currentPeriodEnd` e `pendingPlan`.

### Teste

- `TRIAL_DAYS = 14` em `lib/entitlements.ts`, usado em `app/auth/actions.ts`.

### Texto

- **`messages/pt-BR/marketing.json`:** `pricing`, `features` e `home`, mais os metadados.
- **Home:** `app/[locale]/(fluxo)/page.tsx`, com FAIXAS, lista de recursos, `faqSchema` e o subtítulo dos planos.
- **Páginas:** `pricing/page.tsx`, `features/page.tsx` (tabela a partir de `PLAN_LIMITS`), `download/page.tsx`.
- **JSON-LD e prova social:** `solucoes/[slug]`, `solucoes/cidade/[slug]` e `vendas-automaticas` (sai o `aggregateRating`),
  `config/niche-data.ts` (sai a prova social), register, about, help, blog ("7 dias do Pro", "para sempre") e os termos
  (3.3).

## Constitution Check

A constituição do projeto não foi preenchida (template). Valem as regras do repositório:

- o CI verde: lint, tsc, unit e e2e;
- achado de segurança não entra no texto público.

## Project Structure

```text
prisma/schema.prisma, prisma/migrations/20260928000000_cobranca_agendada/
lib/stripe.ts, lib/billing-effects.ts, lib/entitlements.ts
app/api/stripe/checkout/route.ts, app/api/billing/cancel/route.ts, app/api/webhooks/stripe/route.ts
app/[locale]/dashboard/billing/{page.tsx,cancel-subscription-button.tsx,plans/page.tsx}
app/auth/actions.ts
messages/pt-BR/*.json, app/[locale]/(fluxo)/page.tsx, app/[locale]/(marketing)/**, config/niche-data.ts, lib/blog/**
lib/__tests__/stripe.test.ts, __tests__/seo/promessas-publicas.test.ts
```

## Complexity Tracking

- **Anual→mensal recusado, em vez de agendado:** agendar exigiria Subscription Schedules. Não há nenhuma assinatura
  anual hoje. Adicionar quando houver pedido.
