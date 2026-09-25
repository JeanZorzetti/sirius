-- Spec 011: account isolation. Additive only; safe on live data.

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "wabaAppSecret" TEXT;

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "autorUserId" TEXT,
    "autorEmail" TEXT NOT NULL,
    "autorTipo" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "alvo" TEXT NOT NULL,
    "formato" TEXT,
    "linhas" INTEGER,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_autorUserId_fkey" FOREIGN KEY ("autorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Nothing runs on its own anymore: agent actions waiting for auto-execution now wait for a human.
UPDATE "AgentAction" SET "status" = 'NEEDS_APPROVAL' WHERE "status" = 'PENDING';
