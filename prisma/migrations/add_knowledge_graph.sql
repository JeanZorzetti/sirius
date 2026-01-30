-- Knowledge Graph Schema Migration
-- Adds Entity, Relationship, EntityExtraction, and ContentEntity tables

-- Entity table: Represents nodes in the knowledge graph
CREATE TABLE "Entity" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "wikidataId" TEXT, -- Wikidata Q-code (ex: Q16635046 for CRM)
  "type" TEXT NOT NULL, -- Category: methodology, technology, industry, etc.
  "description" TEXT,
  "aliases" TEXT[], -- Alternative names/synonyms
  "metadata" JSONB DEFAULT '{}', -- Flexible metadata storage
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Relationship table: Represents edges in the knowledge graph (RDF triples)
CREATE TABLE "Relationship" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "subjectId" TEXT NOT NULL,
  "predicate" TEXT NOT NULL, -- uses, usedBy, subclassOf, etc.
  "objectId" TEXT NOT NULL,
  "confidence" DOUBLE PRECISION DEFAULT 1.0, -- 0-1, for AI-extracted relationships
  "source" TEXT, -- URL or reference of content that originated this relationship
  "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, -- Freshness tracking
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  FOREIGN KEY ("subjectId") REFERENCES "Entity"("id") ON DELETE CASCADE,
  FOREIGN KEY ("objectId") REFERENCES "Entity"("id") ON DELETE CASCADE
);

-- EntityExtraction table: Tracks NLP pipeline executions
CREATE TABLE "EntityExtraction" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "contentType" TEXT NOT NULL, -- blog_post, documentation, help_article, etc.
  "contentId" TEXT, -- ID of the content (if applicable)
  "contentUrl" TEXT, -- URL or path to content
  "textSample" TEXT, -- First 500 chars of processed text
  "extractedEntities" JSONB DEFAULT '[]', -- Array of extracted entity data
  "extractedRelationships" JSONB DEFAULT '[]', -- Array of extracted relationships
  "modelUsed" TEXT, -- LLM model identifier (ex: llama-3.3-70b-versatile)
  "tokensUsed" INTEGER,
  "processingTimeMs" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3)
);

-- ContentEntity table: Many-to-many relationship between content and entities
CREATE TABLE "ContentEntity" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "contentType" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "relevance" DOUBLE PRECISION DEFAULT 1.0, -- How relevant this entity is to the content
  "context" TEXT, -- Sentence/paragraph where entity was found
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE
);

-- Indexes for performance
CREATE UNIQUE INDEX "Entity_wikidataId_key" ON "Entity"("wikidataId") WHERE "wikidataId" IS NOT NULL;
CREATE INDEX "Entity_type_idx" ON "Entity"("type");
CREATE INDEX "Entity_name_idx" ON "Entity"("name");
CREATE INDEX "Relationship_subjectId_idx" ON "Relationship"("subjectId");
CREATE INDEX "Relationship_objectId_idx" ON "Relationship"("objectId");
CREATE INDEX "Relationship_predicate_idx" ON "Relationship"("predicate");
CREATE INDEX "Relationship_lastSeen_idx" ON "Relationship"("lastSeen");
CREATE INDEX "EntityExtraction_status_idx" ON "EntityExtraction"("status");
CREATE INDEX "EntityExtraction_contentType_idx" ON "EntityExtraction"("contentType");
CREATE INDEX "ContentEntity_contentId_idx" ON "ContentEntity"("contentId");
CREATE INDEX "ContentEntity_entityId_idx" ON "ContentEntity"("entityId");

-- Composite index for relationship uniqueness
CREATE UNIQUE INDEX "Relationship_triple_idx" ON "Relationship"("subjectId", "predicate", "objectId");

-- Full-text search index on Entity name and description
CREATE INDEX "Entity_name_trgm_idx" ON "Entity" USING gin (name gin_trgm_ops);
CREATE INDEX "Entity_description_trgm_idx" ON "Entity" USING gin (description gin_trgm_ops);

-- Enable pg_trgm extension for fuzzy text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
