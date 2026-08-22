# Handoff — Auditoria de over-engineering (2026-08-22)

## Contexto
Pedido: "refatore o projeto". Repo tem ~200k linhas de TS/TSX — refatorar às cegas é como o risco entra. Rodada uma auditoria de código morto antes de tocar em qualquer coisa. Nada foi apagado.

## Feito
- **`docs/AUDITORIA_OVER_ENGINEERING_2026-08-22.md`** (novo) — 17 achados ranqueados, plano de execução em 6 fases por risco crescente, e dois anexos com as listas completas.
- **`scripts/audit-dead-code.js`** (novo) — reproduz os números: arquivos sem importador + rotas de API sem chamador. Resolve import estático, `import()` dinâmico e `require()`.

## Achado principal
**~24.400 linhas (12% do TS/TSX) não são alcançáveis por nenhum caminho de execução.** Dois terços disso (16.057 linhas) ficaram órfãos de uma vez só, no commit `2d29773` de 27/04/2026 ("clean up obsolete admin pages"): 10 páginas de admin foram apagadas e o backend inteiro delas ficou — subsistema Generative UI (14.666 linhas, com testes), cluster AGI/graph (1.391), A/B testing.

Nada quebrou porque código não alcançado compila, passa no lint e passa nos próprios testes. É por isso que o `audit-dead-code.js` existe agora.

## Próximos
1. **Decisão de produto sobre o Generative UI** — é 60% do corte total. `docs/GENERATIVE_UI_SUMMARY.md` diz "Fase 1 de 6 COMPLETA" (31/01/2026); último commit de feature foi 03/02/2026. Se for retomar, falta *uma página* que renderize `MessageRenderer`. Se não, são 14,6k linhas type-checadas e testadas a cada CI por nada.
2. Fases 1–3 do plano (~8.700 linhas, risco baixo/nenhum) podem ir sem decisão de produto.
3. Fase 4+ é mudança não-trivial → fluxo Spec Kit, o projeto tem `.specify/`.

## Pendências / gotchas
- **Não confundir os dois Mercado Pago.** `lib/mercadopago.ts` (10 importadores) e `/api/webhooks/mercadopago` continuam vivos por causa das assinaturas legadas — ver handoff de 07/07. O órfão é `lib/mercado-pago/checkout.ts` (diretório com hífen) + `/api/mercadopago/checkout`.
- Falsos positivos já verificados nos anexos: `/api/sync/process` (chamado por `public/sw-push.js`), `/api/mobile/sync` (app Capacitor), `/api/mercadopago/checkout` (redirect de 7 linhas).
- `sirius-crm-483316-a2e815438069.json` — service account do Google na raiz do repo. Fora do escopo desta auditoria; pede um `/security-review`.
- `npm run build` roda `prisma migrate deploy` contra o banco. Para verificar as fases, usar `npm run typecheck && npm run test`.
- 5 docs `GENERATIVE_UI_*.md` descrevem o subsistema como se estivesse em produção. Vão junto se o item 1 for apagado.

---

# Handoff — Brand entity SEO "sirius crm" (2026-07-11)

## Contexto
Investigação via roihub /insights + GSC: o trend "cliques declining" era 100% o query branded `sirius crm` (21→7 cliques entre janelas 28d; posição própria caiu de 2,0 → ~4,4-5,4; CTR 17%→6%). Nome homônimo disputado (Hitachi, ERP Sirius UK, Sirius Jewels, Dana Grupo). Descoberta grave: **todos os `sameAs` do site apontavam pra perfis mortos ou de terceiros** — `linkedin.com/company/roilabs` (deletada), `linkedin.com/company/roi-labs` (consultoria americana homônima), `twitter.com/roilabs` e `github.com/roilabs` (contas de estranhos). Isso ativamente atrapalha a desambiguação da entidade.

## Feito (commit `ef1f16b`)
- **`lib/geo/entity.ts`** (novo) — fonte única dos perfis VERIFICADOS em 11/07: `ORG_SAME_AS` (linkedin `roi-labs-curadoria` [confirmado owned via admin view] + instagram `roilabs.curadoria` [declarado no schema de roilabs.com.br]) e `FOUNDER`/`FOUNDER_SAME_AS` (Jean: linkedin `in/jean-zorzetti-772742239` + github `JeanZorzetti`). Comentário no arquivo lista os URLs proibidos e por quê.
- **`app/[locale]/layout.tsx`** — @graph central: Organization com `sameAs` verificados + `founder` (Person Jean, cujo About no LinkedIn cita "Sirius CRM" — link bidirecional de entidade); WebSite ganhou `alternateName: 'Sirius'`; SoftwareApplication ganhou `@id`; removido `twitter.creator: '@roilabs'` (handle não é nosso).
- **home, community, blog/[slug], lib/geo/schema-generator.ts** — todos os sameAs inline (10 ocorrências) trocados pelo import de `ORG_SAME_AS`.
- **`components/marketing/footer.tsx`** — links visíveis corrigidos: LinkedIn→curadoria, Twitter→Instagram curadoria, GitHub→JeanZorzetti.
- **`docs/BLOG_POST_TEMPLATE.md`** + mds do spin-selling — referências corrigidas pra não perpetuar URLs errados.
- Typecheck verde (`npm run typecheck`).

## Próximos
1. Validar em prod (Rich Results Test / view-source em siriuscrm.com.br procurando `roi-labs-curadoria`).
2. **Google Ads branded "sirius crm"** — protege o nome dos homônimos e reativa a demanda branded que secou (era o próximo passo do plano de growth; as 3 vendas vieram de branded).
3. Medir posição branded no GSC ~28/07 (D+17 da mudança).

## Pendências / gotchas
- `aggregateRating 5.0/12` no SoftwareApplication do layout: sem reviews visíveis na página, é risco de spam de structured data (pode virar manual action). Avaliar remover ou linkar reviews reais.
- Página LinkedIn `roi-labs-curadoria` está parada (0 posts em 90d) — schema aponta pra ela, mas entidade forte pede página viva.
- `contactOption: 'TollFree'` no layout é incorreto (número é celular) — cosmético.

---

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
