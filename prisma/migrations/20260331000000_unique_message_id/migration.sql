-- Remove duplicate messages before adding unique constraint
-- Keep the earliest record (smallest sentAt) for each (organizationId, messageId) pair
DELETE FROM "WhatsAppMessage" a
USING "WhatsAppMessage" b
WHERE a."organizationId" = b."organizationId"
  AND a."messageId" = b."messageId"
  AND a."messageId" IS NOT NULL
  AND a.id > b.id;

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppMessage_organizationId_messageId_key" ON "WhatsAppMessage"("organizationId", "messageId");
