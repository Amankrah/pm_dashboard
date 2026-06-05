import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSubmissionFromPayload } from "@/lib/submissions";
import { submissionPayloadSchema } from "@/lib/validation";

const bodySchema = submissionPayloadSchema.extend({
  token: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const { token, ...payload } = body;

    const invite = await prisma.formInvite.findUnique({
      where: { token },
      include: { submission: true, period: true },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "This invite has expired." }, { status: 410 });
    }

    if (invite.submittedAt || invite.submission) {
      return NextResponse.json(
        { error: "This form has already been submitted." },
        { status: 409 },
      );
    }

    const submission = await createSubmissionFromPayload(
      invite.periodId,
      invite.id,
      payload,
    );

    const { notifyNewSubmission } = await import("@/lib/email/notify");
    notifyNewSubmission({
      submissionId: submission.id,
      fullName: payload.respondent.full_name,
      email: payload.respondent.email,
      faculty: payload.respondent.faculty,
      periodLabel: invite.period.label,
      activities: payload.activities.map((a) => ({ status: a.status })),
    }).catch((err) => console.error("Notification error:", err));

    return NextResponse.json({
      ok: true,
      submissionId: submission.id,
      message: "Thank you. Your activity mapping has been submitted.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed.", details: err.flatten() },
        { status: 400 },
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Submission failed." }, { status: 500 });
  }
}
