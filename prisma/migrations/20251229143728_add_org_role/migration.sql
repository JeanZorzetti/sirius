-- CreateEnum
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'MEMBER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "orgRole" "OrgRole" NOT NULL DEFAULT 'OWNER';
