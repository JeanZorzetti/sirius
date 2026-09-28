-- Spec 016: stage chance of closing (null = default by type and order) and palette colour
ALTER TABLE "PipelineStage" ADD COLUMN "probability" INTEGER;
ALTER TABLE "PipelineStage" ADD COLUMN "color" TEXT;
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_probability_range" CHECK ("probability" IS NULL OR ("probability" BETWEEN 0 AND 100));
