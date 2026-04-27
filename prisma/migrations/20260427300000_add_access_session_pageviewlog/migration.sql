-- CreateTable
CREATE TABLE "AccessSession" (
    "id" TEXT NOT NULL,
    "loginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logoutAt" TIMESTAMP(3),
    "durationS" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "AccessSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageViewLog" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "pageTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "PageViewLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccessSession_userId_loginAt_idx" ON "AccessSession"("userId", "loginAt");

-- CreateIndex
CREATE INDEX "AccessSession_organizationId_loginAt_idx" ON "AccessSession"("organizationId", "loginAt");

-- CreateIndex
CREATE INDEX "PageViewLog_organizationId_createdAt_idx" ON "PageViewLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "PageViewLog_organizationId_path_idx" ON "PageViewLog"("organizationId", "path");

-- CreateIndex
CREATE INDEX "PageViewLog_userId_createdAt_idx" ON "PageViewLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AccessSession" ADD CONSTRAINT "AccessSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessSession" ADD CONSTRAINT "AccessSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageViewLog" ADD CONSTRAINT "PageViewLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PageViewLog" ADD CONSTRAINT "PageViewLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
