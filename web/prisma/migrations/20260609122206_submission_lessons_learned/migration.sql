-- Phase 1e: Submission.lessonsLearned
--
-- One nullable TEXT column on Submission, mapping directly to the Partner
-- Narrative Report's "Implementation Learning" section: free-text lessons
-- learned during the reporting period and how they might inform future
-- programming or adjustments.

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN "lessonsLearned" TEXT;
