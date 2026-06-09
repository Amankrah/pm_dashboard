-- Phase 9: Program Adjustments per Section 3 of the docx. Three tables:
-- WorkplanAdjustment (rows), Risk (rows), AdjustmentsNarrative (singleton
-- per quarter for the upcoming-activities free text).

-- CreateTable
CREATE TABLE "WorkplanAdjustment" (
    "id"           TEXT NOT NULL PRIMARY KEY,
    "programYear"  INTEGER NOT NULL,
    "quarter"      INTEGER NOT NULL,
    "initialPlan"  TEXT NOT NULL,
    "change"       TEXT NOT NULL,
    "reason"       TEXT,
    "implications" TEXT,
    "orderIndex"   INTEGER NOT NULL DEFAULT 0,
    "updatedAt"    DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "WorkplanAdjustment_programYear_quarter_idx"
  ON "WorkplanAdjustment"("programYear", "quarter");

-- CreateTable
CREATE TABLE "Risk" (
    "id"          TEXT NOT NULL PRIMARY KEY,
    "programYear" INTEGER NOT NULL,
    "quarter"     INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "response"    TEXT,
    "orderIndex"  INTEGER NOT NULL DEFAULT 0,
    "updatedAt"   DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "Risk_programYear_quarter_idx"
  ON "Risk"("programYear", "quarter");

-- CreateTable
CREATE TABLE "AdjustmentsNarrative" (
    "id"                 TEXT NOT NULL PRIMARY KEY,
    "programYear"        INTEGER NOT NULL,
    "quarter"            INTEGER NOT NULL,
    "upcomingActivities" TEXT,
    "updatedAt"          DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "AdjustmentsNarrative_programYear_quarter_key"
  ON "AdjustmentsNarrative"("programYear", "quarter");
