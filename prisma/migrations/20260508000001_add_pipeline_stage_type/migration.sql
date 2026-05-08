-- CreateEnum
CREATE TYPE "PipelineStageType" AS ENUM ('OPEN', 'WON', 'LOST');

-- AlterTable
ALTER TABLE "PipelineStage" ADD COLUMN "type" "PipelineStageType" NOT NULL DEFAULT 'OPEN';
