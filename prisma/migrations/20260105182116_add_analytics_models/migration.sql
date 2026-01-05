-- CreateEnum
CREATE TYPE "UserActivityType" AS ENUM ('LOGIN', 'LOGOUT', 'DEAL_CREATED', 'DEAL_UPDATED', 'DEAL_DELETED', 'DEAL_STAGE_CHANGED', 'CONTACT_CREATED', 'CONTACT_UPDATED', 'CONTACT_DELETED', 'PIPELINE_CREATED', 'PIPELINE_DELETED', 'EMAIL_SENT', 'PAGE_VIEW', 'FEATURE_USED');

-- CreateTable
CREATE TABLE "DealSnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalDeals" INTEGER NOT NULL,
    "totalValue" DECIMAL(12,2) NOT NULL,
    "avgDealValue" DECIMAL(12,2) NOT NULL,
    "dealsByStage" JSONB NOT NULL,
    "dealsByPipeline" JSONB NOT NULL,
    "dealsCreated" INTEGER NOT NULL DEFAULT 0,
    "dealsClosed" INTEGER NOT NULL DEFAULT 0,
    "dealsLost" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "DealSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivity" (
    "id" TEXT NOT NULL,
    "type" "UserActivityType" NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueSnapshot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "mrr" DECIMAL(12,2) NOT NULL,
    "arr" DECIMAL(12,2) NOT NULL,
    "totalOrganizations" INTEGER NOT NULL,
    "freeOrganizations" INTEGER NOT NULL,
    "proOrganizations" INTEGER NOT NULL,
    "churnedOrganizations" INTEGER NOT NULL DEFAULT 0,
    "newOrganizations" INTEGER NOT NULL DEFAULT 0,
    "avgLtv" DECIMAL(12,2),
    "avgCac" DECIMAL(12,2),
    "forecastNext30d" DECIMAL(12,2),
    "forecastNext60d" DECIMAL(12,2),
    "forecastNext90d" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT,

    CONSTRAINT "RevenueSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DealSnapshot_organizationId_date_idx" ON "DealSnapshot"("organizationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DealSnapshot_organizationId_date_key" ON "DealSnapshot"("organizationId", "date");

-- CreateIndex
CREATE INDEX "UserActivity_organizationId_createdAt_idx" ON "UserActivity"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "UserActivity_userId_createdAt_idx" ON "UserActivity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserActivity_type_createdAt_idx" ON "UserActivity"("type", "createdAt");

-- CreateIndex
CREATE INDEX "RevenueSnapshot_year_month_idx" ON "RevenueSnapshot"("year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueSnapshot_organizationId_year_month_key" ON "RevenueSnapshot"("organizationId", "year", "month");

-- AddForeignKey
ALTER TABLE "DealSnapshot" ADD CONSTRAINT "DealSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueSnapshot" ADD CONSTRAINT "RevenueSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
