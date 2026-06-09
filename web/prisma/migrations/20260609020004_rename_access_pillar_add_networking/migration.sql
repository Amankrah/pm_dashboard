-- Rename legacy "Access and Success" pillar label to "Access" everywhere the
-- string is stored as data. The Pillar enum is enforced application-side
-- (zod + TypeScript types) so no schema column change is required.

-- ActivityTheme.theme: composite PK is (activityId, theme). Update is safe
-- because no row currently exists with theme = "Access" (the new label was
-- never written before this migration).
UPDATE "ActivityTheme"
SET    "theme" = 'Access'
WHERE  "theme" = 'Access and Success';

-- PillarTarget.pillar: targets keyed by the old label must follow the rename
-- so the dashboard's Targets view continues to resolve them.
UPDATE "PillarTarget"
SET    "pillar" = 'Access'
WHERE  "pillar" = 'Access and Success';
