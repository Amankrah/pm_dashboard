import { prisma } from "@/lib/db";
import type { SubmissionPayload } from "@/lib/validation";

export async function createSubmissionFromPayload(
  periodId: string,
  inviteId: string | null,
  payload: SubmissionPayload,
) {
  const { respondent, activities, challenges, additional } = payload;

  return prisma.$transaction(async (tx) => {
    const submission = await tx.submission.create({
      data: {
        periodId,
        inviteId,
        fullName: respondent.full_name,
        email: respondent.email,
        faculty: respondent.faculty,
        department: respondent.department,
        position: respondent.position,
        submissionDate: respondent.submission_date,
        resourcesNeeded: additional?.resources_needed ?? null,
        collaborationOpportunities:
          additional?.collaboration_opportunities ?? null,
        challengesBarriers: additional?.challenges_barriers ?? null,
        lessonsLearned: additional?.lessons_learned ?? null,
        outcomesAchievements: additional?.outcomes_achievements ?? null,
        otherInformation: additional?.other_information ?? null,
        activities: {
          create: activities.map((act) => ({
            title: act.title,
            status: act.status,
            activityType: act.activity_type ?? null,
            location: act.location ?? null,
            localeType: act.locale_type ?? null,
            outreachCount: act.outreach_count ?? null,
            participantsTotal: act.participants_total ?? null,
            participantsYouth: act.participants_youth ?? null,
            participantsWomen: act.participants_women ?? null,
            participantsYiW: act.participants_yiw ?? null,
            participantsYiWWomen: act.participants_yiw_women ?? null,
            participantsDisability: act.participants_disability ?? null,
            participantsRefugeeIdp: act.participants_refugee_idp ?? null,
            description: act.description ?? null,
            startDate: act.start_date ?? null,
            endDate: act.end_date ?? null,
            partnerType: act.partner_type ?? null,
            partnerInstitution: act.partner_institution,
            contactName: act.contact_name,
            contactEmail: act.contact_email,
            outputs: act.outputs ?? null,
            themes: {
              create: act.themes.map((theme) => ({ theme })),
            },
            collaborators: {
              create: (act.collaborators ?? [])
                .filter((c) => c.name)
                .map((c) => ({
                  name: c.name,
                  faculty: c.faculty ?? null,
                  email: c.email ?? null,
                })),
            },
          })),
        },
        challenges: {
          create: (challenges ?? [])
            .filter((c) => c.challenge.trim().length > 0)
            .map((c, idx) => ({
              pillar: c.pillar,
              challenge: c.challenge,
              contributingFactor: c.contributing_factor?.trim() || null,
              responseApproach: c.response_approach?.trim() || null,
              orderIndex: idx,
            })),
        },
      },
      include: {
        activities: { include: { themes: true, collaborators: true } },
        challenges: true,
      },
    });

    if (inviteId) {
      await tx.formInvite.update({
        where: { id: inviteId },
        data: { submittedAt: new Date() },
      });
    }

    return submission;
  });
}

export function slugify(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}
