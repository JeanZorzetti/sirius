-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'STARTER', 'PRO', 'BUSINESS');

-- CreateEnum
CREATE TYPE "ScrapingProvider" AS ENUM ('OUTSCRAPER', 'APIFY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ScrapingSource" AS ENUM ('GOOGLE_MAPS', 'LINKEDIN', 'CUSTOM');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AddonType" AS ENUM ('SCRAPING_100', 'SCRAPING_500', 'WHATSAPP_EXTRA_INSTANCE');

-- CreateEnum
CREATE TYPE "AddonStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CONSUMED');

-- CreateEnum
CREATE TYPE "WhatsAppStatus" AS ENUM ('DISCONNECTED', 'CONNECTING', 'CONNECTED', 'FAILED');

-- CreateEnum
CREATE TYPE "DistributionStrategy" AS ENUM ('ROUND_ROBIN', 'LEAST_BUSY', 'WEIGHTED');

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedReason" TEXT;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "customPricing" DECIMAL(10,2),
ADD COLUMN     "customPricingExpiresAt" TIMESTAMP(3),
ADD COLUMN     "grandfatheredAt" TIMESTAMP(3),
ADD COLUMN     "grandfatheredDealLimit" INTEGER,
ADD COLUMN     "tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
ADD COLUMN     "whatsappInstances" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "ScrapingCredit" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "monthlyQuota" INTEGER NOT NULL DEFAULT 0,
    "usedThisMonth" INTEGER NOT NULL DEFAULT 0,
    "lastRefill" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScrapingCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapingJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "ScrapingProvider" NOT NULL,
    "source" "ScrapingSource" NOT NULL,
    "query" TEXT NOT NULL,
    "filters" JSONB,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "resultsCount" INTEGER NOT NULL DEFAULT 0,
    "results" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScrapingJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Addon" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "AddonType" NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "status" "AddonStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3),
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Addon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppConnection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "instanceName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "qrCode" TEXT,
    "status" "WhatsAppStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "apiKey" TEXT,
    "webhookUrl" TEXT,
    "connectedAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgiQuota" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "monthlyLimit" INTEGER NOT NULL,
    "usedThisMonth" INTEGER NOT NULL DEFAULT 0,
    "lastReset" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgiQuota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadDistributionRule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "strategy" "DistributionStrategy" NOT NULL DEFAULT 'ROUND_ROBIN',
    "filters" JSONB NOT NULL,
    "assignees" TEXT[],
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadDistributionRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScrapingCredit_organizationId_key" ON "ScrapingCredit"("organizationId");

-- CreateIndex
CREATE INDEX "ScrapingCredit_organizationId_idx" ON "ScrapingCredit"("organizationId");

-- CreateIndex
CREATE INDEX "ScrapingJob_organizationId_status_idx" ON "ScrapingJob"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ScrapingJob_status_idx" ON "ScrapingJob"("status");

-- CreateIndex
CREATE INDEX "ScrapingJob_createdAt_idx" ON "ScrapingJob"("createdAt");

-- CreateIndex
CREATE INDEX "Addon_organizationId_idx" ON "Addon"("organizationId");

-- CreateIndex
CREATE INDEX "Addon_status_idx" ON "Addon"("status");

-- CreateIndex
CREATE INDEX "WhatsAppConnection_organizationId_idx" ON "WhatsAppConnection"("organizationId");

-- CreateIndex
CREATE INDEX "WhatsAppConnection_status_idx" ON "WhatsAppConnection"("status");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppConnection_organizationId_instanceName_key" ON "WhatsAppConnection"("organizationId", "instanceName");

-- CreateIndex
CREATE UNIQUE INDEX "AgiQuota_organizationId_key" ON "AgiQuota"("organizationId");

-- CreateIndex
CREATE INDEX "AgiQuota_organizationId_idx" ON "AgiQuota"("organizationId");

-- CreateIndex
CREATE INDEX "LeadDistributionRule_organizationId_idx" ON "LeadDistributionRule"("organizationId");

-- CreateIndex
CREATE INDEX "LeadDistributionRule_enabled_idx" ON "LeadDistributionRule"("enabled");

-- AddForeignKey
ALTER TABLE "ScrapingCredit" ADD CONSTRAINT "ScrapingCredit_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapingJob" ADD CONSTRAINT "ScrapingJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Addon" ADD CONSTRAINT "Addon_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppConnection" ADD CONSTRAINT "WhatsAppConnection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgiQuota" ADD CONSTRAINT "AgiQuota_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDistributionRule" ADD CONSTRAINT "LeadDistributionRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
