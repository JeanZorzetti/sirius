-- CreateEnum
CREATE TYPE "PWAMetricType" AS ENUM ('INSTALL_PROMPT_SHOWN', 'INSTALL_PROMPT_ACCEPTED', 'INSTALL_PROMPT_DISMISSED', 'APP_INSTALLED', 'PUSH_PERMISSION_GRANTED', 'PUSH_PERMISSION_DENIED', 'OFFLINE_SYNC_SUCCESS', 'OFFLINE_SYNC_FAILURE', 'SERVICE_WORKER_UPDATED');

-- CreateTable
CREATE TABLE "PWAMetric" (
    "id" TEXT NOT NULL,
    "type" "PWAMetricType" NOT NULL,
    "userId" TEXT,
    "userAgent" TEXT,
    "deviceType" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "PWAMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PWAMetric_organizationId_type_idx" ON "PWAMetric"("organizationId", "type");

-- CreateIndex
CREATE INDEX "PWAMetric_organizationId_createdAt_idx" ON "PWAMetric"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "PWAMetric_userId_idx" ON "PWAMetric"("userId");

-- AddForeignKey
ALTER TABLE "PWAMetric" ADD CONSTRAINT "PWAMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PWAMetric" ADD CONSTRAINT "PWAMetric_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
