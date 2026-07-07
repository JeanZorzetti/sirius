# Handoff — Migração de pagamento para Stripe (2026-07-07)

## Contexto
O checkout via Mercado Pago não estava funcionando. Migrado o meio de pagamento para **Stripe**, mantendo o Mercado Pago apenas para honrar assinaturas de clientes legados.

## Feito
- **`lib/stripe.ts`** — SDK Stripe (singleton lazy), catálogo `STRIPE_PLANS` (preços em centavos), `createStripeCheckout()` (Checkout Session hospedada) e `cancelStripeSubscription()`.
- **`lib/billing-effects.ts`** — regras de negócio de assinatura extraídas do webhook do MP, agora **provider-neutral** e compartilhadas entre Stripe e MP: `upgradePlan`, `upgradeToFounder`, `processAddonPurchase`, `renewSubscription`, `downgradeToFree`, `handleFailedRecurringPayment`, `sendPaymentFailureEmail`, `recordWhatsAppSetupPurchase`.
- **`app/api/stripe/checkout/route.ts`** — nova rota de checkout. Mesmo contrato da antiga (`{ plan, billingPeriod }` → `{ checkoutUrl }`), incl. guarda de tier, desconto de indicação e `customPricing`.
- **`app/api/webhooks/stripe/route.ts`** — trata `checkout.session.completed`, `invoice.paid` (renovação), `invoice.payment_failed` (email) e `customer.subscription.deleted` (churn → FREE). Valida assinatura via `STRIPE_WEBHOOK_SECRET`.
- **`app/api/webhooks/mercadopago/route.ts`** — refatorado para usar `lib/billing-effects.ts` (mesma lógica, sem duplicação). Continua funcionando para clientes legados.
- **`app/api/mercadopago/checkout/route.ts`** — agora só re-exporta a rota da Stripe (compat com app mobile Capacitor que ainda chama a URL antiga).
- **Frontend** (3 call sites) apontando para `/api/stripe/checkout`: `dashboard/billing/plans/page.tsx`, `components/dashboard/billing/embedded-checkout-modal.tsx`, `components/integrations/whatsapp-setup-cta.tsx`.
- **`app/api/billing/cancel/route.ts`** — cancela na Stripe (e no MP se legado).
- **Schema + migration** `20260707000000_add_stripe_billing_fields`: colunas `stripeCustomerId` e `stripeSubscriptionId` na `Organization`.
- **Teste** `lib/__tests__/stripe.test.ts` — guardrail de preços (STRIPE_PLANS × PLAN_PRICES) e mode/interval. ✅ 3/3.

## Verificado
- `npx tsc --noEmit` → **0 erros**.
- `npx vitest run lib/__tests__/stripe.test.ts` → **3/3 passou**.
- `prisma generate` OK com os novos campos.

## Decisões
- **Checkout hospedado** (redirect), não embedded — menor superfície, mesma UX do fluxo MP atual (que já redirecionava).
- **Preços via `price_data` inline**, sem catálogo de Prices no dashboard. Permite `customPricing` (referral/grandfathering/founder) sem criar um Price por cliente.
- **NÃO passar `payment_method_types`** — a Stripe seleciona métodos dinamicamente pelo dashboard (best practice; habilita PIX/cartão conforme conta).
- **Dunning é da Stripe**, não retry manual. Configurar no dashboard para cancelar a assinatura após as tentativas → dispara `customer.subscription.deleted` → downgrade FREE.

## Pendências (bloqueiam produção — precisam do Jean)
1. **Criar conta/pegar chaves Stripe** e preencher em produção (EasyPanel): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`. Idem `.env` local (chaves `sk_test_`/`whsec_` de teste).
2. **Cadastrar o webhook** no dashboard Stripe → `https://siriuscrm.com.br/api/webhooks/stripe` com os eventos: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`. Copiar o signing secret para `STRIPE_WEBHOOK_SECRET`.
3. **Habilitar métodos de pagamento** (cartão, PIX) em Settings → Payment methods.
4. **Configurar dunning** (Settings → Billing → Retries) para cancelar após as tentativas.
5. **Verificar moeda BRL** habilitada na conta.
6. **Teste E2E em prod**: assinar um plano de teste, confirmar upgrade de tier no banco + email de confirmação; cancelar e confirmar downgrade.

## Gotchas
- Diretório de trabalho do agente ≠ raiz do projeto: rodar prisma sempre com `--schema prisma/schema.prisma`.
- `.env` e `.env.easypanel` são gitignored (segredos reais). Só `.env.example` versionado.
- Migration usa `ADD COLUMN IF NOT EXISTS` (idempotente). A coluna Stripe já existiu antes (removida na migration de migração p/ MP em jan/2026).
- `customPricing` só é honrado para **PRO mensal** (comportamento herdado do fluxo MP) — revisar se quiser estender.
- MP continua no código de propósito (assinaturas legadas). Não remover `lib/mercadopago.ts` nem o webhook enquanto houver `mercadoPagoSubscriptionId` ativo em alguma org.
