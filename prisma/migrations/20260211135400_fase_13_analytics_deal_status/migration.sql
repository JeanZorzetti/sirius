-- CreateEnum: DealStatus (ACTIVE, WON, LOST)
CREATE TYPE "DealStatus" AS ENUM ('ACTIVE', 'WON', 'LOST');

-- AlterTable: Add status column to Deal (default ACTIVE - safe for existing data)
ALTER TABLE "Deal" ADD COLUMN "status" "DealStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable: Add lostReason column to Deal (nullable - safe for existing data)
ALTER TABLE "Deal" ADD COLUMN "lostReason" TEXT;

-- Comment
COMMENT ON COLUMN "Deal"."status" IS 'Status do deal: ACTIVE (ativo no pipeline), WON (ganho), LOST (perdido)';
COMMENT ON COLUMN "Deal"."lostReason" IS 'Motivo da perda (ex: preço, timing, concorrente)';
