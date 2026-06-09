-- Phase 1d: per-activity participant disaggregation.
--
-- Eight nullable integer counts feeding the Mastercard Foundation Partner
-- Narrative Report's Overall Indicator Performance table. NULL = not
-- reported; 0 = explicitly zero. The Rural/Urban/Peri-Urban split is
-- derived from Activity.localeType (Phase 1c), not duplicated here.

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN "outreachCount"           INTEGER;
ALTER TABLE "Activity" ADD COLUMN "participantsTotal"       INTEGER;
ALTER TABLE "Activity" ADD COLUMN "participantsYouth"       INTEGER;
ALTER TABLE "Activity" ADD COLUMN "participantsWomen"       INTEGER;
ALTER TABLE "Activity" ADD COLUMN "participantsDisability"  INTEGER;
ALTER TABLE "Activity" ADD COLUMN "participantsRefugeeIdp"  INTEGER;
ALTER TABLE "Activity" ADD COLUMN "participantsYiW"         INTEGER;
ALTER TABLE "Activity" ADD COLUMN "participantsYiWWomen"    INTEGER;
