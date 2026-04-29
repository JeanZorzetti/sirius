-- AlterTable: add Facebook OAuth flow fields to Organization
ALTER TABLE "Organization"
  ADD COLUMN IF NOT EXISTS "facebookUserAccessToken" TEXT,
  ADD COLUMN IF NOT EXISTS "facebookAvailablePages"  TEXT,
  ADD COLUMN IF NOT EXISTS "facebookOAuthState"      TEXT;
