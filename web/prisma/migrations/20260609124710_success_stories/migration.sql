-- Phase 4: Success Stories with explicit participant consent.
--
-- Maps to Section 6 of the Mastercard Foundation Partner Narrative Report.
-- The consent flag mirrors the docx's signature checkbox; when consent is
-- false the participantName MUST stay NULL (application-layer rule).

-- CreateTable
CREATE TABLE "SuccessStory" (
    "id"              TEXT NOT NULL PRIMARY KEY,
    "submissionId"    TEXT NOT NULL,
    "participantName" TEXT,
    "programActivity" TEXT NOT NULL,
    "location"        TEXT,
    "story"           TEXT NOT NULL,
    "outcomes"        TEXT,
    "photoUrl"        TEXT,
    "consent"         BOOLEAN NOT NULL DEFAULT false,
    "orderIndex"      INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "SuccessStory_submissionId_fkey"
      FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SuccessStory_submissionId_idx" ON "SuccessStory"("submissionId");
