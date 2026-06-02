export type MailConfig = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  notifyTo: string[];
  notifyCc: string[];
  notifyRespondent: boolean;
};

export function getMailConfig(): MailConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from =
    process.env.SMTP_FROM?.trim() || user || "ebenezer.kwofie@mcgill.ca";

  if (!host || !user || !pass || !from) return null;

  const notifyTo = (process.env.NOTIFY_TO ?? "ebenezer.kwofie@mcgill.ca")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  const notifyCc = (process.env.NOTIFY_CC ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  return {
    enabled: true,
    host,
    port: Number(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    user,
    pass,
    from,
    notifyTo,
    notifyCc,
    notifyRespondent: process.env.NOTIFY_RESPONDENT === "true",
  };
}

export function isMailConfigured() {
  return getMailConfig() !== null;
}
