-- Omie ERP Integration fields on Organization
ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "omieAppKey"    TEXT,
  ADD COLUMN IF NOT EXISTS "omieAppSecret" TEXT,
  ADD COLUMN IF NOT EXISTS "omieEnabled"   BOOLEAN NOT NULL DEFAULT false;

-- Omie fields on Contact
ALTER TABLE "Contact"
  ADD COLUMN IF NOT EXISTS "omieClienteId" TEXT,
  ADD COLUMN IF NOT EXISTS "document"      TEXT,
  ADD COLUMN IF NOT EXISTS "source"        TEXT;

CREATE INDEX IF NOT EXISTS "Contact_omieClienteId_idx" ON "Contact"("omieClienteId");

-- OmieFinanceiro table
CREATE TABLE IF NOT EXISTS "OmieFinanceiro" (
  "id"             TEXT NOT NULL,
  "omieId"         TEXT NOT NULL,
  "status"         TEXT NOT NULL,
  "valor"          DOUBLE PRECISION NOT NULL,
  "vencimento"     TIMESTAMP(3) NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "contactId"      TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  CONSTRAINT "OmieFinanceiro_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OmieFinanceiro_omieId_key" ON "OmieFinanceiro"("omieId");
CREATE INDEX IF NOT EXISTS "OmieFinanceiro_organizationId_idx" ON "OmieFinanceiro"("organizationId");
CREATE INDEX IF NOT EXISTS "OmieFinanceiro_contactId_idx" ON "OmieFinanceiro"("contactId");

ALTER TABLE "OmieFinanceiro"
  ADD CONSTRAINT "OmieFinanceiro_contactId_fkey"
    FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "OmieFinanceiro_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
