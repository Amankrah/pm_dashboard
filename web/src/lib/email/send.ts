import nodemailer from "nodemailer";
import { prisma } from "@/lib/db";
import { getMailConfig } from "@/lib/email/config";

export type SendMailInput = {
  type: string;
  to: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
  text?: string;
  meta?: Record<string, unknown>;
};

function normalizeList(v?: string | string[]) {
  if (!v) return [];
  return (Array.isArray(v) ? v : [v]).map((e) => e.trim()).filter(Boolean);
}

async function logNotification(
  input: SendMailInput,
  status: "sent" | "failed" | "skipped",
  error?: string,
) {
  const to = normalizeList(input.to).join(", ");
  const cc = normalizeList(input.cc).join(", ") || null;
  await prisma.notificationLog.create({
    data: {
      type: input.type,
      toAddress: to || "(none)",
      ccAddress: cc,
      subject: input.subject,
      status,
      error: error ?? null,
      meta: input.meta ? JSON.stringify(input.meta) : null,
    },
  });
}

export async function sendMail(input: SendMailInput): Promise<{
  ok: boolean;
  status: "sent" | "failed" | "skipped";
  error?: string;
}> {
  const config = getMailConfig();
  const toList = normalizeList(input.to);
  const ccList = normalizeList(input.cc);

  if (!config || toList.length === 0) {
    const msg = !config
      ? "SMTP not configured — notification logged only."
      : "No recipients.";
    console.info("[email:skipped]", input.type, input.subject, msg);
    await logNotification(input, "skipped", msg);
    return { ok: false, status: "skipped", error: msg };
  }

  try {
    const transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
    });

    await transport.sendMail({
      from: config.from,
      to: toList.join(", "),
      cc: ccList.length > 0 ? ccList.join(", ") : undefined,
      subject: input.subject,
      html: input.html,
      text: input.text ?? input.html.replace(/<[^>]+>/g, " "),
    });

    await logNotification(input, "sent");
    return { ok: true, status: "sent" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed";
    console.error("[email:failed]", input.type, message);
    await logNotification(input, "failed", message);
    return { ok: false, status: "failed", error: message };
  }
}
