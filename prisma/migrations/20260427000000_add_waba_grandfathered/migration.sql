-- Add wabaGrandfathered flag to Organization
-- Marks Starter/Pro orgs that had WhatsApp access before the Business-only gate
ALTER TABLE "Organization" ADD COLUMN "wabaGrandfathered" BOOLEAN NOT NULL DEFAULT false;

-- Seed: mark all current Starter and Pro orgs as grandfathered
UPDATE "Organization" SET "wabaGrandfathered" = true WHERE tier IN ('STARTER', 'PRO');
