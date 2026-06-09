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
