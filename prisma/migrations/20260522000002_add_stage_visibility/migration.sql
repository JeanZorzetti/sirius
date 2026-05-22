-- AddColumn: stage visibility restrictions for users
ALTER TABLE "User" ADD COLUMN "stageRestricted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "allowedStageIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
