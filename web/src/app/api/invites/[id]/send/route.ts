import { NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMailConfig } from "@/lib/email/config";
import { sendMail } from "@/lib/email/send";
import { inviteEmail } from "@/lib/email/templates";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }

  const { id } = await params;
  const invite = await prisma.formInvite.findUnique({
    where: { id },
    include: { period: true, submission: true },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.submittedAt || invite.submission) {
    return NextResponse.json(
      { error: "This invite has already been used." },
      { status: 409 },
    );
  }

  const email = invite.email?.trim();
  if (!email) {
    return NextResponse.json(
      { error: "Invite has no email address. Add email when generating the link." },
      { status: 400 },
    );
  }

  const config = getMailConfig();
  if (!config) {
    return NextResponse.json(
      { error: "SMTP not configured." },
      { status: 400 },
    );
  }

  const mail = inviteEmail({
    recipientName: invite.fullName ?? undefined,
    periodLabel: invite.period.label,
    token: invite.token,
    faculty: invite.faculty ?? undefined,
  });

  const result = await sendMail({
    type: "invite_sent",
    to: email,
    cc: config.notifyCc,
    subject: mail.subject,
    html: mail.html,
    meta: { inviteId: invite.id, token: invite.token },
  });

  return NextResponse.json({ ...result, link: mail.link });
}
