import { NextResponse } from "next/server";
import { getSession, requireAdmin } from "@/lib/auth";
import { getMailConfig } from "@/lib/email/config";
import { sendMail } from "@/lib/email/send";
import { testEmail } from "@/lib/email/templates";

export async function POST() {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }

  const config = getMailConfig();
  if (!config) {
    return NextResponse.json(
      { error: "SMTP is not configured. Set SMTP_* variables in .env." },
      { status: 400 },
    );
  }

  const { subject, html } = testEmail();
  const result = await sendMail({
    type: "test",
    to: session!.email,
    subject,
    html,
  });

  return NextResponse.json(result);
}
