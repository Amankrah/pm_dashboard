-- Phase 3: Activity.partnerType classifier for the Partner Narrative
-- Report's Collaboration Update section.
--
-- Backfills existing rows by matching known institution names. Rows that
-- the seed list does not cover stay NULL; the form will surface them with
-- "Unknown" and the admin can fill in via the detail page later.

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN "partnerType" TEXT;

-- Backfill: known Academic partners
UPDATE "Activity"
SET    "partnerType" = 'Academic'
WHERE  "partnerType" IS NULL
  AND  "partnerInstitution" IN (
    'Ashesi University',
    'Koforidua Technical University',
    'Kwame Nkrumah University of Science and Technology (KNUST)',
    'University of Environment and Sustainable Development',
    'University of Ghana',
    'University of Health and Allied Sciences (UHAS)'
  );

-- Backfill: known Industry partners
UPDATE "Activity"
SET    "partnerType" = 'Industry'
WHERE  "partnerType" IS NULL
  AND  "partnerInstitution" = 'Association of Ghana Industries';
