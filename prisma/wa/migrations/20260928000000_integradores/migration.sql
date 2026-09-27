-- Spec 012: WhatsApp through the customer's integrator (Z-API, uazapi, Evolution API).
-- Additive only, and idempotent: the WA database was created by the old Go gateway without
-- migration history, so every statement must survive running on a database that already has it.

-- CreateEnum (PostgreSQL has no CREATE TYPE IF NOT EXISTS)
DO $$ BEGIN
  CREATE TYPE "WhatsAppIntegrador" AS ENUM ('ZAPI', 'UAZAPI', 'EVOLUTION');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterEnum
ALTER TYPE "WhatsAppStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';

-- AlterTable
ALTER TABLE "WhatsAppMessage" ADD COLUMN IF NOT EXISTS "erro" TEXT;

-- AlterTable
ALTER TABLE "WhatsAppConnection"
  ADD COLUMN IF NOT EXISTS "avisoVersao" TEXT,
  ADD COLUMN IF NOT EXISTS "baseUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "instanciaChave" TEXT,
  ADD COLUMN IF NOT EXISTS "provider" "WhatsAppIntegrador",
  ADD COLUMN IF NOT EXISTS "statusMotivo" TEXT,
  ADD COLUMN IF NOT EXISTS "statusMudouEm" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "webhookSegredoHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "WhatsAppConnection_webhookSegredoHash_key" ON "WhatsAppConnection"("webhookSegredoHash");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "WhatsAppConnection_instanciaChave_key" ON "WhatsAppConnection"("instanciaChave");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "WhatsAppConnection_provider_status_idx" ON "WhatsAppConnection"("provider", "status");
