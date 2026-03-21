-- CreateTable
CREATE TABLE "DealClosing" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "dealId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealClosing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DealClosing_dealId_idx" ON "DealClosing"("dealId");

-- AddForeignKey
ALTER TABLE "DealClosing" ADD CONSTRAINT "DealClosing_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
