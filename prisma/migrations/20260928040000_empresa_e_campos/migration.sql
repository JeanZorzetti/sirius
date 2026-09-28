-- Spec 017: company as an entity, the contact's role in it, and custom fields
-- CreateEnum
CREATE TYPE "PapelNaEmpresa" AS ENUM ('DECISOR', 'INFLUENCIADOR', 'CHAMPION', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoCampo" AS ENUM ('TEXTO', 'NUMERO', 'DATA', 'SELECAO', 'CHECKBOX');

-- CreateEnum
CREATE TYPE "EntidadeCampo" AS ENUM ('CONTACT', 'DEAL');

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "domain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactCompany" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" "PapelNaEmpresa" NOT NULL DEFAULT 'OUTRO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldDefinition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entity" "EntidadeCampo" NOT NULL,
    "label" TEXT NOT NULL,
    "type" "TipoCampo" NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomFieldValue" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "definitionId" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "valueText" TEXT,
    "valueNumber" DOUBLE PRECISION,
    "valueDate" TIMESTAMP(3),
    "valueBool" BOOLEAN,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_organizationId_nameKey_key" ON "Company"("organizationId", "nameKey");

-- CreateIndex
CREATE INDEX "ContactCompany_organizationId_companyId_idx" ON "ContactCompany"("organizationId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "ContactCompany_contactId_companyId_key" ON "ContactCompany"("contactId", "companyId");

-- CreateIndex
CREATE INDEX "CustomFieldDefinition_organizationId_entity_order_idx" ON "CustomFieldDefinition"("organizationId", "entity", "order");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldDefinition_organizationId_entity_label_key" ON "CustomFieldDefinition"("organizationId", "entity", "label");

-- CreateIndex
CREATE INDEX "CustomFieldValue_organizationId_recordId_idx" ON "CustomFieldValue"("organizationId", "recordId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomFieldValue_definitionId_recordId_key" ON "CustomFieldValue"("definitionId", "recordId");

-- AddForeignKey
ALTER TABLE "Company" ADD CONSTRAINT "Company_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactCompany" ADD CONSTRAINT "ContactCompany_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactCompany" ADD CONSTRAINT "ContactCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldDefinition" ADD CONSTRAINT "CustomFieldDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomFieldValue" ADD CONSTRAINT "CustomFieldValue_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "CustomFieldDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Backfill: every distinct company name typed on a contact becomes one Company per account (name kept as first
-- written), and the contact is linked to it with role OUTRO. Contact.company stays as it was.
INSERT INTO "Company" (id, "organizationId", name, "nameKey", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "organizationId", min(btrim(company)), lower(btrim(company)), now(), now()
FROM "Contact"
WHERE company IS NOT NULL AND btrim(company) <> ''
GROUP BY "organizationId", lower(btrim(company));

INSERT INTO "ContactCompany" (id, "organizationId", "contactId", "companyId", role, "createdAt")
SELECT gen_random_uuid()::text, c."organizationId", c.id, co.id, 'OUTRO', now()
FROM "Contact" c
JOIN "Company" co ON co."organizationId" = c."organizationId" AND co."nameKey" = lower(btrim(c.company))
WHERE c.company IS NOT NULL AND btrim(c.company) <> '';

-- A custom field value points to a contact or a deal by recordId, with no foreign key (it can be either). Deleting the
-- record deletes its values here, so every delete path (single, bulk, API, admin) leaves no personal data behind.
CREATE OR REPLACE FUNCTION apagar_valores_de_campos() RETURNS trigger AS $$
BEGIN
  DELETE FROM "CustomFieldValue" WHERE "recordId" = OLD.id AND "organizationId" = OLD."organizationId";
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Contact_apagar_valores_de_campos" AFTER DELETE ON "Contact"
  FOR EACH ROW EXECUTE FUNCTION apagar_valores_de_campos();
CREATE TRIGGER "Deal_apagar_valores_de_campos" AFTER DELETE ON "Deal"
  FOR EACH ROW EXECUTE FUNCTION apagar_valores_de_campos();
