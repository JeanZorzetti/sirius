-- Add product fields to DealClosing
ALTER TABLE "DealClosing" ADD COLUMN IF NOT EXISTS "productId" TEXT;
ALTER TABLE "DealClosing" ADD COLUMN IF NOT EXISTS "productName" TEXT;

-- FK optional (produto pode ser deletado depois)
ALTER TABLE "DealClosing" ADD CONSTRAINT "DealClosing_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
