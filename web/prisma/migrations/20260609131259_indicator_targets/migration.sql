-- Phase 6: per-indicator annual targets feeding the Partner Narrative
-- Report's "Annual Target" column on the Overall Indicator Performance
-- table. One row per (indicator, programYear) pair.

-- CreateTable
CREATE TABLE "IndicatorTarget" (
    "id"          TEXT NOT NULL PRIMARY KEY,
    "indicator"   TEXT NOT NULL,
    "programYear" INTEGER NOT NULL,
    "target"      INTEGER NOT NULL DEFAULT 0,
    "updatedAt"   DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "IndicatorTarget_indicator_programYear_key"
  ON "IndicatorTarget"("indicator", "programYear");

-- CreateIndex
CREATE INDEX "IndicatorTarget_programYear_idx"
  ON "IndicatorTarget"("programYear");
