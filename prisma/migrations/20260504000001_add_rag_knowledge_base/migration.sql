-- Enable pgvector extension (already installed in Docker image)
CREATE EXTENSION IF NOT EXISTS vector;

-- KnowledgeDocument: stores raw documents uploaded by org admins
CREATE TABLE "KnowledgeDocument" (
    "id"             TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title"          TEXT NOT NULL,
    "content"        TEXT NOT NULL,
    "contentType"    TEXT NOT NULL,
    "metadata"       JSONB,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

-- KnowledgeChunk: text chunks with pgvector embeddings
CREATE TABLE "KnowledgeChunk" (
    "id"          TEXT NOT NULL,
    "documentId"  TEXT NOT NULL,
    "chunkIndex"  INTEGER NOT NULL,
    "text"        TEXT NOT NULL,
    "embedding"   vector(1536),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- Foreign keys
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_documentId_fkey"
    FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "KnowledgeDocument_organizationId_idx" ON "KnowledgeDocument"("organizationId");
CREATE INDEX "KnowledgeChunk_documentId_idx" ON "KnowledgeChunk"("documentId");

-- HNSW index for approximate nearest-neighbor cosine search
CREATE INDEX "KnowledgeChunk_embedding_hnsw_idx"
    ON "KnowledgeChunk" USING hnsw (embedding vector_cosine_ops);
