import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const periodId = searchParams.get("periodId");

  const submissions = await prisma.submission.findMany({
    where: periodId ? { periodId } : undefined,
    orderBy: { submittedAt: "desc" },
    include: {
      activities: {
        include: { themes: true, collaborators: true },
      },
      period: { select: { label: true, slug: true } },
    },
  });

  return NextResponse.json({ submissions });
}
