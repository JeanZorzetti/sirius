-- Replace stage visibility columns with a simple canViewDealClosings flag
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canViewDealClosings" BOOLEAN NOT NULL DEFAULT true;
