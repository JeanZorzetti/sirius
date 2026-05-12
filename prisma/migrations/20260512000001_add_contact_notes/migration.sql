-- AddColumn Contact.notes
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "notes" TEXT;
