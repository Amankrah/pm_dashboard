import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const invite = await prisma.formInvite.findUnique({
    where: { token },
    include: { period: true, submission: true },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 });
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

  return NextResponse.json({
    invite: {
      token: invite.token,
      email: invite.email,
      fullName: invite.fullName,
      faculty: invite.faculty,
      period: {
        label: invite.period.label,
        status: invite.period.status,
      },
    },
  });
}
