-- CreateTable
CREATE TABLE "CustomSegment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomSegment_organizationId_name_key" ON "CustomSegment"("organizationId", "name");

-- CreateIndex
CREATE INDEX "CustomSegment_organizationId_idx" ON "CustomSegment"("organizationId");

-- AddForeignKey
ALTER TABLE "CustomSegment" ADD CONSTRAINT "CustomSegment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomSegment" ADD CONSTRAINT "CustomSegment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: para cada (orgId, segment) distinto nos contatos, criar um CustomSegment
INSERT INTO "CustomSegment" ("id", "name", "organizationId", "createdAt")
SELECT
    gen_random_uuid()::text,
    TRIM(c."segment"),
    c."organizationId",
    NOW()
FROM "Contact" c
WHERE c."segment" IS NOT NULL AND TRIM(c."segment") <> ''
GROUP BY c."organizationId", TRIM(c."segment")
ON CONFLICT ("organizationId", "name") DO NOTHING;
