import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PILLARS } from "@/lib/constants";
import { loadTargetsFromDb } from "@/lib/analytics/targets-db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const targets = await loadTargetsFromDb();
  return NextResponse.json({ targets });
}

const saveSchema = z.object({
  periodKey: z.string(),
  values: z.record(z.string(), z.coerce.number().min(0).max(999)),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Admin required" }, { status: 403 });
  }

  try {
    const body = saveSchema.parse(await request.json());
    await prisma.$transaction(
      PILLARS.map((pillar) => {
        const target = body.values[pillar] ?? 0;
        return prisma.pillarTarget.upsert({
          where: {
            periodKey_pillar: { periodKey: body.periodKey, pillar },
          },
          create: { periodKey: body.periodKey, pillar, target },
          update: { target },
        });
      }),
    );

    const targets = await loadTargetsFromDb();
    return NextResponse.json({ ok: true, targets });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
