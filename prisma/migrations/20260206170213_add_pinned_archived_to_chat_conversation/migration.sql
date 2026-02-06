-- AlterTable
ALTER TABLE "ChatConversation" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ChatConversation" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "ChatConversation_organizationId_isPinned_idx" ON "ChatConversation"("organizationId", "isPinned");

-- CreateIndex
CREATE INDEX "ChatConversation_organizationId_isArchived_idx" ON "ChatConversation"("organizationId", "isArchived");
