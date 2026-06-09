import { prisma } from "@/lib/db";
import type { AnalyticsBundle, FlatActivity, SubmissionRow } from "@/lib/analytics/types";

export async function loadAnalyticsBundle(): Promise<AnalyticsBundle> {
  const rows = await prisma.submission.findMany({
    orderBy: { submittedAt: "desc" },
    include: {
      period: {
        select: {
          id: true,
          label: true,
          reportKey: true,
          programYear: true,
          quarter: true,
        },
      },
      activities: {
        include: {
          themes: true,
          collaborators: true,
        },
      },
    },
  });

  const submissions: SubmissionRow[] = rows.map((s) => {
    const activities: FlatActivity[] = s.activities.map((a) => ({
      id: a.id,
      title: a.title,
      status: a.status,
      themes: a.themes.map((t) => t.theme),
      activityType: a.activityType,
      location: a.location,
      localeType: a.localeType,
      description: a.description,
      startDate: a.startDate,
      endDate: a.endDate,
      partnerType: a.partnerType,
      partnerInstitution: a.partnerInstitution,
      contactName: a.contactName,
      contactEmail: a.contactEmail,
      outputs: a.outputs,
      counts: {
        outreachCount: a.outreachCount,
        participantsTotal: a.participantsTotal,
        participantsYouth: a.participantsYouth,
        participantsWomen: a.participantsWomen,
        participantsYiW: a.participantsYiW,
        participantsYiWWomen: a.participantsYiWWomen,
        participantsDisability: a.participantsDisability,
        participantsRefugeeIdp: a.participantsRefugeeIdp,
      },
      collaborators: a.collaborators.map((c) => ({
        name: c.name,
        faculty: c.faculty,
        email: c.email,
      })),
      submission: {
        id: s.id,
        fullName: s.fullName,
        email: s.email,
        faculty: s.faculty,
        department: s.department,
        position: s.position,
        submissionDate: s.submissionDate,
        periodId: s.periodId,
        periodLabel: s.period.label,
        periodReportKey: s.period.reportKey,
        periodProgramYear: s.period.programYear,
        periodQuarter: s.period.quarter,
      },
    }));

    return {
      id: s.id,
      fullName: s.fullName,
      email: s.email,
      faculty: s.faculty,
      department: s.department,
      position: s.position,
      submissionDate: s.submissionDate,
      submittedAt: s.submittedAt.toISOString(),
      periodId: s.periodId,
      periodLabel: s.period.label,
      periodReportKey: s.period.reportKey,
      periodProgramYear: s.period.programYear,
      periodQuarter: s.period.quarter,
      resourcesNeeded: s.resourcesNeeded,
      collaborationOpportunities: s.collaborationOpportunities,
      challengesBarriers: s.challengesBarriers,
      lessonsLearned: s.lessonsLearned,
      outcomesAchievements: s.outcomesAchievements,
      activities,
    };
  });

  const activities = submissions.flatMap((s) => s.activities);

  return {
    submissions,
    activities,
    submissionCount: submissions.length,
  };
}
