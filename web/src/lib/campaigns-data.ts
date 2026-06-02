import { prisma } from "@/lib/db";
import { inviteLink } from "@/lib/tokens";

export async function listCampaigns() {
  return prisma.reportingPeriod.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { submissions: true, invites: true } },
    },
  });
}

export async function listInvitesForPeriod(periodId: string) {
  const invites = await prisma.formInvite.findMany({
    where: { periodId },
    orderBy: { createdAt: "desc" },
  });

  return invites.map((inv) => ({
    id: inv.id,
    token: inv.token,
    email: inv.email,
    fullName: inv.fullName,
    faculty: inv.faculty,
    submittedAt: inv.submittedAt?.toISOString() ?? null,
    link: inviteLink(inv.token),
  }));
}
