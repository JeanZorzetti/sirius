-- Reintroduz colunas Stripe (removidas em 20260108175339_migrate_stripe_to_mercadopago).
-- IF NOT EXISTS: idempotente caso o ambiente ainda tenha resquício da versão pré-MP.
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
