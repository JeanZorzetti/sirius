-- AlterTable: add Facebook Lead Ads webhook fields to Organization
ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "facebookPageAccessToken"    TEXT,
  ADD COLUMN IF NOT EXISTS "facebookPageId"             TEXT,
  ADD COLUMN IF NOT EXISTS "facebookWebhookVerifyToken" TEXT;

-- CreateTable: FacebookLead
CREATE TABLE "FacebookLead" (
    "id"             TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "leadgenId"      TEXT NOT NULL,
    "pageId"         TEXT NOT NULL,
    "formId"         TEXT NOT NULL,
    "adId"           TEXT,
    "adgroupId"      TEXT,
    "campaignId"     TEXT,
    "name"           TEXT,
    "email"          TEXT,
    "phone"          TEXT,
    "rawFields"      JSONB,
    "fetchedAt"      TIMESTAMP(3),
    "contactId"      TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacebookLead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FacebookLead_leadgenId_key" ON "FacebookLead"("leadgenId");
CREATE INDEX "FacebookLead_organizationId_createdAt_idx" ON "FacebookLead"("organizationId", "createdAt");
CREATE INDEX "FacebookLead_organizationId_formId_idx" ON "FacebookLead"("organizationId", "formId");
CREATE INDEX "FacebookLead_contactId_idx" ON "FacebookLead"("contactId");

-- AddForeignKey
ALTER TABLE "FacebookLead"
  ADD CONSTRAINT "FacebookLead_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
