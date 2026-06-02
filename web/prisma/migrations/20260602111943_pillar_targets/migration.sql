-- CreateTable
CREATE TABLE "PillarTarget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periodKey" TEXT NOT NULL,
    "pillar" TEXT NOT NULL,
    "target" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PillarTarget_periodKey_pillar_key" ON "PillarTarget"("periodKey", "pillar");
