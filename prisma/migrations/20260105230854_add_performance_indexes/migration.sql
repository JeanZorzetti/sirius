-- CreateIndex
CREATE INDEX "Contact_organizationId_idx" ON "Contact"("organizationId");

-- CreateIndex
CREATE INDEX "Deal_organizationId_stageId_idx" ON "Deal"("organizationId", "stageId");

-- CreateIndex
CREATE INDEX "Deal_userId_idx" ON "Deal"("userId");

-- CreateIndex
CREATE INDEX "PipelineStage_organizationId_pipelineId_idx" ON "PipelineStage"("organizationId", "pipelineId");
