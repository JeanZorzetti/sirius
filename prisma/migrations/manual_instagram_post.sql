-- Run this manually on the EasyPanel PostgreSQL database
-- or it will run automatically on next deploy via: prisma migrate deploy

CREATE TABLE IF NOT EXISTS "InstagramPost" (
  "id"           TEXT NOT NULL,
  "type"         TEXT NOT NULL,
  "caption"      TEXT NOT NULL,
  "hashtags"     TEXT NOT NULL,
  "altText"      TEXT NOT NULL,
  "imageUrls"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "slides"       TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "scheduledFor" TIMESTAMP(3) NOT NULL,
  "status"       TEXT NOT NULL DEFAULT 'pending',
  "postedAt"     TIMESTAMP(3),
  "error"        TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InstagramPost_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "InstagramPost_status_scheduledFor_idx"
  ON "InstagramPost"("status", "scheduledFor");
