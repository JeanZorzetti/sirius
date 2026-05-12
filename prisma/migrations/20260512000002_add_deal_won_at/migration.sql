-- AlterTable: add wonAt field to Deal for sales history
ALTER TABLE "Deal" ADD COLUMN "wonAt" TIMESTAMP(3);
