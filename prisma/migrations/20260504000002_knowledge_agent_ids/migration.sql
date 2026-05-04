-- Add agentIds array to KnowledgeDocument for N:N agent association
-- Empty array = global (accessible to all agents)
ALTER TABLE "KnowledgeDocument" ADD COLUMN "agentIds" TEXT[] NOT NULL DEFAULT '{}';
