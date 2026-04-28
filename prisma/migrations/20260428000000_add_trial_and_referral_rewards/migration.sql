-- CreateEnum
CREATE TYPE "TrialStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CONVERTED');

-- AlterTable: Organization — add trial fields and referralDiscount
ALTER TABLE "Organization"
  ADD COLUMN "trialStartedAt" TIMESTAMP(3),
  ADD COLUMN "trialEndsAt" TIMESTAMP(3),
  ADD COLUMN "trialStatus" "TrialStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "referralDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable: Referral — add discountAppliedAt
ALTER TABLE "Referral"
  ADD COLUMN "discountAppliedAt" TIMESTAMP(3);

-- Backfill: mark existing paid orgs as CONVERTED (they never had a trial)
UPDATE "Organization"
  SET "trialStatus" = 'CONVERTED'
  WHERE "tier" != 'FREE' OR "isFounder" = true;

-- Backfill: FREE orgs get trial window anchored to createdAt
-- Most will already be "expired" (older than 7 days), enforced in application layer
UPDATE "Organization"
  SET
    "trialStartedAt" = "createdAt",
    "trialEndsAt" = "createdAt" + INTERVAL '7 days'
  WHERE "tier" = 'FREE' AND "isFounder" = false;
