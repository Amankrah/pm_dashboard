import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Phase 10: quarterly rollover. PATCH lets an admin flip a reporting
// period between "open" and "closed". Closed periods reject new public
// submissions (already enforced in /f/[token]) and the form-link
// generator on /dashboard/campaigns is blocked client-side as well.

const patchSchema = z.object({
  status: z.enum(["open", "closed"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!requireAdmin(session)) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = patchSchema.parse(await request.json());
    const existing = await prisma.reportingPeriod.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Reporting period not found." },
        { status: 404 },
      );
    }
    const updated = await prisma.reportingPeriod.update({
      where: { id },
      data: { status: body.status },
    });
    return NextResponse.json({ ok: true, campaign: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Could not update reporting period." },
      { status: 500 },
    );
  }
}
