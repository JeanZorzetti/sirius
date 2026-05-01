-- Add new columns to InstagramPost
ALTER TABLE "InstagramPost" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "InstagramPost" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "InstagramPost" ADD COLUMN IF NOT EXISTS "approvedById" TEXT;
ALTER TABLE "InstagramPost" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "InstagramPost" ADD COLUMN IF NOT EXISTS "recurrenceRule" TEXT;
ALTER TABLE "InstagramPost" ADD COLUMN IF NOT EXISTS "recurrenceEndDate" TIMESTAMP(3);
ALTER TABLE "InstagramPost" ADD COLUMN IF NOT EXISTS "recurrenceParentId" TEXT;

-- Migrate existing statuses: pending -> scheduled
UPDATE "InstagramPost" SET status = 'scheduled' WHERE status = 'pending';

-- Foreign keys
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'InstagramPost_createdById_fkey') THEN
    ALTER TABLE "InstagramPost" ADD CONSTRAINT "InstagramPost_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'InstagramPost_approvedById_fkey') THEN
    ALTER TABLE "InstagramPost" ADD CONSTRAINT "InstagramPost_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'InstagramPost_recurrenceParentId_fkey') THEN
    ALTER TABLE "InstagramPost" ADD CONSTRAINT "InstagramPost_recurrenceParentId_fkey" FOREIGN KEY ("recurrenceParentId") REFERENCES "InstagramPost"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "InstagramPost_recurrenceParentId_idx" ON "InstagramPost"("recurrenceParentId");

-- Create InstagramPostComment table
CREATE TABLE IF NOT EXISTS "InstagramPostComment" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "resolved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InstagramPostComment_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'InstagramPostComment_postId_fkey') THEN
    ALTER TABLE "InstagramPostComment" ADD CONSTRAINT "InstagramPostComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "InstagramPost"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'InstagramPostComment_userId_fkey') THEN
    ALTER TABLE "InstagramPostComment" ADD CONSTRAINT "InstagramPostComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "InstagramPostComment_postId_createdAt_idx" ON "InstagramPostComment"("postId", "createdAt");
