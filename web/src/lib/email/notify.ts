import { appBaseUrl } from "@/lib/tokens";
import { getMailConfig } from "@/lib/email/config";
import { sendMail } from "@/lib/email/send";
import {
  respondentConfirmationEmail,
  submissionReceivedEmail,
} from "@/lib/email/templates";

export async function notifyNewSubmission(opts: {
  submissionId: string;
  fullName: string;
  email: string;
  faculty: string;
  periodLabel: string;
  activities: { status: string }[];
}) {
  const config = getMailConfig();
  const completed = opts.activities.filter((a) => a.status === "Completed").length;
  const ongoing = opts.activities.filter((a) => a.status === "Ongoing").length;
  const planned = opts.activities.filter((a) => a.status === "Planned").length;

  const staff = submissionReceivedEmail({
    respondentName: opts.fullName,
    respondentEmail: opts.email,
    faculty: opts.faculty,
    periodLabel: opts.periodLabel,
    activityCount: opts.activities.length,
    completed,
    ongoing,
    planned,
    dashboardUrl: appBaseUrl(),
  });

  await sendMail({
    type: "submission_received",
    to: config?.notifyTo ?? ["ebenezer.kwofie@mcgill.ca"],
    cc: config?.notifyCc,
    subject: staff.subject,
    html: staff.html,
    meta: { submissionId: opts.submissionId },
  });

  if (config?.notifyRespondent && opts.email) {
    const confirm = respondentConfirmationEmail({
      name: opts.fullName,
      periodLabel: opts.periodLabel,
      activityCount: opts.activities.length,
    });
    await sendMail({
      type: "submission_confirmation",
      to: opts.email,
      subject: confirm.subject,
      html: confirm.html,
      meta: { submissionId: opts.submissionId },
    });
  }
}
