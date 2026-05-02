ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "instagramPageAccessToken" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "instagramBusinessAccountId" TEXT;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "instagramOAuthState" TEXT;
