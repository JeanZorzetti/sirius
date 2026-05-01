-- Add organizationId to InstagramPost for multi-tenant scoping
ALTER TABLE "InstagramPost" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Assign all existing posts to ROI Labs organization
UPDATE "InstagramPost" SET "organizationId" = '09c166c7-b3d9-4eda-bfe3-f5bf83fc3ab5' WHERE "organizationId" IS NULL;

-- Make the column required
ALTER TABLE "InstagramPost" ALTER COLUMN "organizationId" SET NOT NULL;

-- Add foreign key
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'InstagramPost_organizationId_fkey'
  ) THEN
    ALTER TABLE "InstagramPost" ADD CONSTRAINT "InstagramPost_organizationId_fkey"
      FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE;
  END IF;
END $$;

-- Add composite index
CREATE INDEX IF NOT EXISTS "InstagramPost_organizationId_status_scheduledFor_idx"
  ON "InstagramPost"("organizationId", "status", "scheduledFor");
