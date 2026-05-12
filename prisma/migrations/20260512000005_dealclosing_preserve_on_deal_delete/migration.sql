-- Preserve DealClosing when deal is deleted
-- Step 1: add desnormalized columns
ALTER TABLE "DealClosing" ADD COLUMN IF NOT EXISTS "contactId" TEXT;
ALTER TABLE "DealClosing" ADD COLUMN IF NOT EXISTS "dealTitle" TEXT;

-- Step 2: backfill from existing deals
UPDATE "DealClosing" dc
SET
  "contactId" = d."contactId",
  "dealTitle" = d."title"
FROM "Deal" d
WHERE dc."dealId" = d."id";

-- Step 3: make dealId nullable
ALTER TABLE "DealClosing" ALTER COLUMN "dealId" DROP NOT NULL;

-- Step 4: drop cascade constraint and replace with SET NULL
ALTER TABLE "DealClosing" DROP CONSTRAINT IF EXISTS "DealClosing_dealId_fkey";
ALTER TABLE "DealClosing" ADD CONSTRAINT "DealClosing_dealId_fkey"
  FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 5: index on contactId for fast lookup
CREATE INDEX IF NOT EXISTS "DealClosing_contactId_idx" ON "DealClosing"("contactId");
