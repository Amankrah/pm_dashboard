-- CreateTable
CREATE TABLE "AllowedUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ReportingPeriod" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "startDate" TEXT,
    "endDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FormInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "email" TEXT,
    "fullName" TEXT,
    "faculty" TEXT,
    "expiresAt" DATETIME,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FormInvite_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "ReportingPeriod" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "periodId" TEXT NOT NULL,
    "inviteId" TEXT,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "faculty" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "submissionDate" TEXT NOT NULL,
    "resourcesNeeded" TEXT,
    "collaborationOpportunities" TEXT,
    "challengesBarriers" TEXT,
    "outcomesAchievements" TEXT,
    "otherInformation" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Submission_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "ReportingPeriod" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Submission_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "FormInvite" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TEXT,
    "endDate" TEXT,
    "partnerInstitution" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "outputs" TEXT,
    CONSTRAINT "Activity_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityTheme" (
    "activityId" TEXT NOT NULL,
    "theme" TEXT NOT NULL,

    PRIMARY KEY ("activityId", "theme"),
    CONSTRAINT "ActivityTheme_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Collaborator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "faculty" TEXT,
    "email" TEXT,
    CONSTRAINT "Collaborator_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AllowedUser_email_key" ON "AllowedUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ReportingPeriod_slug_key" ON "ReportingPeriod"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FormInvite_token_key" ON "FormInvite"("token");

-- CreateIndex
CREATE INDEX "FormInvite_periodId_idx" ON "FormInvite"("periodId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_inviteId_key" ON "Submission"("inviteId");

-- CreateIndex
CREATE INDEX "Submission_periodId_idx" ON "Submission"("periodId");

-- CreateIndex
CREATE INDEX "Submission_email_idx" ON "Submission"("email");

-- CreateIndex
CREATE INDEX "Activity_submissionId_idx" ON "Activity"("submissionId");

-- CreateIndex
CREATE INDEX "Collaborator_activityId_idx" ON "Collaborator"("activityId");
