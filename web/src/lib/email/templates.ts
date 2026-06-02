import { appBaseUrl, inviteLink } from "@/lib/tokens";

const BRAND = "Nkabom Collaborative · McGill University";

function layout(body: string) {
  return `<!DOCTYPE html><html><body style="font-family:'Segoe UI',Arial,sans-serif;background:#edf1f7;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
<div style="background:linear-gradient(135deg,#152c47,#1e3a5f);color:#fff;padding:24px">
<div style="font-size:11px;opacity:0.75;letter-spacing:1px">${BRAND}</div>
<div style="font-size:18px;font-weight:700;margin-top:8px">Academic Lead Office</div>
</div>
<div style="padding:24px;color:#1e293b;font-size:14px;line-height:1.6">${body}</div>
<div style="padding:16px 24px;background:#f8fafc;font-size:11px;color:#64748b;border-top:1px solid #e2e8f0">
This is an automated message from the Nkabom Faculty Activity Map.
</div></div></body></html>`;
}

export function submissionReceivedEmail(opts: {
  respondentName: string;
  respondentEmail: string;
  faculty: string;
  periodLabel: string;
  activityCount: number;
  completed: number;
  ongoing: number;
  planned: number;
  dashboardUrl: string;
}) {
  const subject = `Nkabom Activity Mapping — ${opts.respondentName} — ${opts.faculty}`;
  const html = layout(`
<p>A new faculty activity mapping has been submitted to the programme database.</p>
<table style="width:100%;font-size:13px;margin:16px 0;border-collapse:collapse">
<tr><td style="padding:6px 0;color:#64748b">Respondent</td><td style="padding:6px 0;font-weight:600">${opts.respondentName}</td></tr>
<tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0">${opts.respondentEmail}</td></tr>
<tr><td style="padding:6px 0;color:#64748b">Faculty</td><td style="padding:6px 0">${opts.faculty}</td></tr>
<tr><td style="padding:6px 0;color:#64748b">Reporting period</td><td style="padding:6px 0">${opts.periodLabel}</td></tr>
<tr><td style="padding:6px 0;color:#64748b">Activities</td><td style="padding:6px 0">${opts.activityCount} (${opts.completed} completed, ${opts.ongoing} ongoing, ${opts.planned} planned)</td></tr>
</table>
<p><a href="${opts.dashboardUrl}/dashboard/submissions" style="display:inline-block;background:#1e3a5f;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600">View in dashboard</a></p>
`);
  return { subject, html };
}

export function respondentConfirmationEmail(opts: {
  name: string;
  periodLabel: string;
  activityCount: number;
}) {
  const subject = `Confirmation — Nkabom Activity Mapping received`;
  const html = layout(`
<p>Dear ${opts.name},</p>
<p>Thank you for submitting your Nkabom Collaborative faculty activity mapping for <strong>${opts.periodLabel}</strong>.</p>
<p>We received <strong>${opts.activityCount} activit${opts.activityCount === 1 ? "y" : "ies"}</strong>. The Academic Lead office will use this information to coordinate engagement across McGill faculties and Ghanaian partner institutions.</p>
<p>If you need to correct your submission, please contact <a href="mailto:ebenezer.kwofie@mcgill.ca">ebenezer.kwofie@mcgill.ca</a>.</p>
`);
  return { subject, html };
}

export function inviteEmail(opts: {
  recipientName?: string;
  periodLabel: string;
  token: string;
  faculty?: string;
}) {
  const link = inviteLink(opts.token);
  const greeting = opts.recipientName ? `Dear ${opts.recipientName},` : "Dear colleague,";
  const subject = `Nkabom Faculty Activity Mapping — ${opts.periodLabel}`;
  const html = layout(`
<p>${greeting}</p>
<p>Please complete the <strong>Nkabom Faculty Activity Mapping Form</strong> for <strong>${opts.periodLabel}</strong>.
${opts.faculty ? ` This link is associated with <strong>${opts.faculty}</strong>.` : ""}</p>
<p style="margin:20px 0"><a href="${link}" style="display:inline-block;background:#1a6b44;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">Open mapping form</a></p>
<p style="font-size:12px;color:#64748b;word-break:break-all">Or copy this link: ${link}</p>
<p style="font-size:12px;color:#64748b">The form saves directly to the programme database — no email attachment required.</p>
`);
  return { subject, html, link };
}

export function testEmail() {
  const subject = "Nkabom Activity Map — test notification";
  const html = layout(`
<p>This is a test email from the Nkabom Faculty Activity Map application.</p>
<p>If you received this message, SMTP is configured correctly.</p>
<p style="font-size:12px;color:#64748b">Sent at ${new Date().toISOString()}</p>
`);
  return { subject, html };
}

export { appBaseUrl };
