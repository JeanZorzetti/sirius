-- Add missing Deal columns that exist in schema but were never migrated

ALTER TABLE "Deal" ADD COLUMN IF NOT EXISTS "dueDateNote" TEXT;
ALTER TABLE "Deal" ADD COLUMN IF NOT EXISTS "observations" TEXT;
ALTER TABLE "Deal" ADD COLUMN IF NOT EXISTS "productId" TEXT;

-- Foreign key for productId -> Product
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Deal_productId_fkey'
  ) THEN
    ALTER TABLE "Deal" ADD CONSTRAINT "Deal_productId_fkey"
      FOREIGN KEY ("productId") REFERENCES "Product"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END$$;
