-- DropForeignKey
ALTER TABLE "ConversationMessage" DROP CONSTRAINT "ConversationMessage_sessionId_fkey";

-- AlterTable
ALTER TABLE "ConversationSession" ADD COLUMN     "diagnosticMode" TEXT NOT NULL DEFAULT 'complete';

-- CreateTable
CREATE TABLE "Entity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wikidataId" TEXT,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Relationship" (
    "id" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "predicate" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "source" TEXT,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityExtraction" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT,
    "contentUrl" TEXT,
    "textSample" TEXT,
    "contentHash" TEXT,
    "extractedEntities" JSONB NOT NULL DEFAULT '[]',
    "extractedRelationships" JSONB NOT NULL DEFAULT '[]',
    "modelUsed" TEXT,
    "tokensUsed" INTEGER,
    "processingTimeMs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "EntityExtraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentEntity" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "relevance" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "context" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentVariant" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "componentName" TEXT NOT NULL,
    "props" JSONB NOT NULL,
    "trafficWeight" INTEGER NOT NULL DEFAULT 50,

    CONSTRAINT "ExperimentVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperimentEvent" (
    "id" TEXT NOT NULL,
    "experimentId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExperimentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Entity_wikidataId_key" ON "Entity"("wikidataId");

-- CreateIndex
CREATE INDEX "Entity_type_idx" ON "Entity"("type");

-- CreateIndex
CREATE INDEX "Entity_name_idx" ON "Entity"("name");

-- CreateIndex
CREATE INDEX "Relationship_subjectId_idx" ON "Relationship"("subjectId");

-- CreateIndex
CREATE INDEX "Relationship_objectId_idx" ON "Relationship"("objectId");

-- CreateIndex
CREATE INDEX "Relationship_predicate_idx" ON "Relationship"("predicate");

-- CreateIndex
CREATE INDEX "Relationship_lastSeen_idx" ON "Relationship"("lastSeen");

-- CreateIndex
CREATE UNIQUE INDEX "Relationship_subjectId_predicate_objectId_key" ON "Relationship"("subjectId", "predicate", "objectId");

-- CreateIndex
CREATE INDEX "EntityExtraction_status_idx" ON "EntityExtraction"("status");

-- CreateIndex
CREATE INDEX "EntityExtraction_contentType_idx" ON "EntityExtraction"("contentType");

-- CreateIndex
CREATE INDEX "EntityExtraction_contentId_contentHash_idx" ON "EntityExtraction"("contentId", "contentHash");

-- CreateIndex
CREATE INDEX "ContentEntity_contentId_idx" ON "ContentEntity"("contentId");

-- CreateIndex
CREATE INDEX "ContentEntity_entityId_idx" ON "ContentEntity"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Experiment_name_key" ON "Experiment"("name");

-- CreateIndex
CREATE INDEX "Experiment_organizationId_status_idx" ON "Experiment"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Experiment_status_idx" ON "Experiment"("status");

-- CreateIndex
CREATE INDEX "ExperimentVariant_experimentId_idx" ON "ExperimentVariant"("experimentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperimentVariant_experimentId_name_key" ON "ExperimentVariant"("experimentId", "name");

-- CreateIndex
CREATE INDEX "ExperimentEvent_experimentId_variantId_eventType_idx" ON "ExperimentEvent"("experimentId", "variantId", "eventType");

-- CreateIndex
CREATE INDEX "ExperimentEvent_sessionId_idx" ON "ExperimentEvent"("sessionId");

-- CreateIndex
CREATE INDEX "ExperimentEvent_timestamp_idx" ON "ExperimentEvent"("timestamp");

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relationship" ADD CONSTRAINT "Relationship_objectId_fkey" FOREIGN KEY ("objectId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentEntity" ADD CONSTRAINT "ContentEntity_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ConversationSession"("sessionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experiment" ADD CONSTRAINT "Experiment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentVariant" ADD CONSTRAINT "ExperimentVariant_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentEvent" ADD CONSTRAINT "ExperimentEvent_experimentId_fkey" FOREIGN KEY ("experimentId") REFERENCES "Experiment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperimentEvent" ADD CONSTRAINT "ExperimentEvent_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ExperimentVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
