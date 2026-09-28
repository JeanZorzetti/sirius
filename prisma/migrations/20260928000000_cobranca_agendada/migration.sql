-- Spec 013: cancellation and downgrade scheduled for the end of the paid period
ALTER TABLE "Organization" ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Organization" ADD COLUMN "currentPeriodEnd" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN "pendingPlan" TEXT;
