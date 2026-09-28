-- Spec 014: history of every deal move and one automation execution per move
ALTER TABLE "Activity" ADD COLUMN "fromStageId" TEXT;
ALTER TABLE "Activity" ADD COLUMN "toStageId" TEXT;
ALTER TABLE "Activity" ADD COLUMN "actorType" TEXT NOT NULL DEFAULT 'USER';

ALTER TABLE "AutomationExecution" ADD COLUMN "activityId" TEXT;
CREATE UNIQUE INDEX "AutomationExecution_automationId_activityId_key" ON "AutomationExecution"("automationId", "activityId");
