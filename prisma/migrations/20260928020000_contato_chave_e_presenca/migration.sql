-- Spec 015: phone key for matching contacts and last time a user opened the app
ALTER TABLE "Contact" ADD COLUMN "phoneKey" TEXT;
CREATE INDEX "Contact_organizationId_phoneKey_idx" ON "Contact"("organizationId", "phoneKey");
ALTER TABLE "User" ADD COLUMN "lastSeenAt" TIMESTAMP(3);

-- Backfill with the same rule as lib/whatsapp/telefone.ts#chaveTelefone:
-- digits; add 55 to a 10/11-digit number written without "+"; a Brazilian number becomes 55 + DDD + last 8.
WITH d AS (
  SELECT id,
         CASE WHEN btrim(phone) LIKE '+%' THEN regexp_replace(phone, '[^0-9]', '', 'g')
              WHEN length(regexp_replace(phone, '[^0-9]', '', 'g')) IN (10, 11) THEN '55' || regexp_replace(phone, '[^0-9]', '', 'g')
              ELSE regexp_replace(phone, '[^0-9]', '', 'g') END AS dig
  FROM "Contact" WHERE phone IS NOT NULL
)
UPDATE "Contact" c
SET "phoneKey" = CASE
      WHEN d.dig = '' THEN NULL
      WHEN d.dig LIKE '55%' AND length(d.dig) IN (12, 13) THEN '55' || substr(d.dig, 3, 2) || right(d.dig, 8)
      ELSE d.dig END
FROM d WHERE d.id = c.id;
