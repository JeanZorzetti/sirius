-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "TaskVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'ADMINS_ONLY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "visibility" "TaskVisibility" NOT NULL DEFAULT 'PUBLIC';
