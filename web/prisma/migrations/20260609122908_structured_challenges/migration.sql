-- Phase 2: structured Challenges per the Partner Narrative Report's
-- "Programme Challenges and Barriers for Success" section.
--
-- Each Challenge belongs to a Submission and is tagged with a pillar so the
-- report's per-pillar challenge tables can be built directly. The legacy
-- Submission.challengesBarriers column is preserved for archival; new
-- submissions write structured rows here instead.

-- CreateTable
CREATE TABLE "Challenge" (
    "id"                  TEXT NOT NULL PRIMARY KEY,
    "submissionId"        TEXT NOT NULL,
    "pillar"              TEXT NOT NULL,
    "challenge"           TEXT NOT NULL,
    "contributingFactor"  TEXT,
    "responseApproach"    TEXT,
    "orderIndex"          INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Challenge_submissionId_fkey"
      FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Challenge_submissionId_idx" ON "Challenge"("submissionId");

-- CreateIndex
CREATE INDEX "Challenge_pillar_idx" ON "Challenge"("pillar");
