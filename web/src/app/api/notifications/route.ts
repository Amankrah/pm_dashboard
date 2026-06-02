import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getMailConfig, isMailConfigured } from "@/lib/email/config";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const logs = await prisma.notificationLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const config = getMailConfig();

  return NextResponse.json({
    smtpConfigured: isMailConfigured(),
    notifyTo: config?.notifyTo ?? [],
    notifyCc: config?.notifyCc ?? [],
    notifyRespondent: config?.notifyRespondent ?? false,
    logs,
  });
}
