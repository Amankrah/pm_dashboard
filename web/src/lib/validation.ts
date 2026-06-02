import { z } from "zod";

const pillarEnum = z.enum([
  "Education",
  "Access and Success",
  "Entrepreneurship",
]);

const statusEnum = z.enum(["Completed", "Ongoing", "Planned"]);

export const collaboratorSchema = z.object({
  name: z.string().min(1),
  faculty: z.string().optional(),
  email: z.string().optional(),
});

export const activitySchema = z.object({
  title: z.string().min(1),
  themes: z.array(pillarEnum).min(1),
  status: statusEnum,
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
      outcomes_achievements: z.string().optional(),
      other_information: z.string().optional(),
    })
    .optional(),
});

export type SubmissionPayload = z.infer<typeof submissionPayloadSchema>;

export const importSubmissionSchema = submissionPayloadSchema.extend({
  id: z.string().optional(),
});
