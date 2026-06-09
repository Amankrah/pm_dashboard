-- Phase 1b: quarterly cadence for ReportingPeriod.
--
-- Adds three nullable columns:
--   programYear INTEGER  e.g. 1, 2, 3 (year of the Nkabom programme)
--   quarter     INTEGER  1..4
--   reportKey   TEXT     canonical sortable id, e.g. "Y2Q3"; UNIQUE when set
--
-- Backfills any pre-existing row with a sensible default. The dev fixture row
-- ("Academic Year 2025-26") is mapped to Y2Q3 so the dashboard immediately
-- reflects the new cadence. NULLs are allowed during the transition so the
-- migration stays reversible.

-- AlterTable
ALTER TABLE "ReportingPeriod" ADD COLUMN "programYear" INTEGER;
ALTER TABLE "ReportingPeriod" ADD COLUMN "quarter" INTEGER;
ALTER TABLE "ReportingPeriod" ADD COLUMN "reportKey" TEXT;

-- Backfill: legacy dev row maps to Y2Q3
UPDATE "ReportingPeriod"
SET    "programYear" = 2,
       "quarter"     = 3,
       "reportKey"   = 'Y2Q3'
WHERE  "reportKey" IS NULL
  AND  "slug" = 'ay-2025-26';

-- Unique index on reportKey (NULLs allowed and not deduplicated in SQLite)
CREATE UNIQUE INDEX "ReportingPeriod_reportKey_key" ON "ReportingPeriod"("reportKey");
