-- Phase 1c: report-aligned activity descriptors.
--
-- activityType : Training / Workshop / Meeting / Event / Course / Mentorship
--                / Outreach / Research / Other
-- location     : free text place name(s)
-- localeType   : Rural / Urban / Peri-Urban / Mixed
--
-- All three are nullable. Legacy Activity rows stay valid (the form will
-- treat them as "not specified"). New submissions are not retroactively
-- backfilled; the form will require activityType going forward.

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN "activityType" TEXT;
ALTER TABLE "Activity" ADD COLUMN "location"     TEXT;
ALTER TABLE "Activity" ADD COLUMN "localeType"   TEXT;
