/*
  Migration: Add Multiple Pipelines Support

  This migration:
  1. Creates the Pipeline table
  2. Creates a default pipeline for each organization
  3. Migrates existing PipelineStages to the default pipeline
  4. Migrates existing Deals to their stage's pipeline
  5. Adds foreign key constraints
*/

-- Step 1: Create Pipeline table
CREATE TABLE "Pipeline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Pipeline_pkey" PRIMARY KEY ("id")
);

-- Step 2: Add foreign key for Pipeline -> Organization
ALTER TABLE "Pipeline" ADD CONSTRAINT "Pipeline_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 3: Create index for Pipeline
CREATE INDEX "Pipeline_organizationId_isDefault_idx" ON "Pipeline"("organizationId", "isDefault");

-- Step 4: Create a default pipeline for each organization that has stages
INSERT INTO "Pipeline" ("id", "name", "isDefault", "organizationId", "updatedAt")
SELECT
    gen_random_uuid()::text,
    'Pipeline Principal',
    true,
    "organizationId",
    CURRENT_TIMESTAMP
FROM "PipelineStage"
GROUP BY "organizationId";

-- Step 5: Add pipelineId column to PipelineStage (nullable first)
ALTER TABLE "PipelineStage" ADD COLUMN "pipelineId" TEXT;

-- Step 6: Populate pipelineId in PipelineStage with the default pipeline
UPDATE "PipelineStage" ps
SET "pipelineId" = p."id"
FROM "Pipeline" p
WHERE ps."organizationId" = p."organizationId" AND p."isDefault" = true;

-- Step 7: Make pipelineId NOT NULL now that it's populated
ALTER TABLE "PipelineStage" ALTER COLUMN "pipelineId" SET NOT NULL;

-- Step 8: Add foreign key for PipelineStage -> Pipeline
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_pipelineId_fkey"
    FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 9: Create index for PipelineStage
CREATE INDEX "PipelineStage_pipelineId_order_idx" ON "PipelineStage"("pipelineId", "order");

-- Step 10: Add pipelineId column to Deal (nullable first)
ALTER TABLE "Deal" ADD COLUMN "pipelineId" TEXT;

-- Step 11: Populate pipelineId in Deal from their stage's pipeline
UPDATE "Deal" d
SET "pipelineId" = ps."pipelineId"
FROM "PipelineStage" ps
WHERE d."stageId" = ps."id";

-- Step 12: Make pipelineId NOT NULL now that it's populated
ALTER TABLE "Deal" ALTER COLUMN "pipelineId" SET NOT NULL;

-- Step 13: Add foreign key for Deal -> Pipeline
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_pipelineId_fkey"
    FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
