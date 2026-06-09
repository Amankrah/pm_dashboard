-- Phase 8: Outcome Level Progress per Section 4 of the Partner Narrative
-- Report. Mirrors the Output tables in shape; separate namespace because
-- the indicator vocabularies (YiW, enterprise revenue change, dignified
-- jobs %) are distinct from the output indicators.

-- CreateTable
CREATE TABLE "OutcomeIndicatorTarget" (
    "id"          TEXT NOT NULL PRIMARY KEY,
    "pillar"      TEXT NOT NULL,
    "indicator"   TEXT NOT NULL,
    "programYear" INTEGER NOT NULL,
    "target"      INTEGER NOT NULL DEFAULT 0,
    "updatedAt"   DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "OutcomeIndicatorTarget_pillar_indicator_programYear_key"
  ON "OutcomeIndicatorTarget"("pillar", "indicator", "programYear");

-- CreateIndex
CREATE INDEX "OutcomeIndicatorTarget_programYear_idx"
  ON "OutcomeIndicatorTarget"("programYear");

-- CreateTable
CREATE TABLE "OutcomeIndicatorEntry" (
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
CREATE UNIQUE INDEX "OutcomeIndicatorEntry_pillar_indicator_programYear_quarter_key"
  ON "OutcomeIndicatorEntry"("pillar", "indicator", "programYear", "quarter");

-- CreateIndex
CREATE INDEX "OutcomeIndicatorEntry_programYear_quarter_idx"
  ON "OutcomeIndicatorEntry"("programYear", "quarter");
