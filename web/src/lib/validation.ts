import { z } from "zod";

// Activity tags: the four pillars plus the "Other" catchall. "Other" is a
// valid tag but never appears in pillar rollups (see lib/constants.ts).
const themeTagEnum = z.enum([
  "Education",
  "Access",
  "Entrepreneurship",
  "Networking",
  "Other",
]);

const statusEnum = z.enum(["Completed", "Ongoing", "Planned"]);

// Phase 1c report-aligned activity descriptors. Optional in the schema for
// backward compatibility, but enforced in the form for new submissions.
const activityTypeEnum = z.enum([
  "Training",
  "Workshop",
  "Meeting",
  "Event",
  "Course",
  "Mentorship",
  "Outreach",
  "Research",
  "Other",
]);

const localeTypeEnum = z.enum(["Rural", "Urban", "Peri-Urban", "Mixed"]);

// Phase 3: partner type classifier.
const partnerTypeEnum = z.enum([
  "Academic",
  "Industry",
  "Community Organization",
  "Government",
  "Other",
]);

// Phase 2: structured Challenges per the Partner Narrative Report. Tagged
// with the same pillar vocabulary used by activity themes (plus Other).
const challengePillarEnum = z.enum([
  "Education",
  "Access",
  "Entrepreneurship",
  "Networking",
  "Other",
]);

export const challengeSchema = z.object({
  pillar: challengePillarEnum,
  challenge: z.string().min(1),
  contributing_factor: z.string().optional(),
  response_approach: z.string().optional(),
});

// Phase 4: Success Stories. Hard rule: participant_name is null unless
// consent is true. We accept input either way but normalise here.
export const successStorySchema = z
  .object({
    participant_name: z.string().optional(),
    program_activity: z.string().min(1),
    location: z.string().optional(),
    story: z.string().min(1),
    outcomes: z.string().optional(),
    photo_url: z.string().url().optional().or(z.literal("").transform(() => undefined)),
    consent: z.boolean(),
  })
  .transform((v) => ({
    ...v,
    // Privacy guard: drop the name if the participant did not consent.
    participant_name: v.consent ? v.participant_name?.trim() || undefined : undefined,
  }));

// Phase 1d: participant counts. Each is a non-negative integer or absent.
// "absent" maps to NULL in the DB ("not reported"); 0 is preserved as 0
// ("explicitly zero").
const countField = z.coerce
  .number()
  .int()
  .min(0)
  .max(10_000_000)
  .optional();

export const collaboratorSchema = z.object({
  name: z.string().min(1),
  faculty: z.string().optional(),
  email: z.string().optional(),
});

export const activitySchema = z.object({
  title: z.string().min(1),
  themes: z.array(themeTagEnum).min(1),
  status: statusEnum,
  activity_type: activityTypeEnum.optional(),
  location: z.string().optional(),
  locale_type: localeTypeEnum.optional(),
  // Participant disaggregation. All optional.
  outreach_count: countField,
  participants_total: countField,
  participants_youth: countField,
  participants_women: countField,
  participants_yiw: countField,
  participants_yiw_women: countField,
  participants_disability: countField,
  participants_refugee_idp: countField,
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  partner_type: partnerTypeEnum.optional(),
  partner_institution: z.string().min(1),
  contact_name: z.string().min(1),
  contact_email: z.string().email(),
  outputs: z.string().optional(),
  collaborators: z.array(collaboratorSchema).optional(),
});

export const submissionPayloadSchema = z.object({
  respondent: z.object({
    full_name: z.string().min(1),
    email: z.string().email(),
    faculty: z.string().min(1),
    department: z.string().min(1),
    position: z.string().min(1),
    submission_date: z.string().min(1),
  }),
  activities: z.array(activitySchema).min(1),
  // Phase 2: structured Challenges. Optional; faculty with nothing to
  // report leave it empty.
  challenges: z.array(challengeSchema).optional(),
  // Phase 4: participant-centred Success Stories. Optional.
  success_stories: z.array(successStorySchema).optional(),
  additional: z
    .object({
      resources_needed: z.string().optional(),
      collaboration_opportunities: z.string().optional(),
      challenges_barriers: z.string().optional(),
      lessons_learned: z.string().optional(),
      outcomes_achievements: z.string().optional(),
      other_information: z.string().optional(),
    })
    .optional(),
});

export type SubmissionPayload = z.infer<typeof submissionPayloadSchema>;

export const importSubmissionSchema = submissionPayloadSchema.extend({
  id: z.string().optional(),
});
