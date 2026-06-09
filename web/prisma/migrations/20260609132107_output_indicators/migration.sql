-- Phase 7: Output Level Progress per Section 4 of the Partner Narrative
-- Report. Two tables: annual targets and quarterly entries.

-- CreateTable
CREATE TABLE "OutputIndicatorTarget" (
    "id"          TEXT NOT NULL PRIMARY KEY,
    "pillar"      TEXT NOT NULL,
    "indicator"   TEXT NOT NULL,
    "programYear" INTEGER NOT NULL,
    "target"      INTEGER NOT NULL DEFAULT 0,
    "updatedAt"   DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "OutputIndicatorTarget_pillar_indicator_programYear_key"
  ON "OutputIndicatorTarget"("pillar", "indicator", "programYear");

-- CreateIndex
CREATE INDEX "OutputIndicatorTarget_programYear_idx"
  ON "OutputIndicatorTarget"("programYear");

-- CreateTable
CREATE TABLE "OutputIndicatorEntry" (
    "id"          TEXT NOT NULL PRIMARY KEY,
    "pillar"      TEXT NOT NULL,
    "indicator"   TEXT NOT NULL,
    "programYear" INTEGER NOT NULL,
    "quarter"     INTEGER NOT NULL,
    "value"       INTEGER NOT NULL DEFAULT 0,
    "comments"    TEXT,
    "updatedAt"   DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "OutputIndicatorEntry_pillar_indicator_programYear_quarter_key"
  ON "OutputIndicatorEntry"("pillar", "indicator", "programYear", "quarter");

-- CreateIndex
CREATE INDEX "OutputIndicatorEntry_programYear_quarter_idx"
  ON "OutputIndicatorEntry"("programYear", "quarter");
