-- CreateEnum
CREATE TYPE "AgiInsightType" AS ENUM ('QUALIFICATION_BANT', 'QUALIFICATION_MEDDIC', 'NEXT_STEP_SUGGESTION', 'OBJECTION_HANDLING', 'SCRIPT_GENERATED', 'PIPELINE_ANALYSIS', 'DEAL_RISK_ASSESSMENT');

-- CreateTable
CREATE TABLE "AgiConversation" (
    "id" TEXT NOT NULL,
    "dealId" TEXT,
    "pipelineId" TEXT,
    "context" TEXT,
    "messages" JSONB NOT NULL,
    "summary" TEXT,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "AgiConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgiInsight" (
    "id" TEXT NOT NULL,
    "type" "AgiInsightType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "confidence" DECIMAL(3,2) NOT NULL,
    "applied" BOOLEAN NOT NULL DEFAULT false,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "dealId" TEXT,
    "pipelineId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "AgiInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgiUsage" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "tokensUsed" INTEGER NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "plan" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "AgiUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgiSkillExecution" (
    "id" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB,
    "executionTime" INTEGER,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "dealId" TEXT,
    "conversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "AgiSkillExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgiConversation_organizationId_userId_idx" ON "AgiConversation"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "AgiConversation_dealId_idx" ON "AgiConversation"("dealId");

-- CreateIndex
CREATE INDEX "AgiConversation_pipelineId_idx" ON "AgiConversation"("pipelineId");

-- CreateIndex
CREATE INDEX "AgiConversation_createdAt_idx" ON "AgiConversation"("createdAt");

-- CreateIndex
CREATE INDEX "AgiInsight_organizationId_type_idx" ON "AgiInsight"("organizationId", "type");

-- CreateIndex
CREATE INDEX "AgiInsight_dealId_idx" ON "AgiInsight"("dealId");

-- CreateIndex
CREATE INDEX "AgiInsight_pipelineId_idx" ON "AgiInsight"("pipelineId");

-- CreateIndex
CREATE INDEX "AgiInsight_createdAt_idx" ON "AgiInsight"("createdAt");

-- CreateIndex
CREATE INDEX "AgiUsage_organizationId_year_month_idx" ON "AgiUsage"("organizationId", "year", "month");

-- CreateIndex
CREATE INDEX "AgiUsage_userId_year_month_idx" ON "AgiUsage"("userId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "AgiUsage_organizationId_userId_date_key" ON "AgiUsage"("organizationId", "userId", "date");

-- CreateIndex
CREATE INDEX "AgiSkillExecution_organizationId_skillName_idx" ON "AgiSkillExecution"("organizationId", "skillName");

-- CreateIndex
CREATE INDEX "AgiSkillExecution_userId_idx" ON "AgiSkillExecution"("userId");

-- CreateIndex
CREATE INDEX "AgiSkillExecution_success_idx" ON "AgiSkillExecution"("success");

-- CreateIndex
CREATE INDEX "AgiSkillExecution_createdAt_idx" ON "AgiSkillExecution"("createdAt");

-- AddForeignKey
ALTER TABLE "AgiConversation" ADD CONSTRAINT "AgiConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgiConversation" ADD CONSTRAINT "AgiConversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgiInsight" ADD CONSTRAINT "AgiInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgiInsight" ADD CONSTRAINT "AgiInsight_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgiUsage" ADD CONSTRAINT "AgiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgiUsage" ADD CONSTRAINT "AgiUsage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgiSkillExecution" ADD CONSTRAINT "AgiSkillExecution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgiSkillExecution" ADD CONSTRAINT "AgiSkillExecution_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
